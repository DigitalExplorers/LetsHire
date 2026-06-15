"use client";

import React, { useEffect, useState } from "react";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { useRouter } from "next/navigation";
import { toast, ToastContainer } from "react-toastify";

const AddAdminForm = () => {
  const API_URL = process.env.NEXT_PUBLIC_API_URL ?? process.env.LOCALHOST_URL;
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : "";
  const router = useRouter();

  const [organizations, setOrganizations] = useState<{ id: string; name: string }[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    organizationId: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const fetchOrganizations = async () => {
    try {
      const res = await fetch(`${API_URL}/super-admin/organizations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setOrganizations(data);
    } catch (error) {
      toast.error("Failed to fetch organizations");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { name, email, password, organizationId } = formData;
    if (!name || !email || !password || !organizationId) {
      toast.error("All fields are required!");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/super-admin/create-admin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, email, password, organizationId }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.message || "Failed to create admin");
      }

      toast.success("Admin created successfully!");
      setTimeout(() => router.push("/super-admin/admins"), 1500);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DefaultLayout>
      <Breadcrumb pageName="Add Admin" />
      <ToastContainer position="top-center" autoClose={3000} />
      <div>
        <button
          onClick={() => router.back()}
          className="bg-gray-200 px-4 py-2 rounded-md text-sm hover:bg-gray-300 text-gray-800"
        >
          ← Back
        </button>
      </div>

      <div className="max-w-2xl mx-auto p-6 bg-white shadow-md rounded-lg dark:bg-boxdark">
        <h3 className="text-lg font-bold mb-4">Create New Admin</h3>
        <form onSubmit={handleSubmit}>
          {/* Name */}
          <div className="mb-4.5">
            <label className="block text-sm font-medium text-black dark:text-white mb-2">
              Name <span className="text-meta-1">*</span>
            </label>
            <input
              type="text"
              name="name"
              placeholder="Full Name"
              className="w-full border border-gray-300 px-4 py-2 rounded-md"
              value={formData.name}
              onChange={handleChange}
            />
          </div>

          {/* Email */}
          <div className="mb-4.5">
            <label className="block text-sm font-medium text-black dark:text-white mb-2">
              Email <span className="text-meta-1">*</span>
            </label>
            <input
              type="email"
              name="email"
              placeholder="Email Address"
              className="w-full border border-gray-300 px-4 py-2 rounded-md"
              value={formData.email}
              onChange={handleChange}
            />
          </div>

          {/* Password */}
          <div className="mb-4.5">
            <label className="block text-sm font-medium text-black dark:text-white mb-2">
              Password <span className="text-meta-1">*</span>
            </label>
            <input
              type="password"
              name="password"
              placeholder="Password"
              className="w-full border border-gray-300 px-4 py-2 rounded-md"
              value={formData.password}
              onChange={handleChange}
            />
          </div>

          {/* Organization */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-black dark:text-white mb-2">
              Organization <span className="text-meta-1">*</span>
            </label>
            <select
              name="organizationId"
              className="w-full border border-gray-300 rounded px-4 py-2 text-black outline-none focus:border-primary"
              value={formData.organizationId}
              onChange={handleChange}
            >
              <option value="">Select Organization</option>
              {organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className={`w-full bg-primary text-white px-4 py-2 rounded-md hover:bg-opacity-90 ${
              isSubmitting ? "opacity-60 cursor-not-allowed" : ""
            }`}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Saving..." : "Save Admin"}
          </button>
        </form>
      </div>
    </DefaultLayout>
  );
};

export default AddAdminForm;
