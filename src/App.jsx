import React, { createContext, useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router";
import { Navigate } from "react-router-dom";
import AuthLayout from "../components/Auths/AuthLayout.jsx";
import Login from "../components/Auths/Login.jsx";
import SignUp from "../components/Auths/SignUp.jsx";
import DashboardLayout from "../components/Home/Dashboards/DashboardLayout.jsx";
import ClientDashboard from "../components/Home/Dashboards/ClientDashboard.jsx";
import VendorDashboard from "../components/Home/Dashboards/VendorDashboard.jsx";
import GetStarted from "../components/Auths/GetStarted.jsx";
import { checkAuth } from "../utils/auths.js";

export const AuthContext = createContext({});

const App = () => {
    let [user, setUser] = useState(null);
    // determine if user has a session through auth key in local storage
    // then update state and auth layout prop values accordingly...
    useEffect(() => {
        checkAuth(setUser);
    }, [])
    return (
        <Router>
            <Routes>
                <Route path="/" element={ user ? <Navigate to="/dashboard" replace/> : <GetStarted/> }/>
                <Route path="/auth" element={<AuthLayout/>}>
                    <Route path="signup" element={<SignUp/>}/>
                    <Route index path="login" element={<Login/>}/>
                </Route>
                <Route path="/dashboard" element={ user ? <DashboardLayout/> : <Navigate to="/" replace/> }>
                    <Route path="client" element={<ClientDashboard/>}/>
                    <Route path="vendor" element={<VendorDashboard/>}/>
                </Route>
                <Route path="*" element={<Navigate to="/" replace/>}/>
            </Routes>
        </Router>
    )
}

export default App;