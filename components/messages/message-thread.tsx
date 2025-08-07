
"use client"

import Link from "next/link"
import Image from "next/image"
import React, { useState, useEffect, useRef } from "react"
import { format } from "date-fns"
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SendHorizonal, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/use-auth"
import { Skeleton } from "../ui/skeleton"
import { useMessages } from "@/hooks/use-messages"
import { sendMessageAction } from "@/app/actions"
import { doc, getDoc, onSnapshot } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { Conversation, Listing } from "@/lib/types"

export function MessageThread({ conversationId }: { conversationId: string }) {
  const { user, loading: authLoading } = useAuth();
  const { messages, loading: messagesLoading } = useMessages(conversationId);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [listing, setListing] = useState<Listing | null>(null);
  const [convLoading, setConvLoading] = useState(true);
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!conversationId) return;

    const convRef = doc(db, "conversations", conversationId);
    const unsubscribe = onSnapshot(convRef, (doc) => {
        if (doc.exists()) {
            const convData = { id: doc.id, ...doc.data() } as Conversation;
            setConversation(convData);

            if (convData.listingId) {
                getDoc(doc(db, "listings", convData.listingId)).then(listingDoc => {
                    if(listingDoc.exists()) {
                        setListing({ id: listingDoc.id, ...listingDoc.data() } as Listing)
                    }
                })
            }
        }
        setConvLoading(false);
    });

    return () => unsubscribe();

  }, [conversationId]);
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newMessage.trim() || !user || !conversationId) return;

      setIsSending(true);
      const text = newMessage;
      setNewMessage("");

      const result = await sendMessageAction(conversationId, text, user.uid);

      if (result?.error) {
          console.error("Failed to send message:", result.error);
          setNewMessage(text); // Put message back in input if it failed
      }
      setIsSending(false);
  }

  const generateGradientUrl = (id: string) => {
    // Simple hash function to get a number from a string
    const hashCode = (s: string) => s.split('').reduce((a,b) => (((a << 5) - a) + b.charCodeAt(0))|0, 0);
    const hash = Math.abs(hashCode(id));
    
    // Generate two distinct hues
    const hue1 = hash % 360;
    const hue2 = (hue1 + 120) % 360; // 120 degrees apart for contrast

    return `https://placehold.co/128x128.png/000000/FFFFFF?text=%20&bg-gradient=linear-gradient(135deg, hsl(${hue1}, 80%, 70%), hsl(${hue2}, 80%, 70%))`;
  }

  const loading = authLoading || messagesLoading || convLoading;

  if (loading) {
      return (
          <div className="flex h-[calc(100vh-4rem)]">
              <div className="flex flex-col flex-grow h-full">
                  <div className="flex items-center p-4 border-b">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="ml-4 space-y-2">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-3 w-48" />
                      </div>
                  </div>
                  <div className="flex-grow p-8 space-y-6">
                      <Skeleton className="h-16 w-1/2" />
                      <Skeleton className="h-16 w-1/2 ml-auto" />
                      <Skeleton className="h-24 w-2/3" />
                  </div>
                   <div className="p-4 border-t bg-background">
                       <Skeleton className="h-12 w-full" />
                   </div>
              </div>
              <div className="hidden lg:block w-96 border-l h-full p-4">
                  <Skeleton className="h-64 w-full" />
              </div>
          </div>
      )
  }
  
  if (!conversation || !user) {
      return <div className="p-8">Conversation not found or you are not logged in.</div>
  }

  const otherParticipantId = conversation.participantIds.find(id => id !== user?.uid) || '';
  const otherParticipant = conversation.participants[otherParticipantId];

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      <div className="flex flex-col flex-grow h-full">
        {/* Header */}
        <div className="flex items-center p-4 border-b">
            <Avatar className="h-10 w-10">
                <AvatarImage src={generateGradientUrl(otherParticipantId)} alt={otherParticipant.name} />
                <AvatarFallback>{otherParticipant.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="ml-4">
                <p className="font-bold">{otherParticipant.name}</p>
                 {listing && (
                    <p className="text-sm text-muted-foreground">
                        Regarding: <Link href={`/listings/${listing.id}`} className="hover:underline">{listing.title}</Link>
                    </p>
                )}
            </div>
        </div>

        {/* Message Area */}
        <div className="flex-grow overflow-y-auto p-4 md:p-8 space-y-6">
            {messages.map(msg => {
                const isMe = msg.senderId === user?.uid;
                const sender = isMe ? user : { displayName: otherParticipant.name, uid: otherParticipantId };
                return (
                    <div key={msg.id} className={cn("flex items-end gap-2", isMe ? "justify-end" : "justify-start")}>
                        {!isMe && (
                             <Avatar className="h-8 w-8">
                                <AvatarImage src={generateGradientUrl(sender.uid)} alt={sender.displayName!} />
                                <AvatarFallback>{sender.displayName?.charAt(0)}</AvatarFallback>
                            </Avatar>
                        )}
                        <div className={cn("max-w-xs md:max-w-md lg:max-w-lg p-3 rounded-lg", isMe ? "bg-primary text-primary-foreground" : "bg-muted")}>
                           <p>{msg.text}</p>
                           <p className={cn("text-xs mt-1", isMe ? "text-primary-foreground/70" : "text-muted-foreground")}>
                               {msg.timestamp ? format(msg.timestamp.toDate(), 'p') : 'sending...'}
                           </p>
                        </div>
                         {isMe && user && (
                             <Avatar className="h-8 w-8">
                                <AvatarImage src={user.photoURL || generateGradientUrl(user.uid)} alt={user.displayName!} />
                                <AvatarFallback>{user.displayName?.charAt(0) || 'U'}</AvatarFallback>
                            </Avatar>
                        )}
                    </div>
                );
            })}
             <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t bg-background">
            <form className="relative" onSubmit={handleSendMessage}>
                <Input 
                    placeholder="Type a message..." 
                    className="pr-12 h-12"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    disabled={isSending}
                />
                <Button size="icon" type="submit" className="absolute top-1/2 -translate-y-1/2 right-2 bg-accent hover:bg-accent/90" disabled={isSending || !newMessage.trim()}>
                    {isSending ? <Loader2 className="h-5 w-5 animate-spin"/> : <SendHorizonal className="h-5 w-5 text-accent-foreground"/>}
                </Button>
            </form>
        </div>
      </div>
      
      {/* Listing Info Sidebar */}
       {listing && (
            <div className="hidden lg:block w-80 xl:w-96 border-l h-full p-4 overflow-y-auto">
                <Card className="sticky top-4">
                    <CardHeader className="p-0">
                        <div className="aspect-[4/3] relative">
                            <Image src={listing.imageUrl} alt={listing.title} fill className="object-cover rounded-t-lg"/>
                        </div>
                    </CardHeader>
                    <CardContent className="p-4">
                        <h3 className="font-headline font-semibold">{listing.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{listing.subCategory}</p>
                        {listing.price && (
                            <p className="text-xl font-bold text-primary mt-2">${listing.price}</p>
                        )}
                        <Button variant="outline" className="w-full mt-4" onClick={() => window.location.href = `/listings/${listing.id}`}>
                            View Listing
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )}
    </div>
  )
}
