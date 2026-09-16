import React from "react";
import { useNavigate } from "react-router";
import { ArrowLeft } from "lucide-react";

/**
 * Lightweight placeholder for nav destinations whose backend feature hasn't
 * shipped yet (currently: FX Rate, Cross Border). Swap out for the real page
 * once the corresponding backend work lands.
 */
export default function ComingSoon({ icon: Icon, title, description }) {
  const navigate = useNavigate();

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center mb-5">
        {Icon && <Icon size={28} className="text-indigo-500" />}
      </div>
      <h1 className="text-xl font-semibold text-gray-900 mb-2">{title}</h1>
      <p className="text-sm text-gray-500 max-w-sm mb-6">{description}</p>
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <ArrowLeft size={16} />
        Go back
      </button>
    </div>
  );
}
