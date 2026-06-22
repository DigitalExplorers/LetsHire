"use client";

import React, { useEffect, useState } from "react";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import Link from "next/link";
import { ArrowUpDown, MoreVertical } from "lucide-react";
import { useAuth } from "@/hooks/AuthContext";
import DropdownActions from "@/components/DropdownActions";
import ConfirmAction from "@/components/ConfirmAction";
import AddMemberPanel from "@/components/Panels/AddMemberPanel";
import { useRightPanel } from "@/contexts/RightPanelContext";
import Cookies from "js-cookie";
interface AdminUser {
  id: number;
  name: string;
  email: string;
  createdAt: string;
  role: {
    name: string;
  };
}

const ManageUsersPage = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [totalUsersCount, setTotalUsersCount] = useState(0);
  const [filterRole, setFilterRole] = useState("All");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [sortField, setSortField] = useState<"name" | "date">("name");

   const { openPanel } = useRightPanel();

  const itemsPerPage = 10;
  const { user } = useAuth();

  useEffect(() => {
    if (user) fetchUsers();
  }, [user, currentPage]);

  const fetchUsers = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/users/sub-users?page=${currentPage}&limit=${itemsPerPage}`,
        {
        headers: {
          Authorization: `Bearer ${Cookies.get("token")}`,
        },
        },
      );

      const json = await res.json();
      const data = json?.data || json;
      setUsers(Array.isArray(data) ? data : []);
      setTotalUsersCount(json?.meta?.total ?? (Array.isArray(data) ? data.length : 0));
    } catch (err) {
      console.error("Error fetching users", err);
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await ConfirmAction({
        action: async () => {
          await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/sub-user/${id}`, {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${Cookies.get("token")}`,
            },
          });
          fetchUsers();
        },
        title: "Are you sure you want to delete this user?",
        message: "You won't be able to revert this!",
        confirmText: "Yes, delete it!",
      });
    }
    catch (err) { console.log("error occured at ", err) }
  };

  const filtered = users
    .filter((u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
    )
    .filter((u) =>
      filterRole === "All" ? true : u.role?.name?.toLowerCase() === filterRole.toLowerCase()
    );

  const sorted = [...filtered].sort((a, b) => {
    if (sortField === "name") {
      return sortOrder === "asc"
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name);
    } else {
      return sortOrder === "asc"
        ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  const totalUsers = search || filterRole !== "All" ? sorted.length : totalUsersCount;
  const totalPages = Math.ceil(totalUsers / itemsPerPage);
  const paginated = sorted;

  const handleSortToggle = (field: "name" | "date") => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  return (
    <DefaultLayout>
      <Breadcrumb pageName="Manage Users" />

      <div className="rounded-lg border bg-white p-5 shadow-md w-full">
        <div className="flex flex-col md:flex-row justify-between items-center mb-4 space-y-2 md:space-y-0">
          <input
            type="text"
            placeholder="Search by name or email..."
            className="border px-3 py-2 rounded-lg text-black w-full md:w-1/3"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <div className="flex gap-3 items-center">
            <select
              className="border px-4 py-2 rounded-md text-black"
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
            >
              <option value="All">All Roles</option>
              <option value="hr">HR</option>
              <option value="interviewer">Interviewer</option>
            </select>

            {/* <Link href="/admin/team/add-member">
              <button className="bg-primary text-white px-4 py-2 rounded-md hover:bg-opacity-90">
                + Add User
              </button>
            </Link> */}
            <button
              onClick={() => openPanel("Add Member", <AddMemberPanel />)}
              className="bg-primary text-white px-4 py-2 rounded"
            >
              + Add User
            </button>
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
          <>
            <div className="overflow-x-auto w-full">
              <table className="w-full min-w-max table-auto border-collapse border border-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th
                      className="px-4 py-3 text-left cursor-pointer"
                      onClick={() => handleSortToggle("name")}
                    >
                      Name
                      <ArrowUpDown className="inline ml-1" size={14} />
                    </th>
                    <th className="px-4 py-3 text-left">Email</th>
                    <th className="px-4 py-3 text-left">Role</th>
                    <th className="px-4 py-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.length > 0 ? (
                    paginated.map((user) => (
                      <tr key={user.id} className="border-t">
                        <td className="px-4 py-3">{user.name}</td>
                        <td className="px-4 py-3">{user.email}</td>
                        <td className="px-4 py-3 capitalize">{user.role?.name || "—"}</td>
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
                                  href={`/admin/team/edit-member?id=${user.id}`}
                                  className="block px-4 py-2 text-left hover:bg-gray-100"
                                  onClick={close}
                                >
                                  Edit
                                </Link>
                                <button
                                  onClick={() => {
                                    close();
                                    handleDelete(user.id)
                                  }}
                                  className="block px-4 py-2 text-left text-red-600 hover:bg-gray-100"
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
                      <td colSpan={5} className="text-center text-gray-500 py-5">
                        No users found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center mt-4">
              <span className="text-sm">
                Showing {(currentPage - 1) * itemsPerPage + 1}–
                {Math.min(currentPage * itemsPerPage, totalUsers)} of {totalUsers}
              </span>
              <div className="flex gap-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((prev) => prev - 1)}
                  className={`px-3 py-1 border rounded-md ${currentPage === 1 ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  Prev
                </button>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((prev) => prev + 1)}
                  className={`px-3 py-1 border rounded-md ${currentPage === totalPages ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </DefaultLayout>
  );
};

export default ManageUsersPage;
