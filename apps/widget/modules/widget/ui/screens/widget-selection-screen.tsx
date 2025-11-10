"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { WidgetHeader } from "@/modules/widget/ui/components/widget-header";
import { Button } from "@workspace/ui/components/button";
import { api } from "@workspace/backend/_generated/api";
import { 
  MessageSquareTextIcon, 
  ChevronRightIcon, 
  MicIcon, 
  PhoneIcon,
  SparklesIcon,
  BotIcon,
  HeadphonesIcon
} from "lucide-react";
import { useSetAtom, useAtomValue, useAtom } from "jotai";
import { screenAtom, organizationIdAtom,errorMessageAtom, contactSessionIdAtomFamily,conversationIdAtom, widgetSettingsAtom, hasVapiSecretsAtom } from "../../atoms/widget-atoms";
import { WidgetFooter } from "../components/widget-footer";
import { cn } from "@workspace/ui/lib/utils";
import { useWidgetTranslation } from "@/hooks/use-widget-translation";
import { SimpleLanguageButton } from "../components/simple-language-button";

export const WidgetSelectionScreen = () => {
  const { t } = useWidgetTranslation();
  const setScreen = useSetAtom(screenAtom);
  const setErrorMessage = useSetAtom(errorMessageAtom);
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
    if (!contactSessionId) {
      setScreen("auth");
      return;
    }

    if (!organizationId) {
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
      label: t('startChat'),
      description: t('chatDescription'),
      onClick: handleNewConversation,
      disabled: isPending,
      color: "text-blue-500",
      bgColor: "hover:bg-blue-50"
    },
    {
      id: "voice",
      icon: MicIcon,
      label: t('startVoice'),
      description: t('voiceDescription'),
      onClick: () => setScreen("voice"),
      disabled: isPending || !(hasVapiSecrets && widgetSettings?.vapiSettings?.assistantId),
      color: "text-green-500",
      bgColor: "hover:bg-green-50"
    },
    {
      id: "contact",
      icon: PhoneIcon,
      label: t('callUs'),
      description: t('contactDescription'),
      onClick: () => setScreen("contact"),
      disabled: isPending || !(hasVapiSecrets && widgetSettings?.vapiSettings?.phoneNumber),
      color: "text-purple-500",
      bgColor: "hover:bg-purple-50"
    }
  ];

  return (
    <>
      <WidgetHeader>
        <div className="flex items-center justify-between px-4 py-6">
          <div className="flex flex-col gap-y-2">
            <div className="flex items-center gap-2">
              <SparklesIcon className="size-5 text-yellow-500" />
              <p className="text-2xl font-bold text-gray-900">
                {t('greeting')}
              </p>
            </div>
            <p className="text-lg text-gray-600 font-medium">
              {t('greeting')}
            </p>
          </div>
          <Button 
            onClick={() => {
              const current = localStorage.getItem('widgetLanguage') || 'en';
              const next = current === 'en' ? 'hi' : current === 'hi' ? 'bn' : 'en';
              localStorage.setItem('widgetLanguage', next);
              window.location.reload();
            }}
            variant="ghost" 
            size="icon"
            className="h-9 w-9 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
            title="Change Language"
          >
            <span className="text-xl">
              {(localStorage.getItem('widgetLanguage') === 'hi' || localStorage.getItem('widgetLanguage') === 'bn') ? '🇮🇳' : '🇬🇧'}
            </span>
          </Button>
        </div>
      </WidgetHeader>
      
      <div className="flex flex-1 flex-col gap-y-3 p-4 overflow-y-auto">
        {actionButtons.map((button) => (
          <Button
            key={button.id}
            className={cn(
              "h-20 w-full justify-between p-4 transition-all duration-200",
              "border-2 border-gray-100 rounded-xl",
              "hover:scale-[1.02] hover:shadow-md",
              button.bgColor,
              hoveredButton === button.id && "ring-2 ring-offset-2 ring-blue-200"
            )}
            variant="outline"
            onClick={button.onClick}
            disabled={button.disabled}
            onMouseEnter={() => setHoveredButton(button.id)}
            onMouseLeave={() => setHoveredButton(null)}
          >
            <div className="flex items-center gap-x-3 flex-1">
              <div className={cn(
                "p-2 rounded-lg bg-gray-50 transition-colors",
                hoveredButton === button.id && "bg-white shadow-sm"
              )}>
                <button.icon className={cn("size-5", button.color)} />
              </div>
              <div className="flex flex-col items-start">
                <span className="font-semibold text-gray-900 text-left">
                  {button.label}
                </span>
                <span className="text-sm text-gray-500 text-left">
                  {button.description}
                </span>
              </div>
            </div>
            <div className={cn(
              "p-1 rounded-full transition-colors",
              hoveredButton === button.id ? "bg-blue-100" : "bg-gray-100"
            )}>
              <ChevronRightIcon className="size-4 text-gray-600" />
            </div>
          </Button>
        ))}
        
        {/* Quick help section */}
        <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
          <div className="flex items-center gap-2 mb-2">
            <BotIcon className="size-4 text-blue-600" />
            <h3 className="font-semibold text-blue-900 text-sm">{t('quickHelp')}</h3>
          </div>
          <p className="text-xs text-blue-700">
            {t('quickHelpDesc')}
          </p>
        </div>
        
        {/* Support status */}
        <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-xs text-gray-600">{t('supportAvailable')}</span>
        </div>
      </div>
      
      <WidgetFooter />
    </>
  );
};