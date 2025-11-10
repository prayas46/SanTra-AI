import { atom } from "jotai";
import { atomFamily,atomWithStorage} from "jotai/utils";
import {CONTACT_SESSION_KEY} from   "../constants";
import { WidgetScreen } from "@/modules/widget/types";
import { Doc, Id } from "@workspace/backend/_generated/dataModel";

// Basic widget state atoms
export const screenAtom = atom<WidgetScreen>("loading");
export const organizationIdAtom = atom<string | null>(null);


//Organizations-scoped contact session atom

export const contactSessionIdAtomFamily =atomFamily((organizationId:string)=>{
    
    return atomWithStorage<Id<"contactSessions"> | null>(`${CONTACT_SESSION_KEY}_{organizationId}`,null)
});

    
//Need to store different organization Id for different organioizations

export const errorMessageAtom = atom<string | null>(null);
export const loadingMessageAtom = atom<string | null>(null);
export const conversationIdAtom = atom<Id<"conversations"> | null>(null);
export const widgetSettingsAtom = atom<Doc<"widgetSettings"> | null>(null);
export const showSuggestionsAtom = atom<boolean>(true);
export const vapiSecretsAtom = atom<{
  publicApiKey: string;
} | null>(null);
export const hasVapiSecretsAtom = atom((get) => get(vapiSecretsAtom) !== null);

// Language preference atom
export const widgetLanguageAtom = atomWithStorage<"en" | "hi" | "bn">(
  "widgetLanguage",
  "en"
);
