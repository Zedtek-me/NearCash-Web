import React, { useState } from "react";
import { handleSubmit, handleState } from "../../utils/auths.js";
import Loader from "./Loader.jsx";

export default function Login(){
    const [data, setData] = useState({})
    const [loading, setLoading] = useState(false)
    return (
        <form method="post" onSubmit={(e)=> handleSubmit(e, setLoading, data)} className="flex flex-col justify-around items-center justify-self-start text-center text-black h-full w-2/3">
            <div className="email flex flex-row flex-wrap justify-around items-center w-1/2 h-12 shadow rounded-3xl">
                <label htmlFor="email" className="text-left flex flex-row justify-center items-center mr-3">Email</label>
                <input type="email" name="email" id="email" onChange={(e)=> handleState(e, setData)} className="text-black text-center w-2/3" placeholder="johndoe@email.com"/>
            </div>
            <div className="password flex flex-row flex-wrap  justify-around items-center w-1/2 h-12 shadow rounded-3xl">
                <label htmlFor="password" className="text-left flex flex-row justify-center items-center mr-3">Password</label>
                <input type="password" name="password" id="password" onChange={(e)=> handleState(e, setData)} className="text-center text-black w-2/3" placeholder="************"/>
            </div>
            <div className="remember-fg-pass flex flex-row justify-around items-center w-1/2">
                <div className="remember flex flex-row justify-between items-center text-center w-36">
                    <input type="checkbox" className="justify-self-start flex flex-row justify-center align-center"/>
                    <h5 className="remember-txt">Remember me</h5>
                </div>
                <input type="button" value="Forgot password?" className="fg-pass text-center cursor-pointer"/>
            </div>
            <div className="submit flex flex-row justify-center text-center -mt-16">
                {
                    loading ? <Loader/> : <button type="submit" name="submit" 
                    id="submit" className="flex flex-row justify-around align-center border-2 border-black p-3 bg-black w-96 rounded-3xl text-white">Login</button>
                }
            </div>
        </form>
    )

}
