import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Mail,
  Lock,
  ShieldCheck,
  Eye,
  EyeOff
} from "lucide-react";
import toast from "react-hot-toast";
import axios from "axios";
import { AuthContext } from "../Context/AuthContext";

export default function LoginPage() {
  const navigate = useNavigate();

  const { setUser } = useContext(AuthContext);

  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      return toast.error("Please enter email and password");
    }

    try {
      setLoading(true);

      const loadingToast = toast.loading(
        "Verifying authentication..."
      );

      const res = await axios.post(
        "http://localhost:5000/user/login",
        formData
      );

      const data = res.data;

      toast.dismiss(loadingToast);

      if (data.success) {
        localStorage.setItem("token", data.token);

        localStorage.setItem(
          "user",
          JSON.stringify(data.user)
        );

        setUser(data.user);

        toast.success(
          `Welcome back, ${data.user.fullName}`
        );

        setTimeout(() => {
          navigate("/");
        }, 1000);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.log("Login error:", error);

      toast.error(
        error.response?.data?.message ||
          "Server error during login"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100 flex items-center justify-center p-4">

      <div className="absolute top-8 left-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg">
            <ShieldCheck size={26} />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              MIS Portal
            </h1>

            <p className="text-sm text-slate-500">
              Material Management System
            </p>
          </div>
        </div>
      </div>

      <form
        onSubmit={handleLogin}
        className="bg-white/90 backdrop-blur-md w-full max-w-md rounded-3xl shadow-2xl border border-white/40 p-8"
      >
        <div className="mb-8 text-center">
          <div className="w-20 h-20 rounded-3xl bg-blue-100 flex items-center justify-center mx-auto mb-4 text-blue-600">
            <ShieldCheck size={40} />
          </div>

          <h1 className="text-3xl font-bold text-slate-800">
            Secure Login
          </h1>

          <p className="text-slate-500 mt-2 text-sm">
            Access your operational dashboard securely
          </p>
        </div>

        {/* EMAIL */}

        <div className="mb-5">
          <label className="text-sm font-semibold text-slate-700">
            Email Address
          </label>

          <div className="relative mt-2">
            <Mail
              className="absolute left-4 top-3.5 text-slate-400"
              size={18}
            />

            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              className="w-full border border-slate-200 rounded-2xl pl-12 pr-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition"
            />
          </div>
        </div>

        {/* PASSWORD */}

        <div className="mb-6">
          <label className="text-sm font-semibold text-slate-700">
            Password
          </label>

          <div className="relative mt-2">
            <Lock
              className="absolute left-4 top-3.5 text-slate-400"
              size={18}
            />

            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              className="w-full border border-slate-200 rounded-2xl pl-12 pr-12 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition"
            />

            <button
              type="button"
              onClick={() =>
                setShowPassword(!showPassword)
              }
              className="absolute right-4 top-3 text-slate-400 hover:text-slate-700"
            >
              {showPassword ? (
                <EyeOff size={20} />
              ) : (
                <Eye size={20} />
              )}
            </button>
          </div>
        </div>

        {/* BUTTON */}

        <button
          type="submit"
          disabled={loading}
          className={`w-full rounded-2xl py-3 text-white font-semibold transition-all duration-300 ${
            loading
              ? "bg-slate-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700 hover:shadow-lg"
          }`}
        >
          {loading
            ? "Authenticating..."
            : "Login to Dashboard"}
        </button>

        {/* FOOTER */}

        <div className="mt-8 text-center text-xs text-slate-500">
          Protected enterprise access • Role-based authentication
        </div>
      </form>
    </div>
  );
}