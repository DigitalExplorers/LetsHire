"use client";

import React, { useEffect, useState } from "react";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { useRouter, useSearchParams } from "next/navigation";
import { toast, ToastContainer } from "react-toastify";
import Cookies from "js-cookie";
const EditMemberForm = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("hr");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get("id");

  useEffect(() => {
    if (userId) {
      fetchUserDetails(userId);
    }
  }, [userId]);

  const fetchUserDetails = async (id: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/sub-user/${id}`, {
        headers: {
          Authorization: `Bearer ${Cookies.get("token")}`,
        },
      });

      if (!res.ok) throw new Error("User not found");

      const data = await res.json();
      setName(data.name);
      setEmail(data.email);
      setRole(data.role?.name || "hr");
    } catch (error) {
      toast.error("Failed to load user data.");
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !role) {
      toast.error("All fields except password are required!");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/sub-user/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${Cookies.get("token")}`,
        },
        body: JSON.stringify({
          name,
          email,
          role,
          ...(password && { password }), // only send password if entered
        }),
      });

      if (!res.ok) throw new Error("Update failed");

      toast.success("User updated successfully!");
      setTimeout(() => router.push("/admin/team"), 1500);
    } catch (error) {
      toast.error("Update failed. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DefaultLayout>
      <Breadcrumb pageName="Edit User" />
      <ToastContainer />

      <div className="max-w-2xl mx-auto p-6 bg-white shadow-md rounded-lg dark:bg-boxdark">
        <h3 className="text-lg font-bold mb-4">Edit Team User</h3>

        <form onSubmit={handleUpdate}>
          <div className="mb-4.5">
            <label className="mb-1 block text-sm font-medium text-black dark:text-white">
              Name <span className="text-meta-1">*</span>
            </label>
            <input
              type="text"
              placeholder="Enter full name"
              className="w-full border border-gray-300 rounded px-4 py-2 text-black outline-none focus:border-primary"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="mb-4.5">
            <label className="mb-1 block text-sm font-medium text-black dark:text-white">
              Email <span className="text-meta-1">*</span>
            </label>
            <input
              type="email"
              placeholder="Enter email address"
              className="w-full border border-gray-300 rounded px-4 py-2 text-black outline-none focus:border-primary"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="mb-4.5">
            <label className="mb-1 block text-sm font-medium text-black dark:text-white">
              New Password (optional)
            </label>
            <input
              type="password"
              placeholder="Enter new password"
              className="w-full border border-gray-300 rounded px-4 py-2 text-black outline-none focus:border-primary"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="mb-4.5">
            <label className="mb-1 block text-sm font-medium text-black dark:text-white">
              Role <span className="text-meta-1">*</span>
            </label>
            <select
              className="w-full border border-gray-300 rounded px-4 py-2 text-black outline-none focus:border-primary"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="hr">HR</option>
              <option value="interviewer">Interviewer</option>
            </select>
          </div>

          <button
            type="submit"
            className={`w-full bg-primary text-white px-4 py-2 rounded-md hover:bg-opacity-90 ${
              isSubmitting ? "opacity-60 cursor-not-allowed" : ""
            }`}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Saving..." : "Update User"}
          </button>
        </form>
      </div>
    </DefaultLayout>
  );
};

export default EditMemberForm;
