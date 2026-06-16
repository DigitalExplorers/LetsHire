"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import { FiMoreVertical } from "react-icons/fi"; // Three-dot menu icon
import { Menu } from "@headlessui/react"; // Dropdown menu
import React from "react";
import { toast } from "react-toastify";
import ConfirmAction from "@/components/ConfirmAction";
import * as XLSX from 'xlsx';
import Cookies from "js-cookie";
import { useSearchParams, useRouter } from "next/navigation";

const token = Cookies.get("token");
const adminId = Cookies.get("adminId");  //again we are not using it.
const ITEMS_PER_PAGE = 5; // Pagination limit

// Define the structure for question options
interface Option {
  id: number;
  text: string;
  isCorrect?: boolean;
}

// Define the structure for editing questions
interface EditedData {
  question: string;
  options: Option[];
  correctAnswer: string;
}

// Define the structure for each question
interface Question {
  id: number;
  question: string;
  options: Option[];
}

interface Role {
  id: number;
  name: string;
  quizzes?: Question[];
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? process.env.LOCALHOST_URL;

const QuestionTableView = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editedData, setEditedData] = useState<EditedData>({
    question: "",
    options: [] as Option[],
    correctAnswer: "",
  });
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isLoading, setLoading] = useState<boolean>(true);

  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<number|"">("");
  const [selectedRoleName, setSelectedRoleName] = useState<string | "">("");

  const searchParams = useSearchParams();
  const roleIdFromQuery = searchParams.get("roleId");
  const roleNameFromQuery = searchParams.get("roleName");

  const router = useRouter();

  useEffect(() => {
    if (roleIdFromQuery) {
      setSelectedRoleId(parseInt(roleIdFromQuery));
    }
    if (roleNameFromQuery) {
      setSelectedRoleName(roleNameFromQuery);
    }
  }, [roleIdFromQuery, roleNameFromQuery]);

  // Fetch questions when role changes
  useEffect(() => {
    if(selectedRoleId){
      fetchQuestions(selectedRoleId);
    };
  }, [selectedRoleId]);

  const fetchQuestions = async (roleId: number | "") => {
    setLoading(true);
    const url = `${API_URL}/roles/${roleId}/questions`

    try {
      const res = await fetch(url, {
        method: "GET",
        headers: { "Accept": "application/json", 'Authorization': `Bearer ${token}`},
        credentials: "include",
      });
      const data = await res.json();

      let questions: Question[] = [];

      if (Array.isArray(data)) {
        questions = data;
      } else if (data?.quizzes && Array.isArray(data.quizzes)) {
        questions = data.quizzes;
      } else {
        toast.error("Invalid question data format");
      }

      setQuestions(questions);
    } catch (error) {
      console.error("Failed to fetch questions:", error);
    } finally {
      setLoading(false);
    }
  };

  // Export handler
  const handleExport = () => {
    const exportData = questions.map((q) => ({
      Question: q.question,
      OptionA: q.options[0]?.text,
      OptionB: q.options[1]?.text,
      OptionC: q.options[2]?.text,
      OptionD: q.options[3]?.text,
      CorrectOption: q.options.find((opt) => opt.isCorrect)?.text || '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    // Get role name by ID
    // const selectedRoleName = roles.find((role) => role.id === selectedRoleId)?.name || "all";

    XLSX.utils.book_append_sheet(workbook, worksheet, "Questions");
    XLSX.writeFile(workbook, `questions-${selectedRoleName || 'all'}.xlsx`);
  };



  // Handle Edit Click
  const handleEdit = (q: Question) => {
    setEditingId(q.id);
    setEditedData({
      question: q.question,
      options: q.options.map((opt) => ({
        id: opt.id,
        text: opt.text,
        isCorrect: opt.isCorrect,
      })),
      correctAnswer: q.options.find((opt) => opt.isCorrect)?.id.toString() || "",
    });
  };

  const handleEditPopup = async (qes: Question) => {
    await ConfirmAction({
      action: async () => {
        handleEdit(qes);
      },
      title: "Edit Question",
      message: "Do you want to edit the question?",
      confirmText: "Yes, edit it!",
    });
  };

  // Handle Save after Editing
  const handleSave = async (id: number) => {
    try {
      const formattedOptions = editedData.options.map((opt) => ({
        id: opt.id,
        text: opt.text,
        isCorrect: opt.id.toString() === editedData.correctAnswer,
      }));

      const response = await fetch(`${API_URL}/quiz/questions/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", 'Authorization': `Bearer ${token}`},
        body: JSON.stringify({
          question: editedData.question,
          options: formattedOptions,
        }),
      });

      if (!response.ok) throw new Error("Failed to update question");

      setQuestions(
        questions.map((q) =>
          q.id === id ? { ...q, question: editedData.question, options: formattedOptions } : q
        )
      );
      setEditingId(null);
    } catch (error) {
      console.error("Error updating question:", error);
    }
  };

  const handleSavePopup = async (id: number) => {
    await ConfirmAction({
      action: async () => {
        handleSave(id);
      },
      title: "Save Question",
      message: "Do you want to save the question?",
      confirmText: "Yes, save it!",
    });
  };

  const handleDelete = async (id: number) => {
    await ConfirmAction({
      action: async () => {
        const response = await fetch(`${API_URL}/quiz/questions/${id}`, { method: "DELETE", headers: { "Content-Type": "application/json", 'Authorization': `Bearer ${token}`}, });
        if (!response.ok) {
          toast.error("Failed to delete question");
          throw new Error("Failed to delete question");
        }
        setQuestions(questions.filter((q) => q.id !== id));
      },
      title: "Delete Question",
      message: "You won't be able to revert this!",
      confirmText: "Yes, delete it!",
    });
  };


  // Pagination Logic
  const totalPages = Math.ceil(questions.length / ITEMS_PER_PAGE);
  const paginatedQuestions = questions.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <DefaultLayout>
      <Breadcrumb pageName="Questions & Options" />

      <div className="p-6 bg-white shadow-md rounded-lg dark:bg-boxdark">
        {/* <ToastContainer position="top-center" autoClose={3000} /> */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-baseline gap-4 mb-4">
          <div>
            <button onClick={() => router.back()} style={{ height: '47px' }} className="bg-gray-200 px-4 py-2 rounded-md text-sm hover:bg-gray-300 text-gray-800">← Back</button>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <h2 className="text-xl font-bold">{selectedRoleName}</h2>
            <button
              onClick={handleExport} style={{ height: '45px' }}
              className="bg-primary text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700"
            >
              Export
            </button>
            <div className="w-full sm:w-auto">
              <Link href={`/positions/add-question?roleId=${selectedRoleId}&roleName=${encodeURIComponent(selectedRoleName)}`}>
                <button style={{ height: '47px' }} className="w-full sm:w-auto bg-primary text-white px-4 py-2 rounded-md hover:bg-opacity-90 text-sm">
                  + Add Question
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="flex items-center justify-center min-h-[60vh] w-full">
            <div className="text-center">
              <div className="loader border-t-4 border-blue-500 border-solid rounded-full w-12 h-12 mx-auto animate-spin"></div>
              <p className="mt-2 text-gray-600">Loading...</p>
            </div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300 dark:border-strokedark">
                <thead>
                  <tr className="bg-gray-200 dark:bg-strokedark">
                    <th className="border p-2 text-left">No.</th>
                    <th className="border p-2 text-left">Question & Options</th>
                    <th className="border p-2 text-left">Correct Answer</th>
                    <th className="border p-2 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedQuestions.length > 0 ? (
                    paginatedQuestions.map((q, index) => (
                      <tr key={q.id} className="border">
                        <td style={{ verticalAlign: "top" }} className="border p-4 font-bold text-center">{index + 1 + (currentPage - 1) * ITEMS_PER_PAGE}</td>

                        <td className="border p-4">
                          {editingId === q.id ? (
                            <>
                              <input
                                type="text"
                                className="border p-2 w-full mb-2"
                                value={editedData.question}
                                onChange={(e) => setEditedData({ ...editedData, question: e.target.value })}
                              />
                              <ul className="list-disc pl-5 mt-2 text-gray-600 dark:text-gray-400">
                                {editedData.options.map((opt, idx) => (
                                  <li key={idx} className="flex justify-between">
                                    <input
                                      type="text"
                                      className="border p-2 w-full"
                                      value={opt.text}
                                      onChange={(e) => {
                                        const newOptions = [...editedData.options];
                                        newOptions[idx].text = e.target.value;
                                        setEditedData({ ...editedData, options: newOptions });
                                      }}
                                    />
                                  </li>
                                ))}
                              </ul>
                            </>
                          ) : (
                            <>
                              <p className="font-semibold">{q.question}</p>
                              <ul className="list-disc pl-5 mt-2 text-gray-600 dark:text-gray-400">
                                {q.options.map((opt, idx) => (
                                  <li key={idx}>{opt.text}</li>
                                ))}
                              </ul>
                            </>
                          )}
                        </td>

                        <td className="border p-4 font-bold text-green-600 dark:text-green-400">
                          {editingId === q.id ? (
                            <select
                              className="border p-2 w-full"
                              value={editedData.correctAnswer}
                              onChange={(e) => setEditedData({ ...editedData, correctAnswer: e.target.value })}
                            >
                              {editedData.options.map((opt) => (
                                <option key={opt.id} value={opt.id}>
                                  {opt.text}
                                </option>
                              ))}
                            </select>
                          ) : (
                            q.options.find((opt) => opt.isCorrect)?.text || "N/A"
                          )}
                        </td>

                        <td className="border p-4">
                          <Menu as={React.Fragment}>
                            <div className="relative inline-block text-left">
                              <Menu.Button className="p-2 hover:bg-gray-100 rounded-md dark:hover:bg-gray-700">
                                <FiMoreVertical size={20} />
                              </Menu.Button>
                              <Menu.Items className="absolute right-0 w-32 bg-white shadow-lg rounded-md p-2 dark:bg-boxdark">
                                {editingId === q.id ? (
                                  <Menu.Item>
                                    {({ active }: { active: boolean }) => (
                                      <button className={`w-full text-left p-2 ${active ? "bg-gray-100 dark:bg-gray-700" : ""}`} onClick={() => handleSavePopup(q.id)}>
                                        Save
                                      </button>
                                    )}
                                  </Menu.Item>
                                ) : (
                                  <>
                                    <Menu.Item>
                                      {({ active }: { active: boolean }) => (
                                        <button
                                          className={`w-full text-left p-2 ${active ? "bg-gray-100 dark:bg-gray-700" : ""}`}
                                          onClick={() => handleEdit(q)}
                                        >
                                          Edit
                                        </button>
                                      )}
                                    </Menu.Item>
                                    <Menu.Item>
                                      {({ active }: { active: boolean }) => (
                                        <button
                                          className={`w-full text-left p-2 text-red-500 ${active ? "bg-gray-100 dark:bg-gray-700" : ""}`}
                                          onClick={() => handleDelete(q.id)}
                                        >
                                          Delete
                                        </button>
                                      )}
                                    </Menu.Item>
                                  </>
                                )}
                              </Menu.Items>
                            </div>
                          </Menu>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="border p-4 text-center text-gray-500">No questions found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {/* Pagination Controls */}
            <div className="flex justify-between items-center mt-4">
              <button onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="px-3 py-1 border rounded-md">Prev</button>
              <span>Page {currentPage} of {totalPages}</span>
              <button onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="px-3 py-1 border rounded-md">Next</button>
            </div>
          </>
        )}
      </div>
    </DefaultLayout>
  );
};

export default QuestionTableView;
