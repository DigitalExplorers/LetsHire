"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { resetPassword } from "../../services/authService";
import { useBranding } from "@/contexts/BrandingContext";
import Image from "next/image";

const ResetPassword = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get("token");

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const { logoUrl, primaryColor } = useBranding();

    useEffect(() => {
        if (!token) {
            setError("Invalid or missing token.");
        }
    }, [token]);

    const validate = () => {
        if (!password || !confirmPassword) return "Please fill in all fields.";
        if (password.length < 6) return "Password must be at least 6 characters.";
        if (password !== confirmPassword) return "Passwords do not match.";
        return "";
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setMessage("");
        setLoading(true);

        const validationError = validate();
        if (validationError) {
            setError(validationError);
            setLoading(false);
            return;
        }

        try {
            await resetPassword(token!, password);
            setMessage("Password reset successfully. Redirecting to login...");
            setTimeout(() => router.push("/auth/signin"), 2000);
        } catch (err: any) {
            setError(err?.response?.data?.message || "Failed to reset password.");
        } finally {
            setLoading(false);
        }
    };

    return (
      <div className="min-h-screen bg-white flex items-start justify-center px-4 py-10 sm:py-20">
        <div className="w-full max-w-screen-2xl">
          <div className="flex justify-center">
            <div className="w-full max-w-lg border border-gray-200 shadow-sm bg-white rounded-lg">
              <div className="w-full p-4 sm:p-10 xl:p-14">
                {/* Logo */}
                <div className="mb-6 flex justify-center">
                  <Image
                    src={'/images/logo/THE8800-logo-final.png'}
                    alt="Logo"
                    width={240}
                    height={48}
                    className="h-12 object-contain"
                  />
                </div>

                            <h2 className="mb-8 text-2xl font-bold text-center text-[#464D67]">
                                Reset Password
                            </h2>

                            {error && <p className="text-red-500 mb-4 text-center">{error}</p>}
                            {message && <p className="text-green-600 mb-4 text-center">{message}</p>}

                            <form onSubmit={handleSubmit}>
                                <div className="mb-4">
                                    <label className="mb-2.5 block font-medium text-[#464D67]">New Password</label>
                                    <input
                                        type="password"
                                        placeholder="Enter new password"
                                        className="w-full rounded-lg border border-gray-300 py-4 px-6 outline-none text-[#464D67]"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </div>

                                <div className="mb-6">
                                    <label className="mb-2.5 block font-medium text-[#464D67]">Confirm New Password</label>
                                    <input
                                        type="password"
                                        placeholder="Confirm new password"
                                        className="w-full rounded-lg border border-gray-300 py-4 px-6 outline-none text-[#464D67]"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                    />
                                </div>

                                <div className="mb-5">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        style={{ backgroundColor: primaryColor }}
                                        className="text-white w-full px-6 py-3 font-bold text-[16px] rounded-lg outline-none hover:opacity-90 disabled:opacity-70 disabled:cursor-not-allowed font-['Space Grotesk']"
                                    >
                                        {loading ? "Resetting..." : "Reset Password"}
                                    </button>
                                </div>

                                <div className="mt-6 text-center text-[#464D67]">
                                    <a href="/auth/signin" style={{ color: primaryColor }} className="hover:underline">
                                        Back to Sign In
                                    </a>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;
