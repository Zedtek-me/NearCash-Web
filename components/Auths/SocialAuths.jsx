import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router";
import Loader from "./Loader.jsx"
import { handleSocialAuth } from "../../utils/auths.js";



export default function SocialAuth({ authType }){
    const [authenticated, setAuthenticated] = useState(false)
    const [queryParams, setQueryParams] = useSearchParams()
    let authCode = queryParams.get("code")
    useEffect(()=>{
        handleSocialAuth(authCode, setAuthenticated)
    }, [authCode])
    return (
        <div className="social-auth-handler w-full h-full border border-solid border-grey relative flex justify-center items-center bg-slate-400">
            {
                (
                    // !authenticated ? <Loader/>: 
                    <p className="auth-text flex justify-between items-center text-center">
                        hold on while we process signing in to your {authType} account.
                        Auth code: {authCode}
                    </p>
                )
            }
        </div>
    )
}