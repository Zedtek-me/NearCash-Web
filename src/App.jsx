import React, { createContext, useEffect, useState } from "react";
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

import { CURRENT_USER } from "../components/Auths/queries/userQueries.js"

export const AuthContext = createContext({userData: null});

const App = () => {
    let [ user, setUser ] = useState(null);
    let [ fetchUser, { data } ] = useLazyQuery(CURRENT_USER)
    
    useEffect(() => {
        let sessionToken = checkCurrentSession();
        if(sessionToken){
            fetchUser()
            if(data){
                let { user: newUserData } = data;
                AuthContext.userData = newUserData;
                setUser(newUserData);
            }
        }
    }, [])
    return (
        <Router>
            <Routes>
                <Route path="/" element={ user ? <Navigate to={`/dashboard/${user.user_type}`} replace/> : <GetStarted/> }/>
                <Route path="/auth" element={<AuthLayout/>}>
                    <Route path="signup" element={<SignUp/>}/>
                    <Route index path="login" element={<Login/>}/>
                    <Route path="google" element={<SocialAuth socialType="GOOGLE"/>}/>
                </Route>
                <Route path="/dashboard/:user_type" element={ user ? <DashboardLayout/> : <Navigate to="/" replace/> }>
                    <Route index element={<Home/>}/>
                </Route>
                <Route path="*" element={<Navigate to="/" replace/>}/>
            </Routes>
        </Router>
    )
}

export default App;