"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@workspace/ui/components/button";
import { ArrowLeftIcon } from "lucide-react";

export const HospitalDemoPage = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orgId = searchParams.get("orgId") ?? "";

  const handleBackToIntegrations = () => {
    router.push("/integrations");
  };

  useEffect(() => {
    if (!orgId) return;
    // Dynamically inject the widget script with organization ID
    const script = document.createElement("script");
    script.src = "https://san-tra-ai-widget.vercel.app/widget.js";
    script.setAttribute("data-organization-id", orgId);
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, [orgId]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b bg-card">
        <div className="mx-auto max-w-5xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-primary" />
            <div className="font-semibold">CarePlus Medical Clinic</div>
          </div>
          <div className="flex items-center gap-4">
            <nav className="hidden md:flex gap-6 text-sm text-muted-foreground">
              <a href="#services" className="hover:text-foreground">Services</a>
              <a href="#doctors" className="hover:text-foreground">Doctors</a>
              <a href="#contact" className="hover:text-foreground">Contact</a>
            </nav>
            <Button 
              onClick={handleBackToIntegrations}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <ArrowLeftIcon className="size-4" />
              Back to Integrations
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10 space-y-12">
        <section className="space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-3xl md:text-5xl font-bold leading-tight">Your Health, Our Priority</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Experience our AI-powered support assistant integrated on this demo page. 
              Use the chat widget in the bottom right corner to book appointments, ask questions, and get help instantly.
            </p>
            <div className="inline-flex text-sm rounded-md bg-accent p-3 font-mono">
              Organization ID: <span className="font-bold">{orgId || "(missing)"}</span>
            </div>
          </div>
          
          <div className="grid md:grid-cols-4 gap-4 mt-8">
            <div className="rounded-lg border bg-card p-4 text-center">
              <div className="text-2xl mb-2">🚑</div>
              <h3 className="font-semibold">24/7 Emergency</h3>
              <p className="text-sm text-muted-foreground">Round the clock emergency care</p>
            </div>
            <div className="rounded-lg border bg-card p-4 text-center">
              <div className="text-2xl mb-2">👨‍⚕️</div>
              <h3 className="font-semibold">Expert Doctors</h3>
              <p className="text-sm text-muted-foreground">Qualified specialists</p>
            </div>
            <div className="rounded-lg border bg-card p-4 text-center">
              <div className="text-2xl mb-2">🔬</div>
              <h3 className="font-semibold">Diagnostics</h3>
              <p className="text-sm text-muted-foreground">Advanced testing facilities</p>
            </div>
            <div className="rounded-lg border bg-card p-4 text-center">
              <div className="text-2xl mb-2">💊</div>
              <h3 className="font-semibold">Pharmacy</h3>
              <p className="text-sm text-muted-foreground">On-site medication</p>
            </div>
          </div>
        </section>

        <section id="services" className="space-y-4">
          <h2 className="text-xl font-semibold">Our Services</h2>
          <p className="text-muted-foreground">We offer comprehensive healthcare services including cardiology, orthopedics, neurology, and more.</p>
        </section>

        <section id="doctors" className="space-y-4">
          <h2 className="text-xl font-semibold">Our Doctors</h2>
          <p className="text-muted-foreground">Meet our team of experienced specialists ready to care for you.</p>
        </section>

        <section id="contact" className="space-y-4">
          <h2 className="text-xl font-semibold">Contact Us</h2>
          <p className="text-muted-foreground">For appointments or inquiries, use the chat widget or email us at care@careplus.example</p>
        </section>
      </main>

      <footer className="border-t bg-card">
        <div className="mx-auto max-w-5xl px-6 py-6 text-sm text-muted-foreground">
          This is a demo page to preview your integration. The chat widget is injected using your organization ID.
        </div>
      </footer>
    </div>
  );
};