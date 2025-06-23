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
import useAuth from "../Hooks/Auths.js";
import { CURRENT_USER } from "../components/Auths/queries/userQueries.js"
import ClientDashboard from "../components/Home/Dashboards/ClientDashboard.jsx";
import BusinessSetUpPage from "../components/Auths/BusinessSetup.jsx";

const App = () => {
    const { userData: user, updateUser, clearUser, isLoading, setIsLoading } = useAuth()
    const [ fetchUser, { data } ] = useLazyQuery(CURRENT_USER)
    console.log("user from app component::: ", user)
    useEffect(() => {
        let sessionToken = checkCurrentSession();
        if(sessionToken){
            console.log(`found the localStorage session toke: ${sessionToken}`)
            fetchUser().then((result)=>{
                setIsLoading(false)
                console.log("result from the user fetcher from app component::: ", result)
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
                <Route path="/" element={ user?.email ? <Navigate to={`/dashboard/${user.firstName}`} replace/> : <GetStarted/> }/>
                <Route path="/auth" element={<AuthLayout/>}>
                    <Route path="signup" element={<SignUp/>}/>
                    <Route index path="login" element={<Login/>}/>
                    <Route path="google" element={<SocialAuth socialType="GOOGLE"/>}/>
                    
                </Route>
                <Route path="/dashboard/:user_type" element={ user?.email ? <DashboardLayout/> : <Navigate to="/" replace/> }>
                    <Route index element={<Home/>}/>
                </Route>
                <Route path="business-setup" element={<BusinessSetUpPage />}/>
                <Route path="*" element={<Navigate to="/" replace/>}/>
                <Route path="/client" element={<ClientDashboard />}/>
            </Routes>
        </Router>
    )
}

export default App;