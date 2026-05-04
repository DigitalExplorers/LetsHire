"use client";

import DefaultLayout from "@/components/Layouts/DefaultLayout";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { getInterviewers, deleteInterviewer } from "../../services/interviewerService";
import { useRouter } from "next/navigation";
import ConfirmAction from "@/components/ConfirmAction";
import { ArrowDownUp, ArrowUpDown } from "lucide-react";

// Define the Interviewer interface
interface Interviewer {
  id: number;
  name: string;
  email: string;
  skills: string[];
  department: string;
  availability: "Available" | "Busy" | "On Leave";
  createdAt: string;
  updatedAt: string;
}

const InterviewersList = () => {
  const [interviewers, setInterviewers] = useState<Interviewer[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [sortField, setSortField] = useState<"name" | "date">("name");
  const itemsPerPage = 10;

  useEffect(() => {
    setLoading(true);
    getInterviewers()
      .then((data) => setInterviewers(data))
      .catch((err) => console.error("Error fetching interviewers:", err))
      .finally(() => setLoading(false));
  }, []);

  const router = useRouter();

  const fetchAssignedCandidates = (interviewerId: number) => {
    router.push(`/interview/assigned-candidates?interviewerId=${interviewerId}`);
  };

  // Filter Interviewers Safely
  const filteredInterviewers = interviewers.filter((interviewer) =>
    interviewer.name.toLowerCase().includes(search.toLowerCase()) ||
    interviewer.skills.some((skill: string) => skill.toLowerCase().includes(search.toLowerCase()))
  );

  const sortedfilteredInterviewers = [...filteredInterviewers].sort((a, b) => {
    const nameA = a.name.toLowerCase();
    const nameB = b.name.toLowerCase();
    return sortOrder === "asc" ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
  });

  // Pagination Logic
  const totalInterviewers = sortedfilteredInterviewers.length;
  const totalPages = Math.ceil(totalInterviewers / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(currentPage * itemsPerPage, totalInterviewers);
  const paginatedInterviewers = sortedfilteredInterviewers.slice(startIndex - 1, endIndex);

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const handleSortToggle = () => {
    setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
  };

  const handleDeleteInterviewer = async (id: number) => {
    try {
      await ConfirmAction({
        action: async () => {
          await deleteInterviewer(id);
          setInterviewers(interviewers.filter((i) => i.id !== id));
        },
        title: "Are you sure you want to delete this interviewer?",
        message: "You won't be able to revert this!",
        confirmText: "Yes, delete it!",
      });
    }
    catch(err){console.log("error occured at ",err)}
  };

  return (
    <DefaultLayout>
      <div className="rounded-lg border bg-white p-5 shadow-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-black">Interviewers List</h3>
          <div className="flex space-x-3">
            <input
              type="text"
              placeholder="Search interviewer..."
              className="border px-3 py-2 rounded-lg text-black"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Link href="/interview/add-interviewer">
              <button className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-opacity-90">
                + Add Interviewer
              </button>
            </Link>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center min-h-[60vh] w-full">
            <div className="text-center">
              <div className="loader border-t-4 border-blue-500 border-solid rounded-full w-12 h-12 mx-auto animate-spin"></div>
              <p className="mt-2 text-gray-600">Loading...</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full min-w-max table-auto border-collapse border border-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  {/* <th className="px-4 py-3 text-left">Name</th> */}
                  <th
                    className="px-4 py-3 text-left cursor-pointer select-none"
                    onClick={handleSortToggle}
                  >
                    Name{" "}
                    {sortOrder === "asc" ? (
                      <ArrowUpDown size={14} className="inline ml-1" />
                    ) : (
                      <ArrowDownUp size={14} className="inline ml-1" />
                    )}
                  </th>
                  <th className="px-4 py-3 text-left">Email</th>
                  <th className="px-4 py-3 text-left">Skills</th>
                  <th className="px-4 py-3 text-left">Department</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
              {paginatedInterviewers.length > 0 ? (
                paginatedInterviewers.map((interviewer) => (
                  <tr
                    key={interviewer.id}
                    className="border-t cursor-pointer hover:bg-gray-100"
                    onClick={() => fetchAssignedCandidates(interviewer.id)}
                  >
                    <td className="px-4 py-3 whitespace-nowrap">{interviewer.name}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{interviewer.email}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{interviewer.skills.join(", ")}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{interviewer.department}</td>
                    <td
                      className="px-4 py-3 text-red-500 cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteInterviewer(interviewer.id);
                      }}
                    >
                      Delete
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="border p-4 text-center text-gray-500">No interviewers found.</td>
                </tr>
              )}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="flex justify-between items-center mt-4">
              <span className="text-sm">
                Showing {startIndex}-{endIndex} of {totalInterviewers}
              </span>
              <div className="flex space-x-2">
                <button onClick={handlePreviousPage} disabled={currentPage === 1} className="px-3 py-1 border rounded-md">
                  Prev
                </button>
                <button onClick={handleNextPage} disabled={currentPage === totalPages} className="px-3 py-1 border rounded-md">
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DefaultLayout>
  );
};

export default InterviewersList;

