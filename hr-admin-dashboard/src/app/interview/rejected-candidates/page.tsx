"use client";
import React from "react";
import { useEffect, useState } from "react";
import { ArrowDownUp, ArrowUpDown, MoreVertical } from "lucide-react";
import { Menu } from "@headlessui/react";
import { getCandidates } from "../../services/candidateService";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import { useRouter } from "next/navigation";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import DropdownActions from "@/components/DropdownActions";

interface Document {
  name: string;
  url: string;
}

// Define the Candidate interface
interface Candidate {
  id: number;
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
  date: string;
  gender: string;
  phone: string;
  address: string;
  avatar: string;
  documents: Document[];
  scores: InterviewRound[]; // Update with proper type if known
  video: string;
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
  Hired: "bg-purple-300 text-purple-700",
  Applied: "bg-blue-300 text-blue-700",
  Interviewing: "bg-yellow-300 text-yellow-700",
  Rejected: "bg-gray-300 text-gray-700",
};

const formatDate = (isoDate: string) => {
  const date = new Date(isoDate);
  return date.toLocaleDateString("en-GB"); // Converts to dd/mm/yyyy format
};

const RejectedCandidates = () => {
  const [search, setSearch] = useState("");
  const [candidates, setCandidates] = useState<TransformedCandidate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [sortField, setSortField] = useState<"name" | "date">("name");
  const itemsPerPage = 10;

  const router = useRouter();
  const candidateView = (candidateId: number) => {
    router.push(`/candidate?id=${candidateId}`);
  };

  useEffect(() => {
    fetchHiredCandidates();
  }, []);

  const fetchHiredCandidates = async () => {
    setIsLoading(true);
    try {
      const data: TransformedCandidate[] = await getCandidates();
      const hiredCandidates = data.filter((candidate): candidate is TransformedCandidate =>
        candidate.status === "Rejected"
      );

      const processedData: TransformedCandidate[] = hiredCandidates.map((candidate) => ({
        ...candidate,
        name: `${candidate.firstName} ${candidate.lastName}`,
        phone: candidate.phoneNumber,
        date: formatDate(candidate.createdAt),
      }));
      setCandidates(processedData);

      setCandidates(processedData);
    } catch (error) {
      console.error("Error fetching hired candidates:", error);
    } finally {
      setIsLoading(false);
    }
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
      <Breadcrumb pageName="Rejected Candidates" />
      <div className="rounded-lg border bg-white p-5 shadow-md w-full">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-4 space-y-2 md:space-y-0">
          {/* <h3 className="text-lg font-semibold text-black">Rejected Candidates</h3> */}
          <input
            type="text"
            placeholder="Search by name..."
            className="border px-3 py-2 rounded-lg text-black w-full md:w-1/3"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

          <>
            {/* {paginatedCandidates.length === 0 ? (
                <div className="flex justify-center items-center h-40">
                  <span className="text-gray-500 text-lg">No candidates found.</span>
                </div>
              ) : (
                <> */}
            <div className="overflow-x-auto w-full">
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
                    <th className="px-4 py-3 text-left">Email</th>
                    <th className="px-4 py-3 text-left">Phone</th>
                    {/* <th className="px-4 py-3 text-left">Date</th> */}
                    <th
                      className="px-4 py-3 text-left cursor-pointer select-none"
                      onClick={() => handleSortToggle("date")}
                    >
                      Date{" "}
                      {sortField === "date" ? (
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
                        <td className="px-4 py-3">{candidate.email}</td>
                        <td className="px-4 py-3">{candidate.phone}</td>
                        <td className="px-4 py-3">{candidate.date}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-3 py-1 rounded-full text-sm ${statusColors[candidate.status]
                              }`}
                          >
                            {candidate.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 relative">
                          <DropdownActions
                            trigger={({ onClick, ref }) => (
                              <button className="p-2 text-gray-600 hover:text-gray-900" onClick={onClick} ref={ref}>
                                <MoreVertical size={20} />
                              </button>
                            )}
                            items={({ close }) => (
                              <div className="py-1">
                                <button
                                  className="block w-full text-left px-4 py-2 hover:bg-gray-200"
                                  onClick={() => {
                                    candidateView(candidate.id);
                                    close();
                                  }}
                                >
                                  View Details
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
      </div>
    </DefaultLayout>
  );
};

export default RejectedCandidates;
