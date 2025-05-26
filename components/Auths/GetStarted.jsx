import React, { useContext } from "react";
import { useNavigate } from "react-router";
import { AuthContext } from "../../src/App.jsx";

export default function GetStarted(){
    const navigator = useNavigate()
    const currentContextVal = useContext(AuthContext);
    return (
        <div className="get-started flex flex-col justify-between items-center bg-black text-white w-screen h-screen p-5">
            <div className="started-txt w-full text-left">
                <h1 className="text-3xl font-bold">Get Started</h1>
                <p className="text-3 flex flex-row flex-wrap break-words">An easy way vendors and clients of POS connect anywhere in Nigeria.</p>
            </div>
            <div className="center-wave w-full relative self-center flex flex-col justify-center items-center h-72">
                {[...Array(16)].map((_, i) => (
                <div
                    key={i}
                    className="absolute border border-gray-600 rounded-full self-center"
                    style={{
                        width: `${(i + 1) * 32}px`,
                        height: `${(i + 1) * 32}px`,
                        top: `${128 - (i + 1) * 16}px`,
                        left: `${128 - (i + 1) * 16}px`,
                    }}
                />
                ))}
            </div>
            <div className="cta-btns flex flex-row justify-around items-center text-center w-1/2 p-4">
                <button type="button" name="Login" onClick={
                    (e)=> handelAuthNavigate(e, navigator, {context: currentContextVal})
                } className="get-started-login-prompt border-2 border-solid rounded-3xl border-white w-48 p-2 font-bold transition-all">
                    Login
                </button>
                <button type="button" name="Sign Up" onClick={
                        (e)=> handelAuthNavigate(e, navigator, {context: currentContextVal})
                    }
                    className="get-started-signup-prompt rounded-3xl bg-white text-black w-48 p-2 font-bold">
                    Sign Up
                </button>
            </div>
        </div>
    )
}


export const handelAuthNavigate = (e, navigator, { context }) => {
    let name = e.target.name.toLowerCase();
    if(name === "login"){
        let btnContext = {login: true, signup: false};
        context.btnContext = btnContext;
        setTimeout(()=> navigator("/auth/login"), 200);
    }
    else {
        let btnContext = {login: false, signup: true};
        context.btnContext = btnContext;
        setTimeout(()=> navigator("/auth/signup"), 200);
    };
}