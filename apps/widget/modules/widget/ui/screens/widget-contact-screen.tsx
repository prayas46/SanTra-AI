"use client";

import { ArrowLeftIcon, PhoneIcon, CheckIcon, CopyIcon } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { WidgetHeader } from "@/modules/widget/ui/components/widget-header";
import { useAtomValue, useSetAtom } from "jotai";
import { screenAtom, widgetSettingsAtom } from "../../atoms/widget-atoms";
import { useState } from "react";
import Link from "next/link";

export const WidgetContactScreen = () => {
  const setScreen = useSetAtom(screenAtom);
  const widgetSettings = useAtomValue(widgetSettingsAtom);

  const phoneNumber = widgetSettings?.vapiSettings?.phoneNumber;

  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    if (!phoneNumber) return;

    try {
      await navigator.clipboard.writeText(phoneNumber);
      setCopied(true);
    } catch (error) {
      console.error(error);
    } finally {
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex w-full h-full">
      {/* LEFT PANEL — Contact Info */}
      <div className="w-1/2 flex flex-col bg-blue-100">
        <WidgetHeader>
          <div className="flex items-center gap-x-2 px-4 py-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setScreen("selection")}
              className="h-9 w-9"
            >
              <ArrowLeftIcon className="h-4 w-4" />
            </Button>
            <p className="font-semibold text-lg text-slate-900">Contact Us</p>
          </div>
        </WidgetHeader>

        <div className="flex flex-1 flex-col items-center justify-center gap-y-4 px-4">
          <div className="flex items-center justify-center rounded-full border bg-white p-3 shadow-md">
            <PhoneIcon className="h-6 w-6 text-blue-500" />
          </div>
          <p className="text-slate-700 text-sm">Available 24/7</p>
          <p className="font-bold text-2xl text-slate-900">{phoneNumber}</p>
        </div>

        <div className="border-t border-blue-200 bg-blue-50 p-4">
          <div className="flex flex-col items-center gap-y-2 w-full">
            <Button
              className="w-full flex items-center justify-center gap-2"
              onClick={handleCopy}
            >
              {copied ? (
                <>
                  <CheckIcon className="h-4 w-4" />
                  Copied!
                </>
              ) : (
                <>
                  <CopyIcon className="h-4 w-4" />
                  Copy Number
                </>
              )}
            </Button>

            <Button asChild className="w-full" size="lg">
              <Link href={`tel:${phoneNumber}`} className="flex items-center justify-center gap-2">
                <PhoneIcon className="h-5 w-5" />
                Call Now
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL — Branding */}
      <div className="w-1/2 relative rounded-xl overflow-hidden flex flex-col items-center justify-center bg-gradient-to-br from-orange-500 via-orange-600 to-blue-700">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,white_1px,transparent_1px)] [background-size:20px_20px]" />
        <div className="absolute w-72 h-72 bg-white/25 blur-3xl rounded-full"></div>
        <div className="relative z-10 flex flex-col items-center text-center px-8">
          <h1 className="text-6xl font-extrabold text-white tracking-tight drop-shadow-xl">
            SanTRA<span className="text-orange-300">-AI</span>
          </h1>
          <p className="mt-5 text-xl text-white/80 max-w-sm leading-relaxed">
            Need help? Call us anytime. Our AI-powered assistant is here for support 24/7.
          </p>
        </div>
      </div>
    </div>
  );
};
