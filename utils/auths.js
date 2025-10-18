import React from "react";

import axios from "axios";
import { nav } from "framer-motion/client";
import { redirect, useNavigate } from "react-router";
import toast from "react-hot-toast";

const axiosInstance = axios.create({
    baseURL: process.env.NEARCASH_REST_API_URL,
    allowAbsoluteUrls: true,
});

export async function handleSubmit(e, setLoader, data, submitSource="login"){
    e.preventDefault()
    setLoader(true)
    console.log("data to send to the backend::: ", data)
    let endpoint = submitSource === "login" ? "/auth/login" : "/auth/signup";
    // setTimeout(() => setLoader(false), 2000)
    let response = await requestHandler(endpoint, "post", data)
    console.log("response from the backend::: ", response)
    setLoader(false)
    if(response.status === 200){
        let { token, user } = response.data;
        localStorage.setItem("nearcash_token", token);
        let { user_type } = user
        user_type?.toLowerCase() === "vendor" ? redirect("/dashboard") : redirect("/dashboard/client");
    }
}

export function handleState(e, stateSetter){
    let { name, value } = e.target;
    console.log(`name: ${name}\n value: ${value}`)
    stateSetter((prevState) => ({...prevState, [name]: value}));
}


export function checkAuthWithRest(userStateSetter){
    /**determines if user has a current session.
     * if so, updates the user state with the user info
     */
    let authToken = localStorage.getItem("nearcash_token")
    if(!authToken) return;
    let headers = {
        "Authorization": `Bearer ${authToken}`,
        "Content-Type": "application/json",
        "Accept": "application/json"
    }
    axiosInstance.get("/auth/user", { headers })
        .then((response) => {
            console.log("user info::: ", response.data)
            userStateSetter(response.data)
        })
        .catch((error) => {
            console.error("error::: ", error)
            userStateSetter(null)
        })
}

export async function requestHandler(endpoint, method="get", data={}, headers={}){
    try {
        let response;
        if(method.toLowerCase() === "get"){
            response = await axiosInstance.get(`${API_BASE}${endpoint}`, { headers });
            console.log("response from the backend... ", response)
            return response
        }
        response = await axiosInstance.post(`${API_BASE}${endpoint}`, data, { headers });
        console.log("response from the backend... ", response)
        return response
    }catch(error){
        console.error("Error in requestHandler: ", error);
        return {};
    }
}

export async function handleSocialAuth(authCode, gqlFunc, authType, socialType, navigate){
    await gqlFunc(
        {
            variables: {
                code: authCode,
                authType: authType,
                socialType: socialType
            },
            onError: (error) =>{
                console.log(`this is the error message returned: ${error.message}`)
                toast.error(`Invalid User!`);
                navigate("/auth/login");
            },
            onCompleted: (data) => {
                console.log("mutation completed! Data here::: ", data);
            }
        }
    )

}

export function checkCurrentSession(){
    let authToken = localStorage.getItem("nearcash_token")
   return authToken;
}

export const backArrowReturnFunc = (navigate) => {
    navigate(-1);
}