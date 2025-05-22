import React from "react";
import { useState } from "react";


export default function VendorDashboard() {
    let [clientInfo, setClientInfo] = useState({});
    return (
        <div className="dashboard vendor-dashboard">
            <h1>Vendor Dashboard</h1>
            <p>This is the vendor dashboard.</p>
        </div>
    )
}