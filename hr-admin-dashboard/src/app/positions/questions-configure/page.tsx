"use client";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { useState, useEffect } from "react";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import { useRouter, useSearchParams } from "next/navigation";
import React from "react";
import ConfirmAction from "@/components/ConfirmAction";
import { toast, ToastContainer } from "react-toastify";

const UploadQuestions = () => {
  const token = localStorage.getItem("token");
  const API_URL = process.env.NEXT_PUBLIC_API_URL ?? process.env.LOCALHOST_URL;
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [numQuestions, setNumQuestions] = useState<number | string>(1);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [selectedRoleId, setSelectedRoleId] = useState<number|"">("");
  const [selectedRoleName, setSelectedRoleName] = useState<string | "">("");
  const searchParams = useSearchParams();
  const roleIdFromQuery = searchParams.get("roleId");
  const roleNameFromQuery = searchParams.get("roleName");
    
    useEffect(() => {
      if (roleIdFromQuery) {
        setSelectedRoleId(parseInt(roleIdFromQuery));
      }
      if (roleNameFromQuery) {
        setSelectedRoleName(roleNameFromQuery);
      }
    }, [roleIdFromQuery, roleNameFromQuery]);

  // Fetch quiz configuration on mount
  useEffect(() => {
    const fetchConfig = async (selectedRoleId:number) => {
      try {
        const response = await fetch(`${API_URL}/quiz/config?roleId=${selectedRoleId}`, {
          headers: { "Content-Type": "application/json", 'Authorization': `Bearer ${token}`},
        });
        if (!response.ok) throw new Error("Failed to fetch configuration");
        const data = await response.json();
        setNumQuestions(data.numberOfQuestions > 0 ? data.numberOfQuestions : 1);
      } catch (error) {
        console.error("Error fetching config:", error);
        toast.error("Failed to load configuration. Defaulting to 1.", {});
      } finally {
        setLoadingConfig(false);
      }
    };

    if(selectedRoleId){
      fetchConfig(selectedRoleId);
    };

  }, [selectedRoleId]);


  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setFile(event.target.files[0]);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
        toast.error("Please select a file to upload.", {});
        return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
        const response = await fetch(`${API_URL}/quiz/upload`, {
        method: "POST",
        headers: {'Authorization': `Bearer ${token}`},
        body: formData,
        });
        if (!response.ok) throw new Error("File upload failed");

        toast.success("File uploaded successfully!", {});
        router.push("/positions/question-view");
    } catch (error) {
        console.error("Error uploading file:", error);
        toast.error("Failed to upload file. Please try again!", {});
    } finally {
        setIsUploading(false);
    }
  };

  const handleConfigUpdate = async () => {
    if (Number(numQuestions) < 1) {
      alert("Number of questions must be at least 1.");
      return;
    }

    setIsSaving(true);
    try {
        const response = await fetch(`${API_URL}/quiz/config?roleId=${selectedRoleId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json", 'Authorization': `Bearer ${token}`},
            body: JSON.stringify({ numberOfQuestions: numQuestions }),
        });
        if (!response.ok) throw new Error("Failed to update configuration");
        toast.success("Configuration updated successfully!", {});
    } catch (error) {
        console.error("Error updating config:", error);
        toast.success("Failed to update configuration. Please try again.", {});
    } finally {
        setIsSaving(false);
    }
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value; // Get input as string
  
    // Allow empty input while typing
    if (value === "") {
      setNumQuestions("");
      return;
    }
  
    // Convert to number and ensure it's valid
    const num = Number(value);
    if (!isNaN(num) && num >= 1) {
      setNumQuestions(num);
    }
  };
  
  // Ensure minimum value of 1 when user leaves input empty
  const handleBlur = () => {
    if (numQuestions === "" || Number(numQuestions) < 1) {
      setNumQuestions(1);
    }
  };
  
  

  return (
    <DefaultLayout>
      <Breadcrumb pageName="Quiz Configuration" />

      <div className="max-w-3xl mx-auto">
        <ToastContainer position="top-center" autoClose={3000} />
        {/* Section 1: Upload Questions */}
        {/* <div className="mb-8 p-6 bg-white shadow-md rounded-lg dark:bg-boxdark">
          <h3 className="text-lg font-semibold text-black dark:text-white mb-5">Upload Questions</h3>

          <div className="mb-4">
            <label className="mb-2 block text-sm font-medium text-black dark:text-white">
              Upload CSV or Excel File <span className="text-meta-1">*</span>
            </label>
            <input
              type="file"
              accept=".csv,.xlsx"
              className="w-full cursor-pointer rounded-md border border-stroke bg-transparent px-4 py-2 text-black outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white"
              onChange={handleFileChange}
            />
          </div>

          <button
            className={`w-full bg-primary text-white px-4 py-2 rounded-md hover:bg-opacity-90 ${
              isUploading ? "opacity-60 cursor-not-allowed" : ""
            }`}
            onClick={handleUpload}
            disabled={isUploading}
          >
            {isUploading ? "Uploading..." : "Upload File"}
          </button>
        </div> */}

        {/* Section 2: Configure Number of Questions */}
        <div className="p-6 bg-white shadow-md rounded-lg dark:bg-boxdark">
          <h3 className="text-lg font-semibold text-black dark:text-white mb-5">Quiz Setting</h3>

          <div className="mb-4">
            <label className="mb-2 block text-sm font-medium text-black dark:text-white">
              Number of Questions to Display <span className="text-meta-1">*</span>
            </label>
            {/* <input
              type="number"
              min="1"
              max="100"
              value={numQuestions}
              onChange={handleNumberChange}
              className="w-full rounded-md border border-stroke bg-transparent px-4 py-2 text-black outline-none focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white"
            /> */}

            <input
            type="number"
            min="1"
            max="100"
            value={numQuestions}
            onChange={handleNumberChange}
            onBlur={handleBlur} // Ensure "1" is set if input is empty
            className="w-full rounded-md border border-stroke bg-transparent px-4 py-2 text-black outline-none focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white"
            />

          </div>

          <button
            className={`w-full bg-primary text-white px-4 py-2 rounded-md hover:bg-opacity-90 ${
              isSaving ? "opacity-60 cursor-not-allowed" : ""
            }`}
            onClick={handleConfigUpdate}
            disabled={isSaving || loadingConfig}
          >
            {loadingConfig ? "Loading..." : isSaving ? "Saving..." : "Save Configuration"}
          </button>
        </div>
      </div>
    </DefaultLayout>
  );
};

export default UploadQuestions;
