import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Navigate } from "react-router";
import { handleSocialAuth } from "../../utils/auths.js";
import { useMutation } from "@apollo/client";
import { AUTHORIZE_WITH_SOCIAL_CODE } from "./mutations/userMutations.js";
import useAuth from "../../hooks/useAuth.js";
import Spinner from "../../utils/components/spinner.jsx";


export default function SocialAuth({ authType, socialType }){
    const [queryParams, _] = useSearchParams();
    const { updateUser, userData } = useAuth()
    const navigate = useNavigate()
    const [ mutationFunc ] = useMutation(AUTHORIZE_WITH_SOCIAL_CODE)
    const authCode = queryParams.get("code")
    const [data, setData] = useState(null)
    
    const authenticated = (Object.entries(userData).length > 0)
   
    const authTypeFromContext = localStorage.getItem("auth_type")

    

    useEffect( ()=>{
        if (authenticated) {
                if (authTypeFromContext == "signup") {
                navigate('/business-setup');
                } else {
                navigate(`/dashboard/${userData?.user_type || 'client'}`);
                }
            } else {
                if(!data?.authorizeWithCode?.data){
                    handleSocialAuth(authCode, mutationFunc, authTypeFromContext, socialType, navigate).then((res) => {
                    setData(res);
                })
                }
                

            }

        
    }, [authCode])

    useEffect(
        ()=>{
            if(data?.authorizeWithCode.data){
                const {user, token} = data.authorizeWithCode.data;
                localStorage.setItem("nearcash_token", token)
                updateUser(user)
            }
        }, [data]
    )
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