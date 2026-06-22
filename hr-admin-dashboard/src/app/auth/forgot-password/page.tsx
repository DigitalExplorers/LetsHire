"use client";
import React, { useState } from "react";
import { sendResetLink } from "../../services/authService";
import { useBranding } from "@/contexts/BrandingContext";
import Image from "next/image";
const ForgotPassword = () => {
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const { logoUrl, primaryColor } = useBranding();

    const validateEmail = (value: string) => {
        if (!value.trim()) return "Please enter your email";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Invalid email";
        return "";
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setMessage("");
        setLoading(true);

        const emailError = validateEmail(email);
        if (emailError) {
            setError(emailError);
            setLoading(false);
            return;
        }

        try {
            await sendResetLink(email);
            setMessage("If this email is registered, you’ll receive a password reset link shortly.");
        } catch (err: any) {
            console.error("Forgot password error:", err);
            setError("Something went wrong. Please try again.");
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
                                <Image src={'/images/logo/THE8800-logo-final.png'} alt="Logo" width={240}  height={48} className="h-12 object-contain" />
                            </div>

                            <h2 className="mb-9 text-2xl font-bold text-[#464D67] text-center">
                                Forgot Password
                            </h2>

                            {error && <p className="text-red-500 mb-5 text-center">{error}</p>}
                            {message && <p className="text-green-600 mb-5 text-center">{message}</p>}

                            <form onSubmit={handleSubmit}>
                                <div className="mb-4">
                                    <label className="mb-2.5 block font-medium text-[#464D67]">Registered Email</label>
                                    <input
                                        type="email"
                                        placeholder="Enter your registered email"
                                        className="w-full rounded-lg border border-gray-300 py-4 px-6 outline-none text-[#464D67]"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>

                                <div className="mb-5">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        style={{ backgroundColor: primaryColor }}
                                        className="text-white w-full px-6 py-3 font-bold text-[16px] rounded-lg outline-none hover:opacity-90 disabled:opacity-70 disabled:cursor-not-allowed font-['Space Grotesk']"
                                    >
                                        {loading ? "Sending..." : "Send Reset Link"}
                                    </button>
                                </div>

                                <div className="mt-6 text-center text-[#464D67]">
                                    <p>
                                        Remember your password?{" "}
                                        <a href="/auth/signin" style={{ color: primaryColor }} className="hover:underline">
                                            Sign In
                                        </a>
                                    </p>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
