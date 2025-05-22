import React, { createContext, useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router";
import AuthLayout from "../components/Auths/AuthLayout.jsx";
import Home from "../components/Home/Home.jsx";
import Login from "../components/Auths/Login.jsx";
import SignUp from "../components/Auths/SignUp.jsx";
import DashboardLayout from "../components/Home/Dashboards/DashboardLayout.jsx";
import ClientDashboard from "../components/Home/Dashboards/ClientDashboard.jsx";
import VendorDashboard from "../components/Home/Dashboards/VendorDashboard.jsx";
import { checkAuth } from "../utils/auths.js";

const AuthContext = createContext();

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
                <Route path="/" element={<AuthLayout currentPage="Login" userInfo={user}/>}>
                    <Route path="signup" element={<SignUp/>}/>
                    <Route path="login" element={<Login/>}/>
                </Route>
                <Route path="/dashboard" element={<DashboardLayout/>}>
                    <Route index element={<Home/>}/>
                    <Route path="client" element={<ClientDashboard/>}/>
                    <Route path="vendor" element={<VendorDashboard/>}/>
                </Route>
            </Routes>
        </Router>
    )
}

export default App;