"use client";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { useState, useEffect } from "react";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import { toast, ToastContainer } from "react-toastify";
import * as XLSX from "xlsx";
import { useRouter, useSearchParams } from "next/navigation";

const adminId = localStorage.getItem("adminId");
const token = localStorage.getItem("token");

const UploadRoleQuestions = () => {
  const API_URL = process.env.NEXT_PUBLIC_API_URL ?? process.env.LOCALHOST_URL;
  const [roles, setRoles] = useState<{ id: number; name: string }[]>([]);
  const [selectedRole, setSelectedRole] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newRole, setNewRole] = useState("");
  const [isAddingRole, setIsAddingRole] = useState(false);

  const searchParams = useSearchParams();
  const router = useRouter();
  const roleIdFromQuery = searchParams.get("roleId");
  const roleFromQuery = searchParams.get("roleName");

  useEffect(() => {
    if (roleIdFromQuery) {
      setSelectedRole(roleIdFromQuery);
    }
  }, [roleIdFromQuery]);

  const fetchRoles = async () => {
    try {
      const response = await fetch(`${API_URL}/roles?adminId=${adminId}`);
      if (!response.ok) throw new Error("Failed to fetch roles");
      const data = await response.json();
      setRoles(data);
    } catch (error) {
      console.error("Error fetching roles:", error);
    } finally {
      setLoadingRoles(false);
    }
  };
  
  useEffect(() => {
    fetchRoles();
  }, []);


  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const uploadedFile = event.target.files[0];
  
      const allowedExtensions = [".csv", ".xlsx"];
      const fileExtension = uploadedFile.name.substring(uploadedFile.name.lastIndexOf(".")).toLowerCase();
      if (!allowedExtensions.includes(fileExtension)) {
        toast.error("Only .csv or .xlsx files are allowed!");
        return;
      }
  
      try {
        const data = await uploadedFile.arrayBuffer();
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet);
  
        const isValid = json.every((row: any, index: number) => {
          const isRowValid =
            row.Question != null &&
            row.OptionA != null &&
            row.OptionB != null &&
            row.OptionC != null &&
            row.OptionD != null &&
            row.CorrectOption != null;
        
          if (!isRowValid) {
            console.error(`Validation failed at row index ${index}:`, row);
          }
        
          return isRowValid;
        });
  
        if (!isValid) {
          toast.error(
            "Invalid file format. Make sure your file has proper columns like Question, OptionA to D, and CorrectOption.",
            {
              autoClose: false,
              closeOnClick: true,
              draggable: true,
              className: "custom-toast",
            }
          );
          return;
        }
  
        setFile(uploadedFile);
      } catch (error) {
        toast.error("Error reading the file. Please upload a valid Excel or CSV file.");
      }
    }
  };
  

  const handleRoleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedRole(event.target.value);
  };

  const handleNewRoleSubmit = async () => {
    if (!newRole.trim()) {
      toast.error("Enter a valid role name.");
      return;
    }

    setIsAddingRole(true);
    try {
      const response = await fetch(`${API_URL}/roles`, {
        method: "POST",
        headers: { "Content-Type": "application/json", 'Authorization': `Bearer ${token}`},
        body: JSON.stringify({ name: newRole }),
      });
      if (!response.ok) throw new Error("Failed to create role");
      toast.success("Role added successfully!");
      setNewRole("");
      setShowModal(false);
      fetchRoles();
    } catch (error) {
      toast.error("Role creation failed. Try again.");
    } finally {
      setIsAddingRole(false);
    }
  };

  const handleUpload = async () => {
    if (!file || !selectedRole) {
      toast.error("Please select a role and upload a file.");
      return;
    }
    // Validate file extension
    const allowedExtensions = [".csv", ".xlsx"];
    const fileExtension = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
    if (!allowedExtensions.includes(fileExtension)) {
      toast.error("Only .csv or .xlsx files are allowed!");
      return;
    }
  
    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("roleId", selectedRole);

    try {
      const response = await fetch(`${API_URL}/quiz/upload-with-role`, {
        method: "POST",
        headers: {'Authorization': `Bearer ${token}`},
        body: formData,
      });
  
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.message || "Upload failed");
      }
  
      toast.success("Questions uploaded successfully!");
      setSelectedRole("");
      setFile(null);

      const fileInput = document.querySelector<HTMLInputElement>('input[type="file"]');
      if (fileInput) {
        fileInput.value = "";
      }

    } catch (error) {
      toast.error("Upload failed. Try again.");
    } finally {
      setIsUploading(false);
    }
  };


  // Download a sample upload file
  const handleDownloadSample = () => {
    const sampleData = [
      {
        Question: "What is the capital of France?",
        OptionA: "Paris",
        OptionB: "London",
        OptionC: "Berlin",
        OptionD: "Madrid",
        CorrectOption: "Paris",
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sample");

    XLSX.writeFile(workbook, "Sample_Question_Format.xlsx");
  };


  return (
    <DefaultLayout>
      <Breadcrumb pageName="Upload Questions to Position" />
      <ToastContainer position="top-center" autoClose={3000} />

      <div>
        <button onClick={() => router.back()} style={{ height: '47px' }} className="bg-gray-200 px-4 py-2 rounded-md text-sm hover:bg-gray-300 text-gray-800">← Back</button>
      </div>
      <div className="max-w-2xl mx-auto p-6 bg-white shadow-md rounded-lg">
        <h3 className="text-lg font-semibold mb-5 text-black dark:text-white">{roleFromQuery}</h3>

        {/* Upload File */}
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
          <p
            onClick={handleDownloadSample}
            className="text-sm text-blue-600 underline mt-2 cursor-pointer hover:text-blue-800"
          >
            Download Sample Format
          </p>
        </div>

        {/* Upload Button */}
        <button
          className={`w-full bg-primary text-white px-4 py-2 rounded-md hover:bg-opacity-90 ${isUploading ? "opacity-60 cursor-not-allowed" : ""
            }`}
          onClick={handleUpload}
          disabled={isUploading}
        >
          {isUploading ? "Uploading..." : "Upload Questions"}
        </button>

        {/* Download Section */}
        {/* <div className="mt-6">
          <h3 className="text-lg font-semibold mb-3 text-black dark:text-white">Download Questions</h3>
          <button className="w-full bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-opacity-90" onClick={handleDownloadRoleQuestions}>
            Download Role-Specific Questions
          </button>
        </div> */}
      </div>
      {/* Add Role Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-md w-96">
            <h3 className="text-lg font-semibold mb-4">Add New Role</h3>
            <input
              type="text"
              placeholder="Enter Role Name"
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              className="w-full rounded-md border border-stroke bg-transparent px-4 py-2 text-black dark:border-form-strokedark dark:bg-form-input dark:text-white mb-4"
            />
            <div className="flex justify-end gap-3">
              <button
                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-opacity-80"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
              <button
                className={`px-4 py-2 bg-primary text-white rounded-md hover:bg-opacity-90 ${isAddingRole ? "opacity-60 cursor-not-allowed" : ""
                  }`}
                onClick={handleNewRoleSubmit}
                disabled={isAddingRole}
              >
                {isAddingRole ? "Adding..." : "Add Role"}
              </button>
            </div>
          </div>
        </div>
      )}
    </DefaultLayout>
  );
};

export default UploadRoleQuestions;

