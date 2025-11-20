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

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@workspace/ui/components/form";

import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@workspace/ui/components/button"; 
import { useState } from "react";
import { VapiConnectedView } from "../components/vapi-connected-view";
import { motion } from "framer-motion";


// -------------------------------------
// FEATURES
// -------------------------------------
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


// -------------------------------------
// SCHEMA
// -------------------------------------
const formSchema = z.object({
  publicApiKey: z.string().min(1, "Public API Key is required"),
  privateApiKey: z.string().min(1, "Private API Key is required"),
});


// -------------------------------------
// CONNECT FORM
// -------------------------------------
const VapiPluginForm = ({ open, setOpen }:{
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
      <DialogContent className="rounded-2xl shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Enable Vapi</DialogTitle>
        </DialogHeader>
        <DialogDescription className="text-sm text-gray-500">
          Your API Keys are safely encrypted using AWS Secrets Manager.
        </DialogDescription>

        <Form {...form}>
          <form 
            className="flex flex-col gap-4 mt-4"
            onSubmit={form.handleSubmit(onSubmit)}
          >
            <FormField
              control={form.control}
              name="publicApiKey"
              render={({ field }) => (
                <FormItem>
                  <Label>Public API Key</Label>
                  <FormControl>
                    <Input 
                      placeholder="Your Public API Key" 
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
                  <Label>Private API Key</Label>
                  <FormControl>
                    <Input 
                      placeholder="Your Private API Key" 
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
                className="rounded-xl"
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


// -------------------------------------
// REMOVE FORM
// -------------------------------------
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
      <DialogContent className="rounded-2xl shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Disconnect Vapi</DialogTitle>
        </DialogHeader>
        <DialogDescription className="text-gray-500 text-sm">
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


// -------------------------------------
// MAIN VIEW WITH ANIMATIONS + NEW HERO
// -------------------------------------
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

      <div className="min-h-screen w-full relative bg-gray-50 overflow-hidden">

        {/* Floating Gradient Blob */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.3, scale: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="absolute top-[-120px] right-[-120px] h-[350px] w-[350px] rounded-full bg-gradient-to-br from-indigo-300 via-purple-300 to-pink-300 blur-3xl opacity-40"
        />

        <div className="mx-auto w-full max-w-4xl px-6 py-16">

          {/* HERO CARD with animations */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="rounded-3xl bg-white bg-opacity-80 backdrop-blur-xl shadow-lg p-10 border border-gray-200/60"
          >
            <h1 className="text-4xl font-extrabold tracking-tight">
              Vapi Integration
            </h1>
            <p className="text-gray-600 mt-2 text-sm">
              Let your app speak. Let your users be heard.
            </p>

            {/* Animated Feature Grid */}
            <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-6">
              {vapiFeatures.map((f, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: idx * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                  className="flex flex-col items-center rounded-xl border bg-gray-50 py-6 hover:bg-gray-100 transition shadow-sm"
                >
                  <f.icon className="h-6 w-6 text-gray-700" />
                  <p className="text-sm mt-2 font-medium">{f.label}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Bottom Card */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut", delay: 0.2 }}
            className="mt-12 rounded-3xl bg-white shadow-xl border border-gray-200 p-10"
          >
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
          </motion.div>

        </div>
      </div>
    </>
  );
};
