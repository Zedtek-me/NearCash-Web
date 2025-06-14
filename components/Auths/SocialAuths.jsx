import React, { useState, useEffect, useContext } from "react";
import { useSearchParams, useNavigate, Navigate, replace } from "react-router";
import Loader from "./Loader.jsx"
import { handleSocialAuth } from "../../utils/auths.js";
import { useMutation } from "@apollo/client";
import { AUTHORIZE_WITH_SOCIAL_CODE } from "./mutations/userMutations.js";
import useAuth from "../../Hooks/Auths.js";


export default function SocialAuth({ socialType }){
    const [queryParams, _] = useSearchParams();
    const { updateUser, clearUser, userData } = useAuth()
    const navigate = useNavigate()
    const [ mutationFunc, { loading, error, data } ] = useMutation(AUTHORIZE_WITH_SOCIAL_CODE)
    const authCode = queryParams.get("code")
    const authenticated = (Object.entries(userData).length > 0)
    console.log("error recieved ", error, "data received: ", data, "loading state:: ", loading, "user data::: ", userData)
    useEffect(()=>{
        (
            authenticated ? navigate(`/dashboard/${(userData?.user_type || "client")}`) :
            handleSocialAuth(authCode, mutationFunc, "login", socialType)
        )

    }, [authCode])

    useEffect(
        ()=>{
            if(data?.authorizeWithCode.data){
                console.log("entered into the if authorize check::::::::")
                let {user, token} = data.authorizeWithCode.data;
                console.log("user data directly from mutation before attempting to set in context and state::::: ", user, `token destructured::: ${token}`)
                localStorage.setItem("nearcash_token", token)
                updateUser(user)
            }
        }, [data]
    )
    console.log(`authenticated state::: ${authenticated}`)
    return (
        <div className="social-auth-handler w-full h-full border border-solid border-grey relative flex flex-col justify-center items-center">
            {
                authenticated ? <Navigate to={`/dashboard/${(userData?.auth_type || "client")}`} replace/>: (
                    <div className="flex-1">
                        <p className="auth-text flex justify-between items-center text-center my-2">
                            Authenticating...
                        </p>
                        <Loader extraStyles={"my-2 border-2 border-solid border-black h-fit"}/>
                    </div>
                )
            }
        </div>
    )
}