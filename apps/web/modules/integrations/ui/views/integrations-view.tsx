"use client";

import { useState } from "react";
import { useOrganization } from "@clerk/nextjs";
import { INTEGRATIONS, IntegrationId } from "../../constants";
import { createScript } from "../../utils";

import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Separator } from "@workspace/ui/components/separator";
import { toast } from "sonner";
import { CopyIcon, ExternalLinkIcon } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";

export const IntegrationsView = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedSnippet, setSelectedSnippet] = useState("");
  const { organization } = useOrganization();

  const handleIntegrationClick = (integrationId: IntegrationId) => {
    if (!organization?.id) {
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
      toast.success("Copied!");
    } catch {
      toast.error("Failed to copy");
    }
  };

  return (
    <>
      <IntegrationDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        snippet={selectedSnippet}
      />

      <div className="flex min-h-screen flex-col bg-muted p-10">
        <div className="mx-auto w-full max-w-screen-lg rounded-xl bg-background p-8 shadow-sm border">

          <div className="space-y-2">
            <h1 className="text-3xl font-semibold">Setup & Integrations</h1>
            <p className="text-muted-foreground">
              Connect ChatBox with your website in seconds.
            </p>
          </div>

          <div className="mt-8 space-y-6">
            <div className="flex items-center gap-4">
              <Label className="whitespace-nowrap">Organization ID</Label>

              <Input
                disabled
                readOnly
                value={organization?.id ?? ""}
                className="flex-1 bg-background font-mono text-sm"
              />

              <Button size="sm" onClick={handleCopy} className="gap-2">
                <CopyIcon className="size-4" />
                Copy
              </Button>
            </div>
          </div>

          <Separator className="my-8" />

          <div className="space-y-2">
            <Label className="text-lg font-medium">Integrations</Label>
            <p className="text-sm text-muted-foreground">
              Choose your platform and get your installation script.
            </p>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
            {INTEGRATIONS.map((integration) => (
              <button
                key={integration.id}
                type="button"
                onClick={() => handleIntegrationClick(integration.id)}
                className="flex flex-col items-center gap-3 rounded-lg border bg-background p-4 transition hover:bg-accent"
              >
                <img
                  src={integration.icon}
                  alt={integration.title}
                  width={40}
                  height={40}
                  className="object-contain"
                />
                <p className="text-sm font-medium">{integration.title}</p>
              </button>
            ))}
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
  onOpenChange: (v: boolean) => void;
  snippet: string;
}) => {
  const { organization } = useOrganization();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(snippet);
      toast.success("Copied!");
    } catch {
      toast.error("Failed to copy");
    }
  };

  const handlePreview = () => {
    if (!organization?.id) {
      toast.error("Organization ID not found");
      return;
    }
    window.open(`/integration/demo?orgId=${organization.id}`, "_blank");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Integrate with your Website</DialogTitle>
          <DialogDescription>
            Copy the code and add it to your website.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Step 1 */}
          <div className="space-y-2">
            <div className="rounded-md bg-accent p-2 text-sm font-medium">
              1. Copy the script
            </div>

            <div className="group relative">
              <pre className="max-h-[300px] overflow-auto whitespace-pre-wrap rounded-md bg-foreground p-3 font-mono text-secondary text-sm">
                {snippet}
              </pre>

              <Button
                onClick={handleCopy}
                size="icon"
                variant="secondary"
                className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition"
              >
                <CopyIcon className="size-3" />
              </Button>
            </div>
          </div>

          {/* Step 2 */}
          <div className="space-y-2">
            <div className="rounded-md bg-accent p-2 text-sm font-medium">
              2. Paste it into your HTML
            </div>
            <p className="text-sm text-muted-foreground">
              Add this snippet just before the closing <code>&lt;/body&gt;</code> tag.
            </p>
          </div>

          {/* Step 3 */}
          <div className="space-y-2">
            <div className="rounded-md bg-accent p-2 text-sm font-medium">
              3. Preview your integration
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              Test the widget on a demo page.
            </p>

            <Button
              onClick={handlePreview}
              variant="outline"
              className="w-full gap-2"
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
