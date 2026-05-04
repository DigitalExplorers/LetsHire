// components/Panels/AddMemberPanel.tsx
"use client";

import React, { useState } from "react";
import { toast, ToastContainer } from "react-toastify";

const AddMemberPanel = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("hr");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL ?? process.env.LOCALHOST_URL;
  const token = localStorage.getItem("token");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !email || !password || !role) {
      toast.error("All fields are required!");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch(`${API_URL}/users/sub-user`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, email, password, role }),
      });

      if (!res.ok) throw new Error("Failed to create user");

      toast.success("User created successfully!");
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4">
      <ToastContainer />
      <h3 className="text-lg font-bold mb-4">Create New User</h3>

      <form onSubmit={handleSubmit}>
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
            Password <span className="text-meta-1">*</span>
          </label>
          <input
            type="password"
            placeholder="Enter password"
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
          {isSubmitting ? "Saving..." : "Save User"}
        </button>
      </form>
    </div>
  );
};

export default AddMemberPanel;
