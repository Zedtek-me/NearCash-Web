import React from "react";
import { useParams } from "react-router-dom";

export default function ClientDashboard() {
    let [clientInfo, setClientInfo] = useState({});
    let { user_type } = useParams();
    return (
        <div className="dashboard client-dashboard">
            <h1>Client Dashboard</h1>
            <p>This is the {user_type} dashboard.</p>
        </div>
    )
}