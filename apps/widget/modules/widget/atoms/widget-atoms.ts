import { atom } from "jotai";
import { atomFamily,atomWithStorage} from "jotai/utils";
import {CONTACT_SESSION_KEY} from   "../constants";
import { WidgetScreen } from "@/modules/widget/types";

// Basic widget state atoms
export const screenAtom = atom<WidgetScreen>("loading");
export const organizationIdAtom = atom<string | null>(null);


//Organizations-scoped contact session atom

export const contactSessionIdAtomFamily =atomFamily((organizationId:string)=>atomWithStorage(
    `${CONTACT_SESSION_KEY}_{organizationId}`,null))
//Need to store different organization Id for different organioizations

export const errorMessageAtom = atom<string | null>(null);
export const loadingMessageAtom = atom<string | null>(null);

