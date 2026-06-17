"use client";
import { useState } from "react";
import { signUp } from "../../services/authService";
import { useRouter } from "next/navigation";
import { useBranding } from "@/contexts/BrandingContext";

const SignUp = () => {
  const router = useRouter();
  const { primaryColor, logoUrl } = useBranding();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [organization, setOrganization] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

const validateForm = (
  name: string,
  email: string,
  pwd: string,
  confirmPwd: string,
  organization: string
) => {
  if (!name.trim()) return "Name is required *";

  if (!/^[a-zA-Z\s]+$/.test(name))
    return "Name can only contain letters and spaces";

  if (name.trim().length < 2)
    return "Name must be at least 2 characters";

  if (name.trim().length > 100)
    return "Name cannot exceed 100 characters";

  if (!email.trim()) return "Email is required *";

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return "Invalid email";

  if (!organization.trim())
    return "Organization name is required *";

  if (!pwd)
    return "Password is required *";

  if (pwd.length < 8)
    return "Password must be at least 8 characters";

  if (
    !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(pwd)
  ) {
    return "Password must contain uppercase, lowercase, number and special character";
  }

  if (/\s/.test(pwd))
    return "Password must not contain spaces";

  if (pwd !== confirmPwd)
    return "Passwords do not match *";

  return "";
};

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const validationError = validateForm(name, email, password, confirmPassword, organization);
    if (validationError) {
      setError(validationError);
      setLoading(false);
      return;
    }

    try {
        try {
          const check = await fetch( `${process.env.NEXT_PUBLIC_API_URL}/users/check-email?email=${email.toLowerCase()}&organizationName=${organization.trim()}`);
          if (!check.ok) { throw new Error("Unable to verify email availability.");}
          const { exists } = await check.json();
          if (exists) { setError("Email already exists. Please try Signin."); 
            setLoading(false); 
            return;
            }
          } 
          catch (error) {
          console.error("Check email API error:", error);
          setError("Unable to verify email. Please try again.");
          setLoading(false);
          return;
        }

      await signUp(name, email.toLowerCase(), password, organization);
      router.push("/auth/signin");
    } catch (err: any) {
      console.error("Signup error:", err);
      setError(err.message || "Failed to create an account. Please try again.");
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
                Sign Up to HR Admin
              </h2>

              {error && <p className="text-red-500 mb-5 text-center">{error}</p>}

              <form onSubmit={handleSignUp}>
                <div className="mb-4">
                  <label className="mb-2.5 block font-medium text-[#464D67]">Name</label>
                  <input
                    type="text"
                    placeholder="Enter your full name"
                    className="w-full rounded-lg border border-gray-300 py-4 px-6 outline-none text-[#464D67]"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div className="mb-4">
                  <label className="mb-2.5 block font-medium text-[#464D67]">Email</label>
                  <input
                    type="text"
                    placeholder="Enter your email"
                    className="w-full rounded-lg border border-gray-300 py-4 px-6 outline-none text-[#464D67]"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div className="mb-4">
                  <label className="mb-2.5 block font-medium text-[#464D67]">Organization Name</label>
                  <input
                    type="text"
                    placeholder="Enter your organization"
                    className="w-full rounded-lg border border-gray-300 py-4 px-6 outline-none text-[#464D67]"
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                  />
                </div>

                <div className="mb-4">
                  <label className="mb-2.5 block font-medium text-[#464D67]">Password</label>
                  <input
                    type="password"
                    placeholder="Enter your password"
                    className="w-full rounded-lg border border-gray-300 py-4 px-6 outline-none text-[#464D67]"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>

                <div className="mb-6">
                  <label className="mb-2.5 block font-medium text-[#464D67]">Confirm Password</label>
                  <input
                    type="password"
                    placeholder="Re-enter your password"
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
                    {loading ? "Creating account..." : "Create Account"}
                  </button>
                </div>

                <div className="mt-6 text-center text-[#464D67]">
                  <p>
                    Already have an account?{" "}
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

export default SignUp;
