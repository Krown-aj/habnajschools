"use client";

import { PrimeReactProvider } from "primereact/api";
import { ConfirmDialog } from "primereact/confirmdialog";
import type { ReactNode } from "react";

interface PrimeReactWrapperProps {
    children: ReactNode;
}

/**
 * All PrimeReact UI lives here – it is a client component,
 * so the non-serialisable config object stays on the client.
 */
export default function PrimeReactWrapper({ children }: PrimeReactWrapperProps) {
    return (
        <PrimeReactProvider value={{ unstyled: false, ripple: true }}>
            {children}
            {/* ConfirmDialog must be rendered at the root of the PrimeReact tree */}
            <ConfirmDialog />
        </PrimeReactProvider>
    );
}