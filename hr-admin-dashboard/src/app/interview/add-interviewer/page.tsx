"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createInterviewer } from "../../services/interviewerService";
import DefaultLayout from "@/components/Layouts/DefaultLayout";

interface Interviewer {
  id?: string;
  name: string;
  email: string;
  skills: string[];
  department: string;
  availability: string;
  createdBy: string;
}
const AddInterviewerForm = () => {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [skills, setSkills] = useState("");
  const [department, setDepartment] = useState("");
  const [availability, setAvailability] = useState("Available");
  const [message, setMessage] = useState({ type: "", text: "" });
  const userId = localStorage.getItem("adminId");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !skills || !department) {
      setMessage({ type: "error", text: "All fields are required!" });
      return;
    }

    if (!userId) {
      setMessage({ type: "error", text: "Admin session not found. Please sign in again." });
      return;
    }

    const interviewerData: Interviewer = {
      name,
      email,
      skills: skills.split(", ").map((skill) => skill.trim()),
      department,
      availability,
      createdBy: userId,
    };

    try {
      await createInterviewer(interviewerData);
      setMessage({ type: "success", text: "Interviewer added successfully!" });

      // Clear Form Fields
      setName("");
      setEmail("");
      setSkills("");
      setDepartment("");
      setAvailability("Available");

      // Redirect after 1.5s
      setTimeout(() => {
        router.push("/interview/interviewer-view");
      }, 1500);
    } catch (error) {
      console.error("Error saving interviewer:", error);
      setMessage({ type: "error", text: "Server error. Please try again later." });
    }
  };

  return (
    <DefaultLayout>
      <div className="max-w-2xl mx-auto p-6 bg-white shadow-md rounded-lg dark:bg-boxdark">
        <h3 className="text-lg font-bold mb-4">Create New Interviewer</h3>

        {message.text && (
          <div className={`mb-4 text-white p-3 rounded-md text-center ${message.type === "success" ? "bg-green-500" : "bg-red-500"}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4.5">
            <label className="mb-3 block text-sm font-medium text-black dark:text-white">Name <span className="text-meta-1">*</span></label>
            <input type="text" placeholder="Enter interviewer name" className="w-full rounded border-[1.5px] border-stroke px-5 py-3 text-black outline-none focus:border-primary" value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="mb-4.5">
            <label className="mb-3 block text-sm font-medium text-black dark:text-white">Email <span className="text-meta-1">*</span></label>
            <input type="email" placeholder="Enter interviewer email" className="w-full rounded border-[1.5px] border-stroke px-5 py-3 text-black outline-none focus:border-primary" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>

          <div className="mb-4.5">
            <label className="mb-3 block text-sm font-medium text-black dark:text-white">Skills <span className="text-meta-1">*</span> (comma-separated)</label>
            <input type="text" placeholder="Enter skills (e.g., React, Node.js, Java)" className="w-full rounded border-[1.5px] border-stroke px-5 py-3 text-black outline-none focus:border-primary" value={skills} onChange={(e) => setSkills(e.target.value)} />
          </div>

          <div className="mb-4.5">
            <label className="mb-3 block text-sm font-medium text-black dark:text-white">Department <span className="text-meta-1">*</span></label>
            <input type="text" placeholder="Enter department (e.g., Engineering, HR)" className="w-full rounded border-[1.5px] border-stroke px-5 py-3 text-black outline-none focus:border-primary" value={department} onChange={(e) => setDepartment(e.target.value)} />
          </div>

          {/* <div className="mb-4.5">
            <label className="mb-3 block text-sm font-medium text-black dark:text-white">Availability <span className="text-meta-1">*</span></label>
            <select className="w-full rounded border-[1.5px] border-stroke px-5 py-3 text-black outline-none focus:border-primary" value={availability} onChange={(e) => setAvailability(e.target.value)}>
              <option value="Available">Available</option>
              <option value="Busy">Busy</option>
              <option value="On Leave">On Leave</option>
            </select>
          </div> */}

          <div style={{display:"flex",alignItems:"center",justifyContent:"center"}}>
            <button style={{width:"75%"}} className="bg-primary text-white px-4 py-2 rounded-md hover:bg-opacity-90">Save Interviewer</button>
          </div>
        </form>
      </div>
    </DefaultLayout>
  );
};

export default AddInterviewerForm;
