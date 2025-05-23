import React, { useState } from "react";
import { handleSubmit, handleState } from "../../utils/auths.js";
import { toggleAuthPageBtnClassList } from "../../utils/helpers.js";
import Loader from "./Loader.jsx";

export default function Login(){
    const [data, setData] = useState({})
    const [loading, setLoading] = useState(false)
    const [activeBtns, setActiveBtns] = useState({login: true, signup: false})
    const {login, signup} = activeBtns;
    return (
        <div className="login flex flex-col justify-center align-center bg-white text-black w-full h-1/2 rounded-t-3xl">
            <form method="post" onSubmit={(e)=> handleSubmit(e, setLoading, data)} className="flex flex-col justify-center align-center justify-self-start text-center text-black -mt-32">
                <div className="auth-shuffle self-center flex flex-row justify-around align-center w-1/2 border-black rounded-3xl bg-slate-200 relative">
                    <button type="button"
                        className={login ? "active-btn": "login-btn flex flex-row justify-center align-center rounded-3xl w-1/2 border-yellow-300 text-center pt-2 pb-2 cursor-pointer"}
                     onClick={(e)=> { toggleAuthPageBtnClassList(e, setActiveBtns)}}>Login
                    </button>
                    <button type="button"
                        className={signup ? "active-btn": "signup-btn flex flex-row justify-center align-center rounded-3xl w-1/2 border-yellow-300 text-center bg-slate-200 pt-2 pb-2 cursor-pointer"}
                        onClick={(e)=> { toggleAuthPageBtnClassList(e, setActiveBtns)}}>Sign Up
                    </button>
                </div>
                <div className="email flex flex-row justify-center">
                    <label htmlFor="email" className="text-left flex flex-row justify-center align-center mr-3">Email</label>
                    <input type="email" name="email" id="email" onChange={(e)=> handleState(e, setData)}/>
                </div>
                <div className="password flex flex-row justify-center">
                    <label htmlFor="password" className="text-left flex flex-row justify-center align-center mr-3">Password</label>
                    <input type="password" name="password" id="password" onChange={(e)=> handleState(e, setData)}/>
                </div>
                <div className="submit flex flex-row justify-center">
                    {
                        loading ? <Loader/> : <button type="submit" name="submit" id="submit" className="flex p-16 text-left">Login</button>
                    }
                </div>
            </form>
        </div>
    )

}
