"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { WidgetHeader } from "@/modules/widget/ui/components/widget-header";
import { WidgetFooter } from "../components/widget-footer";
import { Button } from "@workspace/ui/components/button";
import { api } from "@workspace/backend/_generated/api";
import {
  MessageSquareTextIcon,
  ChevronRightIcon,
  MicIcon,
  PhoneIcon,
  SparklesIcon,
  BotIcon,
  ArrowLeftIcon
} from "lucide-react";
import { useSetAtom, useAtomValue, useAtom } from "jotai";
import {
  screenAtom,
  organizationIdAtom,
  contactSessionIdAtomFamily,
  conversationIdAtom,
  widgetSettingsAtom,
  hasVapiSecretsAtom
} from "../../atoms/widget-atoms";
import { cn } from "@workspace/ui/lib/utils";

export const WidgetSelectionScreen = () => {
  const setScreen = useSetAtom(screenAtom);
  const setConversationId = useSetAtom(conversationIdAtom);
  const [widgetSettings] = useAtom(widgetSettingsAtom);
  const [hasVapiSecrets] = useAtom(hasVapiSecretsAtom);

  const organizationId = useAtomValue(organizationIdAtom);
  const contactSessionId = useAtomValue(
    contactSessionIdAtomFamily(organizationId || "")
  );

  const createConversation = useMutation(api.public.conversations.create);
  const [isPending, setIsPending] = useState(false);
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);

  const handleNewConversation = async () => {
    if (!contactSessionId || !organizationId) {
      setScreen("auth");
      return;
    }
    setIsPending(true);
    try {
      const conversationId = await createConversation({
        contactSessionId,
        organizationId,
      });
      setConversationId(conversationId);
      setScreen("chat");
    } catch {
      setScreen("auth");
    } finally {
      setIsPending(false);
    }
  };

  const actionButtons = [
    {
      id: "chat",
      icon: MessageSquareTextIcon,
      label: "Start Chat",
      description: "Chat with our AI assistant",
      onClick: handleNewConversation,
      disabled: isPending,
      color: "text-blue-600",
      bgColor: "hover:bg-blue-100"
    },
    {
      id: "voice",
      icon: MicIcon,
      label: "Start Voice Call",
      description: "Talk to our voice AI",
      onClick: () => setScreen("voice"),
      disabled: isPending || !(hasVapiSecrets && widgetSettings?.vapiSettings?.assistantId),
      color: "text-green-600",
      bgColor: "hover:bg-green-100"
    },
    {
      id: "contact",
      icon: PhoneIcon,
      label: "Call Us",
      description: "Speak with a human agent",
      onClick: () => setScreen("contact"),
      disabled: isPending || !(hasVapiSecrets && widgetSettings?.vapiSettings?.phoneNumber),
      color: "text-purple-600",
      bgColor: "hover:bg-purple-100"
    }
  ];

  return (
    <div className="flex h-full w-full">
      {/* Left Panel */}
      <div className="flex-1 flex flex-col items-center justify-center bg-blue-50 p-8 relative">
        <div className="w-40 h-40 rounded-full bg-white/80 border-4 border-white shadow-lg flex items-center justify-center">
          <p className="text-gray-500 text-center text-sm">Organization Logo</p>
        </div>
        <div className="mt-6 text-center max-w-xs">
          <h2 className="text-lg font-semibold text-blue-900">Welcome to Our Widget!</h2>
          <p className="text-sm text-blue-800 mt-2">
            Choose an option on the right to get started. Our AI assistant and support team are here to help 24/7.
          </p>
        </div>
        {/* Optional decoration circles */}
        <div className="absolute -top-10 -left-10 w-24 h-24 bg-blue-200 rounded-full opacity-50 animate-pulse"></div>
        <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-blue-300 rounded-full opacity-40 animate-pulse"></div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex flex-col bg-blue-100 shadow-md overflow-y-auto p-6">
        <WidgetHeader className="relative z-10 bg-blue-50 shadow-md">
          <div className="flex items-center gap-4 px-4 py-3">
            {/* Home / Back Button */}
            <Button
              variant="transparent"
              size="icon"
              onClick={() => setScreen("selection")}
              className="text-blue-900 bg-white/80 hover:bg-white shadow rounded"
            >
              <ArrowLeftIcon className="w-5 h-5" />
            </Button>
            <div className="flex flex-col">
              <p className="text-lg font-bold text-blue-900">Hi there! 👋</p>
              <p className="text-sm text-blue-800">How would you like to get help today?</p>
            </div>
          </div>
        </WidgetHeader>

        <div className="flex flex-1 flex-col gap-y-4 mt-4">
          {actionButtons.map((button) => (
            <Button
              key={button.id}
              className={cn(
                "h-24 w-full justify-between p-6 transition-all duration-200",
                "border-2 border-gray-200 rounded-xl",
                "hover:scale-[1.03] hover:shadow-lg",
                button.bgColor,
                hoveredButton === button.id && "ring-2 ring-offset-2 ring-blue-300"
              )}
              variant="outline"
              onClick={button.onClick}
              disabled={button.disabled}
              onMouseEnter={() => setHoveredButton(button.id)}
              onMouseLeave={() => setHoveredButton(null)}
            >
              <div className="flex items-center gap-x-4 flex-1">
                <div className={cn(
                  "p-3 rounded-lg bg-white transition-colors",
                  hoveredButton === button.id && "shadow-sm"
                )}>
                  <button.icon className={cn("size-6", button.color)} />
                </div>
                <div className="flex flex-col items-start">
                  <span className="font-semibold text-gray-900 text-left text-lg">
                    {button.label}
                  </span>
                  <span className="text-sm text-gray-800 text-left">
                    {button.description}
                  </span>
                </div>
              </div>
              <div className={cn(
                "p-2 rounded-full transition-colors",
                hoveredButton === button.id ? "bg-blue-200" : "bg-gray-100"
              )}>
                <ChevronRightIcon className="size-5 text-gray-700" />
              </div>
            </Button>
          ))}

          {/* Quick Help Section */}
          <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <BotIcon className="size-4 text-blue-800" />
              <h3 className="font-semibold text-blue-900 text-sm">Quick Help</h3>
            </div>
            <p className="text-xs text-blue-800">
              Our AI assistant is available 24/7 to help with any questions you might have.
            </p>
          </div>

          {/* Support Status */}
          <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-xs text-gray-800">Support available now</span>
          </div>
        </div>

        <WidgetFooter />
      </div>
    </div>
  );
};
