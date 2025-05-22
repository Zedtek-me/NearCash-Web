import React, { useEffect } from "react";
import { Outlet, useNavigate } from "react-router";
import { toTitleCase } from "../../utils/helpers.js";

const Layout = ({ currentPage, userInfo }) => {
    let navigate = useNavigate();
    useEffect(()=>{
        let userType = userInfo?.type?.toUpperCase();
        if(!userInfo) navigate("login")
        if(userType === "CLIENT"){
            navigate("dashboard/client")
        }
        else if (userType === "VENDOR"){
            navigate("dashboard/vendor")
        }
    }, [userInfo])
    return (
        <div className="layout w-screen h-screen bg-black flex flex-col justify-between align-center text-white pl-5 pt-2">
            <div className="auth-layout-content self-start flex flex-col justify-center align-start text-left">
                {/* icon and welcome note containers go in here */}
                <div className="icon">This is the icon section</div>
                <div className="welcome-note">
                    <h1 className="auth-type-txt text-3xl font-bold">{(toTitleCase(currentPage) === "Login" && "Login") || "Sign Up" }</h1>
                    <p className="text-3">
                        An easy way vendors and clients of POS connect anywhere in Nigeria.
                    </p>
                </div>
            </div>
            <Outlet/>
        </div>
    )
}

export default Layout;
