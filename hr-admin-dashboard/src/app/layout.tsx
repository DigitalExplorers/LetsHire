"use client";
import "jsvectormap/dist/jsvectormap.css";
import "flatpickr/dist/flatpickr.min.css";
import "@/css/space_grotesk.css";
import "@/css/style.css";
import React, { useEffect, useState } from "react";
import Loader from "@/components/common/Loader";
import { AuthProvider } from "@/hooks/AuthContext";
import { BrandingProvider } from "@/contexts/BrandingContext";
import { RightPanelProvider } from "@/contexts/RightPanelContext";
import RightPanel from "@/components/Layouts/RightPanel";

function LayoutBody({ children }: { children: React.ReactNode }) {
  return (
    <div className="dark:bg-boxdark-2 dark:text-bodydark">
      {children}
      <RightPanel />
    </div>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    setTimeout(() => setLoading(false), 1000);
  }, []);

  return (
    <html lang="en">
      <body suppressHydrationWarning={true}>
        <AuthProvider>
          <BrandingProvider>
            <RightPanelProvider>
              <div className="dark:bg-boxdark-2 dark:text-bodydark">
                {loading ? <Loader /> : <LayoutBody>{children}</LayoutBody>}
              </div>
            </RightPanelProvider>
          </BrandingProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
