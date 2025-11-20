"use client";

import { api } from "@workspace/backend/_generated/api";
import { useQuery } from "convex/react";
import { Loader2Icon } from "lucide-react";
import { CustomizationForm } from "../components/customization-form";

export const CustomizationView = () => {
    const widgetSettings = useQuery(api.private.widgetSettings.getOne);
    const vapiPlugin = useQuery(api.private.plugins.getOne, { service: "vapi" });

    const isLoading = widgetSettings === undefined || vapiPlugin === undefined;

    if (isLoading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-muted/40 p-8">
                <Loader2Icon className="h-6 w-6 text-muted-foreground animate-spin" />
                <p className="text-sm text-muted-foreground">Loading customization settings…</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen w-full bg-gradient-to-br from-muted/60 via-muted/40 to-background p-8">
            
            <div className="mx-auto w-full max-w-screen-lg space-y-10">

                {/* --- Header Section --- */}
                <div className="rounded-xl bg-card/60 backdrop-blur-lg border shadow-sm p-8">
                    <h1 className="text-4xl font-semibold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                        Widget Customization
                    </h1>

                    <p className="mt-2 max-w-prose text-sm text-muted-foreground">
                        Tailor your chat widget to feel like a natural extension of your brand — 
                        from greetings to quick replies and voice integrations.
                    </p>
                </div>

                {/* --- Form Box --- */}
                <div className="rounded-xl border bg-card/80 backdrop-blur-sm p-8 shadow-md hover:shadow-lg transition-shadow duration-300">
                    <CustomizationForm
                        initialData={widgetSettings}
                        hasVapiPlugin={!!vapiPlugin}
                    />
                </div>
            </div>

        </div>
    );
};
