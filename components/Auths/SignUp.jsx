import React, { useState } from "react";
import { handleSubmit, handleState } from "../../utils/auths.js";
import Loader from "./Loader.jsx";

export default function SignUp(){
    let [data, setData] = useState({})
    let [loading, setLoading] = useState(false)

    return (
        <div className="signup">
            <form method="post" onSubmit={(e)=> handleSubmit(e, setLoading, data)}>
                <div className="emal">
                    <label htmlFor="email">Email</label>
                    <input type="email" name="email" id="email" onChange={(e)=> handleState(e, setData)}/>
                </div>
                <div className="password">
                    <label htmlFor="password">Password</label>
                    <input type="password" name="password" id="password" onChange={(e)=> handleState(e, setData)}/>
                </div>
                <div className="submit">
                    {
                        loading ? <Loader/> : <button type="submit" name="submit" id="submit" value="Sign Up">Sign up</button>
                    }
                </div>
            </form>
        </div>
    )

}
