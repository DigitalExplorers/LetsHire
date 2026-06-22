"use client";

import React, { useEffect, useState } from "react";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import Link from "next/link";
import { ArrowDownUp, ArrowUpDown, MoreVertical } from "lucide-react";
import DropdownActions from "@/components/DropdownActions";
import ConfirmAction from "@/components/ConfirmAction";
import Cookies from "js-cookie";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? process.env.LOCALHOST_URL;

interface AdminUser {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  organization?: {
    name: string;
  };
}

const formatDate = (isoDate: string) => {
  const date = new Date(isoDate);
  return date.toLocaleDateString("en-GB");
};

const AdminsTableView = () => {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [totalAdmins, setTotalAdmins] = useState(0);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [sortField, setSortField] = useState<"name" | "date">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedAdmin, setSelectedAdmin] = useState<AdminUser | null>(null);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchAdmins();
  }, [currentPage]);

  const fetchAdmins = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`${API_URL}/super-admin/admins?page=${currentPage}&limit=${itemsPerPage}`, {
        headers: {
          Authorization: `Bearer ${Cookies.get("token")}`,
        },
      });
      const payload = await res.json();
      const data = Array.isArray(payload?.data) ? payload.data : payload;
      const transformed = data.map((admin: any) => ({
        id: admin.id,
        name: admin.name,
        email: admin.email,
        createdAt: formatDate(admin.createdAt),
        organization: admin.organization,
      }));
      setAdmins(transformed);
      setTotalAdmins(payload?.meta?.total ?? transformed.length);
    } catch (err) {
      console.error("Error fetching admins", err);
    } finally {
      setIsLoading(false);
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

  const handleDelete = async (id: string, close: () => void) => {
    try {
      close();
      await ConfirmAction({
        action: async () => {
          const res = await fetch(`${API_URL}/super-admin/admin/${id}`, {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${Cookies.get("token")}`,
            },
          });

          if (!res.ok) {
            let message = "Failed to delete admin.";

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

          await fetchAdmins();
        },
        title: "Delete admin",
        message: "Are you sure you want to delete this, You won't be able to revert this!",
        confirmText: "Yes, delete it!",
        successMessage: "Admin deleted successfully!",
        errorActionLabel: "delete admin",
      });
    } catch (err) {
      console.log("Error deleting admin:", err);
    }
  };

  const filtered = admins.filter((a) =>
    a.name.toLowerCase().includes(search.toLowerCase())
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

  const total = search ? sorted.length : totalAdmins;
  const totalPages = Math.ceil(total / itemsPerPage);
  const paginated = sorted;

  return (
    <DefaultLayout>
      <Breadcrumb pageName="Admins" />
      <div className="rounded-lg border bg-white p-5 shadow-md w-full">
        <div className="flex justify-between flex-col md:flex-row items-center mb-4 gap-2">
          <input
            type="text"
            placeholder="Search by name..."
            className="border px-3 py-2 rounded-lg text-black w-full md:w-1/3"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Link href="/super-admin/add-admin">
            <button className="bg-primary text-white px-4 py-2 rounded-md hover:bg-opacity-90">
              + Add Admin
            </button>
          </Link>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center min-h-[60vh] w-full">
            <div className="text-center">
              <div className="loader border-t-4 border-blue-500 border-solid rounded-full w-12 h-12 mx-auto animate-spin"></div>
              <p className="mt-2 text-gray-600">Loading...</p>
            </div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto w-full">
              <table className="w-full min-w-max table-auto border-collapse border border-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th
                      className="px-4 py-3 text-left cursor-pointer"
                      onClick={() => handleSortToggle("name")}
                    >
                      Name {sortField === "name" ? (
                        sortOrder === "asc" ? (
                          <ArrowUpDown className="inline ml-1" size={14} />
                        ) : (
                          <ArrowDownUp className="inline ml-1" size={14} />
                        )
                      ) : (
                        <ArrowUpDown className="inline ml-1 text-gray-400" size={14} />
                      )}
                    </th>
                    <th className="px-4 py-3 text-left">Email</th>
                    <th className="px-4 py-3 text-left">Organization</th>
                    <th className="px-4 py-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.length > 0 ? (
                    paginated.map((admin) => (
                      <tr key={admin.id} className="border-t">
                        <td className="px-4 py-3">{admin.name}</td>
                        <td className="px-4 py-3">{admin.email}</td>
                        <td className="px-4 py-3">{admin.organization?.name || "—"}</td>
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
                                <button
                                  onClick={() => {
                                    close();
                                    setSelectedAdmin(admin);
                                  }}
                                  className="block px-4 py-2 w-full text-left hover:bg-gray-100"
                                >
                                  View
                                </button>
                                <Link
                                  href={`/super-admin/edit-admin?id=${admin.id}`}
                                  className="block px-4 py-2 w-full text-left hover:bg-gray-100"
                                  onClick={close}
                                >
                                  Edit
                                </Link>
                                <button
                                  onClick={() => handleDelete(admin.id, close)}
                                  className="block px-4 py-2 w-full text-left text-red-600 hover:bg-gray-100"
                                >
                                  Delete
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
                        No admins found.
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
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((prev) => prev - 1)}
                  className={`px-3 py-1 border rounded-md ${
                    currentPage === 1 ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  Prev
                </button>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((prev) => prev + 1)}
                  className={`px-3 py-1 border rounded-md ${
                    currentPage === totalPages ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {selectedAdmin && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">Admin Info</h3>
            <p><strong>Name:</strong> {selectedAdmin.name}</p>
            <p><strong>Email:</strong> {selectedAdmin.email}</p>
            <p><strong>Organization:</strong> {selectedAdmin.organization?.name || "—"}</p>
            <div className="mt-4 text-right">
              <button onClick={() => setSelectedAdmin(null)} className="bg-gray-500 text-white px-4 py-2 rounded-md">Close</button>
            </div>
          </div>
        </div>
      )}
    </DefaultLayout>
  );
};

export default AdminsTableView;
