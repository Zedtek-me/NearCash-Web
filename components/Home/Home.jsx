import React from "react";
import { useParams } from "react-router";
import ClientDashboard from "./Dashboards/ClientDashboard.jsx"
import VendorDashboard from "./Dashboards/VendorDashboard.jsx";

const Home = () => {
    const { user_type } = useParams()
    if(user_type?.toLowerCase() === "client") return <ClientDashboard/>
    if(user_type?.toLowerCase() === "vendor") return <VendorDashboard/>
}

export default Home;
