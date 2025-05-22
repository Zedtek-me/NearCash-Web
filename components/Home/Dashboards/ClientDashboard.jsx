import React from "react";
import { useState } from "react";


export default function ClientDashboard() {
    let [clientInfo, setClientInfo] = useState({});
    return (
        <div className="dashboard client-dashboard">
            <h1>Client Dashboard</h1>
            <p>This is the client dashboard.</p>
        </div>
    )
}