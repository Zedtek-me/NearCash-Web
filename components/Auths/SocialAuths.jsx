import React, { useState, useEffect, useContext } from "react";
import { useSearchParams, useNavigate } from "react-router";
import Loader from "./Loader.jsx"
import { handleSocialAuth } from "../../utils/auths.js";
import { useMutation } from "@apollo/client";
import { AUTHORIZE_WITH_SOCIAL_CODE } from "./mutations/userMutations.js";
import { AuthContext } from "../../src/App.jsx";



export default function SocialAuth({ authType, socialType }){
    const [authenticated, setAuthenticated] = useState(false);
    const [userData, setUserData] = useState({});
    const [queryParams, _] = useSearchParams();
    const currentContextVal = useContext(AuthContext);
    const navigate = useNavigate()
    const [ mutationFunc, { loading, error, data } ] = useMutation(AUTHORIZE_WITH_SOCIAL_CODE)
    let authCode = queryParams.get("code")
    console.log("error recieved ", error, "data received: ", data, "loading state:: ", loading)
    useEffect(()=>{
        (
            authenticated ? navigate(`/dashboard/${(userData?.user_type || "client")}`) :
            handleSocialAuth(authCode, mutationFunc, authType, socialType)
        )

    }, [authCode])
    if(data?.authorizeWithCode){
        let user = data.authorizeWithCode.data;
        currentContextVal.userData = user
        setUserData(user)
        setAuthenticated(true)
    }
    return (
        <div className="social-auth-handler w-full h-full border border-solid border-grey relative flex flex-col justify-center items-center">
            <p className="auth-text flex justify-between items-center text-center my-2">
                Authenticating...
            </p>
            <Loader extraStyles={"my-2 border-2 border-solid border-black"}/>
        </div>
    )
}