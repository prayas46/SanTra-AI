"use client";

import { useAtomValue, useSetAtom } from "jotai";
import { screenAtom, conversationIdAtom, organizationIdAtom, contactSessionIdAtomFamily, showSuggestionsAtom, widgetSettingsAtom } from "../../atoms/widget-atoms";
import { WidgetHeader } from "@/modules/widget/ui/components/widget-header";
import { Button } from "@workspace/ui/components/button";
import { ArrowLeftIcon, BotIcon, UserIcon, SparklesIcon, MessageCircleIcon, CalendarIcon, InfoIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormField } from "@workspace/ui/components/form";
import { useThreadMessages, toUIMessages } from "@convex-dev/agent/react";
import { useQuery, useAction } from "convex/react";
import { api } from "@workspace/backend/_generated/api";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useInfiniteScroll } from "@workspace/ui/hooks/use-infinite-scroll";
import { InfiniteScrollTrigger } from "@workspace/ui/components/infinite-scroll-trigger";
import { AIInputTextarea } from "@workspace/ui/components/ai/input";

const formSchema = z.object({
  message: z.string().min(1, "Message is required"),
});

export const WidgetChatScreen = () => {
  const setScreen = useSetAtom(screenAtom);
  const setConversationId = useSetAtom(conversationIdAtom);
  const setShowSuggestions = useSetAtom(showSuggestionsAtom);

  const widgetSettings = useAtomValue(widgetSettingsAtom);
  const conversationId = useAtomValue(conversationIdAtom);
  const organizationId = useAtomValue(organizationIdAtom);
  const contactSessionId = useAtomValue(contactSessionIdAtomFamily(organizationId || ""));
  const showSuggestions = useAtomValue(showSuggestionsAtom);

  const [isTyping, setIsTyping] = useState(false);
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const conversation = useQuery(
    api.public.conversations.getOne,
    conversationId && contactSessionId ? { conversationId, contactSessionId } : "skip"
  );

  const messages = useThreadMessages(
    api.public.messages.getMany,
    conversation?.threadId && contactSessionId ? { threadId: conversation.threadId, contactSessionId } : "skip",
    { initialNumItems: 10 }
  );

  const { topElementRef, handleLoadMore, canLoadMore, isLoadingMore } = useInfiniteScroll({
    status: messages.status,
    loadMore: messages.loadMore,
    loadSize: 10,
  });

  const onBack = () => {
    setConversationId(null);
    setShowSuggestions(true);
    setScreen("selection");
  };

  const suggestions = useMemo(() => {
    if (!widgetSettings) return [];
    return Object.keys(widgetSettings.defaultSuggestions).map(
      (key) => widgetSettings.defaultSuggestions[key as keyof typeof widgetSettings.defaultSuggestions]
    );
  }, [widgetSettings]);

  const scrollToBottom = useCallback((force = false) => {
    if (messagesEndRef.current && (autoScrollEnabled || force)) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [autoScrollEnabled]);

  const handleScroll = useCallback(() => {
    if (!messagesContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    setAutoScrollEnabled(scrollHeight - scrollTop - clientHeight < 100);
  }, []);

  useEffect(() => {
    setShowSuggestions(true);
  }, [conversationId, setShowSuggestions]);

  useEffect(() => {
    if (messages.results) setTimeout(scrollToBottom, 100);
  }, [messages.results, scrollToBottom]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { message: "" },
  });

  const createMessage = useAction(api.public.messages.create);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!conversation || !contactSessionId) return;

    setIsTyping(true);
    setShowSuggestions(false);
    form.reset();

    try {
      await createMessage({
        threadId: conversation.threadId,
        prompt: values.message,
        contactSessionId,
      });
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSuggestionClick = useCallback(
    (suggestion: string) => {
      form.setValue("message", suggestion, { shouldValidate: true, shouldDirty: true, shouldTouch: true });
      setShowSuggestions(false);
      form.handleSubmit(onSubmit)();
    },
    [form, onSubmit]
  );

  const isResolved = conversation?.status === "resolved";
  const hasMessages = messages.results && messages.results.length > 0;
  const uiMessages = useMemo(() => toUIMessages(messages.results ?? []), [messages.results]);

  return (
    <div className="flex w-full h-full">
      {/* LEFT SIDE — LIGHT BLUE CHAT */}
      <div className="w-1/2 flex flex-col bg-blue-100">
        <WidgetHeader>
          <div className="flex items-center gap-3 px-4 py-3">
            <Button onClick={onBack} size="icon" variant="ghost" className="h-9 w-9">
              <ArrowLeftIcon className="h-4 w-4" />
            </Button>
            <h2 className="font-semibold text-lg text-slate-900">Chat</h2>
          </div>
        </WidgetHeader>

        <div
          ref={messagesContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto px-4 py-6 scrollbar-thin scrollbar-thumb-blue-300"
        >
          <InfiniteScrollTrigger
            canLoadMore={canLoadMore}
            isLoadingMore={isLoadingMore}
            onLoadMore={handleLoadMore}
            ref={topElementRef}
          />

          {!hasMessages && (
            <div className="flex flex-col items-center justify-center text-center py-8">
              <BotIcon className="h-10 w-10 text-blue-500 mb-4" />
              <p className="text-sm text-slate-700">Hello! How can I help you today?</p>
            </div>
          )}

          <div className="space-y-4 flex-1">
            {uiMessages?.map((message, index) => {
              const isUser = message.role === "user";
              return (
                <div key={message.id || index} className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
                  {!isUser && (
                    <div className="w-8 h-8 rounded-xl bg-blue-500 flex items-center justify-center">
                      <BotIcon className="h-4 w-4 text-white" />
                    </div>
                  )}
                  <div className={`${isUser ? "bg-blue-400 text-white" : "bg-white text-slate-900"} px-4 py-2 rounded-2xl max-w-[70%]`}>
                    {message.content}
                  </div>
                  {isUser && (
                    <div className="w-8 h-8 rounded-xl bg-blue-300 flex items-center justify-center">
                      <UserIcon className="h-4 w-4 text-white" />
                    </div>
                  )}
                </div>
              );
            })}

            {isTyping && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-500 flex items-center justify-center">
                  <BotIcon className="h-4 w-4 text-white" />
                </div>
                <div className="bg-white px-4 py-2 rounded-2xl animate-pulse">SanTRA-AI is typing...</div>
              </div>
            )}

            <div ref={messagesEndRef} className="h-1" />
          </div>
        </div>

        <div className="p-4 border-t border-blue-200 bg-blue-50">
          <Form {...form}>
            <div className="flex gap-3">
              <div className="flex-1">
                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <AIInputTextarea
                      {...field}
                      disabled={isResolved || isTyping}
                      placeholder="Type a message..."
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          if (form.formState.isValid && !isTyping) form.handleSubmit(onSubmit)();
                        }
                      }}
                      className="w-full min-h-[48px] max-h-24 resize-none rounded-2xl px-4 py-2"
                    />
                  )}
                />
              </div>
              <Button
                onClick={form.handleSubmit(onSubmit)}
                disabled={!form.watch("message")?.trim() || isTyping || isResolved}
                className="w-12 h-12 rounded-2xl bg-blue-500 text-white"
              >
                Send
              </Button>
            </div>
          </Form>
        </div>
      </div>

      {/* RIGHT SIDE — BRAND PANEL */}
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
