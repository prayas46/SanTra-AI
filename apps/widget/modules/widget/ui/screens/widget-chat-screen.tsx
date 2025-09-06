"use client";

import { useAtomValue } from "jotai";
import { AlertTriangleIcon } from "lucide-react";
import { errorMessageAtom, widgetSettingsAtom, showSuggestionsAtom } from "@/modules/widget/atoms/widget-atoms";
import { WidgetHeader } from "@/modules/widget/ui/components/widget-header";
import { useSetAtom } from "jotai";
import { screenAtom, conversationIdAtom, organizationIdAtom, contactSessionIdAtomFamily } from "../../atoms/widget-atoms";
import { useQuery, useAction } from "convex/react";
import { api } from "@workspace/backend/_generated/api";
import { Button } from "@workspace/ui/components/button";
import { useThreadMessages, toUIMessages } from "@convex-dev/agent/react";
import { ArrowLeftIcon, MenuIcon, XIcon, SendIcon, SparklesIcon, MessageCircleIcon, BotIcon, UserIcon, CalendarIcon, InfoIcon } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { Form, FormField } from "@workspace/ui/components/form";
import { DicebearAvatar } from "@workspace/ui/components/dicebear-avatar";
import { useInfiniteScroll } from "@workspace/ui/hooks/use-infinite-scroll";
import { InfiniteScrollTrigger } from "@workspace/ui/components/infinite-scroll-trigger";
import { useMemo, useEffect, useState, useRef, useCallback } from "react";
import { cn } from "@workspace/ui/lib/utils";

import {
  AIConversation,
  AIConversationContent,
} from "@workspace/ui/components/ai/conversation";

import {
  AIInput,
  AIInputTextarea,
} from "@workspace/ui/components/ai/input";

import {
  AIMessage,
  AIMessageContent,
} from "@workspace/ui/components/ai/message";

import {
  AIResponse
} from "@workspace/ui/components/ai/response";

const formSchema = z.object({
  message: z.string().min(1, "Message is required"),
});

export const WidgetChatScreen = () => {
  const setScreen = useSetAtom(screenAtom);
  const setConversationId = useSetAtom(conversationIdAtom);
  const setShowSuggestions = useSetAtom(showSuggestionsAtom);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(true);

  const widgetSettings = useAtomValue(widgetSettingsAtom);
  const conversationId = useAtomValue(conversationIdAtom);
  const organizationId = useAtomValue(organizationIdAtom);
  const showSuggestions = useAtomValue(showSuggestionsAtom);
  const contactSessionId = useAtomValue(
    contactSessionIdAtomFamily(organizationId || "")
  );

  const conversation = useQuery(
    api.public.conversations.getOne,
    conversationId && contactSessionId
      ? {
        conversationId,
        contactSessionId,
      }
      : "skip"
  );

  const messages = useThreadMessages(
    api.public.messages.getMany,
    conversation?.threadId && contactSessionId
      ? {
        threadId: conversation.threadId,
        contactSessionId,
      }
      : "skip",
    { initialNumItems: 10 },
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
    if (!widgetSettings) {
      return [];
    }

    return Object.keys(widgetSettings.defaultSuggestions).map((key) => {
      return widgetSettings.defaultSuggestions[
        key as keyof typeof widgetSettings.defaultSuggestions
      ];
    });
  }, [widgetSettings]);

  // Smart auto-scroll logic
  const scrollToBottom = useCallback((force = false) => {
    if (messagesEndRef.current && (autoScrollEnabled || force)) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [autoScrollEnabled]);

  // Check if user is near bottom to enable/disable auto-scroll
  const handleScroll = useCallback(() => {
    if (!messagesContainerRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    
    setAutoScrollEnabled(isNearBottom);
  }, []);

  useEffect(() => {
    setShowSuggestions(true);
  }, [conversationId, setShowSuggestions]);

  // Auto-scroll when messages change
  useEffect(() => {
    if (messages.results) {
      // Delay scroll to ensure DOM is updated
      const timeoutId = setTimeout(() => {
        scrollToBottom();
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }
  }, [messages.results, scrollToBottom]);

  // Auto-scroll when typing starts/ends
  useEffect(() => {
    if (isTyping) {
      scrollToBottom(true);
    }
  }, [isTyping, scrollToBottom]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      message: "",
    },
  });

  const createMessage = useAction(api.public.messages.create);
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!conversation || !contactSessionId) {
      return;
    }

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

  const handleSuggestionClick = useCallback((suggestion: string) => {
    form.setValue("message", suggestion, {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true,
    });
    setShowSuggestions(false);
    form.handleSubmit(onSubmit)();
  }, [form, onSubmit]);

  const isResolved = conversation?.status === "resolved";
  const hasMessages = messages.results && messages.results.length > 0;
  const uiMessages = useMemo(() => toUIMessages(messages.results ?? []), [messages.results]);

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      {/* Header */}
      <WidgetHeader className="flex items-center justify-between px-4 py-3 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-slate-200/60 dark:border-slate-700/60 shadow-sm">
        <div className="flex items-center gap-3">
          <Button
            onClick={onBack}
            size="icon"
            variant="ghost"
            className="h-9 w-9 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all duration-200"
          >
            <ArrowLeftIcon className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                <BotIcon className="h-5 w-5 text-white" />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900"></div>
            </div>
            <div>
              <h2 className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
                AI Assistant
              </h2>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-slate-500 dark:text-slate-400">Online & ready to help</span>
              </div>
            </div>
          </div>
        </div>
        <Button
          size="icon"
          variant="ghost"
          className="h-9 w-9 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all duration-200"
        >
          <MenuIcon className="h-4 w-4" />
        </Button>
      </WidgetHeader>

      {/* Chat Messages Area */}
      <div className="flex-1 flex flex-col min-h-0 relative overflow-hidden">
        <div 
          ref={messagesContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 hover:scrollbar-thumb-slate-400 dark:scrollbar-thumb-slate-600 dark:hover:scrollbar-thumb-slate-500 scrollbar-track-transparent"
        >
          <div className="px-4 py-6 space-y-4 min-h-full flex flex-col">
            {/* Infinite scroll trigger */}
            <InfiniteScrollTrigger
              canLoadMore={canLoadMore}
              isLoadingMore={isLoadingMore}
              onLoadMore={handleLoadMore}
              ref={topElementRef}
            />
            
            {/* Empty state */}
            {!hasMessages && !isLoadingMore && (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
                <div className="relative mb-6">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 flex items-center justify-center shadow-2xl">
                    <BotIcon className="h-10 w-10 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full border-3 border-white dark:border-slate-900 flex items-center justify-center">
                    <SparklesIcon className="h-3 w-3 text-white" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-3">
                  👋 Hello! How can I help you today?
                </h3>
                <p className="text-slate-500 dark:text-slate-400 max-w-sm leading-relaxed text-sm">
                  I'm your AI assistant, ready to help with appointments, insurance questions, and more. Choose a quick action below or type your message.
                </p>
              </div>
            )}

            {/* Messages */}
            <div className="space-y-4 flex-1">
              {uiMessages?.map((message, index) => {
                const isUser = message.role === "user";
                const isLast = index === uiMessages.length - 1;
                
                return (
                  <div 
                    key={message.id || index} 
                    className={`flex gap-3 animate-in slide-in-from-bottom-2 duration-300 ${
                      isUser ? "justify-end" : "justify-start"
                    }`}
                    style={{ animationDelay: `${Math.min(index * 50, 200)}ms` }}
                  >
                    {/* Assistant Avatar */}
                    {!isUser && (
                      <div className="flex-shrink-0 mt-1">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 flex items-center justify-center shadow-md">
                          <BotIcon className="h-4 w-4 text-white" />
                        </div>
                      </div>
                    )}
                    
                    {/* Message Bubble */}
                    <div className={`max-w-[75%] group ${isUser ? "flex flex-col items-end" : ""}`}>
                      <div
                        className={`px-4 py-3 rounded-2xl shadow-sm transition-all duration-200 hover:shadow-md ${
                          isUser 
                            ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-br-md" 
                            : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-bl-md"
                        }`}
                      >
                        <div className={`text-sm leading-relaxed whitespace-pre-wrap break-words ${isUser ? "text-white" : ""}`}>
                          {message.content}
                        </div>
                      </div>
                      <div className={`text-xs text-slate-400 dark:text-slate-500 mt-1.5 px-1 opacity-0 group-hover:opacity-100 transition-all duration-200`}>
                        {isLast ? "Just now" : "Earlier"}
                      </div>
                    </div>

                    {/* User Avatar */}
                    {isUser && (
                      <div className="flex-shrink-0 mt-1">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-slate-500 to-slate-600 flex items-center justify-center shadow-md">
                          <UserIcon className="h-4 w-4 text-white" />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Typing Indicator */}
              {isTyping && (
                <div className="flex gap-3 animate-in slide-in-from-bottom-2 duration-300">
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 flex items-center justify-center shadow-md">
                      <BotIcon className="h-4 w-4 text-white" />
                    </div>
                  </div>
                  <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl rounded-bl-md shadow-sm px-4 py-3">
                    <div className="flex items-center space-x-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                      <span className="text-xs text-slate-500">SanTra...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Scroll anchor */}
            <div ref={messagesEndRef} className="h-1" />
          </div>
        </div>

        {/* Suggestions Overlay */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute bottom-4 left-4 right-4 z-20">
            <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-2xl p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                    <SparklesIcon className="h-3 w-3 text-white" />
                  </div>
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Quick Actions
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  onClick={() => setShowSuggestions(false)}
                >
                  <XIcon className="h-3.5 w-3.5" />
                </Button>
              </div>
              <div className="space-y-2">
                {suggestions.slice(0, 3).map((suggestion, index) => {
                  if (!suggestion) return null;
                  
                  const getIcon = (suggestion: string) => {
                    if (suggestion.toLowerCase().includes('appointment')) return CalendarIcon;
                    if (suggestion.toLowerCase().includes('insurance')) return InfoIcon;
                    return MessageCircleIcon;
                  };
                  
                  const Icon = getIcon(suggestion);
                  
                  return (
                    <button
                      key={suggestion}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-200/60 dark:border-slate-700/60 hover:border-indigo-300 dark:hover:border-indigo-600 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 dark:hover:from-blue-950/50 dark:hover:to-indigo-950/50 transition-all duration-300 text-left group transform hover:scale-[1.02]"
                    >
                      <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/50 flex items-center justify-center transition-all duration-300">
                        <Icon className="h-4 w-4 text-slate-600 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400" />
                      </div>
                      <span className="text-sm text-slate-700 dark:text-slate-300 font-medium flex-1 group-hover:text-slate-900 dark:group-hover:text-slate-100 transition-colors">
                        {suggestion}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-t border-slate-200/60 dark:border-slate-700/60 p-4">
        {/* Show scroll to bottom button if not auto-scrolling */}
        {!autoScrollEnabled && (
          <div className="flex justify-center mb-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => scrollToBottom(true)}
              className="rounded-full text-xs px-3 py-1.5 h-auto bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm hover:bg-white dark:hover:bg-slate-800 transition-all duration-200"
            >
              ↓ New messages
            </Button>
          </div>
        )}
        
        <Form {...form}>
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <FormField
                control={form.control}
                disabled={isResolved}
                name="message"
                render={({ field }) => (
                  <div className="relative">
                    <AIInputTextarea
                      disabled={isResolved || isTyping}
                      onChange={field.onChange}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          if (form.formState.isValid && !isTyping) {
                            form.handleSubmit(onSubmit)();
                          }
                        }
                      }}
                      placeholder={
                        isResolved
                          ? "This conversation has been resolved."
                          : isTyping
                          ? "AI is responding..."
                          : "Type your message..."
                      }
                      value={field.value}
                      className="min-h-[48px] max-h-32 resize-none rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 px-4 py-3 pr-12 focus:border-indigo-400 dark:focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-800 transition-all duration-200 text-sm placeholder:text-slate-400 backdrop-blur-sm"
                    />
                  </div>
                )}
              />
            </div>
            <Button
              type="submit"
              disabled={isResolved || !form.formState.isValid || isTyping || !form.watch("message")?.trim()}
              onClick={form.handleSubmit(onSubmit)}
              className={`h-12 w-12 rounded-2xl shadow-lg transition-all duration-300 flex-shrink-0 ${
                isResolved || !form.formState.isValid || isTyping || !form.watch("message")?.trim()
                  ? "bg-slate-300 dark:bg-slate-600 cursor-not-allowed"
                  : "bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 hover:shadow-xl hover:scale-105 active:scale-95"
              }`}
            >
              <SendIcon className={`h-5 w-5 transition-transform duration-200 ${isTyping ? "animate-pulse" : ""}`} />
            </Button>
          </div>
        </Form>
      </div>
    </div>
  );
};