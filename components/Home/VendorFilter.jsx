import React, { useState } from "react";
import { ChevronDown } from "lucide-react";

const VENDOR_TYPES = [
    { label: "All", value: null },
    { label: "Local", value: "LOCAL" },
    { label: "FX", value: "FX" },
];

const COLLECTION_MODES = [
    { label: "All", value: null },
    { label: "Meet Up", value: "MEET_UP" },
    { label: "Store Walk-In", value: "STORE_WALK_IN" },
];

const VendorFilter = ({ onFilter, onCollectionModeFilter, onSelectFx }) => {
    const [openFilter, setOpenFilter] = useState(false);
    const [filterBy, setFilterBy] = useState("");

    const handleOpenFilter = () => {
        setOpenFilter((prev) => !prev);
        setFilterBy("");
    };

    const handleFilterBy = (key) => {
        setFilterBy(key);
        setOpenFilter(false);
    };

    const handleSelectType = (value) => {
        setFilterBy("");
        setOpenFilter(false);
        if (value === "FX") {
            onSelectFx?.();
            return;
        }
        onFilter(value);
    };

    const handleSelectMode = (value) => {
        setFilterBy("");
        onCollectionModeFilter(value);
    };

    return (
        <div className="relative inline-block text-slate-800">
            <div
                className="filter-by flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50"
                onClick={handleOpenFilter}
            >
                <p className="font-semibold text-sm whitespace-nowrap">Filter by</p>
                <ChevronDown
                    size={16}
                    className={`transform transition-transform duration-300 ${openFilter ? "rotate-180" : ""}`}
                />
            </div>

            {openFilter && (
                <div className="absolute right-0 z-20 mt-2 flex w-48 flex-col items-start justify-start rounded-xl border border-slate-200 bg-white px-2 py-2 text-slate-800 shadow-xl shadow-slate-900/10">
                    <h3
                        className="w-full py-2 hover:bg-gray-50 cursor-pointer rounded transition-colors font-medium"
                        onClick={() => handleFilterBy("vendor type")}
                    >
                        Vendor Type
                    </h3>
                    <h3
                        className="w-full py-2 hover:bg-gray-50 cursor-pointer rounded transition-colors font-medium"
                        onClick={() => handleFilterBy("collection mode")}
                    >
                        Collection Mode
                    </h3>
                </div>
            )}

            {filterBy === "vendor type" && (
                <div className="absolute right-0 z-20 mt-2 flex w-48 flex-col items-start justify-start rounded-xl border border-slate-200 bg-white px-2 py-2 text-slate-800 shadow-xl shadow-slate-900/10">
                    {VENDOR_TYPES.map(({ label, value }) => (
                        <div
                            key={label}
                            className="w-full py-2 hover:bg-gray-50 cursor-pointer rounded transition-colors font-medium"
                            onClick={() => handleSelectType(value)}
                        >
                            {label}
                        </div>
                    ))}
                </div>
            )}

            {filterBy === "collection mode" && (
                <div className="absolute right-0 z-20 mt-2 flex w-48 flex-col items-start justify-start rounded-xl border border-slate-200 bg-white px-2 py-2 text-slate-800 shadow-xl shadow-slate-900/10">
                    {COLLECTION_MODES.map(({ label, value }) => (
                        <div
                            key={label}
                            className="w-full py-2 hover:bg-gray-50 cursor-pointer rounded transition-colors font-medium"
                            onClick={() => handleSelectMode(value)}
                        >
                            {label}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default VendorFilter;
