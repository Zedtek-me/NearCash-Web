import React, { useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { useLazyQuery } from "@apollo/client";
import EmptyTableState from "./components/EmptyTable";
import { GET_VENDORS, GET_CLIENTS } from "../Auths/queries/userQueries";

const TransactionFilter = ({ statusMap, refetch, user }) => {
    const [openFilter, setOpenFilter] = useState(false);
    const [filterBy, setFilterBy] = useState("")
    const [dateFilter, setDateFilter] = useState({
        dateFrom: "",
        dateTo: ""
    });
    const [clients, setClients] = useState([]);
    const [vendors, setVendors] = useState([]);
    const [ fetchClients, { data: clientsData } ] = useLazyQuery(GET_CLIENTS);
    const [ fetchVendors, {data: vendorsData} ] = useLazyQuery(GET_VENDORS);

    const { userType } = user;

    useEffect(()=>{
        if(userType == "VENDOR"){
            fetchClients();
            if (clientsData){
                setClients(clientsData)
            };
        }
        else{
            fetchVendors();
            if(vendorsData){
                setVendors(vendorsData)
            }
        }
    });

    const handleOpenFilter = () => {
        setOpenFilter((prev) => !prev)
        setFilterBy("");
    };

    const handleSearch = (searchTxt) => {
        setFilterBy("");
        let refinedSearch = searchTxt?.replace(" ", "_")?.toUpperCase()
        if(searchTxt === "All"){
            refinedSearch = ""
        }
        refetch({
            status: refinedSearch
        })
    }

    const handleDateFilter = () => {
        setFilterBy("");
        refetch({
            dateFrom: dateFilter.dateFrom,
            dateTo: dateFilter.dateTo
        })
        setDateFilter(prev => ({...prev, dateFrom: "", dateTo: ""}))
    }

    const handleClearFilter = () => {
        setDateFilter(prev => ({...prev, dateFrom: "", dateTo: ""}))
    }

    const handleDateStateChange = (date, type) =>{
        if(type == "dateFrom"){
            setDateFilter((prev) => ({...prev, dateFrom: date?.toString()}));
        }
        else setDateFilter((prev) => ({...prev, dateTo: date}));
    }

    const handleUserFilter = (userId, userType) => {
        setFilterBy("");
        refetch({
            user_type: txt?.toUpperCase()
        })
    }

    const handleFilterBy = (txt) => {
        setOpenFilter((prev) => !prev);
        if(txt?.length){
            setFilterBy(txt?.toLowerCase())
        }
    }

    return (
        <div className="relative max-w-full text-black cursor-pointer bg-white rounded-xl">
            <div className="filter-by flex justify-center items-center" onClick={handleOpenFilter}>
                <p className="w-20 font-semibold">Filter by</p>
                <ChevronDown size={16} className={`rounded-full transform transition-transform duration-300 ${openFilter ? 'rotate-180' : ''}`}/>
            </div>
            {
                openFilter && (
                    <div className="absolute left-6 flex flex-col justify-between items-center px-auto mx-auto tex-black z-10 bg-white w-44 h-44 p-5 text-left rounded-xl">
                        <h3 className="status" onClick={(e)=> handleFilterBy(e.target.textContent)}>
                            Status
                        </h3>
                        <h3 className="status" onClick={(e)=> handleFilterBy(e.target.textContent)}>
                            Date
                        </h3>
                        {
                            userType == "VENDOR" ? (
                                <h3 className="by_clients" onClick={(e)=> handleFilterBy(e.target.textContent)}>Client</h3>
                            ) : (
                                <h3 className="by_vendor" onClick={(e)=> handleFilterBy(e.target.textContent)}>Vendor</h3>
                            )
                        }
                    </div>
                )
            }
            {
                filterBy == "status" && (
                    <div className="statuses absolute left-6 flex flex-col justify-between items-center px-auto mx-auto text-black z-10 bg-white w-44 h-44 p-5 text-left rounded-xl">
                        {
                            statusMap.map((statusData, idx) => (
                                <div className={`text-${statusData?.color}`} onClick={() => handleSearch(statusData?.name)} key={idx}>
                                    <p className={`text-left`}>{statusData?.name}</p>
                                </div>
                            ))
                        }
                    </div>
                ) || filterBy == "date" && (
                    <div className="date_cont flex flex-col justify-center items-center w-full h-44 absolute z-10 py-auto m-auto">
                        <div className="from_to_cont flex justify-between items-center text-left max-w-md">
                            <div className="from flex justify-between items-center">
                                <h2 className="mr-5">From:</h2>
                                <input type="date" name="date_from" id="date_from" value={dateFilter.dateFrom} onChange={(e)=>handleDateStateChange(e.target.value, "dateFrom")} className="rounded-xl w-32 h-8 border border-black"/>
                            </div>
                            <div className="to flex justify-between items-center">
                                <h2 className="mx-5">To:</h2>
                                <input type="date" name="date_from_from" id="date_from" value={dateFilter.dateTo} onChange={(e)=>handleDateStateChange(e.target.value, "dateTo")} className="rounded-xl w-32 h-8 border border-black"/>
                            </div>
                        </div>
                        <div className="btn_cont flex justify-between items-center w-44 my-5">
                            <button type="button" onClick={handleDateFilter} className="bg-green-300 transition-all duration-300 ease-in-out hover:bg-green-400 py-2 px-5 rounded-lg">search</button>
                            <button type="button" onClick={handleClearFilter} className="bg-gray-300 transition-all duration-300 ease-in-out hover:bg-gray-400 py-2 px-5 rounded-lg">clear</button>
                        </div>
                    </div>
                ) || (filterBy?.includes("client") || filterBy.includes("vendor")) && (
                    <div className="list_users absolute z-10">
                        {
                            (!clients?.length && !vendors?.length) ? <EmptyTableState title={`${userType == 'VENDOR'? 'No Clients Yet' : 'No Vendor Yet'}`} description={`${userType == 'VENDOR' ? 'clients that have patronized you will be listed here.': 'vendors you\'ve contacted will appear here.'}`}/> : (
                                (userType == "VENDOR" && clients?.length) ? clients.map((clientUser) => (
                                    <div className="users" onClick={(e) => handleUserFilter(clientUser?.id, clientUser?.userType)} key={clientUser?.id}>

                                    </div>
                                )) : (userType == "CLIENT" && vendors?.length) ? vendors?.map((vendorUser) => (
                                    <div className="users" onClick={(e) => handleUserFilter(vendorUser?.id, vendorUser?.userType)} key={vendorUser?.id}>

                                    </div>
                                )) : <EmptyTableState title={`${userType == 'VENDOR'? 'No Clients Yet' : 'No Vendor Yet'}`} description={`${userType == 'VENDOR' ? 'clients that have patronized you will be listed here.': 'vendors you\'ve contacted will appear here.'}`}/>
                            )
                        }
                    </div>
                )
            }
        </div>
    )
}

export default TransactionFilter;