"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import QRCode from "react-qr-code";
import html2canvas from "html2canvas";
import { toast, ToastContainer } from "react-toastify";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { useRouter, useSearchParams } from "next/navigation";
import Cookies from "js-cookie";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

type LinkData = {
  id: string;
  roleName: string;
  roleId: string;
  token: string;
  registrationUrl: string;
  createdAt: string;
};

const AllRegistrationLinks = () => {
  const [linkList, setLinkList] = useState<LinkData[]>([]);
  const [copyStatus, setCopyStatus] = useState<{ [token: string]: string }>({});
  const [roles, setRoles] = useState<{ id: string; name: string }[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<string | "">("");
  const [selectedRoleName, setSelectedRoleName] = useState<string | "">("");
  const searchParams = useSearchParams();
  const roleIdFromQuery = searchParams.get("roleId");
  const roleNameFromQuery = searchParams.get("roleName");

  const router = useRouter();

  useEffect(() => {
    if (roleIdFromQuery) {
      setSelectedRoleId(roleIdFromQuery);
    }
    if (roleNameFromQuery) {
      setSelectedRoleName(roleNameFromQuery);
    }
  }, [roleIdFromQuery, roleNameFromQuery]);

  // Fetch all links
  useEffect(() => {
    const fetchLinks = async () => {
      try {
        if (selectedRoleId) {
          const res = await axios.get(`${API_URL}/registration-link/by-role?roleId=${selectedRoleId}`, {
            headers: {
              Authorization: `Bearer ${Cookies.get("token")}`,
            },
          });

          const enrichedLinks = res.data.map((link: any) => {
            return {
              ...link,
              roleName: selectedRoleName ? selectedRoleName : "Unknown Role",
            };
          });

          console.log(enrichedLinks);
          setLinkList(enrichedLinks);
        }
      } catch (err) {
        toast.error("Failed to fetch registration links");
      }
    };

    fetchLinks();
  }, [selectedRoleId]);

  const handleCopy = (token: string, link: string) => {
    navigator.clipboard.writeText(link);
    setCopyStatus((prev) => ({ ...prev, [token]: "Copied!" }));
    toast.success("Link copied to clipboard!");

    setTimeout(() => {
      setCopyStatus((prev) => ({ ...prev, [token]: "Copy" }));
    }, 2000);
  };

  const handleDownloadQRCode = (token: string, roleName: string) => {
    const wrapperId = `qrCodeWrapper-${token}`;
    const qrContainer = document.getElementById(wrapperId);
    if (!qrContainer) return;

    html2canvas(qrContainer).then((canvas) => {
      const image = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = image;
      link.download = `registration-${roleName}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  };

  return (
    <DefaultLayout>
      <Breadcrumb pageName="Registration URLs" />
      <ToastContainer position="top-center" autoClose={3000} />

      <div style={{ marginBottom: '10px' }}>
        <button onClick={() => router.back()} style={{ height: '47px' }} className="bg-gray-200 px-4 py-2 rounded-md text-sm hover:bg-gray-300 text-gray-800">← Back</button>
      </div>
      <div className="max-w-4xl mx-auto p-6 bg-white shadow-md rounded-lg">
        {linkList.length === 0 ? (
          <p className="text-gray-600">No URLs found for this position.</p>
        ) : (
          linkList.map((link) => (
            <div
              key={link.token}
              className="bg-white border border-gray-300 rounded-lg shadow-md p-6 mb-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6"
            >
              {/* Section 1: QR Code */}
              <div className="flex justify-center w-full lg:w-3/3">
                <div
                  id={`qrCodeWrapper-${link.token}`}
                  className="p-6 border border-gray-300 rounded-lg bg-white shadow text-center w-full max-w-md"
                >
                  <h3 className="text-xl font-bold text-gray-800 mb-3">Registration QR Code</h3>
                  <p className="text-sm text-gray-600 mb-5">
                    <strong>Role:</strong> {link.roleName}
                  </p>
                  <div className="flex justify-center">
                    {link.registrationUrl && <QRCode value={link.registrationUrl} size={200} />}

                  </div>
                  <button
                    onClick={() => handleDownloadQRCode(link.token, link.roleName)}
                    className="mt-4 bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700"
                  >
                    Download QR Code
                  </button>
                </div>
              </div>

              {/* Section 2: Registration Info */}
              <div className="w-full flex flex-col justify-center">
                <label className="mb-2 font-medium text-gray-800">Registration Link</label>
                <div className="flex items-center">
                  <input
                    type="text"
                    value={link.registrationUrl}
                    readOnly
                    className="flex-1 rounded-md border border-stroke px-3 py-2 text-black bg-gray-100"
                  />
                  <button
                    onClick={() => handleCopy(link.token, link.registrationUrl)}
                    className="bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700"
                  >
                    {copyStatus[link.token] || "Copy"}
                  </button>
                </div>
              </div>
            </div>
          ))


        )}
      </div>
    </DefaultLayout>
  );
};

export default AllRegistrationLinks;
