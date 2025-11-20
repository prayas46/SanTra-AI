"use client";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@workspace/ui/components/select";

import {
    ListIcon,
    ArrowRightIcon,
    ArrowUpIcon,
    CheckIcon,
    CornerUpLeftIcon,
} from "lucide-react";

import { usePaginatedQuery } from "convex/react";
import { api } from "@workspace/backend/_generated/api";
import { usePathname } from "next/navigation";
import { cn } from "@workspace/ui/lib/utils";
import { ScrollArea } from "@workspace/ui/components/scroll-area";
import { getCountryFromTimezone, getCountryflagUrl } from "@/lib/country-utils";
import { DicebearAvatar } from "@workspace/ui/components/dicebear-avatar";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ConversationStatusIcon } from "@workspace/ui/components/conversation-status-icon";
import { useAtomValue, useSetAtom } from "jotai/react";
import { statusFilterAtom } from "../../atoms";
import { useInfiniteScroll } from "@workspace/ui/hooks/use-infinite-scroll";
import { InfiniteScrollTrigger } from "@workspace/ui/components/infinite-scroll-trigger";
import { Skeleton } from "@workspace/ui/components/skeleton";

// Component for rendering skeleton loading state
export const SkeletonConversations = () => (
    <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-auto px-4 py-2">
        {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-start gap-3 p-3">
                <Skeleton className="h-10 w-10 rounded-full" />

                <div className="flex-1">
                    <Skeleton className="h-4 w-24" />
                    <div className="mt-2">
                        <Skeleton className="h-3 w-full" />
                    </div>
                </div>
            </div>
        ))}
    </div>
);


export const ConversationsPanel = () => {
    const pathname = usePathname();
    const statusFilter = useAtomValue(statusFilterAtom);
    const setStatusFilter = useSetAtom(statusFilterAtom);

    // Fetch paginated conversations data
    const conversations = usePaginatedQuery(
        api.private.conversations.getMany,
        {
            status: statusFilter === "all" ? undefined : statusFilter,
        },
        {
            initialNumItems: 10,
        }
    );

    // Hook for handling infinite scroll
    const {
        topElementRef,
        handleLoadMore,
        canLoadMore,
        isLoadingMore,
        isLoadingFirstPage,
    } = useInfiniteScroll({
        status: conversations.status,
        loadMore: conversations.loadMore,
        loadSize: 10,
    });

    return (
        // Set a fixed, wider width (w-96, which is 384px) to take more horizontal screen space.
        // NOTE: The previous JSX comment was incorrectly placed, causing syntax errors.
        <div className="flex h-full w-96 flex-shrink-0 flex-col bg-background">
            
            {/* FILTER BAR - Increased padding, added shadow for separation */}
            <div className="flex flex-col gap-3.5 border-b px-4 pt-4 pb-3 shadow-sm">
                <Select
                    value={statusFilter}
                    onValueChange={(value) =>
                        setStatusFilter(value as "unresolved" | "escalated" | "resolved" | "all")
                    }
                >
                    <SelectTrigger className="h-9 border-border shadow-md transition-colors hover:bg-muted/50 focus:bg-muted/50">
                        <SelectValue placeholder="Filter" />
                    </SelectTrigger>

                    <SelectContent>
                        <SelectItem value="all">
                            <div className="flex items-center gap-2">
                                <ListIcon className="size-4" />
                                All
                            </div>
                        </SelectItem>

                        <SelectItem value="unresolved">
                            <div className="flex items-center gap-2">
                                <ArrowRightIcon className="size-4 text-primary" />
                                Unresolved
                            </div>
                        </SelectItem>

                        <SelectItem value="escalated">
                            <div className="flex items-center gap-2">
                                <ArrowUpIcon className="size-4 text-destructive" />
                                Escalated
                            </div>
                        </SelectItem>

                        <SelectItem value="resolved">
                            <div className="flex items-center gap-2">
                                <CheckIcon className="size-4 text-accent" />
                                Resolved
                            </div>
                        </SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* BODY */}
            {isLoadingFirstPage ? (
                <SkeletonConversations />
            ) : (
                <ScrollArea className="max-h-[calc(100vh-53px)]">
                    {/* Added horizontal padding to the container for list items */}
                    <div className="flex w-full flex-col px-4"> 
                        {conversations.results.map((conversation: any) => {
                            const isLastFromOperator =
                                conversation.lastMessage?.message?.role !== "user";

                            const country = getCountryFromTimezone(
                                conversation.contactSession.metadata?.timezone
                            );

                            const countryFlagUrl = country?.code
                                ? getCountryflagUrl(country.code)
                                : undefined;

                            return (
                                <Link
                                    key={conversation._id}
                                    href={`/conversations/${conversation._id}`}
                                    className={cn(
                                        "relative flex cursor-pointer items-start gap-3 border-b py-3 transition-colors duration-150 rounded-md -mx-2 px-2", // Adjusted vertical padding and added hover padding
                                        "hover:bg-accent/10",
                                        pathname === `/conversations/${conversation._id}` &&
                                            "bg-accent/20 border-accent/50 hover:bg-accent/20 shadow-inner" // Highlight active item more
                                    )}
                                >
                                    <DicebearAvatar
                                        seed={conversation.contactSession._id}
                                        badgeImageUrl={countryFlagUrl}
                                        size={40}
                                        className="shrink-0"
                                    />

                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-center mb-0.5">
                                            <span className="truncate font-semibold text-foreground">
                                                {conversation.contactSession.name}
                                            </span>

                                            {/* Time stamp moved to align right with the primary text */}
                                            <span className="ml-2 text-xs text-muted-foreground shrink-0">
                                                {formatDistanceToNow(
                                                    conversation._creationTime,
                                                    { addSuffix: true }
                                                )}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {isLastFromOperator && (
                                                <CornerUpLeftIcon className="size-3 text-muted-foreground" />
                                            )}

                                            <span
                                                className={cn(
                                                    "line-clamp-1 text-sm text-muted-foreground pr-1 flex-1 min-w-0", // Added flex-1 and min-w-0 for better truncation
                                                    !isLastFromOperator && "font-medium text-foreground"
                                                )}
                                            >
                                                {conversation.lastMessage?.text || "No recent messages."}
                                            </span>

                                            <ConversationStatusIcon
                                                status={conversation.status}
                                            />
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}

                        <InfiniteScrollTrigger
                            ref={topElementRef}
                            canLoadMore={canLoadMore}
                            isLoadingMore={isLoadingMore}
                            onLoadMore={handleLoadMore}
                        />
                    </div>
                </ScrollArea>
            )}
        </div>
    );
};