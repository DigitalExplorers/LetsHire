// "use client";

// import React, { useEffect, useState } from "react";
// import axios from "axios";
// import QRCode from "react-qr-code";
// import html2canvas from "html2canvas";
// import { toast } from "react-toastify";

// interface Props {
//   roleId: string;
//   roleName: string;
// }

// const API_URL = process.env.NEXT_PUBLIC_API_URL ?? process.env.LOCALHOST_URL;

// const RegistrationLinkPanel = ({ roleId, roleName }: Props) => {
//   const [generatedLink, setGeneratedLink] = useState("");
//   const [isGenerating, setIsGenerating] = useState(false);
//   const [showQRCode, setShowQRCode] = useState(false);
//   const [copyStatus, setCopyStatus] = useState("Copy");

//   const handleGenerate = async () => {
//     if (!roleId) return toast.warning("Role ID missing");
//     setIsGenerating(true);
//     try {
//       const res = await axios.get(`${API_URL}/registration-link`, {
//         params: { roleId },
//         headers: {
//           Authorization: `Bearer ${localStorage.getItem("token")}`,
//         },
//       });
//       setGeneratedLink(res.data.registrationUrl);
//       setShowQRCode(true);
//     } catch (err) {
//       toast.error("Error generating registration link");
//     } finally {
//       setIsGenerating(false);
//     }
//   };

//   const handleCopy = () => {
//     navigator.clipboard.writeText(generatedLink);
//     setCopyStatus("Copied!");
//     toast.success("Link copied to clipboard!");
//     setTimeout(() => setCopyStatus("Copy"), 3000);
//   };

//   const handleDownloadQRCode = () => {
//     const qrContainer = document.getElementById("qrCodeWrapper");
//     if (!qrContainer) return;
//     html2canvas(qrContainer).then((canvas) => {
//       const image = canvas.toDataURL("image/png");
//       const link = document.createElement("a");
//       link.href = image;
//       link.download = `registration-qr-role-${roleId}.png`;
//       document.body.appendChild(link);
//       link.click();
//       document.body.removeChild(link);
//     });
//   };

//   return (
//     <div>
//       <h2 className="text-xl font-semibold mb-4">Generate Registration URL</h2>

//       <p className="text-gray-600 mb-2">
//         <strong>Role:</strong> {roleName}
//       </p>

//       <button
//         className="bg-primary text-white px-4 py-2 rounded w-full hover:bg-opacity-90 disabled:opacity-50"
//         onClick={handleGenerate}
//         disabled={isGenerating}
//       >
//         {isGenerating ? "Generating..." : "Generate URL"}
//       </button>

//       {generatedLink && (
//         <div className="mt-6">
//           <label className="block mb-1 font-medium text-gray-700">
//             Generated URL
//           </label>
//           <div className="flex items-center gap-2">
//             <input
//               type="text"
//               value={generatedLink}
//               readOnly
//               className="flex-1 border rounded px-3 py-2"
//             />
//             <button
//               className="bg-blue-500 text-white px-3 py-2 rounded hover:bg-blue-600"
//               onClick={handleCopy}
//             >
//               {copyStatus}
//             </button>
//           </div>
//         </div>
//       )}

//       {showQRCode && (
//         <div className="mt-6 text-center">
//           <div
//             id="qrCodeWrapper"
//             className="inline-block p-4 bg-white border shadow rounded"
//           >
//             <h3 className="mb-2 font-medium">QR Code</h3>
//             <QRCode value={generatedLink} size={180} />
//           </div>
//           <button
//             onClick={handleDownloadQRCode}
//             className="mt-4 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
//           >
//             Download QR Code
//           </button>
//         </div>
//       )}
//     </div>
//   );
// };

// export default RegistrationLinkPanel;



"use client";

import React, { useState } from "react";
import axios from "axios";
import QRCode from "react-qr-code";
import html2canvas from "html2canvas";
import { toast } from "react-toastify";

interface Props {
  roleId: string;
  roleName: string;
}

const toUtcString = (localDateStr: string) => {
  const date = new Date(localDateStr);
  return date.toISOString(); // → UTC ISO string
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? process.env.LOCALHOST_URL;

const RegistrationLinkPanel = ({ roleId, roleName }: Props) => {
  const [generatedLink, setGeneratedLink] = useState("");
  const [examStartTime, setExamStartTime] = useState("");
  const [examEndTime, setExamEndTime] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [copyStatus, setCopyStatus] = useState("Copy");

  const handleGenerate = async () => {
    if (!roleId) return toast.warning("Role ID missing");
    if (!examStartTime || !examEndTime) return toast.warning("Test Start and End time required");

    setIsGenerating(true);
    try {
      const res = await axios.get(`${API_URL}/registration-link`, {
        params: {
          roleId,
          examStartTime: toUtcString(examStartTime),
          examEndTime: toUtcString(examEndTime),
        },
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      setGeneratedLink(res.data.registrationUrl);
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
    setTimeout(() => setCopyStatus("Copy"), 3000);
  };

  const handleDownloadQRCode = () => {
    const qrContainer = document.getElementById("qrCodeWrapper");
    if (!qrContainer) return;
    html2canvas(qrContainer).then((canvas) => {
      const image = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = image;
      link.download = `registration-qr-role-${roleId}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold text-gray-900">URL Generation</h2>
        <p className="text-sm text-gray-600">
          Role: <span className="font-medium text-black">{roleName}</span>
        </p>
      </div>

      {/* Add start & end time inputs */}
      <div className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Exam Start Time (UTC)
          </label>
          <input
            type="datetime-local"
            value={examStartTime}
            onChange={(e) => setExamStartTime(e.target.value)}
            onFocus={(e) => e.target.showPicker()} // <- force open calendar on focus
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-700"
          />

        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Exam End Time (UTC)
          </label>
          <input
            type="datetime-local"
            value={examEndTime}
            onChange={(e) => setExamEndTime(e.target.value)}
            onFocus={(e) => e.target.showPicker()}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-700"
          />

        </div>
      </div>

      <button
        onClick={handleGenerate}
        disabled={isGenerating}
        className={`w-full py-2 rounded-md text-white font-semibold bg-primary hover:bg-opacity-90 transition disabled:opacity-60`}
      >
        {isGenerating ? "Generating..." : "Generate URL"}
      </button>

      {generatedLink && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Generated URL
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={generatedLink}
                className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm text-gray-700"
              />
              <button
                onClick={handleCopy}
                className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-md text-sm"
              >
                {copyStatus}
              </button>
            </div>
          </div>

          {showQRCode && (
            <div className="mt-6 flex flex-col items-center justify-center w-full">
              <div
                id="qrCodeWrapper"
                className="bg-white border border-gray-300 rounded-lg shadow-md p-6 text-center w-fit"
              >
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  Registration QR Code
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  <span className="font-medium">Role:</span> {roleName || "N/A"}
                </p>
                <QRCode value={generatedLink} size={180} />
              </div>

              <button
                onClick={handleDownloadQRCode}
                className="mt-4 bg-green-600 text-white px-5 py-2 rounded-md hover:bg-green-700"
              >
                Download QR Code
              </button>
            </div>
          )}

          <div className="mt-4 text-sm text-gray-700">
            <p>
              <span className="font-medium">Exam Start:</span>{" "}
              {examStartTime || "N/A"}
            </p>
            <p>
              <span className="font-medium">Exam End:</span>{" "}
              {examEndTime || "N/A"}
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default RegistrationLinkPanel;

