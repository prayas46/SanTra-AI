"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { z } from "zod";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2Icon } from "lucide-react";

import { api } from "@workspace/backend/_generated/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@workspace/ui/components/form";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Textarea } from "@workspace/ui/components/textarea";
import { cn } from "@workspace/ui/lib/utils";

const secretFormSchema = z.object({
  apiKeyHeaderValue: z.string().min(1, "API key is required"),
});

type SecretFormValues = z.infer<typeof secretFormSchema>;

interface SecretFormProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const VoiceNavSecretForm = ({ open, setOpen }: SecretFormProps) => {
  const upsertSecret = useMutation(api.private.secrets.upsert);

  const form = useForm<SecretFormValues>({
    resolver: zodResolver(secretFormSchema),
    defaultValues: {
      apiKeyHeaderValue: "",
    },
  });

  const onSubmit = async (values: SecretFormValues) => {
    try {
      await upsertSecret({
        service: "voice_nav",
        value: {
          apiKeyHeaderValue: values.apiKeyHeaderValue,
        },
      });

      setOpen(false);
      form.reset();
      toast.success("Voice navigation API key saved");
    } catch (error) {
      console.error(error);
      toast.error("Failed to save API key");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Connect Voice Navigation API</DialogTitle>
          <DialogDescription>
            Your API key will be securely stored in AWS Secrets Manager and
            used only from the backend when executing REST actions.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form className="flex flex-col gap-4" onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name="apiKeyHeaderValue"
              render={({ field }) => (
                <FormItem>
                  <Label>API Key / Token</Label>
                  <FormControl>
                    <Input
                      {...field}
                      type="password"
                      placeholder="Paste your API key or token"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="submit"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

interface RemovePluginFormProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const VoiceNavRemovePluginForm = ({ open, setOpen }: RemovePluginFormProps) => {
  const removePlugin = useMutation(api.private.plugins.remove);

  const onSubmit = async () => {
    try {
      await removePlugin({ service: "voice_nav" });
      setOpen(false);
      toast.success("Voice navigation plugin disconnected");
    } catch (error) {
      console.error(error);
      toast.error("Failed to disconnect plugin");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Disconnect Voice Navigation</DialogTitle>
        </DialogHeader>
        <DialogDescription>
          Are you sure you want to disconnect the voice navigation API key for
          this organization?
        </DialogDescription>
        <DialogFooter>
          <Button variant="destructive" onClick={onSubmit}>
            Disconnect
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const emptyAction = {
  name: "",
  label: "",
  description: "",
  type: "front_end" as const,
  clientEvent: "",
  method: "",
  path: "",
  queryParamsTemplate: "",
  bodyTemplate: "",
};

const VoiceNavConfigForm = ({
  config,
}: {
  config: typeof api.private.voiceNav.getConfig._returnType | undefined | null;
}) => {
  type ActionForm = {
    name: string;
    label?: string;
    description?: string;
    type: "front_end" | "rest_api";
    clientEvent?: string;
    method?: string;
    path?: string;
    queryParamsTemplate?: string;
    bodyTemplate?: string;
  };

  type FormValues = {
    apiBaseUrl: string;
    authType: "none" | "api_key_header";
    authHeaderName: string;
    languages: string;
    defaultGreeting: string;
    actions: ActionForm[];
  };

  const upsertConfig = useMutation(api.private.voiceNav.upsertConfig);

  const defaultValues: FormValues = {
    apiBaseUrl: config?.apiBaseUrl || "",
    authType: config?.auth?.type === "api_key_header" ? "api_key_header" : "none",
    authHeaderName: config?.auth?.headerName || "",
    languages: config?.languages?.join(", ") || "",
    defaultGreeting: config?.defaultGreeting || "",
    actions:
      config?.actions?.map((action) => ({
        name: action.name,
        label: action.label || "",
        description: action.description || "",
        type: action.type,
        clientEvent: action.clientEvent || "",
        method: action.method || "",
        path: action.path || "",
        queryParamsTemplate: action.queryParamsTemplate
          ? JSON.stringify(action.queryParamsTemplate, null, 2)
          : "",
        bodyTemplate: action.bodyTemplate
          ? JSON.stringify(action.bodyTemplate, null, 2)
          : "",
      })) || [emptyAction],
  };

  const form = useForm<FormValues>({
    defaultValues,
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "actions",
  });

  const onSubmit = async (values: FormValues) => {
    try {
      const languages = values.languages
        .split(",")
        .map((l) => l.trim())
        .filter(Boolean);

      const actions = values.actions
        .filter((a) => a.name.trim().length > 0)
        .map((a) => {
          let queryParamsTemplate: any = undefined;
          let bodyTemplate: any = undefined;

          if (a.queryParamsTemplate && a.queryParamsTemplate.trim().length > 0) {
            try {
              queryParamsTemplate = JSON.parse(a.queryParamsTemplate);
            } catch (error) {
              toast.error(
                `Invalid JSON in query params template for action "${a.name}"`
              );
              throw error;
            }
          }

          if (a.bodyTemplate && a.bodyTemplate.trim().length > 0) {
            try {
              bodyTemplate = JSON.parse(a.bodyTemplate);
            } catch (error) {
              toast.error(
                `Invalid JSON in body template for action "${a.name}"`
              );
              throw error;
            }
          }

          return {
            name: a.name,
            label: a.label || undefined,
            description: a.description || undefined,
            type: a.type,
            clientEvent: a.type === "front_end" ? a.clientEvent || undefined : undefined,
            method: a.type === "rest_api" ? a.method || undefined : undefined,
            path: a.type === "rest_api" ? a.path || undefined : undefined,
            queryParamsTemplate,
            bodyTemplate,
          };
        });

      await upsertConfig({
        apiBaseUrl: values.apiBaseUrl || undefined,
        auth:
          values.authType === "api_key_header" && values.authHeaderName.trim().length > 0
            ? {
                type: "api_key_header",
                headerName: values.authHeaderName.trim(),
              }
            : undefined,
        actions,
        languages: languages.length > 0 ? languages : undefined,
        defaultGreeting: values.defaultGreeting || undefined,
      });

      toast.success("Voice navigation configuration saved");
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Form {...form}>
      <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>API Configuration</CardTitle>
            <CardDescription>
              Configure how Santra should call your backend for voice navigation.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="apiBaseUrl"
              render={({ field }) => (
                <FormItem>
                  <Label>API Base URL</Label>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="https://api.your-backend.com"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="authType"
                render={({ field }) => (
                  <FormItem>
                    <Label>Authentication</Label>
                    <FormControl>
                      <select
                        className={cn(
                          "w-full rounded-md border bg-background px-3 py-2 text-sm",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        )}
                        value={field.value}
                        onChange={(e) => field.onChange(e.target.value)}
                      >
                        <option value="none">None</option>
                        <option value="api_key_header">API key in header</option>
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="authHeaderName"
                render={({ field }) => (
                  <FormItem>
                    <Label>Auth Header Name</Label>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="e.g. X-API-KEY"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="languages"
              render={({ field }) => (
                <FormItem>
                  <Label>Supported languages (comma-separated)</Label>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="e.g. en-US, hi-IN"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="defaultGreeting"
              render={({ field }) => (
                <FormItem>
                  <Label>Default greeting</Label>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Spoken greeting when voice navigation starts"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
            <CardDescription>
              Define the actions the voice assistant can trigger on your site.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="rounded-md border p-4 space-y-4 bg-background"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name={`actions.${index}.name` as const}
                      render={({ field }) => (
                        <FormItem>
                          <Label>Action name</Label>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="e.g. navigate_page"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`actions.${index}.label` as const}
                      render={({ field }) => (
                        <FormItem>
                          <Label>Label (optional)</Label>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Human-friendly label"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => remove(index)}
                  >
                    ✕
                  </Button>
                </div>
                <FormField
                  control={form.control}
                  name={`actions.${index}.description` as const}
                  render={({ field }) => (
                    <FormItem>
                      <Label>Description</Label>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="What this action does"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid gap-4 md:grid-cols-3">
                  <FormField
                    control={form.control}
                    name={`actions.${index}.type` as const}
                    render={({ field }) => (
                      <FormItem>
                        <Label>Type</Label>
                        <FormControl>
                          <select
                            className={cn(
                              "w-full rounded-md border bg-background px-3 py-2 text-sm",
                              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            )}
                            value={field.value}
                            onChange={(e) => field.onChange(e.target.value)}
                          >
                            <option value="front_end">Front-end</option>
                            <option value="rest_api">REST API</option>
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`actions.${index}.clientEvent` as const}
                    render={({ field }) => (
                      <FormItem>
                        <Label>Client event (front-end)</Label>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="e.g. santra:voiceAction"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`actions.${index}.method` as const}
                    render={({ field }) => (
                      <FormItem>
                        <Label>HTTP method (REST)</Label>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="e.g. GET, POST"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name={`actions.${index}.path` as const}
                    render={({ field }) => (
                      <FormItem>
                        <Label>Path (REST)</Label>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="e.g. /support/tickets"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name={`actions.${index}.queryParamsTemplate` as const}
                    render={({ field }) => (
                      <FormItem>
                        <Label>Query params template (JSON)</Label>
                        <FormControl>
                          <Textarea
                            {...field}
                            rows={4}
                            placeholder='{"q": "{{query}}"}'
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`actions.${index}.bodyTemplate` as const}
                    render={({ field }) => (
                      <FormItem>
                        <Label>Body template (JSON)</Label>
                        <FormControl>
                          <Textarea
                            {...field}
                            rows={4}
                            placeholder='{"subject": "{{subject}}", "message": "{{message}}"}'
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={() => append(emptyAction)}
            >
              Add action
            </Button>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Saving..." : "Save configuration"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export const VoiceNavView = () => {
  const config = useQuery(api.private.voiceNav.getConfig);
  const plugin = useQuery(api.private.plugins.getOne, { service: "voice_nav" });

  const [connectOpen, setConnectOpen] = useState(false);
  const [removeOpen, setRemoveOpen] = useState(false);

  const isLoading = config === undefined || plugin === undefined;

  const toggleConnection = () => {
    if (plugin) {
      setRemoveOpen(true);
    } else {
      setConnectOpen(true);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-y-2 bg-muted p-8">
        <Loader2Icon className="text-muted-foreground animate-spin" />
        <p className="text-muted-foreground text-sm">Loading voice navigation settings...</p>
      </div>
    );
  }

  return (
    <>
      <VoiceNavSecretForm open={connectOpen} setOpen={setConnectOpen} />
      <VoiceNavRemovePluginForm open={removeOpen} setOpen={setRemoveOpen} />
      <div className="flex min-h-screen flex-col bg-muted p-8">
        <div className="mx-auto w-full max-w-screen-lg space-y-8">
          <div className="space-y-2">
            <h1 className="text-2xl md:text-4xl">Voice Navigation</h1>
            <p className="text-muted-foreground">
              Configure how Santra interprets voice commands to navigate your site
              and call your backend APIs.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>API Key</CardTitle>
              <CardDescription>
                {plugin
                  ? "A voice navigation API key is connected for this organization."
                  : "Connect an API key to let Santra call your backend securely."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" onClick={toggleConnection}>
                {plugin ? "Disconnect API key" : "Connect API key"}
              </Button>
            </CardContent>
          </Card>

          <VoiceNavConfigForm config={config} />
        </div>
      </div>
    </>
  );
};
