import MainLayout from "@/components/layouts/main-layout";
import { ConversationList } from "@/components/messages/conversation-list";

export default function MessagesPage() {
    return (
        <MainLayout>
             <div className="flex-1 space-y-3 md:space-y-4 p-3 md:p-4 lg:p-8 pt-4 md:pt-6">
                 <div className="flex items-center justify-between space-y-2">
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-headline">
                        Messages
                    </h1>
                </div>
                <ConversationList />
            </div>
        </MainLayout>
    );
}
