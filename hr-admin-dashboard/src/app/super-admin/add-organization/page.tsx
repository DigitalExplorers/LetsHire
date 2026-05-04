"use client";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast, ToastContainer } from "react-toastify";
import { Contact2 } from "lucide-react";

const AddOrganizationForm = () => {
  const API_URL = process.env.NEXT_PUBLIC_API_URL ?? process.env.LOCALHOST_URL;
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : "";
  const router = useRouter();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [primaryColor, setPrimaryColor] = useState("");
  const [address, setAddress] = useState("");
  const [policy, setPolicy] = useState("")
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [bgFile, setBgFile] = useState<File | null>(null);

  const uploadFile = async (orgId: number, file: File, type: "logo" | "bg") => {
    const formData = new FormData();
    formData.append("file", file);

    const endpoint = type === "logo" ? "upload-logo" : "upload-bg";

    const response = await fetch(`${API_URL}/organizations/${orgId}/${endpoint}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) throw new Error(`Failed to upload ${type}`);

    const data = await response.json();
    return type === "logo" ? data.logoUrl : data.bgImageUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name) {
      toast.warn("Organization name is required!");
      return;
    }

    setIsSubmitting(true);
    try {
      // Step 1: Create org without logo/bg URLs
      const res = await fetch(`${API_URL}/organizations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          description,
          website,
          contactEmail,
          address,
          primaryColor,
          policy,
        }),
      });

      if (!res.ok) throw new Error("Failed to create organization");
      const createdOrg = await res.json();

      // Step 2: Upload logo
      if (logoFile) {
        await uploadFile(createdOrg.id, logoFile, "logo");
      }

      // Step 3: Upload bg
      if (bgFile) {
        await uploadFile(createdOrg.id, bgFile, "bg");
      }

      toast.success("Organization created successfully!");
      router.push("/super-admin/organizations");
    } catch (error) {
      console.error(error);
      toast.error("Organization creation failed. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

    return (
      <DefaultLayout>
        <Breadcrumb pageName="Add Organization" />
        <ToastContainer position="top-center" autoClose={3000} />
        <div>
          <button
            onClick={() => router.back()}
            className="bg-gray-200 px-4 py-2 rounded-md text-sm hover:bg-gray-300 text-gray-800"
          >
            ← Back
          </button>
        </div>

        <div className="max-w-2xl mx-auto p-6 bg-white shadow-md rounded-lg dark:bg-boxdark">
          <h3 className="text-lg font-bold mb-4">Add Organization</h3>
          <form onSubmit={handleSubmit}>
            <div className="mb-4.5">
              <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                Organization Name <span className="text-meta-1">*</span>
              </label>
              <input
                type="text"
                placeholder="Enter name"
                className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="mb-4.5">
              <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                Description
              </label>
              <textarea
                placeholder="Enter description"
                className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              ></textarea>
            </div>

            <div className="mb-4.5">
              <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                Contact Email <span className="text-meta-1">*</span>
              </label>
              <input
                type="email"
                placeholder="Enter contact email"
                className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
              />
            </div>

            <div className="mb-4.5">
              <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                Address
              </label>
              <textarea
                placeholder="Enter address"
                className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white"
                rows={4}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              ></textarea>
            </div>

            <div className="mb-6">
              <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                Website
              </label>
              <input
                type="url"
                placeholder="https://example.com"
                className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
              />
            </div>


            {/* <div className="mb-6">
            <label className="mb-3 block text-sm font-medium text-black dark:text-white">
              Logo URL
            </label>
            <input
              type="url"
              placeholder="https://your-logo.com/logo.png"
              className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
            />
          </div>

          <div className="mb-6">
            <label className="mb-3 block text-sm font-medium text-black dark:text-white">
              Background Image URL
            </label>
            <input
              type="url"
              placeholder="https://your-bg-image.com/bg-image.png"
              className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white"
              value={bgImageUrl}
              onChange={(e) => setBGImageUrl(e.target.value)}
            />
          </div> */}

            <div className="mb-6">
              <label className="mb-3 block text-sm font-medium text-black dark:text-white">Upload Logo</label>
              <input type="file" accept="image/*" onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)} />
            </div>

            <div className="mb-6">
              <label className="mb-3 block text-sm font-medium text-black dark:text-white">Upload Background Image</label>
              <input type="file" accept="image/*" onChange={(e) => setBgFile(e.target.files?.[0] ?? null)} />
            </div>


            <div className="mb-6">
              <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                Primary Color
              </label>
              <input
                type="text"
                placeholder="#bf1f2c"
                className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
              />
            </div>

            <div className="mb-4.5">
              <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                Privacy Policy / T&C
              </label>
              <textarea
                placeholder="Enter privacy policy / t&c"
                className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white"
                rows={4}
                value={policy}
                onChange={(e) => setPolicy(e.target.value)}
              ></textarea>
            </div>

            <button
              type="submit"
              className={`w-full bg-primary text-white px-4 py-2 rounded-md hover:bg-opacity-90 ${isSubmitting ? "opacity-60 cursor-not-allowed" : ""
                }`}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving..." : "Save Organization"}
            </button>
          </form>
        </div>
      </DefaultLayout>
    );
  };

  export default AddOrganizationForm;
