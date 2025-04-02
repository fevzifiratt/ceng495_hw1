'use client';

import { SessionProvider } from "next-auth/react";
import { ReactNode } from "react";

/**
 * This component wraps your application with the NextAuth SessionProvider
 * allowing all components in your app to access the authentication state
 * using the useSession() hook.
 */
export function Providers({ children }: { children: ReactNode }) {
    return <SessionProvider>{children}</SessionProvider>;
}