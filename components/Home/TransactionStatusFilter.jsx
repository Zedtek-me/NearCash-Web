import React, { useState } from "react";
import { ChevronDown } from "lucide-react";

const TransactionStatusFilter = ({ statusMap, refetch }) => {
    const [openStatusFilter, setOpenStatusFilter] = useState(false);

    const handleOpenStatusFilter = () => (
        setOpenStatusFilter((prev) => !prev)
      );

    const handleSearch = (searchTxt) => {
        refetch({
            status: searchTxt?.replace(" ", "_")?.toUpperCase()
        })
    }

    return (
        <div className="relative max-w-full text-black cursor-pointer bg-white" onClick={handleOpenStatusFilter}>
            <div className="filter-by flex justify-center items-center">
                <p className="w-10">Filter by</p>
                <ChevronDown size={16} className={`rounded-full transform transition-transform duration-300 ${openStatusFilter ? 'rotate-180' : ''}`}/>
            </div>
            {
                openStatusFilter && (
                    <div className="absolute flex flex-col justify-center items-center px-auto mx-auto tex-black z-10 bg-white">
                    {
                        statusMap.map((statusData) => (
                        <div className={`text-${statusData?.color}`} onClick={() => handleSearch(statusData?.name)}>
                            <p>{statusData?.name}</p>
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