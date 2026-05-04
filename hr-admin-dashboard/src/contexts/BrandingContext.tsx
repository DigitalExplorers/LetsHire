"use client";

import { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";
import Cookies from "js-cookie";


interface BrandingData {
    logoUrl: string;
    logoIconUrl: string;
    bgImageUrl: string;
    primaryColor: string;
    orgName?: string;
    isDefault?: boolean;
}

interface BrandingContextType extends BrandingData {
    refreshBranding: () => void;
    resetToDefault: () => void;
}

const defaultBranding: BrandingData = {
    logoUrl: "/images/logo/THE8800-logo-white.png",
    logoIconUrl: "/images/logo/THE8800-icon.jpg",
    bgImageUrl: "/images/backgrounds/THE8800-bg.png",
    primaryColor: "#be1e2d",
    orgName: "Letshire",
    isDefault: true,
};

const BrandingContext = createContext<BrandingContextType>({
    ...defaultBranding,
    refreshBranding: () => { },
    resetToDefault: () => { },
});

export const useBranding = () => useContext(BrandingContext);

export const BrandingProvider = ({ children }: { children: React.ReactNode }) => {
    const [branding, setBranding] = useState<BrandingData>(defaultBranding);


    const resetToDefault = () => {
        setBranding(defaultBranding);
        Cookies.remove("organizationId");
        Cookies.remove("role");
    };


    const fetchBranding = async () => {
        const orgId = Cookies.get("organizationId");
        const role = Cookies.get("role")?.toLowerCase();

    // Guard against cookies storing literal strings "null" or "undefined"
    const validOrgId = orgId && orgId !== 'null' && orgId !== 'undefined' ? orgId : null;

    if (!validOrgId || role === 'superadmin') {
      setBranding(defaultBranding);
      return;
    }

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL ?? process.env.LOCALHOST_URL;
      const { data } = await axios.get(`${API_URL}/organizations/${validOrgId}`);

            const hasCustomBranding = data.logoUrl && data.primaryColor;

            if (hasCustomBranding) {
                setBranding({
                    logoUrl: data.logoUrl,
                    logoIconUrl: data.logoIconUrl ?? defaultBranding.logoIconUrl,
                    bgImageUrl: data.bgImageUrl,
                    primaryColor: data.primaryColor,
                    orgName: data.name,
                    isDefault: false,
                });
            } else {
                setBranding(defaultBranding);
            }
        } catch (error) {
            console.error("Branding fetch error:", error);
            setBranding(defaultBranding);
        }
    };

    useEffect(() => {
        fetchBranding();
    }, []);

    return (
        <BrandingContext.Provider value={{ ...branding, refreshBranding: fetchBranding, resetToDefault }}>
            {children}
        </BrandingContext.Provider>
    );
};
