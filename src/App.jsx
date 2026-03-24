import React, { createContext, useEffect, useState, useContext } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router";
import { Navigate } from "react-router-dom";
import { useLazyQuery } from "@apollo/client";
import AuthLayout from "../components/Auths/AuthLayout.jsx";
import Login from "../components/Auths/Login.jsx";
import SignUp from "../components/Auths/SignUp.jsx";
import DashboardLayout from "../components/Home/Dashboards/DashboardLayout.jsx";
import Home from "../components/Home/Home.jsx"
import GetStarted from "../components/Auths/GetStarted.jsx";
import SocialAuth from "../components/Auths/SocialAuths.jsx";
import { checkCurrentSession } from "../utils/auths.js";
import useAuth from "../hooks/useAuth.js";
import { CURRENT_USER } from "../components/Auths/queries/userQueries.js"
import ClientDashboard from "../components/Home/Dashboards/ClientDashboard.jsx";
import BusinessSetUpPage from "../components/Auths/BusinessSetup.jsx";
import VendorDashboard from "../components/Home/Dashboards/VendorDashboard.jsx";
import CreateStorePage from "../components/Home/Dashboards/CreateStore.jsx";
import TransactionPolicyPage from "../components/Home/Vendor/Policy.jsx";
import CategoryManagementPage from "../components/Home/Vendor/Category.jsx";
import TransactionDetails from "../components/Home/components/TransactionDetails.jsx";
import ProfilePage from "../components/Home/components/Profile.jsx";
import EditStorePage from "../components/Home/Dashboards/EditStorePage.jsx";
import KYCPage from "../components/Auths/KYC.jsx";

const App = () => {
    const { userData: user, updateUser, clearUser, isLoading, setIsLoading } = useAuth()
    const [ fetchUser, { data } ] = useLazyQuery(CURRENT_USER)
    useEffect(() => {
        let sessionToken = checkCurrentSession();
        if(sessionToken){
            fetchUser().then((result)=>{
                setIsLoading(false)
                if(result?.data){
                    let { user: newUserData } = result?.data;
                    updateUser(newUserData);
                }
            })
        }
    }, [])
    return (
        <Router>
            <Routes>
                <Route path="/" element={ user?.email ? <Navigate to={`/dashboard/${user?.userType?.toLowerCase()}`} replace/> : <GetStarted/> }/>
                <Route path="/auth" element={<AuthLayout/>}>
                    <Route path="signup" element={<SignUp/>}/>
                    <Route index path="login" element={<Login/>}/>
                    <Route path="google" element={<SocialAuth socialType="GOOGLE"/>}/>
                    
                </Route>
                <Route path="/dashboard/:user_type" element={ user?.email ? <DashboardLayout/> : <Navigate to="/" replace/> }>
                    <Route index element={<Home/>}/>
                </Route>
                <Route path="business-setup" element={<BusinessSetUpPage />}/>
                <Route path="/kyc" element={<KYCPage />}/>
                <Route path="*" element={<Navigate to="/" replace/>}/>
                <Route path="/client" element={<ClientDashboard />}/>
                <Route path="/vendor" element={<VendorDashboard />}/>
                <Route path="/create-store" element={<CreateStorePage />}/>
                <Route path="/policy" element={<TransactionPolicyPage />}/>
                <Route path="/category" element={<CategoryManagementPage />}/>
                <Route path="/transaction-details/:id" element={<TransactionDetails />} />
                <Route path="/profile" element={<ProfilePage />}/>
                <Route path="/edit-business/:id" element={<EditStorePage />}/>


            </Routes>
        </Router>
    )
}

export default App;