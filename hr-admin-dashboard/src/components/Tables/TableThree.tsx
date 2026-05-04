"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowDownUp, ArrowUpDown, MoreVertical } from "lucide-react";
import { Menu } from "@headlessui/react";
import { utils, writeFile } from "xlsx";
import Link from "next/link";
import { getCandidates, deleteCandidate, updateCandidateStatus } from "../../app/services/candidateService";
import React from "react";
import { useRouter } from "next/navigation";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "sweetalert2/dist/sweetalert2.min.css";
import ConfirmAction from "../ConfirmAction";
import DropdownActions from "../DropdownActions";

const statusColors: Record<string, string> = {
  Applied: "bg-blue-300 text-blue-700",
  Shortlisted: "bg-green-300 text-green-700",
  Rejected: "bg-gray-300 text-gray-700",
  Hired: "bg-purple-300 text-purple-700",
  "Interview Completed": "bg-cyan-300 text-cyan-700",
  "Interview Scheduled": "bg-indigo-300 text-indigo-700"
};


interface Candidate {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  countryCode: string;
  phoneNumber: string;
  role?: { name: string };
  createdAt: string;
  status?: string;
  [key: string]: any;  // Index signature for additional fields
}

interface ProcessedCandidate extends Candidate {
  name: string;
  phone: string;
  date: string;
  status: string;
  passPercentage?: number;
}


const formatDate = (isoDate: string) => {
  const date = new Date(isoDate);

  // Convert to IST manually
  const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30 in ms
  const istDate = new Date(date.getTime() + istOffset);

  return istDate.toLocaleString("en-GB", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

// Function to format input date (yyyy-mm-dd) to dd/mm/yyyy
const formatInputDate = (inputDate: any) => {
  const parts = inputDate.split("-");
  return `${parts[2]}/${parts[1]}/${parts[0]}`; // Convert yyyy-mm-dd to dd/mm/yyyy
};

const TableThree = () => {
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [scoreFilter, setScoreFilter] = useState("");
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [candidates, setCandidates] = useState<ProcessedCandidate[]>([]);
  const [filteredData, setFilteredData] = useState<ProcessedCandidate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; // Set the number of candidates per page

  // Define menuRefs as an array of div elements or null
  const menuRefs = useRef<(HTMLDivElement | null)[]>([]);
  const allowedFields = ["name", "score", "date", "passPercentage"] as const;
  type SortField = typeof allowedFields[number];
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [passPercentageFilter, setPassPercentageFilter] = useState("");

  const router = useRouter();
  const candidateView = (candidateId: number) => {
    router.push(`/candidate?id=${candidateId}`); // Navigate to new page
  };

  const fetchCandidates = async () => {
    setIsLoading(true);  // Set loading to true before fetching data
    try {
      const data = await getCandidates();
      console.log("candidate data", data);

      // Filter candidates to show only "Applied"
      const filteredCandidates = data.filter((candidate: any) => candidate.status === "Applied");

      const processedData = filteredCandidates.map((candidate: any) => ({
        ...candidate,
        name: `${candidate.firstName} ${candidate.lastName}`,
        phone: `${candidate.countryCode} ${candidate.phoneNumber}`,
        date: formatDate(candidate.createdAt),
        status: candidate.status || "Applied",
        passPercentage: candidate.passPercentage || 0,
      }));
      setCandidates(processedData);
      setFilteredData(processedData);
    } catch (error) {
      console.error("Error fetching candidates:", error);
    } finally {
      setIsLoading(false); // Set loading to false after fetching
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowExportOptions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    let filtered = candidates;
    if (search) {
      filtered = filtered.filter((candidate) => {
        const nameMatch = candidate.name.toLowerCase().includes(search.toLowerCase());
        const roleMatch = candidate.role?.name?.toLowerCase().includes(search.toLowerCase());
        return nameMatch || roleMatch;
      });
    }
    if (dateFilter) {
      const selectedDate = new Date(dateFilter);
      filtered = filtered.filter((candidate) => {
        const candidateDate = new Date(candidate.createdAt);
        
        return (
          candidateDate.getFullYear() === selectedDate.getFullYear() &&
          candidateDate.getMonth() === selectedDate.getMonth() &&
          candidateDate.getDate() === selectedDate.getDate()
        );
      });
    }
    if (scoreFilter) {
      filtered = filtered.filter((candidate) => candidate.score >= parseInt(scoreFilter));
    }
    if (passPercentageFilter) {
      filtered = filtered.filter(
        (candidate) => (candidate.passPercentage ?? 0) >= parseFloat(passPercentageFilter)
      );
    }
    setFilteredData(filtered);
    setCurrentPage(1); // Reset to first page after filtering
  }, [search, dateFilter, scoreFilter, passPercentageFilter,candidates]);


  const handleDeleteCandidate = async (id: number) => {
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

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field as SortField);
      setSortOrder("asc");
    }
  };

  const sortedFilteredData = [...filteredData].sort((a, b) => {

    if (sortField === "score") {
      return sortOrder === "asc"
        ? (a.score ?? 0) - (b.score ?? 0)
        : (b.score ?? 0) - (a.score ?? 0);
    }
    if (sortField === "date") {
      return sortOrder === "asc"
        ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    if (sortField === "passPercentage") {
      return sortOrder === "asc"
        ? (a.passPercentage ?? 0) - (b.passPercentage ?? 0)
        : (b.passPercentage ?? 0) - (a.passPercentage ?? 0);
    }
    const valA = a[sortField]?.toString().toLowerCase?.() ?? "";
    const valB = b[sortField]?.toString().toLowerCase?.() ?? "";
    return sortOrder === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
  });

  // Pagination Logic
  const totalCandidates = sortedFilteredData.length;
  const totalPages = Math.ceil(totalCandidates / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(currentPage * itemsPerPage, totalCandidates);
  const paginatedCandidates = sortedFilteredData.slice(startIndex - 1, endIndex);

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

  const exportData = (format: any) => {
    const exportableData = filteredData.map(c => ({
      Name: c.name,
      Email: c.email,
      Phone: c.phone,
      Role: c.role?.name || "N/A",
      Score: c.score,
      Pass: c.passPercentage ?? "N/A",
      Date: c.date,
      Status: c.status
    }));

    if (format === "xlsx") {
      const ws = utils.json_to_sheet(exportableData);
      const wb = utils.book_new();
      utils.book_append_sheet(wb, ws, "Candidates");
      writeFile(wb, "candidates.xlsx");
    } else if (format === "csv") {
      const csvContent = [
        ["Name", "Email", "Phone", "Position", "Score", "Pass %", "Date", "Status"], // Header row
        ...exportableData.map(c => [c.Name, c.Email, c.Phone, c.Role, c.Score, c.Pass, c.Date, c.Status.replace("InProgress", "In Progress")])
      ].map(e => e.join(",")).join("\n");

      const blob = new Blob([csvContent], { type: "text/csv" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "candidates.csv";
      link.click();
    }
    setShowExportOptions(false);
  };


  const handleRejectCandidate = async (id: number, newStatus: string) => {
    await ConfirmAction({
      action: async () => {
        setIsLoading(true);
        await updateCandidateStatus(String(id), newStatus);
        fetchCandidates();
      },
      title: `Change status to ${newStatus}`,
      message: `Are you sure you want to mark this candidate as ${newStatus}?`,
      confirmText: `Yes, mark as ${newStatus}`,
      confirmColor: "#d33",
    });
  };

  const handleShortlistCandidate = async (id: number, newStatus: string) => {
    await ConfirmAction({
      action: async () => {
        setIsLoading(true);
        await updateCandidateStatus(String(id), newStatus);
        fetchCandidates();
      },
      title: `Change status to ${newStatus}`,
      message: `Are you sure you want to mark this candidate as ${newStatus}?`,
      confirmText: `Yes, mark as ${newStatus}`,
      confirmColor: "#28a745",
    });
  };

  return (
    <div className="rounded-lg border bg-white p-5 shadow-md w-full">
      {/* Top Filters & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3 flex-wrap">
        {/* Left Side Inputs */}
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            placeholder="Search by name or position"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border p-2 rounded-md w-full sm:w-[100px] lg:w-[250px]"
          />

          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="border p-2 rounded-md w-full sm:w-[160px]"
          />

          <input
            type="number"
            placeholder="Min Score"
            value={scoreFilter}
            onChange={(e) => setScoreFilter(e.target.value)}
            className="border p-2 rounded-md w-full sm:w-[120px] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
          <input
            type="number"
            placeholder="Min %"
            value={passPercentageFilter}
            onChange={(e) => setPassPercentageFilter(e.target.value)}
            className="border p-2 rounded-md w-full sm:w-[100px] [&::-webkit-inner-spin-button]:appearance-none"
          />
        </div>

        {/* Right Side Export Button */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowExportOptions(!showExportOptions)}
            className="bg-blue-500 text-white px-4 py-2 rounded-md"
          >
            Export
          </button>
          {showExportOptions && (
            <div className="absolute mt-1 w-32 bg-white shadow-md rounded-md z-10 right-0">
              <button
                onClick={() => exportData("xlsx")}
                className="block w-full text-left px-4 py-2 hover:bg-gray-200"
              >
                Export Excel
              </button>
              <button
                onClick={() => exportData("csv")}
                className="block w-full text-left px-4 py-2 hover:bg-gray-200"
              >
                Export CSV
              </button>
            </div>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center min-h-[60vh] w-full">
          <div className="text-center">
            <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent mx-auto"></div>
            <p className="mt-3 text-gray-600">Loading...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Table */}
          <div className="overflow-x-auto w-full">
            <table className="w-full min-w-max table-auto border-collapse border border-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  {/* <th className="px-4 py-3 text-left">Name</th> */}
                  <th
                    className="px-4 py-3 text-left cursor-pointer select-none"
                    onClick={() => handleSort("name")}
                  >
                    Name {sortField === "name" && sortOrder === "asc" ? <ArrowUpDown className="inline ml-1" size={14} /> : sortField === "name" && sortOrder === "desc" ? <ArrowDownUp className="inline ml-1" size={14} /> : <ArrowUpDown className="inline ml-1 text-gray-400" size={14} />}
                  </th>
                  <th className="px-4 py-3 text-left">Email</th>
                  <th className="px-4 py-3 text-left">Phone</th>
                  <th className="px-4 py-3 text-left">Position</th>
                  {/* <th className="px-4 py-3 text-left">Score</th> */}
                  <th
                    className="px-4 py-3 text-left cursor-pointer select-none"
                    onClick={() => handleSort("score")}
                  >
                    Score {sortField === "score" && sortOrder === "asc" ? <ArrowUpDown className="inline ml-1" size={14} /> : sortField === "score" && sortOrder === "desc" ? <ArrowDownUp className="inline ml-1" size={14} /> : <ArrowUpDown className="inline ml-1 text-gray-400" size={14} />}
                  </th>
                  {/* <th className="px-4 py-3 text-left">Pass %</th> */}
                  <th
                    className="px-4 py-3 text-left cursor-pointer select-none"
                    onClick={() => handleSort("passPercentage")}
                  >
                    Pass %{" "}
                    {sortField === "passPercentage" && sortOrder === "asc" ? (
                      <ArrowUpDown className="inline ml-1" size={14} />
                    ) : sortField === "passPercentage" && sortOrder === "desc" ? (
                      <ArrowDownUp className="inline ml-1" size={14} />
                    ) : (
                      <ArrowUpDown className="inline ml-1 text-gray-400" size={14} />
                    )}
                  </th>

                  {/* <th className="px-4 py-3 text-left">Date</th> */}
                  <th
                    className="px-4 py-3 text-left cursor-pointer select-none"
                    onClick={() => handleSort("date")}
                  >
                    Date {sortField === "date" && sortOrder === "asc" ? <ArrowUpDown className="inline ml-1" size={14} /> : sortField === "date" && sortOrder === "desc" ? <ArrowDownUp className="inline ml-1" size={14} /> : <ArrowUpDown className="inline ml-1 text-gray-400" size={14} />}
                  </th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedCandidates.length > 0 ? (
                  paginatedCandidates.map((candidate, index) => (
                    <tr key={index} className="border-t"
                    // onClick={() => fetchAssignedCandidates(candidate.id)}
                    >
                      <td className="px-4 py-3 whitespace-nowrap cursor-pointer" onClick={() => candidateView(candidate.id)}>{candidate.name}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{candidate.email}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{candidate.phone}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{candidate.role?.name || "N/A"}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{candidate.score}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{candidate.passPercentage ?? "N/A"}%</td>
                      <td className="px-4 py-3 whitespace-nowrap">{candidate.date}</td>
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
                            <button className="p-2" onClick={onClick} ref={ref}>
                              <MoreVertical size={18} />
                            </button>
                          )}
                          items={({ close }) => (
                            <div className="py-1">
                              <Link
                                href={{ pathname: "/candidate", query: { id: candidate.id } }}
                                onClick={close}
                                className="block w-full px-4 py-2 text-left hover:bg-gray-200"
                              >
                                View Details
                              </Link>

                              <button
                                onClick={() => {
                                  handleRejectCandidate(candidate.id, "Rejected");
                                  close();
                                }}
                                className="block w-full px-4 py-2 text-left hover:bg-gray-200"
                              >
                                Rejected
                              </button>

                              <button
                                onClick={() => {
                                  handleShortlistCandidate(candidate.id, "Shortlisted");
                                  close();
                                }}
                                className="block w-full px-4 py-2 text-left hover:bg-gray-200"
                              >
                                Shortlisted
                              </button>

                              <button
                                onClick={() => {
                                  handleDeleteCandidate(candidate.id);
                                  close();
                                }}
                                className="block w-full px-4 py-2 text-left hover:bg-gray-200 text-red-500"
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="border p-4 text-center text-gray-500">No candidates found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {/* Pagination */}
          <div className="flex justify-between items-center mt-4">
            <span className="text-sm">Showing {startIndex}-{endIndex} of {totalCandidates}</span>
            <div className="flex space-x-2">
              <button onClick={handlePreviousPage} disabled={currentPage === 1} className="px-3 py-1 border rounded-md">
                Prev
              </button>
              <button onClick={handleNextPage} disabled={currentPage === totalPages} className="px-3 py-1 border rounded-md">
                Next
              </button>
            </div>
          </div>
        </>
      )
      }
    </div>

  );
};

export default TableThree;
