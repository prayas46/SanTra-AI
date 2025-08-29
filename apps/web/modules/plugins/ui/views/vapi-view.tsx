"use client"

import { 
  GlobeIcon,
  PhoneIcon,
  PhoneCallIcon,
  WorkflowIcon
 } from "lucide-react";
import { type Feature, PluginCard } from "../components/plugin-card";
import { api } from "@workspace/backend/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
 } from "@workspace/ui/components/dialog";
 import
{
Form,
FormControl,
FormField,
FormItem,
FormMessage,
}
from "@workspace/ui/components/form";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { upsertSecret } from "@workspace/backend/lib/secrets";
import { set } from "date-fns";
import { Button } from "@workspace/ui/components/button"; 
import { useState } from "react";
import { VapiConnectedView } from "../components/vapi-connected-view";

 

const vapiFeatures: Feature[] = [
    {
        icon: GlobeIcon,
        label: "Web voice calls",
        description: "Voice chat directly in your app"
    },
    {
      icon: PhoneIcon,
      label: "Phone numbers",
      description: "Get dedicated business lines",
    },
    {
      icon: PhoneCallIcon,
      label: "Outbound calls",
      description: "Automated customer outreach",
  },
  {
      icon: WorkflowIcon,
      label: "Workflows",
      description: "Custom conversation flows",
  }
];

const formSchema = z.object({
  publicApiKey: z.string().min(1, "Public API Key is required"),
  privateApiKey: z.string().min(1, "Private API Key is required"),
});

const VapiPluginForm = ({
  open,
  setOpen,
}:{
  open: boolean;
  setOpen: (open: boolean) => void;
}) => {
  const upsertSecret = useMutation(api.private.secrets.upsert);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      publicApiKey: "",
      privateApiKey: "",
    },
  }); 

  const onSubmit = async (values: z.infer<typeof formSchema>) =>{
    try{
        await upsertSecret({
          service: "vapi",
          value: {
            publicApiKey: values.publicApiKey,
            privateApiKey: values.privateApiKey,
          }
        })
        setOpen(false)
        form.reset()
        toast.success("Vapi secret created")
    } catch (error) {
      console.error(error)
      toast.error("Something went Wrong!")
    }
  }

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enable Vapi</DialogTitle>
        </DialogHeader>
        <DialogDescription>
          Your API Keys are Safely encrypted and store using  AWS Secrets Manager
        </DialogDescription>
        <Form {...form}>
          <form 
          className="flex flex-col gap-4"
          onSubmit={form.handleSubmit(onSubmit)}
          >
            <FormField
            control={form.control}
            name="publicApiKey"
            render={({ field }) => (
              <FormItem>
              <Label>
                Public API Key
              </Label>
              <FormControl>
                <Input placeholder="Your Public API Key" 
                {...field} 
                type="password"
                />
              </FormControl>
              <FormMessage /> 
              </FormItem>
              )}
            />
            <FormField
            control={form.control}
            name="privateApiKey"
            render={({ field }) => (
              <FormItem>
              <Label>
                Private API Key
              </Label>
              <FormControl>
                <Input placeholder="Your Private API Key" 
                {...field} 
                type="password"
                />
              </FormControl>
              <FormMessage /> 
              </FormItem>
              )}
            />
            <DialogFooter>
              <Button
              disabled={form.formState.isSubmitting}
              type="submit"
              >
                {form.formState.isSubmitting ? "Connecting..." : "Connect"}
              </Button>
            </DialogFooter>
          </form>
          </Form>
      </DialogContent>
      </Dialog>
  )
};

const VapiPluginRemoveForm = ({
  open,
  setOpen,
}:{
  open: boolean;
  setOpen: (open: boolean) => void;
}) => {
  const removePlugin = useMutation(api.private.plugins.remove);

  const onSubmit = async () =>{
    try{
        await removePlugin({
          service: "vapi",
        })
        setOpen(false)
        toast.success("Vapi plugin removed")
    } catch (error) {
      console.error(error)
      toast.error("Something went Wrong!")
    }
  }

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Disconnect Vapi</DialogTitle>
        </DialogHeader>
        <DialogDescription>
          Are you sure you want to disconnect the Vapi plugin?
        </DialogDescription>
        <DialogFooter>
          <Button onClick={onSubmit} variant="destructive">
            Disconnect
          </Button>
        </DialogFooter>
      </DialogContent>
      </Dialog>
  )
};


export const VapiView = () => {
  const vapiPlugin = useQuery(api.private.plugins.getOne, { service: "vapi" });

  const [connectOpen, setConnectOpen] = useState(false);
  const [removeOpen, setRemoveOpen] = useState(false);

  const toggleConnection = () =>{
    if(vapiPlugin){
      setRemoveOpen(true);
    } else {
      setConnectOpen(true);
    }
  }

  return (
    <>
      <VapiPluginForm open={connectOpen} setOpen={setConnectOpen} />
      <VapiPluginRemoveForm open={removeOpen} setOpen={setRemoveOpen} />
      <div className="flex min-h-screen flex-col bg-muted p-8">
        <div className="mx-auto w-full max-w-screen-md">
          <div className="space-y-2">
            <h1 className="text-2xl md:text-4xl">Vapi Plugin</h1>
            <p className="text-muted-foreground">Connect Vapi to enable AI voice calls and phone support</p>
          </div>
          <div className="mt-8">
            {vapiPlugin ? (
              <VapiConnectedView onDisconnect={toggleConnection} />
            ) : (
            <PluginCard
                serviceImage="/vapi.png"
                serviceName="Vapi"
                features={vapiFeatures}
                isDisabled={false}
                onSubmit={toggleConnection}
            />
          )}
          </div>
        </div>
      </div>
    </>
  );
};
