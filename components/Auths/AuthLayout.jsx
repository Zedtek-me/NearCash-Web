import React, { useEffect, useState, useContext } from "react";
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
        <div className="layout w-screen h-screen bg-black flex flex-col justify-between items-center text-white pl-5 pt-2 relative">
            <div className="auth-layout-content self-start flex flex-col justify-between align-start text-left">
                <div className="icon mb-7 p-2 cursor-pointer"><FaArrowLeft onClick={()=> handleBackToggle(navigate, "/")}/></div>
                <div className="welcome-note mt-7 w-fit p-2">
                    <h1 className="auth-type-txt text-3xl font-bold">{ login ? "Login": "Sign Up" }</h1>
                    <p className="text-3 flex flex-row flex-wrap break-words">
                        NearCash - An easy way vendors and clients of POS connect anywhere in Nigeria.
                    </p>
                </div>
            </div>
            <div className="flex flex-col self-center justify-center items-center bg-white text-black w-full h-2/3 rounded-t-3xl pt-5">
                <div className="auth-shuffle self-center flex flex-row justify-around align-center w-1/3 border-black rounded-3xl bg-slate-200 shadow text-black">
                    <button type="button"
                        className={login ? "active-btn login-btn": "login-btn flex flex-row justify-center align-center rounded-3xl w-1/2 border-yellow-300 text-center pt-2 pb-2 cursor-pointer"}
                     onClick={(e)=> { toggleAuthPageBtnClassList(e, setActiveBtns, navigate, {context})}}>Login
                    </button>
                    <button type="button"
                        className={signup ? "active-btn signup-btn": "signup-btn flex flex-row justify-center align-center rounded-3xl w-1/2 border-yellow-300 text-center bg-slate-200 pt-2 pb-2 cursor-pointer"}
                        onClick={(e)=> {toggleAuthPageBtnClassList(e, setActiveBtns, navigate, {context})}}>Sign Up
                    </button>
                </div>
                <Outlet/>
            </div>
        </div>
    )
}

export default Layout;
