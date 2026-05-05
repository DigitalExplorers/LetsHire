"use client";

import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import * as XLSX from "xlsx";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? process.env.LOCALHOST_URL;

interface Props {
    roleId: string;
    roleName: string;
}

const UploadRoleQuestionsPanel = ({ roleId, roleName }: Props) => {
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files?.length) {
            const uploadedFile = event.target.files[0];

            const allowedExtensions = [".csv", ".xlsx"];
            const ext = uploadedFile.name.substring(uploadedFile.name.lastIndexOf(".")).toLowerCase();
            if (!allowedExtensions.includes(ext)) {
                toast.error("Only .csv or .xlsx files are allowed!");
                return;
            }

            try {
                const data = await uploadedFile.arrayBuffer();
                const workbook = XLSX.read(data, { type: "array" });
                const worksheet = workbook.Sheets[workbook.SheetNames[0]];
                const json = XLSX.utils.sheet_to_json(worksheet);

                const isValid = json.every((row: any) =>
                    row.Question &&
                    row.OptionA &&
                    row.OptionB &&
                    row.OptionC &&
                    row.OptionD &&
                    row.CorrectOption &&
                    row.Round
                );

                if (!isValid) {
                    toast.error("Invalid format. Ensure columns: Question, OptionA-D, CorrectOption, Round.");
                    return;
                }

                setFile(uploadedFile);
            } catch (error) {
                console.error(error);
                toast.error("Error reading file.");
            }
        }
    };

    const handleUpload = async () => {
        if (!roleId) {
            toast.error("Missing role.");
            return;
        }

        const currentFileInput = document.querySelector('input[type="file"]') as HTMLInputElement | null;
        const selectedFile = currentFileInput?.files?.[0] || file;

        if (!selectedFile) {
            toast.error("Missing file.");
            return;
        }

        setIsUploading(true);
        const formData = new FormData();
        formData.append("file", selectedFile);
        formData.append("roleId", roleId);

        try {
            const res = await fetch(`${API_URL}/quiz/upload-with-role`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            });

            const result = await res.json();
            if (!res.ok) throw new Error(result?.message || "Upload failed");

            toast.success("Questions uploaded successfully!");

            // Clear local state
            setFile(null);

            // Reset file input value safely
            if (currentFileInput) {
                currentFileInput.value = "";
            }
        } catch (err) {
            console.error(err);
            toast.error("Upload failed.");
        } finally {
            setIsUploading(false);
        }
    };

    const handleDownloadSample = () => {
        const sample = [
            {
                Question: "What is the capital of France?",
                OptionA: "Paris",
                OptionB: "London",
                OptionC: "Berlin",
                OptionD: "Madrid",
                CorrectOption: "Paris",
                Round: "1",
            },
        ];
        const ws = XLSX.utils.json_to_sheet(sample);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Sample");
        XLSX.writeFile(wb, "Sample_Question_Format.xlsx");
    };

    return (
        <div className="p-4">
            <h3 className="text-lg font-semibold mb-4 text-black">{roleName}</h3>

            <div className="mb-4">
                <label className="block text-sm font-medium text-black mb-2">Upload .csv or .xlsx file</label>
                <input
                    type="file"
                    accept=".csv,.xlsx"
                    onChange={handleFileChange}
                    className="w-full border px-3 py-2 rounded-md text-black"
                />
                <button onClick={handleDownloadSample} className="text-sm mt-2 text-blue-600 underline hover:text-blue-800">
                    Download Sample Format
                </button>
            </div>

            <button
                onClick={handleUpload}
                disabled={isUploading || !file || !roleId}
                className="w-full bg-primary text-white px-4 py-2 rounded hover:bg-opacity-90 disabled:opacity-60"
            >
                {isUploading ? "Uploading..." : "Upload Questions"}
            </button>
        </div>
    );
};

export default UploadRoleQuestionsPanel;
