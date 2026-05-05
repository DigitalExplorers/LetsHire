"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import { getCandidatesByInterviewer } from "../../services/interviewerService";
import { ArrowDownUp, ArrowUpDown } from "lucide-react";

// Define Candidate Type
interface Candidate {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  countryCode: string;
  phoneNumber: string;
  status?: string;
}

const AssignedCandidates = () => {
  const searchParams = useSearchParams();
  const interviewerId = searchParams.get("interviewerId");
  const router = useRouter();

  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const showCandidateDetails = (candidateId: number) => {
    router.push(`/candidate?id=${candidateId}`);
  };

  useEffect(() => {
    if (!interviewerId) return;

    setIsLoading(true);
    getCandidatesByInterviewer(parseInt(interviewerId))
      .then((data: Candidate[]) => setCandidates(data))
      .catch((err) => console.error("Error fetching candidates:", err))
      .finally(() => setIsLoading(false));
  }, [interviewerId]);

  const sortedCandidates = [...candidates].sort((a, b) => {
    const nameA = `${a.firstName} ${a.lastName}`.toLowerCase();
    const nameB = `${b.firstName} ${b.lastName}`.toLowerCase();
    return sortOrder === "asc" ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
  });

  return (
    <DefaultLayout>
      <div className="rounded-lg border bg-white p-5 shadow-md w-full">
        <h3 className="text-lg font-semibold text-black">Assigned Candidates</h3>

        <button
          className="bg-gray-500 text-white px-4 py-2 rounded-lg mt-2 hover:bg-opacity-90"
          onClick={() => router.back()}
        >
          ← Back
        </button>

        {isLoading ? (
          <div className="flex items-center justify-center min-h-[60vh] w-full">
            <div className="text-center">
              <div className="loader border-t-4 border-blue-500 border-solid rounded-full w-12 h-12 mx-auto animate-spin"></div>
              <p className="mt-2 text-gray-600">Loading...</p>
            </div>
          </div>
        ) : sortedCandidates.length === 0 ? (
          <div className="flex justify-center items-center h-40">
            <span className="text-gray-500 text-lg">No candidates assigned.</span>
          </div>
        ) : (
          <div className="overflow-x-auto w-full mt-4">
            <table className="w-full min-w-max table-auto border-collapse border border-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th
                    className="px-4 py-3 text-left cursor-pointer select-none"
                    onClick={() => setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))}
                  >
                    Name{" "}
                    {sortOrder === "asc" ? (
                      <ArrowUpDown size={14} className="inline ml-1" />
                    ) : (
                      <ArrowDownUp size={14} className="inline ml-1" />
                    )}
                  </th>
                  <th className="px-4 py-3 text-left">Email</th>
                  <th className="px-4 py-3 text-left">Phone</th>
                  <th className="px-4 py-3 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {sortedCandidates.map((candidate) => (
                  <tr
                    key={candidate.id}
                    className="border-t cursor-pointer hover:bg-gray-100"
                    onClick={() => showCandidateDetails(candidate.id)}
                  >
                    <td className="px-4 py-3 whitespace-nowrap">
                      {candidate.firstName} {candidate.lastName}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">{candidate.email}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {candidate.countryCode} {candidate.phoneNumber}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">{candidate.status || "Pending"}</td>
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

export default AssignedCandidates;
