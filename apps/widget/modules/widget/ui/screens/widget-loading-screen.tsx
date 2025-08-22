import { useState, useEffect } from "react";
import { LoaderIcon } from "lucide-react";
import { useAtomValue, useSetAtom } from "jotai";
import { contactSessionIdAtomFamily, errorMessageAtom, loadingMessageAtom, organizationIdAtom, screenAtom } from "@/modules/widget/atoms/widget-atoms";
import { WidgetHeader } from "@/modules/widget/ui/components/widget-header";
import { useAction, useMutation } from "convex/react";
import { api } from "@workspace/backend/_generated/api";
import { Id } from "@workspace/backend/_generated/dataModel";
import { resumePluginState } from "next/dist/build/build-context";

type InitStep = "org" | "session" | "settings" | "vapi" | "done";

export const WidgetLoadingScreen = ({ organizationId }: { organizationId: string | null }) => {
  const [step, setStep] = useState<InitStep>("org");
  const [sessionValid, setSessionValid] = useState(false);

  const loadingMessage = useAtomValue(loadingMessageAtom);
  const setOrganizationId = useSetAtom(organizationIdAtom);
  const setLoadingMessage = useSetAtom(loadingMessageAtom);
  const setErrorMessage = useSetAtom(errorMessageAtom);
  const setScreen = useSetAtom(screenAtom);


  const contactSessionId = useAtomValue(contactSessionIdAtomFamily(organizationId || ""));

  //Step 1 validate Organization
  const validateOrganization = useAction(api.public.organization.validate);
  useEffect(() => {
    if (step !== "org") {
      return;
    }


    setLoadingMessage("Finding Organization ID...");


    if (!organizationId) {
      setErrorMessage("Organization ID is required");
      setScreen("error");
      return;
    }


    setLoadingMessage("Verifying Organisation...");

    validateOrganization({ organizationId })
      .then((result) => {
        if (result.valid) {
          setOrganizationId(organizationId);
          setStep("session");
        } else {
          setErrorMessage(result.reason || "Invalid configuration");
          setScreen("error");
        }
      })

      .catch(() => {
        setErrorMessage("Unable to verify Organization");
        setScreen("error");
      })
  }, [
    step,
    organizationId,
    setErrorMessage,
    setScreen,
    setOrganizationId,
    setStep,
    validateOrganization,
    setLoadingMessage
  ]);
  //Step-2 Validate session if it exist
  const validateContactSession = useMutation(api.public.contactSessions.validate);
  useEffect(() => {
    if (step !== "session") {
      return;
    }

    setLoadingMessage("Finding contact Sessioon ID...");
    if (!contactSessionId) {
      setSessionValid(false);
      setStep("done")
      return;


    }
    setLoadingMessage("Validating Session....");
    validateContactSession({
      contactSessionId: contactSessionId as Id<"contactSessions">
    })
      .then((result) => {
        setSessionValid(result.valid)
        setStep("done");
      })
      .catch(() => {
        setSessionValid(false);
        setStep("done");
      })

  }, [step, contactSessionId, validateContactSession, setLoadingMessage]);


  useEffect(() => {
    if (step !== "done") {
      return;
    }
    const hasValidSession = contactSessionId && sessionValid;
    setScreen(hasValidSession ? "selection" : "auth");
  }, [step, contactSessionId, sessionValid, setScreen]);


  return (
    <>

      <WidgetHeader>
        <div className="flex flex-col justify-between gap-y-2 px-2 py-6 font-semibold">
          <p className="text-3xl">
            Hi there! 👋
          </p>
          <p className="text-lg">
            Let&apos;s get you started
          </p>
        </div>
      </WidgetHeader>
      <div className="flex flex-1 flex-col items-center justify-center gap-y-4 p-4 text-muted-foreground">
        <LoaderIcon className="animate-spin" />
        <p className="text-sm">
          {loadingMessage || "Loading"}
        </p>
      </div>


    </>
  );
};