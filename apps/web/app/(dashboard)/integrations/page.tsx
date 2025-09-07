import { MongoSyncCard } from "../../../modules/integrations/ui/mongo-sync";

const Page = () => {
    return (
        <div className="container mx-auto p-6 space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Integrations</h1>
                <p className="text-muted-foreground">
                    Connect external data sources and services to enhance your AI assistant.
                </p>
            </div>

            <MongoSyncCard />
        </div>
    );
}

export default Page;