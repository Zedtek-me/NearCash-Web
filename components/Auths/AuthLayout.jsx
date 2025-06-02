import React, { useState, useContext } from "react";
import { Outlet, useNavigate } from "react-router";
import { handleBackToggle, toggleAuthPageBtnClassList } from "../../utils/helpers.js";
import { FaArrowLeft } from "react-icons/fa";
import { AuthContext } from "../../src/App.jsx";


const Layout = () => {
    const navigate = useNavigate();
    const context = useContext(AuthContext);
    const [activeBtns, setActiveBtns] = useState({login: true, signup: false})
    const {login, signup} = (context?.btnContext || activeBtns);
    return (
        <div className="layout w-screen h-screen bg-black flex flex-col items-center text-white pt-3 relative">
            <div className="auth-layout-content self-start flex flex-col justify-between align-start text-left pl-3 lg:pl-5">
                <div className="icon mb-7 p-3 cursor-pointer w-10 border border-gray-700 rounded-[50%] hover:bg-gray-800"><FaArrowLeft onClick={()=> handleBackToggle(navigate, "/")}/></div>
                <div className="welcome-note mt-6 w-fit p-2 leading-4">
                    <h1 className="auth-type-txt text-2xl font-semibold ">{ login ? "Login": "Sign Up" }</h1>
                    <p className="text-sm text-gray-400 leading-5 flex flex-row flex-wrap break-words">
                        NearCash - An easy way vendors and clients of POS connect anywhere in Nigeria.
                    </p>
                </div>
            </div>
            <div className="flex flex-col self-center items-center bg-white text-black w-full h-3/4 rounded-t-3xl pt-6 px-4 mt-6">
                <div className="auth-shuffle self-center flex flex-row justify-between align-center w-full md:w-1/3 rounded-3xl bg-[#EFEFEF] shadow text-black">
                    <button type="button"
                        className={login ? "active-btn login-btn w-[50%]": "login-btn flex flex-row justify-center align-center w-[50%] rounded-3xl w-1/ text-center pt-2 pb-2 cursor-pointer"}
                     onClick={(e)=> { toggleAuthPageBtnClassList(e, setActiveBtns, navigate, {context})}}>Login
                    </button>
                    <button type="button"
                        className={signup ? "active-btn signup-btn w-[50%]": "signup-btn flex flex-row justify-center w-[50%] align-center rounded-3xl text-center pt-2 pb-2 cursor-pointer"}
                        onClick={(e)=> {toggleAuthPageBtnClassList(e, setActiveBtns, navigate, {context})}}>Sign Up
                    </button>
                </div>
                <Outlet/>
            </div>
        </div>
    )
}

export default Layout;
