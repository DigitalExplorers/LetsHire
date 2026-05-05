"use client";

import { useState } from "react";
import { toast } from "react-toastify";

interface AddPositionPanelProps {
  onSuccess?: () => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? process.env.LOCALHOST_URL;
const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

const AddPositionPanel = ({ onSuccess }: AddPositionPanelProps) => {
  const [jobRole, setJobRole] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [experienceRequired, setExperienceRequired] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!jobRole || !jobDescription || experienceRequired == null) {
      toast.error("All fields are required!");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/roles`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: jobRole,
          description: jobDescription || "N/A",
          experienceRequired: experienceRequired || "N/A",
        }),
      });

      if (!response.ok) throw new Error("Failed to create role");
      toast.success("Position added successfully!");
      if (onSuccess) onSuccess();
    } catch (error) {
      toast.error("Position creation failed. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4">
      <h3 className="text-lg font-bold mb-4">Add Position</h3>
      <form onSubmit={handleSubmit}>
        <div className="mb-4.5">
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Name <span className="text-meta-1">*</span>
          </label>
          <input
            type="text"
            placeholder="Enter name"
            className="w-full rounded border px-4 py-2"
            value={jobRole}
            onChange={(e) => setJobRole(e.target.value)}
          />
        </div>

        <div className="mb-4.5">
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Description <span className="text-meta-1">*</span>
          </label>
          <textarea
            placeholder="Enter description"
            rows={4}
            className="w-full rounded border px-4 py-2"
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
          ></textarea>
        </div>

        <div className="mb-4.5">
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Experience Required <span className="text-meta-1">*</span>
          </label>
          <input
            type="text"
            placeholder="E.g. 2 years"
            className="w-full rounded border px-4 py-2"
            value={experienceRequired}
            onChange={(e) => setExperienceRequired(e.target.value)}
          />
        </div>

        <button
          type="submit"
          className={`w-full bg-primary text-white px-4 py-2 rounded hover:bg-opacity-90 ${
            isSubmitting ? "opacity-60 cursor-not-allowed" : ""
          }`}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Saving..." : "Save Position"}
        </button>
      </form>
    </div>
  );
};

export default AddPositionPanel;
