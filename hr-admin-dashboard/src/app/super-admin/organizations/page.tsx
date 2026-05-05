"use client";
import React, { useEffect, useState } from "react";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import Link from "next/link";
import { ArrowDownUp, ArrowUpDown, MoreVertical } from "lucide-react";
import DropdownActions from "@/components/DropdownActions";
import ConfirmAction from "@/components/ConfirmAction";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? process.env.LOCALHOST_URL;

interface Organization {
  id: number;
  name: string;
  description?: string;
  createdAt: string;
  logoUrl: string;
  primaryColor: string;
  address: string;
  contactEmail: string;
  bgImageUrl: string;
  policy: string;
}

const formatDate = (isoDate: string) => {
  const date = new Date(isoDate);
  return date.toLocaleDateString("en-GB");
};

const OrganizationsTableView = () => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [totalOrganizations, setTotalOrganizations] = useState(0);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [sortField, setSortField] = useState<"name" | "date">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const itemsPerPage = 5;

  useEffect(() => {
    fetchOrganizations();
  }, [currentPage]);

  const fetchOrganizations = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/organizations?page=${currentPage}&limit=${itemsPerPage}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        console.error("Failed to fetch organizations:", res.status, res.statusText);
        return;
      }

      const payload = await res.json();
      const data = Array.isArray(payload?.data) ? payload.data : payload;
      const transformed = data.map((org: any) => ({
        id: org.id,
        name: org.name,
        description: org.description || "N/A",
        logoUrl: org.logoUrl,
        primaryColor: org.primaryColor,
        address: org.address,
        contactEmail: org.contactEmail,
        bgImageUrl: org.bgImageUrl,
        policy: org.policy,
        createdAt: formatDate(org.createdAt || new Date().toISOString()),
      }));
      setOrganizations(transformed);
      setTotalOrganizations(payload?.meta?.total ?? transformed.length);
    } catch (err) {
      console.error("Error fetching organizations", err);
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

  const handleDelete = async (id: number) => {
    try {
      await ConfirmAction({
        action: async () => {
          const res = await fetch(`${API_URL}/organizations/${id}`, {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          });

          if (!res.ok) {
            let message = "Failed to delete organization.";

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

          await fetchOrganizations();
        },
        title: "Delete organization",
        message: "Are you sure you want to delete this, You won't be able to revert this!",
        confirmText: "Yes, delete it!",
        successMessage: "Organization deleted successfully!",
        errorActionLabel: "delete organization",
      });
    }
    catch (err) { console.log("error occured at ", err) }
  };

  const filtered = organizations.filter((o) =>
    o.name.toLowerCase().includes(search.toLowerCase())
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

  const total = search ? sorted.length : totalOrganizations;
  const totalPages = Math.ceil(total / itemsPerPage);
  const paginated = sorted;

  return (
    <DefaultLayout>
      <Breadcrumb pageName="Organizations" />
      <div className="rounded-lg border bg-white p-5 shadow-md w-full">
        <div className="flex justify-between flex-col md:flex-row items-center mb-4 gap-2">
          <input
            type="text"
            placeholder="Search by organization..."
            className="border px-3 py-2 rounded-lg text-black w-full md:w-1/3"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Link href="/super-admin/add-organization">
            <button className="bg-primary text-white px-4 py-2 rounded-md hover:bg-opacity-90">
              + Add Organization
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
                    <th className="px-4 py-3 text-left cursor-pointer" onClick={() => handleSortToggle("name")}>Name {sortField === "name" ? (sortOrder === "asc" ? <ArrowUpDown className="inline ml-1" size={14} /> : <ArrowDownUp className="inline ml-1" size={14} />) : (<ArrowUpDown className="inline ml-1 text-gray-400" size={14} />)}</th>
                    <th className="px-4 py-3 text-left">Description</th>
                    <th className="px-4 py-3 text-left">Created At</th>
                    <th className="px-4 py-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.length > 0 ? (
                    paginated.map((org) => (
                      <tr key={org.id} className="border-t">
                        <td className="px-4 py-3">{org.name}</td>
                        <td className="px-4 py-3 max-w-xs" title={org.description}>{org.description}</td>
                        <td className="px-4 py-3">{org.createdAt}</td>
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
                                    setSelectedOrg(org);
                                  }}
                                  className="block px-4 py-2 w-full text-left hover:bg-gray-100"
                                >
                                  View
                                </button>
                                <Link
                                  href={`/super-admin/edit-organization?id=${org.id}`}
                                  className="block px-4 py-2 w-full text-left hover:bg-gray-100"
                                  onClick={close}
                                >
                                  Edit
                                </Link>
                                <button
                                  onClick={() => {
                                    close();
                                    handleDelete(org.id);
                                  }}
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
                      <td colSpan={4} className="border p-4 text-center text-gray-500">
                        No organizations found.
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
          </>
        )}
      </div>

      {selectedOrg && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center" style={{ zIndex: "9999" }}>
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4 text-gray-800">Organization Info</h3>

            {/* Logo */}
            {selectedOrg.logoUrl && (
              <div className="mb-4 text-center">
                <img
                  src={selectedOrg.logoUrl}
                  alt="Organization Logo"
                  className="mx-auto h-16 object-contain"
                />
              </div>
            )}

            <div className="text-sm text-gray-700 space-y-2">
              <p><strong>Name:</strong> {selectedOrg.name}</p>
              <p><strong>Description:</strong> {selectedOrg.description}</p>
              <p><strong>Address:</strong> {selectedOrg.address}</p>
              <p><strong>Contact Email:</strong> {selectedOrg.contactEmail}</p>

              {/* Primary Color */}
              {selectedOrg.primaryColor && (
                <div>
                  <p><strong>Primary Color:</strong> {selectedOrg.primaryColor}</p>
                  <div
                    className="w-5 h-5 rounded-full border mt-1"
                    style={{ backgroundColor: selectedOrg.primaryColor }}
                  ></div>
                </div>
              )}

              {/* Background Image */}
              {selectedOrg.bgImageUrl && (
                <div>
                  <p className="mt-2"><strong>Background Image:</strong></p>
                  <img
                    src={selectedOrg.bgImageUrl}
                    alt="Background"
                    className="w-full h-32 object-cover rounded-md mt-1"
                  />
                </div>
              )}

              {/* Privacy Policy / Terms */}
              {selectedOrg.policy && (
                <div>
                  <p className="mt-2"><strong>Privacy Policy / Terms:</strong></p>
                  <div className="border rounded-md p-2 bg-gray-100 max-h-32 overflow-y-auto whitespace-pre-wrap">
                    {selectedOrg.policy}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 text-right">
              <button
                onClick={() => setSelectedOrg(null)}
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}


    </DefaultLayout>
  );
};

export default OrganizationsTableView;
