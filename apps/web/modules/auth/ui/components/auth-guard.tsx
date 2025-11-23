"use client"

import { AuthLayout } from "../layouts/auth-layout";
import { SignInView } from "../views/sign-in-view";
import { SignedIn, SignedOut } from "@clerk/nextjs";

export const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <SignedIn>
        {children}
      </SignedIn>
      <SignedOut>
        <AuthLayout>
          <SignInView />
        </AuthLayout>
      </SignedOut>
    </>
  );
};