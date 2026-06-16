"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import QRCode from "react-qr-code";
import { toast, ToastContainer } from "react-toastify";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import html2canvas from "html2canvas";
import { useRouter, useSearchParams } from "next/navigation";
import Cookies from "js-cookie";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? process.env.LOCALHOST_URL;

const RegistrationLinkComponent = () => {
    const [selectedRole, setSelectedRole] = useState<string>("");
    const [generatedLink, setGeneratedLink] = useState<string>("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [showQRCode, setShowQRCode] = useState(false);
    const [copyStatus, setCopyStatus] = useState("Copy");


    const [selectedRoleName, setSelectedRoleName] = useState<string | "">("");
    const searchParams = useSearchParams();
    const roleIdFromQuery = searchParams.get("roleId");
    const roleNameFromQuery = searchParams.get("roleName");
    
    const router = useRouter();

    useEffect(() => {
        if (roleIdFromQuery) {
            setSelectedRole(roleIdFromQuery);
        }
        if (roleNameFromQuery) {
            setSelectedRoleName(roleNameFromQuery);
        }
    }, [roleIdFromQuery, roleNameFromQuery]);

    const handleGenerate = async () => {
        if (!selectedRole) return toast.warning("Please select a role");
        setIsGenerating(true);
        try {
            const response = await axios.get(`${API_URL}/registration-link`, {
                params: { roleId: selectedRole },
                headers: {
                    Authorization: `Bearer ${Cookies.get("token")}`
                }
            });
            setGeneratedLink(response.data.registrationUrl);
            setShowQRCode(true);
        } catch (err) {
            toast.error("Error generating registration link");
        } finally {
            setIsGenerating(false);
        }
    };


    const handleCopy = () => {
        navigator.clipboard.writeText(generatedLink);
        setCopyStatus("Copied!");
        toast.success("Link copied to clipboard!");
        setTimeout(() => setCopyStatus("Copy"), 3000); // Reset after 2 seconds
    };


    const handleDownloadQRCode = () => {
        const qrContainer = document.getElementById("qrCodeWrapper");
        if (!qrContainer) return;

        html2canvas(qrContainer).then((canvas) => {
            const image = canvas.toDataURL("image/png");
            const link = document.createElement("a");
            link.href = image;
            link.download = `registration-qr-role-${selectedRole}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        });
    };


    return (
        <DefaultLayout>
            <Breadcrumb pageName="Generate Registration Link" />

            <div style={{marginBottom:'10px'}}>
              <button onClick={() => router.back()} style={{ height: '47px' }} className="bg-gray-200 px-4 py-2 rounded-md text-sm hover:bg-gray-300 text-gray-800">← Back</button>
            </div>
            <div className="max-w-2xl mx-auto p-6 bg-white shadow-md rounded-lg">
                <ToastContainer position="top-center" autoClose={3000} />
                <h3 className="text-lg font-semibold mb-5 text-black dark:text-white">
                    Generate Registration URL
                </h3>

                {/* Role Dropdown */}
                {/* <div className="mb-6">
                    <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                        Select Role <span className="text-meta-1">*</span>
                    </label>
                    <select
                        value={selectedRole}
                        onChange={(e) => setSelectedRole(e.target.value)}
                        className="w-full rounded-md border border-stroke bg-transparent px-4 py-2 text-black dark:border-form-strokedark dark:bg-form-input dark:text-white"
                    >
                        <option value="">Select Role</option>
                        {roles.map((role) => (
                            <option key={role.id} value={role.id}>
                                {role.name}
                            </option>
                        ))}
                    </select>
                </div> */}

                {/* Generate Button */}
                <button
                    className={`w-full bg-primary text-white px-4 py-2 rounded-md hover:bg-opacity-90 ${isGenerating ? "opacity-60 cursor-not-allowed" : ""}`}
                    onClick={handleGenerate}
                    disabled={isGenerating}
                >
                    {isGenerating ? "Generating..." : "Generate URL"}
                </button>

                {/* Display Link & QR Code */}
                {generatedLink && (
                    <>
                        <div className="mt-6">
                            <label className="text-sm text-black dark:text-white font-medium block mb-2">Generated URL</label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    value={generatedLink}
                                    readOnly
                                    className="flex-1 rounded-md border border-stroke px-4 py-2 text-black dark:border-form-strokedark dark:bg-form-input dark:text-white"
                                />
                                <button
                                    className="bg-blue-500 text-white px-3 py-2 rounded-md hover:bg-blue-600"
                                    onClick={handleCopy}
                                >
                                    {copyStatus}
                                </button>
                            </div>
                        </div>


                        {showQRCode && (
                            <div className="mt-6 flex flex-col items-center justify-center">
                                <div
                                    id="qrCodeWrapper"
                                    className="bg-white border border-gray-300 rounded-lg shadow-md p-6 text-center inline-block"
                                >
                                    <h2 className="text-lg font-bold text-gray-800 mb-2">Registration QR Code</h2>

                                    <p className="text-sm text-gray-600 mb-5">
                                        <span className="font-medium">Role:</span>{" "}
                                        { selectedRoleName || "N/A"}
                                    </p>

                                    <div className="flex justify-center">
                                        <QRCode value={generatedLink} size={180} />
                                    </div>
                                </div>

                                <button
                                    onClick={handleDownloadQRCode}
                                    className="mt-4 bg-green-600 text-white px-5 py-2 rounded-md hover:bg-green-700"
                                >
                                    Download QR Code
                                </button>
                            </div>
                        )}


                    </>
                )}
            </div>
        </DefaultLayout>
    );
};

export default RegistrationLinkComponent;
