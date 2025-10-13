'use client';

import { SessionProvider } from 'next-auth/react';
import React from 'react';

export default function Providers({ children }: { children: React.ReactNode }) {
  // The SessionProvider needs to be wrapped in a component that is marked with "use client"
  // to create a client-side context boundary.
  return <SessionProvider>{children}</SessionProvider>;
}