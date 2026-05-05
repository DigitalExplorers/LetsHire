import React, { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";

interface BrandingData {
    logoUrl: string;
    bgImageUrl: string;
    primaryColor: string;
    orgName?: string;
    policy?: string;
    logo2Url?: string;
    isDefaultBrand?: boolean;
}

const defaultBranding: BrandingData = {
    logoUrl: "/assets/THE8800-logo-white.png",
    bgImageUrl: "/assets/THE8800-bg.png",
    primaryColor: "#be1e2d",
    orgName: "Letshire",
    logo2Url: "/assets/THE8800-logo.png",
    isDefaultBrand: true,
};

const BrandingContext = createContext<BrandingData>(defaultBranding);

export const useBranding = () => useContext(BrandingContext);

interface BrandingProviderProps {
    token: string | undefined;
    children: React.ReactNode;
}

export const BrandingProvider: React.FC<BrandingProviderProps> = ({ token, children }) => {
    const [branding, setBranding] = useState<BrandingData>(defaultBranding);

    useEffect(() => {
        const fetchBranding = async () => {
            try {
                const API_URL = import.meta.env.VITE_API_URL;

                const isValidUUID = (token: string) => {
                    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
                    return uuidRegex.test(token);
                };

                const effectiveToken = token && isValidUUID(token)
                    ? token
                    : null;

                if (!effectiveToken || !isValidUUID(effectiveToken)) {
                    console.warn("Invalid or missing token. Skipping branding fetch.");
                    return;
                }

                const res = await axios.get(`${API_URL}/registration-link/resolve/${effectiveToken}`);
                const { organizationId } = res.data;

                if (organizationId) {
                    localStorage.setItem("urlAdminId", res.data.adminId);
                    localStorage.setItem("urlRoleId", res.data.roleId);
                    localStorage.setItem("urlOrgId", res.data.organizationId);
                    localStorage.setItem("urlExamStartTime", res.data.examStartTime);
                    localStorage.setItem("urlExamEndTime", res.data.examEndTime);

                    const brandRes = await axios.get(`${API_URL}/organizations/${organizationId}`);

                    const hasCustomBranding =
                        brandRes.data.logoUrl &&
                        brandRes.data.bgImageUrl &&
                        brandRes.data.primaryColor;

                    if (hasCustomBranding) {
                        setBranding({
                            logoUrl: brandRes.data.logoUrl,
                            bgImageUrl: brandRes.data.bgImageUrl,
                            primaryColor: brandRes.data.primaryColor,
                            orgName: brandRes.data.name,
                            policy: brandRes.data.policy,
                            logo2Url: defaultBranding.logo2Url,
                            isDefaultBrand: false
                        });
                    }
                } else {
                    setBranding(defaultBranding);
                }
            } catch (error) {
                console.error("Error loading branding. Using default branding.", error);
                setBranding(defaultBranding);
            }
        };

        fetchBranding();
    }, [token]);


    return (
        <BrandingContext.Provider value={branding}>
            {children}
        </BrandingContext.Provider>
    );
};
