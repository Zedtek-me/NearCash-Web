import React, { useContext } from "react";
import { useNavigate } from "react-router";
import { AuthContext } from "../../src/App.jsx";
import PointingFinger from "../../assets/images/fingerTapping1.jpg"
;
export default function GetStarted(){
    const navigator = useNavigate()
    const currentContextVal = useContext(AuthContext);
    return (
        <div className="get-started flex flex-col justify-between items-center bg-black text-white w-screen h-screen p-5 pt-12">
            <div className="started-txt w-full text-left">
                <h1 className="text-4xl font-bold mb-2">Get Started!</h1>
                <p className="text-gray-300 text-sm leading-relaxed">An easy way vendors and clients of POS connect anywhere in Nigeria.</p>
            </div>

            <div className="center-wave w-full relative self-center flex flex-col justify-center items-center h-96">
                <div className="ripple-container relative flex justify-center items-center w-80 h-80">
                    {[...Array(8)].map((_, i) => (
                        <div
                            key={i}
                            className="absolute rounded-full border border-gray-600"
                            style={{
                                width: `${80 + (i * 35)}px`,
                                height: `${80 + (i * 35)}px`,
                                opacity: 0.3 - (i * 0.03),
                                animation: `ripple ${3 + (i * 0.5)}s infinite linear`
                            }}
                        />
                    ))}
                    
                    <div className=" relative cursor-pointer bg-white rounded-full w-16 h-16 flex justify-center items-center shadow-lg animate-pulse">
                        <div className="absolute inset-0 bg-white rounded-full animate-ping opacity-30"></div>
                        <img 
                            src={PointingFinger} 
                            alt="pointing finger" 
                            className="w-10 h-10 object-cover rounded-full relative z-10"
                        />
                    </div>
                </div>
            </div>

            <div className="cta-btns flex flex-row justify-center items-center gap-4 w-full px-4 pb-8">
                <button 
                    type="button" 
                    name="Login" 
                    onClick={(e) => handelAuthNavigate(e, navigator, {context: currentContextVal})}
                    className="get-started-login-prompt border-2 border-solid rounded-full border-white flex-1 max-w-36 py-3 px-6 font-medium transition-all hover:bg-white hover:text-black"
                >
                    Login
                </button>
                <button 
                    type="button" 
                    name="Sign Up" 
                    onClick={(e) => handelAuthNavigate(e, navigator, {context: currentContextVal})}
                    className="get-started-signup-prompt rounded-full bg-white text-black flex-1 max-w-36 py-3 px-6 font-medium hover:bg-gray-100 transition-all"
                >
                    Sign up
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