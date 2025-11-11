import React, { useState } from "react";
import { ChevronDown } from "lucide-react";

const TransactionStatusFilter = ({ statusMap, refetch }) => {
    const [openStatusFilter, setOpenStatusFilter] = useState(false);

    const handleOpenStatusFilter = () => (
        setOpenStatusFilter((prev) => !prev)
      );

    const handleSearch = (searchTxt) => {
        let refinedSearch = searchTxt?.replace(" ", "_")?.toUpperCase()
        if(searchTxt === "All"){
            refinedSearch = ""
        }
        refetch({
            status: refinedSearch
        })
    }

    return (
        <div className="relative max-w-full text-black cursor-pointer bg-white rounded-xl" onClick={handleOpenStatusFilter}>
            <div className="filter-by flex justify-center items-center">
                <p className="w-20 font-semibold">Filter by</p>
                <ChevronDown size={16} className={`rounded-full transform transition-transform duration-300 ${openStatusFilter ? 'rotate-180' : ''}`}/>
            </div>
            {
                openStatusFilter && (
                    <div className="absolute left-6 flex flex-col justify-between items-center px-auto mx-auto tex-black z-10 bg-white w-44 h-44 p-5 text-left rounded-xl">
                    {
                        statusMap.map((statusData) => (
                        <div className={`text-${statusData?.color}`} onClick={() => handleSearch(statusData?.name)}>
                            <p className={`text-left`}>{statusData?.name}</p>
                        </div>
                        ))
                    }
                    </div>
                )
            }
        </div>
    )
}

export default TransactionStatusFilter;