import React, { useState } from "react";
import { handleSubmit, handleState } from "../../utils/auths.js";
import Loader from "./Loader.jsx";

export default function Login(){
    let [data, setData] = useState({})
    let [loading, setLoading] = useState(false)

    return (
        <div className="login flex flex-col justify-center align-center bg-white text-black w-full h-1/2">
            <form method="post" onSubmit={(e)=> handleSubmit(e, setLoading, data)} className="flex flex-col justify-center align-center text-left text-black">
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
