import React from "react";
import { useNavigate, useLocation } from "react-router";
import useAuth from "../../../hooks/useAuth";
import { getPrimaryNavItems } from "./navItems";

/**
 * Fixed bottom tab bar — mobile only (md:hidden). Desktop shows the same
 * destinations as icon links in the top navbar (see Headers.jsx).
 */
const Footers = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { userData } = useAuth();

    const basePath = `/dashboard/${userData?.userType?.toLowerCase() || "client"}`;
    const NAV_ITEMS = getPrimaryNavItems(basePath);

    return (
        <nav
            className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur md:hidden"
            aria-label="Primary"
        >
            <div className="flex items-stretch justify-around">
                {NAV_ITEMS.map(({ key, label, tooltip, icon: Icon, path }) => {
                    const isActive = location.pathname === path;
                    return (
                        <button
                            key={key}
                            type="button"
                            onClick={() => navigate(path)}
                            title={tooltip}
                            className="group relative flex-1 flex flex-col items-center justify-center gap-1 py-2.5"
                        >
                            {/* Tooltip */}
                            <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-gray-900 px-2 py-1 text-[11px] text-white opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                                {tooltip}
                            </span>

                            <Icon size={20} className={isActive ? "text-indigo-600" : "text-gray-500"} />
                            <span className={`text-[11px] font-medium ${isActive ? "text-indigo-600" : "text-gray-500"}`}>
                                {label}
                            </span>
                        </button>
                    );
                })}
            </div>
        </nav>
    );
};

export default Footers;
