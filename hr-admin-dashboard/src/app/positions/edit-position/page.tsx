"use client";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast, ToastContainer } from "react-toastify";

const EditPositionForm = () => {
  const API_URL = process.env.NEXT_PUBLIC_API_URL ?? process.env.LOCALHOST_URL;
  const token = localStorage.getItem("token");
  const router = useRouter();
  const searchParams = useSearchParams();

  const roleId = searchParams.get("id");

  const [jobRole, setJobRole] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [experienceRequired, setExperienceRequired] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      router.push("/positions");
    } catch (error) {
      toast.error("Position update failed. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DefaultLayout>
      <Breadcrumb pageName="Edit Position" />
      <ToastContainer position="top-center" autoClose={3000} />
      <div>
        <button
          onClick={() => router.back()}
          style={{ height: "47px" }}
          className="bg-gray-200 px-4 py-2 rounded-md text-sm hover:bg-gray-300 text-gray-800"
        >
          ← Back
        </button>
      </div>

      <div className="max-w-2xl mx-auto p-6 bg-white shadow-md rounded-lg dark:bg-boxdark">
        <h3 className="text-lg font-bold mb-4">Edit Position</h3>
        <form onSubmit={handleUpdate}>
          <div className="mb-4.5">
            <label className="mb-3 block text-sm font-medium text-black dark:text-white">
              Name <span className="text-meta-1">*</span>
            </label>
            <input
              type="text"
              placeholder="Enter name"
              className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white"
              value={jobRole}
              onChange={(e) => setJobRole(e.target.value)}
            />
          </div>

          <div className="mb-4.5">
            <label className="mb-3 block text-sm font-medium text-black dark:text-white">
              Description <span className="text-meta-1">*</span>
            </label>
            <textarea
              placeholder="Enter description"
              className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white"
              rows={4}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
            ></textarea>
          </div>

          <div className="mb-4.5">
            <label className="mb-3 block text-sm font-medium text-black dark:text-white">
              Experience Required <span className="text-meta-1">*</span>
            </label>
            <input
              type="text"
              placeholder="E.g. 2 years"
              className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white"
              value={experienceRequired}
              onChange={(e) => setExperienceRequired(e.target.value)}
            />
          </div>

          <button
            className={`w-full bg-primary text-white px-4 py-2 rounded-md hover:bg-opacity-90 ${
              isSubmitting ? "opacity-60 cursor-not-allowed" : ""
            }`}
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Updating..." : "Update Position"}
          </button>
        </form>
      </div>
    </DefaultLayout>
  );
};

export default EditPositionForm;
