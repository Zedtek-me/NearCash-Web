import React, { createContext, useEffect, useState, useContext } from "react";
import { checkCurrentSession } from "../../utils/auths";
import { useLazyQuery } from "@apollo/client";
import { CURRENT_USER } from "./queries/userQueries.js"

export const AuthContext = createContext(null)

const AuthProvider = ({ children }) => {
    const [userData, setUserData] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [btnContext, setBtnContext] = useState({login: true, signup: false})
    const [ fetchUser, { data } ] = useLazyQuery(CURRENT_USER)

    const updateUser = (user) => {
      setUserData(user);
    };
  
    const clearUser = () => {
      setUserData(null);
      localStorage.removeItem("nearcash_token");
    };
    const updateBtn = (btnValue)=>{
        setBtnContext(btnValue)
    }

    // useEffect(() => {
    //     let sessionToken = checkCurrentSession();
    //     if(sessionToken){
    //         fetchUser().then((result)=>{
    //             if(result.data){
    //                 const { user: newUserData } = data;
    //                 setIsLoading(false)
    //                 updateUser(newUserData);
    //             }
    //         })
    //     }
    // }, [])
  
    return (
      <AuthContext.Provider value={{
        userData,
        updateUser,
        clearUser,
        updateBtn,
        btnContext,
        isLoading,
        setIsLoading
      }}>
        {children}
      </AuthContext.Provider>
    );
  };

export default AuthProvider;