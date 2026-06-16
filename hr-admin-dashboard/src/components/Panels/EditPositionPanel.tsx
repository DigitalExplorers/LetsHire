"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import Cookies from "js-cookie";

interface EditPositionPanelProps {
  roleId: number;
  onSuccess?: () => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? process.env.LOCALHOST_URL;
const token = typeof window !== "undefined" ? Cookies.get("token") : null;

const EditPositionPanel = ({ roleId, onSuccess }: EditPositionPanelProps) => {
  const [jobRole, setJobRole] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [experienceRequired, setExperienceRequired] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (roleId) fetchRoleData();
  }, [roleId]);

  const fetchRoleData = async () => {
    try {
      const response = await fetch(`${API_URL}/roles/${roleId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      setJobRole(data.name);
      setJobDescription(data.description);
      setExperienceRequired(data.experienceRequired);
    } catch (err) {
      console.error("Failed to fetch role data", err);
      toast.error("Failed to fetch position details.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!jobRole || !jobDescription || experienceRequired == null) {
      toast.error("All fields are required!");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/roles/${roleId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: jobRole,
          description: jobDescription,
          experienceRequired,
        }),
      });

      if (!response.ok) throw new Error("Failed to update position");

      toast.success("Position updated successfully!");
      if (onSuccess) onSuccess();
    } catch (error) {
      toast.error("Position update failed. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="text-center p-6">
        <p className="text-gray-600">Loading position details...</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h3 className="text-lg font-bold mb-4">Edit Position</h3>
      <form onSubmit={handleUpdate}>
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
          {isSubmitting ? "Updating..." : "Update Position"}
        </button>
      </form>
    </div>
  );
};

export default EditPositionPanel;
