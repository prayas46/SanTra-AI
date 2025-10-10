// apps/web/modules/billing/ui/components/pricing-table.tsx
"use client";

import { PricingTable as ClerkPricingTable } from "@clerk/nextjs";

export const PricingTable = () => {
  return (
     <div className="flex flex-col items-center justify-center gap-y-4">
      <ClerkPricingTable appearance={{
        elements: {
          pricingTableCard: "shadow-none border rounded-lg",
          pricingTableCardHeader: "bg-background",
          pricingTableCardBody: "bg-background",
          pricingTableCardFooter: "bg-background",
        }
      }} forOrganizations={true} />
    </div>
  );
};