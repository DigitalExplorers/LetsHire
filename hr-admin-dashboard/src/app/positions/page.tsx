"use client";

import React, { useEffect, useState } from "react";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import Link from "next/link";
import { ArrowDownUp, ArrowUpDown, MoreVertical } from "lucide-react";
import DropdownActions from "@/components/DropdownActions";
import ConfirmAction from "@/components/ConfirmAction";
import { toast } from "react-toastify";
import DescriptionPreview from "@/components/DescriptionPreview";
import { useRightPanel } from "@/contexts/RightPanelContext";
import dynamic from "next/dynamic";
import UploadRoleQuestionsPanel from "@/components/Panels/UploadRoleQuestionsPanel";
import QuizSettingPanel from "@/components/Panels/QuizSettingPanel";
import AddPositionPanel from "@/components/Panels/AddPositionPanel";
import EditPositionPanel from "@/components/Panels/EditPositionPanel";
import Cookies from "js-cookie";

const RegistrationLinkPanel = dynamic(() => import("@/components/Panels/RegistrationLinkPanel"));

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? process.env.LOCALHOST_URL;

interface Position {
  id: number;
  name: string;
  description?: string;
  experienceRequired?: number;
  createdAt: string;
}

const formatDate = (isoDate: string) => {
  const date = new Date(isoDate);
  return date.toLocaleDateString("en-GB");
};

const PositionsTableView = () => {
  const [positions, setPositions] = useState<Position[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [sortField, setSortField] = useState<"name" | "date">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [loadingMessage, setloadingMessage] = useState("Loading...");

  const { openPanel } = useRightPanel();
  const itemsPerPage = 10;

  useEffect(() => {
    fetchPositions();
  }, []);

  const fetchPositions = async () => {
    try {
      setIsLoading(true);
      const token = Cookies.get("token");
      const res = await fetch(`${API_URL}/roles`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        console.error("Failed to fetch positions:", res.status, res.statusText);
        return;
      }

      const data = await res.json();
      const transformed = data.map((p: any) => ({
        id: p.id,
        name: p.name,
        description: p.description || "N/A",
        experienceRequired: p.experienceRequired ?? "N/A",
        createdAt: formatDate(p.createdAt || new Date().toISOString()),
      }));
      setPositions(transformed);
    } catch (err) {
      console.error("Error fetching positions", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number, close: () => void) => {
    close();
    try {
      await ConfirmAction({
        action: async () => {
          const res = await fetch(`${API_URL}/roles/${id}`, {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${Cookies.get("token")}`,
            },
          });

          if (!res.ok) {
            let message = "Failed to delete position.";

            try {
              const errorData = await res.json();
              message =
                (Array.isArray(errorData?.message)
                  ? errorData.message.join(", ")
                  : errorData?.message) || message;
            } catch {
              message = `${message} (${res.status} ${res.statusText})`;
            }

            throw new Error(message);
          }

          await fetchPositions();
        },
        title: "Delete position",
        message: "Are you sure you want to delete this, You won't be able to revert this!",
        confirmText: "Yes, delete it",
        successMessage: "Position deleted successfully!",
        errorActionLabel: "delete position",
      });
    } catch (err) {
      console.error("Failed to delete position", err);
    }
  };

  const handleSortToggle = (field: "name" | "date") => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const filtered = positions.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const sorted = [...filtered].sort((a, b) => {
    if (sortField === "name") {
      return sortOrder === "asc"
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name);
    } else {
      const aDate = new Date(a.createdAt).getTime();
      const bDate = new Date(b.createdAt).getTime();
      return sortOrder === "asc" ? aDate - bDate : bDate - aDate;
    }
  });

  const total = sorted.length;
  const totalPages = Math.ceil(total / itemsPerPage);
  const paginated = sorted.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleGenerateMore = async (roleId: number, close: () => void) => {
    close();
    setIsLoading(true);
    setloadingMessage("Generating questions");
    try {
      const res = await fetch(`${API_URL}/generate-questions/generate-more-questions/${roleId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${Cookies.get("token")}`,
        },
      });

      const data = await res.json();
      if (data.success) {
        toast.success(`${data.message}`);
      } else {
        toast.error(`${data.message || "Failed to generate questions"}`);
      }
    } catch (error) {
      console.error("Error generating more questions", error);
      toast.error("Something went wrong while generating questions.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerate = async (roleId: number, close: () => void) => {
    close();
    setIsLoading(true);
    setloadingMessage("Re-generating questions");
    try {
      await ConfirmAction({
        action: async () => {
          await fetch(`${API_URL}/generate-questions/regenerate-questions/${roleId}`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${Cookies.get("token")}`,
            },
            body: JSON.stringify({ numQuestions: 50 }),
          });
        },
        title: "Re-generate Questions",
        message: "This will delete all current questions for this position and create new ones.",
        confirmText: "Yes, regenerate",
      });
    } catch (error) {
      console.error("Error regenerating questions", error);
      toast.error("Something went wrong while regenerating questions.");
    } finally {
      setIsLoading(false);
    }
  };



  return (
    <DefaultLayout isLoading={isLoading} loadingMessage={loadingMessage}>
      <Breadcrumb pageName="Position Management" />
      <div className="rounded-lg border bg-white p-5 shadow-md w-full">
        <div className="flex justify-between flex-col md:flex-row items-center mb-4 gap-2">
          <input
            type="text"
            placeholder="Search by name..."
            className="border px-3 py-2 rounded-lg text-black w-full md:w-1/3"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {/* <Link href="/positions/add-position">
            <button className="bg-primary text-white hover:bg-primary/90 px-4 py-2 rounded">
              + Add Position
            </button>
          </Link> */}
          <button
            className="bg-primary text-white hover:bg-primary/90 px-4 py-2 rounded"
            onClick={() =>
              openPanel("Position", <AddPositionPanel onSuccess={fetchPositions} />)
            }
          >
            + Add Position
          </button>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="w-full min-w-max table-auto border-collapse border border-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3 text-left cursor-pointer" onClick={() => handleSortToggle("name")}>Name {sortField === "name" ? (sortOrder === "asc" ? <ArrowUpDown className="inline ml-1" size={14} /> : <ArrowDownUp className="inline ml-1" size={14} />) : (<ArrowUpDown className="inline ml-1 text-gray-400" size={14} />)}</th>
                <th className="px-4 py-3 text-left">Description</th>
                <th className="px-4 py-3 text-left">Experience</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length > 0 ? (
                paginated.map((pos) => (
                  <tr key={pos.id} className="border-t">
                    <td className="px-4 py-3">{pos.name}</td>
                    <td className="px-4 py-3 max-w-xs">
                      <DescriptionPreview text={pos.description} />
                    </td>
                    <td className="px-4 py-3">{pos.experienceRequired}</td>
                    <td className="px-4 py-3">
                      <DropdownActions
                        trigger={({ onClick, ref }) => (
                          <button
                            onClick={onClick}
                            ref={ref}
                            className="p-2 text-gray-600 hover:text-gray-900"
                          >
                            <MoreVertical size={20} />
                          </button>
                        )}
                        items={({ close }) => (
                          <>
                            <Link
                              href={`/positions/question-view?roleId=${pos.id}&roleName=${encodeURIComponent(pos.name)}`}
                              className="block px-4 py-2 w-full text-left hover:bg-gray-100"
                              onClick={close}
                            >
                              View Questions
                            </Link>

                            <button
                              onClick={() => handleGenerateMore(pos.id, close)}
                              className="block px-4 py-2 w-full text-left hover:bg-gray-100"
                            >
                              Generate Questions
                            </button>

                            <button
                              onClick={() => handleRegenerate(pos.id, close)}
                              className="block px-4 py-2 w-full text-left text-orange-600 hover:bg-gray-100"
                            >
                              Re-generate Questions
                            </button>

                            {/* <Link
                              href={`/positions/upload-role-question?roleId=${pos.id}&roleName=${encodeURIComponent(pos.name)}`}
                              className="block px-4 py-2 w-full text-left hover:bg-gray-100"
                              onClick={close}
                            >
                              Upload Questions
                            </Link> */}
                            <button
                              onClick={() => {
                                close();
                                openPanel("Upload Questions", (
                                  <UploadRoleQuestionsPanel roleId={String(pos.id)} roleName={pos.name} />
                                ))
                              }
                              }
                              className="block px-4 py-2 w-full text-left hover:bg-gray-100"
                            >
                              Upload Questions
                            </button>

                            <Link
                              href={`/generate-url/all-urls?roleId=${pos.id}&roleName=${encodeURIComponent(pos.name)}`}
                              className="block px-4 py-2 w-full text-left hover:bg-gray-100"
                              onClick={close}
                            >
                              View URLs
                            </Link>
                            {/* <Link
                                  href={`/generate-url?roleId=${pos.id}&roleName=${encodeURIComponent(pos.name)}`}
                                  className="block px-4 py-2 w-full text-left hover:bg-gray-100"
                                  onClick={close}
                                >
                                  Generate URLs
                                </Link> */}
                            <button
                              onClick={() => {
                                close();
                                openPanel(
                                  "Generate Registration URL",
                                  <RegistrationLinkPanel roleId={pos.id.toString()} roleName={pos.name} />
                                );
                              }}
                              className="block px-4 py-2 w-full text-left hover:bg-gray-100"
                            >
                              Generate URL
                            </button>
                            {/* <Link
                              href={`/positions/questions-configure?roleId=${pos.id}&roleName=${encodeURIComponent(pos.name)}`}
                              className="block px-4 py-2 w-full text-left hover:bg-gray-100"
                              onClick={close}
                            >
                              Quiz Setting
                            </Link> */}
                            <button
                              onClick={() => {
                                openPanel("Settings", <QuizSettingPanel roleId={pos.id} roleName={pos.name} />);
                                close();
                              }}
                              className="block px-4 py-2 w-full text-left hover:bg-gray-100"
                            >
                              Quiz Setting
                            </button>
                            <button
                              onClick={() => handleDelete(pos.id, close)}
                              className="block px-4 py-2 w-full text-left text-red-600 hover:bg-gray-100"
                            >
                              Delete Position
                            </button>
                            {/* <Link
                              href={`/positions/edit-position?id=${pos.id}`}
                              className="block px-4 py-2 w-full text-left hover:bg-gray-100"
                              onClick={close}
                            >
                              Edit Position
                            </Link> */}
                            <button
                              onClick={() => {
                                close();
                                openPanel("Position", <EditPositionPanel roleId={pos.id} onSuccess={fetchPositions} />);
                              }}
                              className="block px-4 py-2 w-full text-left hover:bg-gray-100"
                            >
                              Edit Position
                            </button>
                          </>
                        )}
                      />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="border p-4 text-center text-gray-500">
                    No positions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex justify-between items-center mt-4">
          <span className="text-sm">
            Showing {(currentPage - 1) * itemsPerPage + 1}-
            {Math.min(currentPage * itemsPerPage, total)} of {total}
          </span>
          <div className="flex gap-2">
            <button disabled={currentPage === 1} onClick={() => setCurrentPage((prev) => prev - 1)} className={`px-3 py-1 border rounded-md ${currentPage === 1 ? "opacity-50 cursor-not-allowed" : ""}`}>Prev</button>
            <button disabled={currentPage === totalPages} onClick={() => setCurrentPage((prev) => prev + 1)} className={`px-3 py-1 border rounded-md ${currentPage === totalPages ? "opacity-50 cursor-not-allowed" : ""}`}>Next</button>
          </div>
        </div>
      </div>
    </DefaultLayout>
  );
};

export default PositionsTableView;
