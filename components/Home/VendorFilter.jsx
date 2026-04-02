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

const VendorFilter = ({ onFilter, onCollectionModeFilter }) => {
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
        onFilter(value);
    };

    const handleSelectMode = (value) => {
        setFilterBy("");
        onCollectionModeFilter(value);
    };

    return (
        <div className="relative inline-block text-black">
            <div
                className="filter-by flex justify-center items-center gap-2 px-4 py-2 bg-white rounded-xl cursor-pointer hover:bg-gray-50 transition-colors border border-gray-200 shadow-sm"
                onClick={handleOpenFilter}
            >
                <p className="font-semibold text-sm whitespace-nowrap">Filter by</p>
                <ChevronDown
                    size={16}
                    className={`transform transition-transform duration-300 ${openFilter ? "rotate-180" : ""}`}
                />
            </div>

            {openFilter && (
                <div className="absolute right-0 mt-2 flex flex-col justify-start items-start text-black z-10 bg-white w-48 py-3 px-4 rounded-xl shadow-lg border border-gray-200">
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
                <div className="absolute right-0 mt-2 flex flex-col justify-start items-start text-black z-10 bg-white w-48 py-3 px-4 rounded-xl shadow-lg border border-gray-200">
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
                <div className="absolute right-0 mt-2 flex flex-col justify-start items-start text-black z-10 bg-white w-48 py-3 px-4 rounded-xl shadow-lg border border-gray-200">
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
