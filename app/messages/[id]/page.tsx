import MainLayout from "@/components/layouts/main-layout";
import { MessageThread } from "@/components/messages/message-thread";

export default function MessageThreadPage({ params }: { params: { id: string }}) {
    return (
        <MainLayout>
            <MessageThread conversationId={params.id} />
        </MainLayout>
    );
}
