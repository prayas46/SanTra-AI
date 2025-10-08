"use client"
import { use } from "react";
import { WidgetView } from "@/modules/widget/ui/views/widget-view";

interface Props {
  searchParams: Promise<{
    organizationId: string;
  }>;
}

export default function Page({ searchParams }: Props) {
  const { organizationId } = use(searchParams);
  return <WidgetView organizationId={"org_31YVI5n7mtOP3AcdBPj9dfnZmLB"} />;
}

