"use client";

import { useEffect, useState } from "react";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { useAuth } from "@/hooks/AuthContext";
import apiClient from "@/app/services/apiClient";

interface AssignedCandidate {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  desiredRole: string;
  status: string;
  interviewScheduledAt?: string | null;
  countryCode?: string;
  phoneNumber?: string;
}

const formatDateTime = (isoDate?: string | null) => {
  if (!isoDate) return "Not Scheduled";
  const date = new Date(isoDate);
  return (
    date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) +
    " " +
    date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
  );
};

const statusColors: Record<string, string> = {
  Applied: "bg-blue-100 text-blue-700",
  Screening: "bg-yellow-100 text-yellow-700",
  Shortlisted: "bg-green-100 text-green-700",
  "Interview Scheduled": "bg-indigo-100 text-indigo-700",
  "Interview Completed": "bg-cyan-100 text-cyan-700",
  InProgress: "bg-orange-100 text-orange-700",
  "Feedback Pending": "bg-red-100 text-red-700",
  Rejected: "bg-gray-100 text-gray-600",
  Hired: "bg-purple-100 text-purple-700",
};

const AssignedInterviews = () => {
  const { user } = useAuth();
  const [candidates, setCandidates] = useState<AssignedCandidate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!user?.id) return;
    const fetchAssigned = async () => {
      setIsLoading(true);
      try {
        // GET /interviews/interviewer/:id/candidates
        const response = await apiClient.get(`/interviews/interviewer/${user.id}/candidates`);
        setCandidates(response.data);
      } catch (err: any) {
        console.error("Error fetching assigned candidates:", err);
        setError("Failed to load assigned interviews. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchAssigned();
  }, [user?.id]);

  const filtered = candidates.filter((c) =>
    `${c.firstName} ${c.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DefaultLayout isLoading={isLoading}>
      <Breadcrumb pageName="Assigned Interviews" />

      <div className="rounded-lg border bg-white p-5 shadow-md w-full">
        {/* Search */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search by name or email..."
            className="border px-3 py-2 rounded-lg text-black w-full md:w-1/3"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-md text-sm">
            {error}
          </div>
        )}

        {!isLoading && filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <svg className="w-16 h-16 mb-4 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-lg font-medium">No assigned interviews yet</p>
            <p className="text-sm mt-1">Candidates assigned to you will appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full min-w-max table-auto border-collapse border border-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left">Candidate</th>
                  <th className="px-4 py-3 text-left">Email</th>
                  <th className="px-4 py-3 text-left">Role Applied</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Interview Date</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((candidate) => (
                  <tr key={candidate.id} className="border-t hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-800">
                      {candidate.firstName} {candidate.lastName}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{candidate.email}</td>
                    <td className="px-4 py-3 text-gray-600">{candidate.desiredRole || "—"}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                          statusColors[candidate.status] ?? "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {candidate.status === "InProgress" ? "In Progress" : candidate.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {formatDateTime(candidate.interviewScheduledAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DefaultLayout>
  );
};

export default AssignedInterviews;
