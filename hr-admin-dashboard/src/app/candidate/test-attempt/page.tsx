"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";

interface Attempt {
  question: string;
  selectedOption: string | null;
  correctOption: string;
  isCorrect: boolean;
  skipped?: boolean;
  unattempted?: boolean;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const CandidateAttemptsPage = () => {
  const searchParams = useSearchParams();
  const candidateId = searchParams.get("id");    //my concern can we change this to body? instead of query ? 
  const round = searchParams.get("round");
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAttempts = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(`${API_URL}/quiz/candidates/${candidateId}/${round}/attempts`);
        const data = await res.json();
        setAttempts(data);
      } catch (err) {
        console.error("Failed to load attempts", err);
      } finally {
        setIsLoading(false);
      }
    };
    if (candidateId) fetchAttempts();
  }, [candidateId, round]);

  const getStatusLabel = (item: Attempt) => {
    const hasNewStatus = item.unattempted !== undefined || item.skipped !== undefined;

    if (hasNewStatus) {
      if (item.unattempted) {
        return <span className="text-yellow-500 font-semibold">Untouched</span>;
      }
      if (item.skipped) {
        return <span className="text-yellow-600 font-semibold">Skipped</span>;
      }
    }

    if (item.isCorrect) {
      return <span className="text-green-600 font-semibold">Correct</span>;
    }
    return <span className="text-red-500 font-semibold">Wrong</span>;
  };

  return (
    <DefaultLayout isLoading={isLoading}>
      <Breadcrumb pageName="Quiz Attempt" />
      <div className="mb-4">
        <button
          onClick={() => window.history.back()}
          className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md text-sm"
        >
          ← Back
        </button>
      </div>
      <div className="w-full bg-white p-6 rounded-lg shadow">
        <h2 className="text-2xl font-semibold mb-6 text-center text-gray-800">
          Candidate Quiz Attempt Summary
        </h2>

        {isLoading ? (
          <p className="text-center text-gray-500">Loading...</p>
        ) : attempts.length === 0 ? (
          <p className="text-center text-gray-500">No attempts found for this candidate.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border border-gray-200 text-sm">
              <thead className="bg-gray-50 text-gray-700">
                <tr>
                  <th className="p-3 border">#</th>
                  <th className="p-3 border text-left">Question</th>
                  <th className="p-3 border text-left">Your Answer</th>
                  <th className="p-3 border text-left">Correct Answer</th>
                  <th className="p-3 border text-center">Result</th>
                </tr>
              </thead>
              <tbody>
                {attempts.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50 transition duration-150">
                    <td className="p-3 border text-center">{index + 1}</td>
                    <td className="p-3 border text-left">{item.question}</td>
                    <td className="p-3 border text-left">
                      {item.unattempted || item.skipped ? (
                        <span className="text-yellow-600 font-semibold">-</span>
                      ) : item.selectedOption ? (
                        item.selectedOption
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="p-3 border text-left">{item.correctOption}</td>
                    <td className="p-3 border text-center">{getStatusLabel(item)}</td>
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

export default CandidateAttemptsPage;
