"use client"

import { useOrganization } from "@clerk/nextjs";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Separator } from "@workspace/ui/components/separator";
import { CopyIcon, ExternalLinkIcon } from "lucide-react";
import { toast } from "sonner";
import { INTEGRATIONS, IntegrationId } from "../../constants";
import { useState } from "react";
import {createScript} from "../../utils";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";

// Remove the problematic Image import from next/image
// import { Image } from "next/image";

export const IntegrationsView = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedSnippet, setSelectedSnippet] = useState("");
  const { organization } = useOrganization();

  // // Add the missing createScript function
  // const createScript = (integrationId: IntegrationId, orgId: string): string => {
  //   // This is just an example - adjust based on your actual script needs
  //   return `
  //     <script>
  //       window.ChatBoxConfig = {
  //         organizationId: "${orgId}", 
  //         integration: "${integrationId}"
  //       };
  //       (function() {
  //         var script = document.createElement('script');
  //         script.src = 'https://your-domain.com/chatbox.js';
  //         script.async = true;
  //         document.head.appendChild(script);
  //       })();
  //     </script>
  //   `.trim();
  // };

  const handleIntegrationClick = (integrationId: IntegrationId) => {
    if (!organization) {
      toast.error("Organization ID not found");
      return;
    }

    const snippet = createScript(integrationId, organization.id);
    setSelectedSnippet(snippet);
    setDialogOpen(true);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(organization?.id ?? "");
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Failed to copy to clipboard")
    }
  };

  return (
    <>
      <IntegrationDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        snippet={selectedSnippet}
      />
      <div className="flex min-h-screen flex-col bg-muted p-8">
        <div className="mx-auto w-full max-w-screen-md">
          <div className="space-y-2">
            <h1 className="text-2xl md:text-4xl">Setup and Integrations</h1>
            <p className="text-muted-foreground">
              Choose the integration that&apos;s right for you
            </p>
          </div>
          <div className="mt-8 space-y-6">
            <div className="flex items-center gap-4">
              <Label className="w-34" htmlFor="organization-id">
                Organization ID
              </Label>

              <Input
                disabled
                id="organization-id"
                readOnly
                value={organization?.id ?? ""}
                className="flex-1 bg-background font-mono text-sm"
              />
              <Button
                className="gap-2"
                onClick={handleCopy}
                size="sm"
              >
                <CopyIcon className="size-4" />
                Copy
              </Button>
            </div>
          </div>

          <Separator className="my-8" />
          <div className="space-y-6">
            <div className="space-y-1">
              <Label className="text-lg">Integrations</Label>
              <p className="text-muted-foreground text-sm">
                Add the following code to your website to enable the ChatBox
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {INTEGRATIONS.map((integration) => (
                <button
                  className="flex items-center gap-4 rounded-lg border bg-background p-4 hover:bg-accent"
                  key={integration.id}
                  onClick={() => handleIntegrationClick(integration.id)}
                  type="button"
                >
                  {/* Use regular img tag instead of Next.js Image component */}
                  <img
                    alt={integration.title}
                    height={32}
                    src={integration.icon}
                    width={32}
                    className="object-contain"
                  />
                  <p>{integration.title}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export const IntegrationDialog = ({
  open,
  onOpenChange,
  snippet,
}: {
  open: boolean;
  onOpenChange: (value: boolean) => void;
  snippet: string;
}) => {
  const { organization } = useOrganization();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(snippet);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Failed to copy to clipboard")
    }
  };

  const handlePreview = () => {
    if (!organization?.id) {
      toast.error("Organization ID not found");
      return;
    }
    
    // Open demo page in new tab with organization ID
    const demoUrl = `/integration/demo?orgId=${organization.id}`;
    window.open(demoUrl, '_blank');
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Integrate with your Website</DialogTitle>
          <DialogDescription>
            Follow these steps to add the ChatBox to your Website
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-2">
            <div className="rounded-md bg-accent p-2 text-sm">
              1. Copy the following code
            </div>
            <div className="group relative">
              <pre className="max-h-[300px] overflow-x-auto overflow-y-auto whitespace-pre-wrap break-all rounded-md bg-foreground p-2 font-mono text-secondary text-sm">
                {snippet}
              </pre>
              <Button
                className="absolute top-2 right-2 size-6 opacity-0 transition-opacity group-hover:opacity-100"
                onClick={handleCopy}
                size="icon"
                variant="secondary"
              >
                <CopyIcon className="size-3" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="rounded-md bg-accent p-2 text-sm">
              2. Add the code in your page
            </div>
            <p className="text-muted-foreground text-sm">
              Paste the ChatBox code above in your page. You can add it in the HTML section.
            </p>
          </div>

          <div className="space-y-2">
            <div className="rounded-md bg-accent p-2 text-sm">
              3. Test your integration
            </div>
            <p className="text-muted-foreground text-sm mb-3">
              Try out your widget on a demo website before implementing it on your site.
            </p>
            <Button 
              onClick={handlePreview}
              className="w-full gap-2"
              variant="outline"
            >
              <ExternalLinkIcon className="size-4" />
              Preview Integration
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};