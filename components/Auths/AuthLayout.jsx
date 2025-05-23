import React, { useEffect } from "react";
import { Outlet, useNavigate } from "react-router";
import { toTitleCase , handleBackToggle } from "../../utils/helpers.js";
import { FaArrowLeft } from "react-icons/fa"

const Layout = ({ currentPage, userInfo }) => {
    let navigate = useNavigate();
    useEffect(()=>{
        let userType = userInfo?.user_type?.toUpperCase();
        if(!userInfo || (Object.keys(userInfo)).length <= 0) navigate("login")
        if(userType === "CLIENT"){
            navigate("dashboard/client")
        }
        else if (userType === "VENDOR"){
            navigate("dashboard/vendor")
        }
    }, [userInfo])
    return (
        <div className="layout w-screen h-screen bg-black flex flex-col justify-between align-center text-white pl-5 pt-2">
            <div className="auth-layout-content self-start flex flex-col justify-between align-start text-left">
                {/* icon and welcome note containers go in here */}
                <div className="icon mb-7 p-2 cursor-pointer"><FaArrowLeft onClick={()=> handleBackToggle(navigate, "dashboard")}/></div>
                <div className="welcome-note mt-7 w-fit p-2">
                    <h1 className="auth-type-txt text-3xl font-bold">{(toTitleCase(currentPage) === "Login" && "Login") || "Sign Up" }</h1>
                    <p className="text-3 flex flex-row flex-wrap break-words">
                        NearCash - An easy way vendors and clients of POS connect anywhere in Nigeria.
                    </p>
                </div>
            </div>
            <Outlet/>
        </div>
    )
}

export default Layout;
