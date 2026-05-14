import React, { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../Context/AuthContext";
import FullScreenLoader from "./FullScrenLoader";

export default function ProtectedRoute({
  children,
  allowedRoles = []
}) {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return <FullScreenLoader />;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  // Super Admin + Admin access everything
  if (
    user.role === "Super Admin" ||
    user.role === "Admin"
  ) {
    return children;
  }

  // Check allowed roles
  if (
    allowedRoles.length > 0 &&
    !allowedRoles.includes(user.role)
  ) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-10 rounded-2xl shadow-xl text-center">
          <h1 className="text-3xl font-bold text-red-600">
            Access Denied
          </h1>

          <p className="text-gray-500 mt-3">
            You don't have permission to access this page.
          </p>
        </div>
      </div>
    );
  }

  return children;
}