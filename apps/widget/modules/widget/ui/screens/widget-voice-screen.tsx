"use client";

import { ArrowLeftIcon, MicIcon, MicOffIcon } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { cn } from "@workspace/ui/lib/utils";
import {
  AIConversation,
  AIConversationContent,
  AIConversationScrollButton,
} from "@workspace/ui/components/ai/conversation";
import {
  AIMessage,
  AIMessageContent,
} from "@workspace/ui/components/ai/message";
import { useVapi } from "@/modules/widget/hooks/use-vapi";
import { WidgetHeader } from "@/modules/widget/ui/components/widget-header";
import { useSetAtom } from "jotai";
import { screenAtom } from "../../atoms/widget-atoms";

export const WidgetVoiceScreen = () => {
  const setScreen = useSetAtom(screenAtom);
  const {
    isConnected,
    isConnecting,
    isSpeaking,
    transcript,
    startCall,
    endCall,
  } = useVapi();

  return (
    <div className="flex w-full h-full">
      {/* LEFT SIDE — Voice Chat */}
      <div className="w-1/2 flex flex-col bg-blue-100">
        <WidgetHeader>
          <div className="flex items-center gap-x-2 px-4 py-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setScreen("selection")}
              className="h-9 w-9"
            >
              <ArrowLeftIcon className="h-4 w-4" />
            </Button>
            <p className="font-semibold text-lg text-slate-900">Voice Chat</p>
          </div>
        </WidgetHeader>

        {transcript.length > 0 ? (
          <AIConversation className="flex-1 px-4 py-6 overflow-y-auto scrollbar-thin scrollbar-thumb-blue-300">
            <AIConversationContent>
              {transcript.map((message, index) => (
                <AIMessage
                  from={message.role}
                  key={`${message.role}-${index}-${message.text}`}
                >
                  <AIMessageContent>{message.text}</AIMessageContent>
                </AIMessage>
              ))}
            </AIConversationContent>
            <AIConversationScrollButton />
          </AIConversation>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-y-4 px-4">
            <div className="flex items-center justify-center rounded-full border bg-white p-3 shadow-md">
              <MicIcon className="h-6 w-6 text-blue-500" />
            </div>
            <p className="text-slate-700 text-sm">Transcript will appear here</p>
          </div>
        )}

        <div className="border-t border-blue-200 bg-blue-50 p-4">
          <div className="flex flex-col items-center gap-y-4">
            {isConnected && (
              <div className="flex items-center gap-x-2">
                <div
                  className={cn(
                    "h-4 w-4 rounded-full",
                    isSpeaking ? "animate-pulse bg-green-500" : "bg-green-500"
                  )}
                />
                <span className="text-slate-700 text-sm">
                  {isSpeaking ? "Assistant Speaking..." : "Listening..."}
                </span>
              </div>
            )}
            <div className="flex w-full justify-center">
              {isConnected ? (
                <Button
                  className="w-full flex items-center justify-center gap-2"
                  size="lg"
                  variant="destructive"
                  onClick={() => endCall()}
                >
                  <MicOffIcon className="h-5 w-5" />
                  End call
                </Button>
              ) : (
                <Button
                  className="w-full flex items-center justify-center gap-2"
                  disabled={isConnecting}
                  size="lg"
                  onClick={() => startCall()}
                >
                  <MicIcon className="h-5 w-5" />
                  Start call
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE — Branding Panel */}
      <div className="w-1/2 relative rounded-xl overflow-hidden flex flex-col items-center justify-center bg-gradient-to-br from-orange-500 via-orange-600 to-blue-700">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,white_1px,transparent_1px)] [background-size:20px_20px]" />
        <div className="absolute w-72 h-72 bg-white/25 blur-3xl rounded-full"></div>
        <div className="relative z-10 flex flex-col items-center text-center px-8">
          <h1 className="text-6xl font-extrabold text-white tracking-tight drop-shadow-xl">
            SanTRA<span className="text-orange-300">-AI</span>
          </h1>
          <p className="mt-5 text-xl text-white/80 max-w-sm leading-relaxed">
            Intelligence that listens. Precision that adapts. Support that feels human.
          </p>
        </div>
      </div>
    </div>
  );
};
