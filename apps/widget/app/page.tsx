"use client";
import { use } from "react";
import { WidgetView } from "@/modules/widget/ui/views/widget-view";

// Default organization ID for local/dev widget usage.
// You can change this value or override it via the ?organizationId= query param.
const DEFAULT_ORGANIZATION_ID = "org_31mKCJtUZMz5Q34SwfL3xxJbrtc";

interface Props {
  searchParams: Promise<{
    organizationId?: string;
  }>;
}

export default function Page({ searchParams }: Props) {
  const { organizationId: paramOrgId } = use(searchParams);
  const organizationId = paramOrgId || DEFAULT_ORGANIZATION_ID;

  return <WidgetView organizationId={organizationId} />;
}
