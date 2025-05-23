import React, { useState } from "react";
import { handleSubmit, handleState } from "../../utils/auths.js";
import { toggleAuthPageBtnClassList } from "../../utils/helpers.js";
import Loader from "./Loader.jsx";

export default function Login(){
    let [data, setData] = useState({})
    let [loading, setLoading] = useState(false)

    return (
        <div className="login flex flex-col justify-center align-center bg-white text-black w-full h-1/2 rounded-t-3xl">
            <form method="post" onSubmit={(e)=> handleSubmit(e, setLoading, data)} className="flex flex-col justify-center align-center justify-self-start text-center text-black -mt-32">
                <div className="auth-shuffle self-center flex flex-row justify-around align-center w-1/2 border-black rounded-3xl bg-slate-200 relative">
                    <div className="login-btn flex flex-row justify-center align-center rounded-3xl w-1/2 border-yellow-300 text-center pt-2 pb-2 cursor-pointer" onClick={toggleAuthPageBtnClassList}>Login</div>
                    <div className="signup-btn flex flex-row justify-center align-center rounded-3xl w-1/2 border-yellow-300 text-center bg-slate-200 pt-2 pb-2 cursor-pointer" onClick={toggleAuthPageBtnClassList}>Sign Up</div>
                    <div className="auth-btn-color-shuffle mt-0.5 mb-0.5 w-1/2 bg-white rounded-3xl cursor-pointer absolute top-0 bottom-0 hidden"></div>
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
