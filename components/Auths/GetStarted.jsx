import React, { useContext } from "react";
import { useNavigate } from "react-router";
import { AuthContext } from "../../src/App.jsx";

export default function GetStarted(){
    const navigator = useNavigate()
    const currentContextVal = useContext(AuthContext);
    return (
        <div className="get-started flex flex-col justify-center items center">
            <p>Get started page................</p>
            <div className="cta-btns flex flex-row justify-around items-center">
                <button type="button" name="Login" onClick={(e)=> handelAuthNavigate(e, navigator, {context: currentContextVal})}>Login</button>
                <button type="button" name="Sign Up" onClick={(e)=> handelAuthNavigate(e, navigator, {context: currentContextVal})}>Sign Up</button>
            </div>
        </div>
    )
}


export const handelAuthNavigate = (e, navigator, { context }) => {
    let name = e.target.name.toLowerCase();
    if(name === "login"){
        let btnContext = {login: true, signup: false};
        context.btnContext = btnContext;
        navigator("/auth/login");
    }
    else {
        let btnContext = {login: false, signup: true};
        context.btnContext = btnContext;
        navigator("/auth/signup")
    };
}