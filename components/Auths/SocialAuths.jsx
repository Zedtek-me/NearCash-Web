import React, { useState, useEffect, useContext } from "react";
import { useSearchParams, useNavigate, Navigate, replace } from "react-router";
import { handleSocialAuth } from "../../utils/auths.js";
import { useMutation } from "@apollo/client";
import { AUTHORIZE_WITH_SOCIAL_CODE } from "./mutations/userMutations.js";
import useAuth from "../../Hooks/Auths.js";
import Spinner from "../../utils/components/spinner.jsx";
import { useStateValue } from "../../providers/stateProvider.jsx";
import { Subscriber } from "../../utils/subscriber.js";


export default function SocialAuth({ authType, socialType }){
    const [queryParams, _] = useSearchParams();
    const { updateUser, clearUser, userData } = useAuth()
    const navigate = useNavigate()
      const [
        {
          auth,
        },
        dispatch
      ] = Object.values(useStateValue());
    const [ mutationFunc, { loading, error, data } ] = useMutation(AUTHORIZE_WITH_SOCIAL_CODE)
    const authCode = queryParams.get("code")
    const authenticated = (Object.entries(userData).length > 0)
    let authTypeFromContext;
        Subscriber.subscribe('auth', (data) => {
    authTypeFromContext = data;
    });
    authTypeFromContext = localStorage.getItem("auth_type")
    console.log("error recieved ", auth, authTypeFromContext)

    useEffect(()=>{
        if (authenticated) {
                if (authTypeFromContext == "signup") {
                navigate('/business-setup');
                } else {
                navigate(`/dashboard/${userData?.user_type || 'client'}`);
                }
            } else {
                handleSocialAuth(authCode, mutationFunc, authTypeFromContext, socialType);
            }

    }, [authCode])

    useEffect(
        ()=>{
            if(data?.authorizeWithCode.data){
                console.log("entered into the if authorize check::::::::")
                const {user, token} = data.authorizeWithCode.data;
                console.log("user data directly from mutation before attempting to set in context and state::::: ", user, `token destructured::: ${token}`)
                localStorage.setItem("nearcash_token", token)
                updateUser(user)
            }
        }, [data]
    )
    console.log(`authenticated state::: ${authenticated}`)
    return (
        <div className="social-auth-handler w-full h-full border border-solid border-grey relative flex flex-col justify-center items-center">
            {authenticated ? (
                authTypeFromContext === 'signup' ? (
                <Navigate to="/business-setup" replace />
                ) : (
                <Navigate to={`/dashboard/${userData?.auth_type || 'client'}`} replace />
                )
            ) : (
                <div className="flex-1 relative">
                <Spinner />
                </div>
            )}
        </div>
    )
}