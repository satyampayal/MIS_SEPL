import React from "react";

export default function FullScreenLoader() {
  return (
    <div className="fixed inset-0 bg-white flex flex-col items-center justify-center z-50">
      <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>

      <h2 className="mt-6 text-xl font-semibold text-gray-700">
        Loading MIS Portal...
      </h2>

      <p className="text-gray-500 text-sm mt-2">
        Verifying authentication and permissions
      </p>
    </div>
  );
}