import React, { useState, useEffect } from "react";
import { ChevronDown, ArrowLeft, ArrowRight } from "lucide-react";
import { useLazyQuery } from "@apollo/client";
import EmptyTableState from "./components/EmptyTable";
import { GET_VENDORS, GET_CLIENTS } from "../Auths/queries/userQueries";

const PAGE_SIZE = 5;

const TransactionFilter = ({ statusMap, refetch, user, businessId = null }) => {
    const [openFilter, setOpenFilter] = useState(false);
    const [filterBy, setFilterBy] = useState("");
    const [dateFilter, setDateFilter] = useState({ dateFrom: "", dateTo: "" });
    const [clients, setClients] = useState([]);
    const [vendors, setVendors] = useState([]);
    const [userPage, setUserPage] = useState(1);
    const [totalUserPages, setTotalUserPages] = useState(1);

    const [fetchClients] = useLazyQuery(GET_CLIENTS);
    const [fetchVendors] = useLazyQuery(GET_VENDORS);

    const { userType } = user;

    useEffect(() => {
        if (userType === "VENDOR") {
            if (!businessId) return;
            fetchClients({
                variables: {
                    vendorId: user?.id,
                    clientId: "",
                    businessId,
                    pageCount: PAGE_SIZE,
                    pageNumber: userPage,
                }
            }).then((result) => {
                setClients(result?.data?.clients || []);
                setTotalUserPages(result?.data?.clientsPagination?.totalPages ?? 1);
            }).catch(() => {});
        } else {
            fetchVendors({
                variables: { pageCount: PAGE_SIZE, pageNumber: userPage }
            }).then((result) => {
                setVendors(result?.data?.vendors || []);
                setTotalUserPages(result?.data?.vendorsPagination?.totalPages ?? 1);
            }).catch(() => {});
        }
    }, [userType, userPage]);

    const handleOpenFilter = () => {
        setOpenFilter((prev) => !prev);
        setFilterBy("");
    };

    const handleSearch = (searchTxt) => {
        setFilterBy("");
        let refinedSearch = searchTxt?.replace(" ", "_")?.toUpperCase();
        if (searchTxt === "All") refinedSearch = "";
        refetch({ status: refinedSearch });
    };

    const handleDateFilter = () => {
        setFilterBy("");
        refetch({ dateFrom: dateFilter.dateFrom, dateTo: dateFilter.dateTo });
        setDateFilter({ dateFrom: "", dateTo: "" });
    };

    const handleClearFilter = () => {
        setDateFilter({ dateFrom: "", dateTo: "" });
    };

    const handleDateStateChange = (date, type) => {
        if (type === "dateFrom") {
            setDateFilter((prev) => ({ ...prev, dateFrom: date?.toString() }));
        } else {
            setDateFilter((prev) => ({ ...prev, dateTo: date }));
        }
    };

    const handleUserFilter = (userId, type) => {
        setFilterBy("");
        const variables = type === "VENDOR" ? { vendorId: userId } : { clientId: userId };
        refetch(variables);
    };

    const handleFilterBy = (txt) => {
        setOpenFilter(false);
        if (txt?.length) setFilterBy(txt?.toLowerCase());
    };

    const StatusFilterComponent = () => (
        <div className="absolute left-0 mt-2 flex flex-col justify-between items-start px-4 py-3 text-black z-10 bg-white w-44 rounded-xl shadow-lg border border-gray-200">
            {statusMap.map((statusData, idx) => (
                <div
                    className={`text-${statusData?.color} w-full py-2 hover:bg-gray-50 cursor-pointer rounded transition-colors`}
                    onClick={() => handleSearch(statusData?.name)}
                    key={idx}
                >
                    <p className="text-left">{statusData?.name}</p>
                </div>
            ))}
        </div>
    );

    const DateFilterComponent = () => (
        <div className="absolute md:left-[-50%] mt-2 bg-white flex flex-col justify-center items-center sm:w-[30rem] md:w-[26rem] z-10 py-4 px-4 rounded-xl shadow-lg border border-gray-200">
            <div className="w-full flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-2">
                <div className="flex flex-col sm:flex-row justify-start items-start sm:items-center w-full sm:w-auto gap-2">
                    <h2 className="font-medium whitespace-nowrap">From:</h2>
                    <input
                        type="date"
                        name="date_from"
                        value={dateFilter.dateFrom}
                        onChange={(e) => handleDateStateChange(e.target.value, "dateFrom")}
                        className="rounded-lg w-full sm:w-36 px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    />
                </div>
                <div className="flex flex-col sm:flex-row justify-start items-start sm:items-center w-full sm:w-auto gap-2">
                    <h2 className="font-medium whitespace-nowrap">To:</h2>
                    <input
                        type="date"
                        name="date_to"
                        value={dateFilter.dateTo}
                        onChange={(e) => handleDateStateChange(e.target.value, "dateTo")}
                        className="rounded-lg w-full sm:w-36 px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    />
                </div>
            </div>
            <div className="flex justify-center items-center gap-3 mt-4 w-full">
                <button
                    type="button"
                    onClick={handleDateFilter}
                    className="bg-black text-white font-medium transition-all duration-300 ease-in-out hover:bg-gray-500 py-2 px-6 rounded-lg shadow-sm"
                >
                    Search
                </button>
                <button
                    type="button"
                    onClick={handleClearFilter}
                    className="bg-gray-300 text-gray-700 font-medium transition-all duration-300 ease-in-out hover:bg-gray-400 py-2 px-6 rounded-lg shadow-sm"
                >
                    Clear
                </button>
            </div>
        </div>
    );

    const UserFilterComponent = () => {
        const list = userType === "VENDOR" ? clients : vendors;
        const isEmpty = !list?.length;

        return (
            <div className="absolute left-0 mt-2 z-10 bg-white rounded-xl shadow-lg border border-gray-200 w-56">
                <div className="max-h-64 overflow-y-auto">
                    {isEmpty ? (
                        <div className="p-4">
                            <EmptyTableState
                                title={userType === "VENDOR" ? "No Clients Yet" : "No Vendor Yet"}
                                description={userType === "VENDOR" ? "Clients that have patronized you will be listed here." : "Vendors you've contacted will appear here."}
                            />
                        </div>
                    ) : userType === "VENDOR" ? (
                        clients.map((clientUser) => (
                            <div
                                className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                                onClick={() => handleUserFilter(clientUser?.id, "CLIENT")}
                                key={clientUser?.id}
                            >
                                <p className="font-medium text-sm">{clientUser?.fullName || clientUser?.email}</p>
                            </div>
                        ))
                    ) : (
                        vendors.map((vendorBusiness) => (
                            <div
                                className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                                onClick={() => handleUserFilter(vendorBusiness?.id, "VENDOR")}
                                key={vendorBusiness?.id}
                            >
                                <p className="font-medium text-sm">{vendorBusiness?.name || vendorBusiness?.owner?.email}</p>
                            </div>
                        ))
                    )}
                </div>

                {totalUserPages > 1 && (
                    <div className="flex items-center justify-between px-3 py-2 border-t border-gray-100">
                        <button
                            onClick={() => setUserPage((p) => Math.max(1, p - 1))}
                            disabled={userPage === 1}
                            className="p-1 rounded-full hover:bg-gray-100 disabled:opacity-40 text-gray-600"
                        >
                            <ArrowLeft size={14} />
                        </button>
                        <span className="text-xs text-gray-500">{userPage} of {totalUserPages}</span>
                        <button
                            onClick={() => setUserPage((p) => p + 1)}
                            disabled={userPage >= totalUserPages}
                            className="p-1 rounded-full hover:bg-gray-100 disabled:opacity-40 text-gray-600"
                        >
                            <ArrowRight size={14} />
                        </button>
                    </div>
                )}
            </div>
        );
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
                <div className="absolute left-0 mt-2 flex flex-col justify-start items-start text-black z-10 bg-white w-44 py-3 px-4 rounded-xl shadow-lg border border-gray-200">
                    <h3
                        className="w-full py-2 hover:bg-gray-50 cursor-pointer rounded transition-colors font-medium"
                        onClick={(e) => handleFilterBy(e.target.textContent)}
                    >
                        Status
                    </h3>
                    <h3
                        className="w-full py-2 hover:bg-gray-50 cursor-pointer rounded transition-colors font-medium"
                        onClick={(e) => handleFilterBy(e.target.textContent)}
                    >
                        Date
                    </h3>
                    {userType === "VENDOR" ? (
                        <h3
                            className="w-full py-2 hover:bg-gray-50 cursor-pointer rounded transition-colors font-medium"
                            onClick={(e) => handleFilterBy(e.target.textContent)}
                        >
                            Client
                        </h3>
                    ) : (
                        <h3
                            className="w-full py-2 hover:bg-gray-50 cursor-pointer rounded transition-colors font-medium"
                            onClick={(e) => handleFilterBy(e.target.textContent)}
                        >
                            Vendor
                        </h3>
                    )}
                </div>
            )}

            {filterBy === "status" && <StatusFilterComponent />}
            {filterBy === "date" && <DateFilterComponent />}
            {(filterBy.includes("client") || filterBy.includes("vendor")) && <UserFilterComponent />}
        </div>
    );
};

export default TransactionFilter;
