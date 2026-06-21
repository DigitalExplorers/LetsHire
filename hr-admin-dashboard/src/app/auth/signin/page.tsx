"use client";
import { useState } from "react";
import { loginUser } from "../../services/authService";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { useAuth } from "@/hooks/AuthContext";
import { useBranding } from "@/contexts/BrandingContext";

const SignIn = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { refetchProfile } = useAuth();
  const { refreshBranding, primaryColor, logoUrl } = useBranding();

  const router = useRouter();

  const isProduction = process.env.NODE_ENV === "production";

  const cookieOptions = {
    expires: 7,
    secure: isProduction,
    sameSite: (isProduction ? 'none' : 'lax') as 'lax' | 'strict' | 'none',
    ...(isProduction && { domain: process.env.NEXT_PUBLIC_COOKIE_DOMAIN }),
  };

  const validateForm = (email: string, pwd: string) => {
    if (!email.trim()) return "Please enter email";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Invalid email";
    if (!pwd.trim()) return "Please enter password";
    return "";
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const validationError = validateForm(email, password);
    if (validationError) {
      setError(validationError);
      setLoading(false);
      return;
    }

    try {
      const response = await loginUser(email, password);
      if (response?.id) {
        const { access_token, id, role, organizationId } = response;

        Cookies.set('token', access_token, cookieOptions);
        Cookies.set('id', id, cookieOptions);
        if (role) Cookies.set('role', role, cookieOptions);
        if (organizationId) Cookies.set('organizationId', String(organizationId), cookieOptions);


        await refetchProfile();
        refreshBranding();

        // Redirect based on role
        switch (role) {
          case "superadmin":
            router.push("/super-admin/dashboard");
            break;
          case "hr":
            router.push("/hr/dashboard");
            break;
          case "interviewer":
            router.push("/interviewer/dashboard");
            break;
          default:
            router.push("/admin/dashboard");
        }
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Invalid email or password");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen w-full bg-white flex items-start justify-center px-4 py-10 sm:py-20">
      <div className="w-full max-w-screen-2xl">
        <div className="flex justify-center">
          <div className="w-full max-w-lg border border-gray-200 shadow-sm bg-white">
            <div className="w-full p-4 sm:p-12.5 xl:p-17.5">
              {/* Logo */}
              <div className="mb-6 flex justify-center">
                <img
                  src={'/images/logo/THE8800-logo-final.png'}
                  alt="Logo"
                  className="h-12 object-contain"
                />
              </div>

              <h2 className="mb-9 text-2xl font-bold text-[#464D67] text-center">
                Sign In to HR Portal
              </h2>

              {error && <p className="text-red-500 mb-5 text-center">{error}</p>}

              <form onSubmit={handleLogin}>
                <div className="mb-4">
                  <label className="mb-2.5 block font-medium text-[#464D67]">Email</label>
                  <input
                    type="email"
                    placeholder="Enter your email"
                    className="w-full rounded-lg border border-gray-300 py-4 px-6 outline-none text-[#464D67]"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div className="mb-6">
                  <label className="mb-2.5 block font-medium text-[#464D67]">Password</label>
                  <input
                    type="password"
                    placeholder="Enter your password"
                    className="w-full rounded-lg border border-gray-300 py-4 px-6 outline-none text-[#464D67]"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>

                <div className="mb-5">
                  <button
                    type="submit"
                    disabled={loading}
                    style={{ backgroundColor: primaryColor }}
                    className="text-white w-full px-6 py-3 font-bold text-[16px] rounded-lg outline-none hover:opacity-90 disabled:opacity-70 disabled:cursor-not-allowed font-['Space Grotesk']"
                  >
                    {loading ? "Signing in..." : "Sign In"}
                  </button>
                </div>

                <div className="mt-6 text-center text-[#464D67]">
                  <p>
                    Don’t have an account?{" "}
                    <a href="/auth/signup" style={{ color: primaryColor }} className="hover:underline">
                      Sign Up
                    </a>
                  </p>
                  <p>
                    <a href="/auth/forgot-password" style={{ color: primaryColor }} className="hover:underline">
                      Forgot Password?
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

export default SignIn;
