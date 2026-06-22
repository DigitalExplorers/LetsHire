"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { toast, ToastContainer } from "react-toastify";
import Cookies from "js-cookie";

const EditAdminForm = () => {
  const API_URL = process.env.NEXT_PUBLIC_API_URL ?? process.env.LOCALHOST_URL;
  const token = typeof window !== "undefined" ? Cookies.get("token") : "";
  const searchParams = useSearchParams();
  const router = useRouter();

  const adminId = searchParams.get("id");
  const [admin, setAdmin] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (adminId) {
      fetchAdminData(adminId);
    }
  }, [adminId]);

  const fetchAdminData = async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/super-admin/admin/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      setAdmin({
        name: data.name || "",
        email: data.email || "",
        password: "" // password shouldn't be prefilled
      });
    } catch (error) {
      toast.error("Failed to fetch admin details.");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setAdmin((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/super-admin/admin/${adminId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(admin),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update admin");
      }

      toast.success("Admin updated successfully!");
      setTimeout(() => router.push("/super-admin/admins"), 1500);
    } catch (error: any) {
      toast.error(error.message || "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DefaultLayout>
      <Breadcrumb pageName="Edit Admin" />
      <ToastContainer position="top-center" autoClose={3000} />

      <div>
        <button
          onClick={() => router.back()}
          className="bg-gray-200 px-4 py-2 rounded-md text-sm hover:bg-gray-300 text-gray-800 mb-4"
        >
          ← Back
        </button>
      </div>

      <div className="max-w-2xl mx-auto p-6 bg-white shadow-md rounded-lg dark:bg-boxdark">
        <h3 className="text-lg font-bold mb-4">Edit Admin</h3>

        <form onSubmit={handleSubmit}>
          <div className="mb-4.5">
            <label className="block mb-1 font-medium text-black dark:text-white">Name</label>
            <input
              type="text"
              name="name"
              value={admin.name}
              onChange={handleChange}
              placeholder="Full name"
              className="w-full border px-4 py-2 rounded-md text-black"
            />
          </div>

          <div className="mb-4.5">
            <label className="block mb-1 font-medium text-black dark:text-white">Email</label>
            <input
              type="email"
              name="email"
              value={admin.email}
              onChange={handleChange}
              placeholder="Email address"
              className="w-full border px-4 py-2 rounded-md text-black"
            />
          </div>

          <div className="mb-4.5">
            <label className="block mb-1 font-medium text-black dark:text-white">Password (optional)</label>
            <input
              type="password"
              name="password"
              value={admin.password}
              onChange={handleChange}
              placeholder="Leave blank to keep existing"
              className="w-full border px-4 py-2 rounded-md text-black"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full bg-primary text-white px-4 py-2 rounded-md hover:bg-opacity-90 ${
              isSubmitting ? "opacity-60 cursor-not-allowed" : ""
            }`}
          >
            {isSubmitting ? "Saving..." : "Update Admin"}
          </button>
        </form>
      </div>
    </DefaultLayout>
  );
};

export default EditAdminForm;
