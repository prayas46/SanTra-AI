"use client";

import { useAtomValue } from "jotai";
import { WidgetAuthScreen } from "@/modules/widget/ui/screens/widget-auth-screen";
import { screenAtom } from "@/modules/widget/atoms/widget-atoms";
import { WidgetErrorScreen } from "../screens/widget-error-screen";
import { WidgetLoadingScreen } from "../screens/widget-loading-screen";
interface Props {
    organizationId: string | null;
};
export const WidgetView = ({ organizationId }: Props) => {
    const screen = useAtomValue(screenAtom);

    const screenComponents= {
        error:<WidgetErrorScreen/>,
        loading: <WidgetLoadingScreen organizationId={organizationId}/>,
        auth: <WidgetAuthScreen />,
        selection: <p>TODO: Selection</p>,
        voice: <p>TODO: Voice</p>,
        inbox: <p>TODO: Inbox</p>,
        chat: <p>TODO: Chat</p>,
        contact: <p>TODO: Contact</p>,
    }

    return (
         <main className="min-h-screen min-w-screen flex h-full w-full flex-col overflow-hidden rounded-xl border bg-muted">
            {screenComponents[screen]}
          
         </main>
    );
};