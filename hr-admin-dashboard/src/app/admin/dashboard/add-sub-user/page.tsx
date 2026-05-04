"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import { useAuth } from "@/hooks/AuthContext";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? process.env.LOCALHOST_URL;

const AddSubUserForm = () => {
  const { user } = useAuth(); // contains admin info
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("interviewer"); // default role
  const [message, setMessage] = useState({ type: "", text: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password || !role) {
      setMessage({ type: "error", text: "All fields are required!" });
      return;
    }

    try {
      const response = await fetch(`${API_URL}/users/create-sub-user`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          name,
          email,
          password,
          role,
        }),
      });

      if (!response.ok) throw new Error("Error creating user");
      setMessage({ type: "success", text: `${role} added successfully!` });

      setTimeout(() => {
        router.push("/interview/interviewer-view"); // or HR view if needed
      }, 1500);
    } catch (err) {
      setMessage({ type: "error", text: "Something went wrong." });
    }
  };

  return (
    <DefaultLayout>
      <div className="max-w-2xl mx-auto p-6 bg-white shadow-md rounded-lg dark:bg-boxdark">
        <h3 className="text-lg font-bold mb-4">Create Sub User (HR or Interviewer)</h3>

        {message.text && (
          <div className={`mb-4 text-white p-3 rounded-md text-center ${message.type === "success" ? "bg-green-500" : "bg-red-500"}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4.5">
            <label className="block text-sm font-medium text-black dark:text-white">Name *</label>
            <input type="text" placeholder="Enter name" value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded border border-stroke px-5 py-3" />
          </div>

          <div className="mb-4.5">
            <label className="block text-sm font-medium text-black dark:text-white">Email *</label>
            <input type="email" placeholder="Enter email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded border border-stroke px-5 py-3" />
          </div>

          <div className="mb-4.5">
            <label className="block text-sm font-medium text-black dark:text-white">Password *</label>
            <input type="password" placeholder="Enter password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded border border-stroke px-5 py-3" />
          </div>

          <div className="mb-4.5">
            <label className="block text-sm font-medium text-black dark:text-white">Role *</label>
            <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full rounded border border-stroke px-5 py-3">
              <option value="interviewer">Interviewer</option>
              <option value="hr">HR</option>
            </select>
          </div>

          <div className="text-center">
            <button className="w-3/4 bg-primary text-white px-4 py-2 rounded-md hover:bg-opacity-90">Create</button>
          </div>
        </form>
      </div>
    </DefaultLayout>
  );
};

export default AddSubUserForm;
