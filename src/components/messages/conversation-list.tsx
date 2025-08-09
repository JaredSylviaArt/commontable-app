
"use client";

import Link from "next/link"
import Image from "next/image"
import { formatDistanceToNow } from 'date-fns';
import { useState } from "react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useConversations } from "@/hooks/use-conversations"
import { useAuth } from "@/hooks/use-auth"
import { ConversationSkeleton } from "@/components/ui/enhanced-skeleton"
import { ErrorBoundary, MessageErrorFallback } from "@/components/ui/error-boundary"
import { Search, MessageCircle, Send, ShoppingBag, Gift, Clock, CheckCircle2 } from "lucide-react"

export function ConversationList() {
    const { user } = useAuth();
    const { conversations, loading } = useConversations();
    const [searchQuery, setSearchQuery] = useState("");

    if (loading) {
        return (
            <div className="space-y-4">
                <Card className="border-0 shadow-sm">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <MessageCircle className="h-5 w-5 text-primary" />
                            </div>
                            <div className="flex-1">
                                <CardTitle className="text-lg font-semibold">Messages</CardTitle>
                                <p className="text-sm text-muted-foreground">Loading conversations...</p>
                            </div>
                        </div>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Search conversations..." disabled className="pl-9" />
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <ConversationSkeleton />
                    </CardContent>
                </Card>
            </div>
        )
    }

    const filteredConversations = conversations.filter(conv => {
        const otherParticipantId = conv.participantIds.find(id => id !== user?.uid);
        if (!otherParticipantId) return false;
        const otherParticipant = conv.participants[otherParticipantId];
        if (!otherParticipant) return false;
        
        return otherParticipant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
               conv.listingTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
               conv.lastMessage?.text.toLowerCase().includes(searchQuery.toLowerCase());
    });

    if (conversations.length === 0) {
        return (
            <div className="space-y-6">
                <Card className="border-0 shadow-sm">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <MessageCircle className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <CardTitle className="text-lg font-semibold">Messages</CardTitle>
                                <p className="text-sm text-muted-foreground">Connect with other users about listings</p>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <div className="text-center py-12">
                            <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6">
                                <MessageCircle className="h-12 w-12 text-muted-foreground" />
                            </div>
                            <h3 className="text-lg font-semibold mb-2">No messages yet</h3>
                            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                                Start connecting with other users by messaging sellers on listing pages or responding to inquiries about your listings.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                <Button onClick={() => window.location.href = '/'} className="flex items-center gap-2">
                                    <ShoppingBag className="h-4 w-4" />
                                    Browse Listings
                                </Button>
                                <Button variant="outline" onClick={() => window.location.href = '/dashboard'} className="flex items-center gap-2">
                                    <Gift className="h-4 w-4" />
                                    View My Listings
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
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

    const getMessageStatus = (conv: any) => {
        if (!conv.lastMessage) return null;
        
        const isFromMe = conv.lastMessage.senderId === user?.uid;
        const isRead = conv.lastMessage.read;
        
        if (isFromMe) {
            return isRead ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
            ) : (
                <Clock className="h-4 w-4 text-muted-foreground" />
            );
        } else {
            return !isRead ? (
                <Badge variant="secondary" className="text-xs">New</Badge>
            ) : null;
        }
    };

    const getConversationType = (conv: any) => {
        const isFromMe = conv.lastMessage?.senderId === user?.uid;
        return isFromMe ? "selling" : "buying";
    };

    return (
        <ErrorBoundary fallback={MessageErrorFallback}>
            <div className="space-y-4">
                <Card className="border-0 shadow-sm">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <MessageCircle className="h-5 w-5 text-primary" />
                            </div>
                            <div className="flex-1">
                                <CardTitle className="text-lg font-semibold">Messages</CardTitle>
                                <p className="text-sm text-muted-foreground">
                                    {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
                                </p>
                            </div>
                            <Badge variant="outline" className="text-xs">
                                {conversations.filter(c => c.lastMessage && !c.lastMessage.read && c.lastMessage.senderId !== user?.uid).length} unread
                            </Badge>
                        </div>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search conversations..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-border">
                            {filteredConversations.map(conv => {
                                const otherParticipantId = conv.participantIds.find(id => id !== user?.uid);
                                if (!otherParticipantId) return null;
                                
                                const otherParticipant = conv.participants[otherParticipantId];
                                if (!otherParticipant) return null;

                                const conversationType = getConversationType(conv);
                                const messageStatus = getMessageStatus(conv);

                                return (
                                    <Link href={`/messages/${conv.id}`} key={conv.id} className="block hover:bg-muted/50 transition-colors">
                                        <div className="flex items-center gap-4 p-4">
                                            <div className="relative">
                                                <Avatar className="h-12 w-12">
                                                    <AvatarImage src={generateGradientUrl(otherParticipantId)} alt={otherParticipant.name} />
                                                    <AvatarFallback>{otherParticipant.name.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                <Badge 
                                                    variant={conversationType === "selling" ? "default" : "secondary"} 
                                                    className="absolute -bottom-1 -right-1 text-xs px-1 py-0"
                                                >
                                                    {conversationType === "selling" ? "Sell" : "Buy"}
                                                </Badge>
                                            </div>
                                            <div className="flex-grow min-w-0">
                                                <div className="flex justify-between items-start mb-1">
                                                    <p className="font-semibold truncate">{otherParticipant.name}</p>
                                                    <div className="flex items-center gap-2 flex-shrink-0">
                                                        {messageStatus}
                                                        {conv.lastMessage?.timestamp && (
                                                            <p className="text-xs text-muted-foreground">
                                                                {formatDistanceToNow(conv.lastMessage.timestamp.toDate(), { addSuffix: true })}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                                <p className="text-sm text-muted-foreground truncate mb-1">{conv.listingTitle}</p>
                                                <div className="flex items-center gap-2">
                                                    {conv.lastMessage?.senderId === user?.uid && (
                                                        <Send className="h-3 w-3 text-muted-foreground" />
                                                    )}
                                                    <p className="text-sm text-foreground truncate flex-1">
                                                        {conv.lastMessage?.text || "No messages yet"}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="relative h-16 w-16 flex-shrink-0">
                                                <Image 
                                                    src={conv.listingImageUrl} 
                                                    alt={conv.listingTitle} 
                                                    fill 
                                                    className="object-cover rounded-md"
                                                />
                                            </div>
                                        </div>
                                    </Link>
                                )
                            })}
                        </div>
                        {filteredConversations.length === 0 && searchQuery && (
                            <div className="text-center py-8 text-muted-foreground">
                                <p>No conversations match your search.</p>
                                <p className="text-sm">Try adjusting your search terms.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </ErrorBoundary>
    )
}
