import React, { useContext } from "react";
import { AuthContext } from "../components/Auths/AuthContextProvider.jsx";

const useAuth = ()=>{
    const context = useContext(AuthContext)
    if (!context) throw new Error("useAuth hook must be used within a context provider")
    return context;
}

export default useAuth;