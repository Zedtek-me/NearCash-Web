import React, { useState } from "react";
import { handleSubmit, handleState } from "../../utils/auths.js";
import Loader from "./Loader.jsx";
import { MdEmail, MdLockOutline } from "react-icons/md";
import { IoEyeOffOutline, IoEyeOutline } from "react-icons/io5";
import { FcGoogle } from "react-icons/fc";
import { FaFacebook } from "react-icons/fa";
import { SIGNUP } from "./mutations/userMutations.js";
import { useMutation } from "@apollo/client";
import { useStateValue } from "../../providers/stateProvider.jsx";
import AuthActionTypes from "../../providers/reducers/auth/authTypes.js";
import useAuth from "../../Hooks/Auths.js";
import { toast } from "react-toastify";
import { useNavigate } from "react-router";
import { Subscriber } from "../../utils/subscriber.js";

export default function SignUp(){
    const [data, setData] = useState({})
    const [loading, setLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const { updateUser, clearUser, userData } = useAuth()
    const navigate = useNavigate()
     const [
    {
      auth,
    },
    dispatch
  ] = Object.values(useStateValue());

    const [getAuthUrl, { loading: googleLoading }] = useMutation(SIGNUP, {
  onCompleted: (data) => {
    const url = data?.signup?.data?.authUrl;
    
    if (url) {
      window.location.href = url;
    }
  },
  onError: (err) => {
    console.error("Failed to get Google Auth URL", err);
  }
});

 const handleGoogleSignIn = async () => {
     
      localStorage.removeItem('nearcash_token');
     


   dispatch({
      type: AuthActionTypes.SET_AUTH_TYPE,
      payload: 'signup'
    });
     Subscriber.report('auth', 'signup');
     localStorage.setItem("auth_type", "signup");
  try {
    await getAuthUrl({
      variables: {
        signUpWith: "GOOGLE"
      }
    });
  } catch (err) {
    console.error("Google Sign-in error", err);
  }
};

const handleSignUpWithEmail =  () => {
      localStorage.removeItem('nearcash_token');

      if (!data.firstName || !data.lastName || !data.email || !data.password) {
      toast.error("Please fill in all fields");
      return;
    }

   dispatch({
      type: AuthActionTypes.SET_AUTH_TYPE,
      payload: 'signup'
    });
     getAuthUrl({
      variables: {
        data: {
          email: data.email,
          password: data.password,
          firstName: data.firstName,
          lastName: data.lastName,
        }
      }
    }).then(({ data }) => {
          const {user, token} = data.signup.data;
          localStorage.setItem("nearcash_token", token)
          updateUser(user)
          navigate('/business-setup');
          toast.success(message);
        })
        .catch((err) => {
          toast.error(err?.message);
        })
    };

    return (
        <div className="w-full md:w-1/3 pt-8">
            <div className="flex flex-col space-y-6">
              <div className="relative">
          <div className="flex items-center bg-white rounded-[50px] px-4 py-2 border border-gray-200">
            <div className="flex-1">
              <label htmlFor="firstName" className="block text-xs text-gray-500">
                First Name
              </label>
              <input
                type="text"
                name="firstName"
                id="firstName"
                onChange={(e) => handleState(e, setData)}
                className="w-full bg-transparent text-gray-900 placeholder-gray-400 focus:outline-none text-sm"
                placeholder="John"
              />
            </div>
          </div>
        </div>

        {/* LAST NAME */}
        <div className="relative">
          <div className="flex items-center bg-white rounded-[50px] px-4 py-2 border border-gray-200">
            <div className="flex-1">
              <label htmlFor="lastName" className="block text-xs text-gray-500">
                Last Name
              </label>
              <input
                type="text"
                name="lastName"
                id="lastName"
                onChange={(e) => handleState(e, setData)}
                className="w-full bg-transparent text-gray-900 placeholder-gray-400 focus:outline-none text-sm"
                placeholder="Doe"
              />
            </div>
          </div>
        </div>
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

                <div className="pt-10">
                    {googleLoading ? (
                        <div className="w-full bg-black text-white py-4 rounded-full flex justify-center items-center">
                            <Loader />
                        </div>
                    ) : (
                        <button 
                            type="submit" 
                            onClick={handleSignUpWithEmail}
                            className="w-full bg-black text-white py-4 rounded-full font-medium hover:bg-gray-800 transition-colors"
                        >
                            Signup
                        </button>
                    )}
                </div>
                 <div className="relative py-4">
                          <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-200"></div>
                          </div>
                          <div className="relative flex justify-center text-sm">
                            <span className="px-4 bg-white text-gray-500">Or</span>
                          </div>
                        </div>
                
                        <div className="flex space-x-4">
                          <button 
                            type="button"
                            disabled={googleLoading}
                            onClick={handleGoogleSignIn}
                            className="flex-1 flex items-center justify-center py-3 px-4 border border-gray-300 rounded-[50px] hover:bg-gray-50 transition-colors"
                          >
                            <FcGoogle className="w-5 h-5 mr-2" />
                            <span className="text-sm font-medium text-gray-700">Google</span>
                          </button>
                          {/* <button 
                            type="button"
                            className="flex-1 flex items-center justify-center py-3 px-4 border border-gray-300 rounded-[50px] hover:bg-gray-50 transition-colors"
                          >
                            <FaFacebook className="w-5 h-5 mr-2 text-blue-600" />
                            <span className="text-sm font-medium">Facebook</span>
                          </button> */}
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
