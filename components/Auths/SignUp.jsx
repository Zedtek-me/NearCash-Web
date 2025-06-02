import React, { useState } from "react";
import { handleSubmit, handleState } from "../../utils/auths.js";
import Loader from "./Loader.jsx";
import { MdEmail, MdLockOutline } from "react-icons/md";
import { IoEyeOffOutline, IoEyeOutline } from "react-icons/io5";

export default function SignUp(){
    const [data, setData] = useState({})
    const [loading, setLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    return (
        <div className="w-full md:w-1/3 pt-8">
            <div className="flex flex-col space-y-6">
                <div className="relative">
                    <div className="flex items-center bg-white rounded-[50px] px-4 py-2 border border-gray-200">
                        <div className="flex items-center justify-center w-6 h-6 mr-3">
                            <MdEmail className="w-5 h-5 text-gray-500" />
                        </div>
                        <div className="flex-1">
                            <label htmlFor="email" className="block text-xs text-gray-500">Email Address</label>
                            <input 
                                type="email" 
                                name="email" 
                                id="email" 
                                onChange={(e) => handleState(e, setData)}
                                className="w-full bg-transparent text-gray-900 placeholder-gray-400 focus:outline-none text-sm"
                                placeholder="uimasann977@gmail.com"
                            />
                        </div>
                    </div>
                </div>

                <div className="relative">
                    <div className="flex items-center bg-white rounded-[50px] px-4 py-2 border border-gray-200">
                        <div className="flex items-center justify-center w-6 h-6 mr-3">
                            <MdLockOutline className="w-5 h-5 text-gray-500" />
                        </div>
                        <div className="flex-1">
                            <label htmlFor="password" className="block text-xs text-gray-500">Password</label>
                            <input 
                                type={showPassword ? "text" : "password"}
                                name="password" 
                                id="password" 
                                onChange={(e) => handleState(e, setData)}
                                className="w-full bg-transparent text-gray-900 placeholder-gray-400 focus:outline-none text-sm"
                                placeholder="••••••••••••"
                            />
                        </div>
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="flex items-center justify-center w-6 h-6 ml-3 text-gray-400 hover:text-gray-600"
                        >
                            {showPassword ? <IoEyeOffOutline className="w-5 h-5" /> : <IoEyeOutline className="w-5 h-5" />}
                        </button>
                    </div>
                </div>

                <div className="relative">
                    <div className="flex items-center bg-white rounded-[50px] px-4 py-2 border border-gray-200">
                        <div className="flex items-center justify-center w-6 h-6 mr-3">
                            <MdLockOutline className="w-5 h-5 text-gray-500" />
                        </div>
                        <div className="flex-1">
                            <label htmlFor="confirmPassword" className="block text-xs text-gray-500">Confirm password</label>
                            <input 
                                type={showConfirmPassword ? "text" : "password"}
                                name="confirmPassword" 
                                id="confirmPassword" 
                                onChange={(e) => handleState(e, setData)}
                                className="w-full bg-transparent text-gray-900 placeholder-gray-400 focus:outline-none text-sm"
                                placeholder="••••••••••••"
                            />
                        </div>
                        <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="flex items-center justify-center w-6 h-6 ml-3 text-gray-400 hover:text-gray-600"
                        >
                            {showConfirmPassword ? <IoEyeOffOutline className="w-5 h-5" /> : <IoEyeOutline className="w-5 h-5" />}
                        </button>
                    </div>
                </div>

                <div className="pt-20">
                    {loading ? (
                        <div className="w-full bg-black text-white py-4 rounded-full flex justify-center items-center">
                            <Loader />
                        </div>
                    ) : (
                        <button 
                            type="submit" 
                            onClick={async (e) => await handleSubmit(e, setLoading, data, "signup")}
                            className="w-full bg-black text-white py-4 rounded-full font-medium hover:bg-gray-800 transition-colors"
                        >
                            Signup
                        </button>
                    )}
                </div>

                <div className="text-center pt-2">
                    <span className="text-gray-600 text-sm">Already have an account? </span>
                    <button type="button" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                        Login
                    </button>
                </div>
            </div>
        </div>
    );
}
