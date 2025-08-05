
"use client";

import Link from "next/link"
import Image from "next/image"
import { formatDistanceToNow } from 'date-fns';
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useConversations } from "@/hooks/use-conversations"
import { useAuth } from "@/hooks/use-auth"
import { Skeleton } from "../ui/skeleton";

export function ConversationList() {
    const { user } = useAuth();
    const { conversations, loading } = useConversations();

    if (loading) {
        return (
            <Card>
                <CardContent className="p-0">
                    <div className="space-y-4 p-4">
                        <Skeleton className="h-16 w-full" />
                        <Skeleton className="h-16 w-full" />
                        <Skeleton className="h-16 w-full" />
                    </div>
                </CardContent>
            </Card>
        )
    }

    if (conversations.length === 0) {
        return (
             <div className="text-center py-12 text-muted-foreground">
                <p>You have no messages yet.</p>
                <p className="text-sm">Start a conversation by messaging a seller on a listing page.</p>
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

  return (
    <Card>
        <CardContent className="p-0">
            <div className="divide-y divide-border">
                {conversations.map(conv => {
                    const otherParticipantId = conv.participantIds.find(id => id !== user?.uid);
                    if (!otherParticipantId) return null;
                    
                    const otherParticipant = conv.participants[otherParticipantId];
                    if (!otherParticipant) return null;

                    return (
                        <Link href={`/messages/${conv.id}`} key={conv.id} className="block hover:bg-muted/50 transition-colors">
                            <div className="flex items-center gap-4 p-4">
                                <Avatar className="h-12 w-12">
                                    <AvatarImage src={generateGradientUrl(otherParticipantId)} alt={otherParticipant.name} />
                                    <AvatarFallback>{otherParticipant.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="flex-grow">
                                    <div className="flex justify-between items-start">
                                        <p className="font-bold">{otherParticipant.name}</p>
                                        {conv.lastMessage?.timestamp && (
                                            <p className="text-xs text-muted-foreground">
                                                {formatDistanceToNow(conv.lastMessage.timestamp.toDate(), { addSuffix: true })}
                                            </p>
                                        )}
                                    </div>
                                    <p className="text-sm text-muted-foreground truncate">{conv.listingTitle}</p>
                                    <p className={'text-sm text-foreground'}>{conv.lastMessage?.text}</p>
                                </div>
                                <div className="relative h-16 w-16 flex-shrink-0">
                                    <Image src={conv.listingImageUrl} alt={conv.listingTitle} fill className="object-cover rounded-md"/>
                                </div>
                            </div>
                        </Link>
                    )
                })}
            </div>
        </CardContent>
    </Card>
  )
}
