"use client";

import React from "react";
import { useEffect, useState } from "react";
import { ArrowDownUp, ArrowUpDown, MoreVertical } from "lucide-react";
import { Menu } from "@headlessui/react";
import { getCandidateInterviewHistory } from "../../services/interviewerService";
import { getCandidates, deleteCandidate } from "../../services/candidateService";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import ConfirmAction from "@/components/ConfirmAction";
import DropdownActions from "@/components/DropdownActions";
import { useRouter } from "next/navigation";

interface Document {
  name: string;
  url: string;
}

// Define the Candidate interface
interface Candidate {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  countryCode: string;
  phoneNumber: string;
  email: string;
  qualification: string;
  yearOfPassedOut: number | null;
  currentCity: string;
  desiredRole: string;
  workExperience: number;
  resume: string | null;
  idProof: string | null;
  createdAt: string;
  updatedAt: string;
  score: number | null;
  status: 
    | "Applied"
    | "Screening"
    | "Shortlisted"
    | "Interview Scheduled"
    | "Interview Completed"
    | "InProgress"
    | "Feedback Pending"
    | "Rejected"
    | "Hired";
  videoPath: string | null;
  videoAnalysis: VideoAnalysis | null;
  interviewScheduledAt?: string;
  assignedInterviewer?: Interviewer | null;
  rounds: InterviewRound[] | null;
  interviews: Interview[];
  feedbacks: Feedback[] | null;
}

// Define a simplified version of Candidate for Interview to avoid circular references
interface InterviewCandidate {
  id: number;
  firstName: string;
  lastName: string;
  countryCode: string;
  phoneNumber: string;
  email: string;
  qualification: string;
  yearOfPassedOut: number | null;
  currentCity: string;
  desiredRole: string;
  workExperience: number;
  resume: string | null;
  idProof: string | null;
  createdAt: string;
  updatedAt: string;
  score: number | null;
  status:
    | "Applied"
    | "Screening"
    | "Shortlisted"
    | "Interview Scheduled"
    | "Interview Completed"
    | "InProgress"
    | "Feedback Pending"
    | "Rejected"
    | "Hired";
  videoPath: string | null;
  interviewScheduledAt?: string;
}

// Define the Interview interface
interface Interview {
  id: number;
  round: number;
  feedback: string | null;
  score: number | null;
  status: "Pending" | "Completed" | "Canceled";
  scheduledDate: string;
  createdAt: string;
  updatedAt: string;
  interviewer?: Interviewer | null;
  candidate: InterviewCandidate;
}

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

interface InterviewRound {
  id: number;
  roundName: string;
  feedback: string | null;
  score: number | null;
  totalScore: number;
  status: "Pending" | "Completed";
  createdAt: string;
  updatedAt: string;
}

interface Feedback {
  id: number;
  strengths: string;
  weaknesses: string;
  comments: string;
  createdAt: string;
  updatedAt: string;
}

// Extend Candidate Interface to Allow Extra Fields
interface TransformedCandidate extends Candidate {
  name: string;
  age: string;
  gender: string;
  phone: string;
  address: string;
  avatar: string;
  documents: Document[];
  scores: InterviewRound[]; // Update with proper type if known
  video: string;
  latestInterview: Interview | null
  analytics: {
    Gender: string;
    Age: string;
    Expression: string;
    sentiment: string;
    speechRate: string;
    clarityScore: string;
    confidenceLevel: string;
    transcript: string;
  };
}


// Interface for Video Analysis Data
interface VideoAnalysis {
  result?: {
    video_analysis?: string[][]; // Assuming it's a 2D array of strings
    audio_analysis?: {
      tone_rating?: string;
      fluency_metrics?: {
        speech_speed_wpm?: number;
      };
      overall_rating_score?: string;
      fluency_rating?: string;
      transcript?: string;
    };
  };
}


const statusColors: Record<string, string> = {
  Applied: "bg-blue-300 text-blue-700",
  Screening: "bg-yellow-300 text-yellow-700",
  Shortlisted: "bg-green-300 text-green-700",
  "Interview Scheduled": "bg-indigo-300 text-indigo-700",
  "Interview Completed": "bg-cyan-300 text-cyan-700",
  InProgress: "bg-orange-300 text-orange-700",
  "Feedback Pending": "bg-red-300 text-red-700",
  Rejected: "bg-gray-300 text-gray-700",
  Hired: "bg-purple-300 text-purple-700",
};


// Use Proper State Types
const HRDashboard = () => {
  const [search, setSearch] = useState("");
  const [candidates, setCandidates] = useState<TransformedCandidate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCandidate, setSelectedCandidate] = useState<TransformedCandidate | null>(null);
  const [interviewHistory, setInterviewHistory] = useState<Interview[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [sortField, setSortField] = useState<"name" | "date">("name");
  const itemsPerPage = 10;

  const router = useRouter();
  const candidateView = (candidateId: string) => {
    router.push(`/candidate?id=${candidateId}`);
  };

  useEffect(() => {
    fetchCandidates();
  }, []);

  // Fetch Candidates with Correct Types
  const fetchCandidates = async () => {
    setIsLoading(true);
    try {
      const data: TransformedCandidate[] = await getCandidates();
      const processedData = data.map((candidate) => ({
        ...candidate,
        id: candidate.id,
        name: `${candidate.firstName} ${candidate.lastName}`,
        email: candidate.email,
        phone: candidate.phoneNumber,
        status: candidate.status,
        latestInterview:
          candidate.interviews.length > 0
            ? candidate.interviews.sort((a, b) => b.round - a.round)[0]
            : null,
      }));

      setCandidates(processedData);
    } catch (error) {
      console.error("Error fetching candidates:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fix Function Parameter Type
  const handleViewHistory = async (candidate: TransformedCandidate) => {
    try {
      setSelectedCandidate(candidate);
      const history: Interview[] = await getCandidateInterviewHistory(candidate.id);
      setInterviewHistory(history);
      setShowHistory(true);
    } catch (error) {
      console.error("Error fetching interview history:", error);
    }
  };

  const handleDeleteCandidate = async (id: string) => {
    await ConfirmAction({
      action: async () => {
        setIsLoading(true);
        await deleteCandidate(id);
        fetchCandidates();
      },
      title: "Delete Candidate",
      message: "You won't be able to revert this!",
      confirmText: "Yes, delete it!",
    });
  };


  // Filter Interviewers Safely
  const filteredCandidates = candidates.filter((candidate) =>
    candidate.name.toLowerCase().includes(search.toLowerCase())
  );

  const sortedCandidates = [...filteredCandidates].sort((a, b) => {
    if (sortField === "name") {
      const nameA = a.name.toLowerCase();
      const nameB = b.name.toLowerCase();
      return sortOrder === "asc" ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
    } else if (sortField === "date") {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
    }
    return 0;
  });

  // Pagination Logic
  const totalCandidates = sortedCandidates.length;
  const totalPages = Math.ceil(totalCandidates / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalCandidates);
  const paginatedCandidates = sortedCandidates.slice(startIndex, endIndex);

  const handleSortToggle = (field: "name" | "date") => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  return (
    <DefaultLayout isLoading={isLoading}>
      <Breadcrumb pageName="Total Candidates" />
        <div className="rounded-lg border bg-white p-5 shadow-md w-full">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row justify-between items-center mb-4 space-y-2 md:space-y-0">
            {/* <h3 className="text-lg font-semibold text-black">Candidates List</h3> */}
            <input
              type="text"
              placeholder="Search by name..."
              className="border px-3 py-2 rounded-lg text-black w-full md:w-1/3"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* {isLoading ? (
            <div className="flex items-center justify-center min-h-[60vh] w-full">
              <div className="text-center">
                <div className="loader border-t-4 border-blue-500 border-solid rounded-full w-12 h-12 mx-auto animate-spin"></div>
                <p className="mt-2 text-gray-600">Loading...</p>
              </div>
            </div>
          ) : ( */}
            <>
              {/* {paginatedCandidates.length === 0 ? (
                <div className="flex justify-center items-center h-40">
                  <span className="text-gray-500 text-lg">No candidates found.</span>
                </div>
              ) : (
                <> */}
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-max table-auto border-collapse border border-gray-200">
                      <thead className="bg-gray-100">
                        <tr>
                          {/* <th className="px-4 py-3 text-left">Name</th> */}
                          <th
                            className="px-4 py-3 text-left cursor-pointer select-none"
                            onClick={() => handleSortToggle("name")}
                          >
                            Name{" "}
                            {sortField === "name" ? (
                              sortOrder === "asc" ? (
                                <ArrowUpDown size={14} className="inline ml-1" />
                              ) : (
                                <ArrowDownUp size={14} className="inline ml-1" />
                              )
                            ) : (
                              <ArrowUpDown size={14} className="inline ml-1 text-gray-400" />
                            )}
                          </th>
                          <th className="px-4 py-3 text-left">Status</th>
                          <th className="px-4 py-3 text-left">Round</th>
                          <th className="px-4 py-3 text-left">Score</th>
                          <th className="px-4 py-3 text-left">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                      {paginatedCandidates.length > 0 ? (
                        paginatedCandidates.map((candidate) => (
                          <tr key={candidate.id} className="border-t">
                            <td className="px-4 py-3 whitespace-nowrap cursor-pointer" onClick={() => candidateView(candidate.id)}>
                              {candidate.name}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`px-3 py-1 rounded-full text-sm ${
                                  statusColors[candidate.status]
                                }`}
                              >
                                {candidate.status}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              {candidate.latestInterview
                                ? `Round ${candidate.latestInterview.round}`
                                : "Screening"}
                            </td>
                            <td className="px-4 py-3">
                              {candidate.latestInterview?.score ?? "N/A"}
                            </td>
                            <td className="px-4 py-3 relative">
                              <DropdownActions
                                trigger={({ onClick, ref }) => (
                                  <button
                                    className="p-2 text-gray-600 hover:text-gray-900"
                                    onClick={onClick}
                                    ref={ref}
                                  >
                                    <MoreVertical size={20} />
                                  </button>
                                )}
                                items={({ close }) => (
                                  <div className="py-1">
                                    <button
                                      className="block px-4 py-2 w-full text-left hover:bg-gray-200"
                                      onClick={() => {
                                        handleViewHistory(candidate);
                                        close();
                                      }}
                                    >
                                      View History
                                    </button>
                                    <button
                                      className="block px-4 py-2 w-full text-left hover:bg-gray-200"
                                      onClick={() => {
                                        handleDeleteCandidate(candidate.id);
                                        close();
                                      }}
                                    >
                                      Delete
                                    </button>
                                  </div>
                                )}
                              />
                            </td>
                          </tr>
                        ))) : (
                          <tr>
                            <td colSpan={6} className="border p-4 text-center text-gray-500">No candidates found.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  {/* Pagination Controls */}
                  {(
                    <div className="flex justify-between items-center mt-4">
                      <span className="text-sm">
                        Showing {startIndex + 1}-{endIndex} of {totalCandidates}
                      </span>
                      <div className="flex space-x-2">
                        <button onClick={handlePreviousPage} disabled={currentPage === 1} className={`px-3 py-1 border rounded-md ${currentPage === 1 ? "opacity-50 cursor-not-allowed" : ""}`}>
                          Prev
                        </button>
                        <button onClick={handleNextPage} disabled={currentPage === totalPages} className={`px-3 py-1 border rounded-md ${currentPage === totalPages ? "opacity-50 cursor-not-allowed" : ""}`}>
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                {/* </>
              )} */}
            </>
          {/* )} */}

          {/* Interview History Modal */}
          {showHistory && selectedCandidate && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 px-4 sm:px-6">
              <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-2xl mx-auto">
                <h2 className="text-xl font-semibold text-gray-800 text-center mb-4">
                  Interview History for {selectedCandidate.name}
                </h2>

                <div className="overflow-x-auto">
                  <table className="w-full border border-gray-200 text-sm sm:text-base">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="p-3 text-left">Round</th>
                        <th className="p-3 text-left">Interviewer</th>
                        <th className="p-3 text-left">Score</th>
                        <th className="p-3 text-left">Feedback</th>
                      </tr>
                    </thead>
                    <tbody>
                      {interviewHistory.map((interview) => (
                        <tr key={interview.id} className="border-t text-gray-700">
                          <td className="p-3">Round {interview.round}</td>
                          <td className="p-3">{interview.interviewer?.name || "Not Assigned"}</td>
                          <td className="p-3">{interview.score ?? "N/A"}</td>
                          <td className="p-3">{interview.feedback ?? "No feedback yet"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <button
                  className="mt-4 bg-gray-600 text-white px-5 py-2 rounded-lg w-full sm:w-auto sm:mx-auto block hover:bg-gray-700"
                  onClick={() => setShowHistory(false)}
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
    </DefaultLayout>
  );
};

export default HRDashboard;
