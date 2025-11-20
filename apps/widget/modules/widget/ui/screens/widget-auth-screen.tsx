import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@workspace/ui/components/form";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { WidgetHeader } from "@/modules/widget/ui/components/widget-header";

import { useMutation } from "convex/react";
import { api } from "@workspace/backend/_generated/api";
import { Doc } from "@workspace/backend/_generated/dataModel";
import { useAtomValue, useSetAtom } from "jotai";

import {
  contactSessionIdAtomFamily,
  organizationIdAtom,
  screenAtom,
} from "../../atoms/widget-atoms";

// Validation schema
const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
});

export const WidgetAuthScreen = () => {
  const setScreen = useSetAtom(screenAtom);
  const organizationId = useAtomValue(organizationIdAtom);
  const setContactSessionId = useSetAtom(
    contactSessionIdAtomFamily(organizationId || "")
  );

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", email: "" },
  });

  const createContactSession = useMutation(api.public.contactSessions.create);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!organizationId) return;

    const metadata: Doc<"contactSessions">["metadata"] = {
      userAgent: navigator.userAgent,
      language: navigator.language,
      languages: navigator.languages?.join(", "),
      platform: navigator.platform,
      vendor: navigator.vendor,
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      viewportSize: `${window.innerWidth}x${window.innerHeight}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      timeOffset: new Date().getTimezoneOffset(),
      cookieEnabled: navigator.cookieEnabled,
      referrer: document.referrer || "direct",
      currentUrl: window.location.href,
    };

    const id = await createContactSession({
      ...values,
      organizationId,
      metadata,
    });

    setContactSessionId(id);
    setScreen("selection");
  };

  return (
    <div className="flex w-full h-full">

      {/* LEFT SIDE — FORM (UPDATED COLOR) */}
      <div
        className="
          w-1/2 flex flex-col relative
          bg-gradient-to-br from-blue-600/20 via-blue-700/20 to-indigo-900/20
        "
      >
        {/* Soft Glow for symmetry */}
        <div className="absolute inset-0 bg-blue-500/10 blur-2xl"></div>

        {/* Header */}
        <WidgetHeader>
          <div className="flex flex-col gap-y-2 px-4 py-4 bg-gradient-to-br from-blue-600/30 to-indigo-700/30 rounded-lg">
            <p className="font-semibold text-3xl tracking-tight text-white drop-shadow">
              Hey there 👋
            </p>
            <p className="text-lg text-white/80">
              Just a few details before we begin.
            </p>
          </div>
        </WidgetHeader>

        {/* Form */}
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="
              flex flex-1 flex-col gap-y-5 p-6
              bg-white/10 backdrop-blur-xl rounded-xl shadow-xl 
              border border-white/20 m-4 relative z-10
            "
          >
            {/* Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      {...field}
                      type="text"
                      placeholder="Your name"
                      className="
                        h-11 bg-white/90
                        focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                        rounded-xl transition-all
                        placeholder:text-gray-500
                      "
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Email */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      {...field}
                      type="email"
                      placeholder="your@email.com"
                      className="
                        h-11 bg-white/90
                        focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                        rounded-xl transition-all
                        placeholder:text-gray-500
                      "
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Submit */}
            <Button
              type="submit"
              size="lg"
              disabled={form.formState.isSubmitting}
              className="
                h-11 rounded-xl text-lg font-semibold transition-all
                bg-gradient-to-r from-blue-600 to-indigo-600
                hover:from-blue-500 hover:to-indigo-500
                shadow-lg hover:shadow-blue-500/30
              "
            >
              Continue →
            </Button>
          </form>
        </Form>
      </div>

      {/* RIGHT SIDE — SANTRA-AI BRAND PANEL */}
      <div
        className="
          w-1/2 relative rounded-xl overflow-hidden flex flex-col
          items-center justify-center
          bg-gradient-to-br from-orange-500 via-orange-600 to-blue-700
        "
      >
        {/* AI Grid */}
        <div
          className="
            absolute inset-0 opacity-10 
            bg-[radial-gradient(circle_at_center,white_1px,transparent_1px)]
            [background-size:20px_20px]
          "
        ></div>

        {/* Glow */}
        <div className="absolute w-72 h-72 bg-white/25 blur-3xl rounded-full"></div>

        {/* Branding */}
        <div className="relative z-10 flex flex-col items-center text-center px-8">
          <h1 className="text-6xl font-extrabold text-white tracking-tight drop-shadow-xl">
            SanTRA<span className="text-orange-300">-AI</span>
          </h1>

          <p className="mt-5 text-xl text-white/80 max-w-sm leading-relaxed">
            Intelligence that listens.  
            Precision that adapts.  
            Support that feels human.
          </p>
        </div>
      </div>
    </div>
  );
};
