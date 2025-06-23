import React, { useState } from "react";
import { handleSubmit, handleState } from "../../utils/auths.js";
import Loader from "./Loader.jsx";
import { FcGoogle } from "react-icons/fc";
import { HiOutlineMail } from "react-icons/hi";
import { MdLockOutline } from "react-icons/md";
import { IoEyeOffOutline, IoEyeOutline } from "react-icons/io5";
import useAuth from "../../Hooks/Auths.js";
import { useStateValue } from "../../providers/stateProvider.jsx";
import { useMutation } from "@apollo/client";
import { LOGIN, SIGNUP } from "./mutations/userMutations.js";
import { useNavigate } from "react-router";

export default function Login(){
  const [data, setData] = useState({})
  const { isLoading: loading, setIsLoading: setLoading, updateUser } = useAuth()
  const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate()

     const [
    {
      auth,
    },
    dispatch
  ] = Object.values(useStateValue());

    const [getAuthUrl, { loading: googleLoading }] = useMutation(LOGIN, {
  onCompleted: (data) => {
    const url = data?.login?.data?.authUrl;
    
    if (url) {
      window.location.href = url;
    }
  },
  onError: (err) => {
    console.error("Failed to get Google Auth URL", err);
  }
});

 const handleGoogleSignIn = async () => {

   dispatch({
      type: AuthActionTypes.SET_AUTH_TYPE,
      payload: 'login'
    });
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

const handleLoginUpWithEmail =  () => {

   dispatch({
      type: AuthActionTypes.SET_AUTH_TYPE,
      payload: 'login'
    });
     getAuthUrl({
      variables: {
        data: {
          email: data.email,
          password: data.password,
        }
      }
    }).then(({ data }) => {
          const {user, token} = data.login.data;
          localStorage.setItem("nearcash_token", token)
          updateUser(user)
          navigate('/dashboard');
          toast.success(message);
        })
        .catch((err) => {
          toast.error(err?.message);
        })
    };

  return (
    <div className="w-full md:w-1/3 pt-8">
      <div 
        className="flex flex-col space-y-6"
      >
        <div className="relative">
          <div className="flex items-center bg-white rounded-[50px] px-4 py-2 border border-gray-200">
            <HiOutlineMail className="w-5 h-5 text-gray-500 mr-3" />
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
            <MdLockOutline className="w-5 h-5 text-gray-500 mr-3" />
            <div className="flex-1">
              <label htmlFor="password" className="block text-xs text-gray-500 ">Password</label>
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
              {showPassword ? <IoEyeOffOutline className="w-4 h-4" /> : <IoEyeOutline className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <input 
              type="checkbox" 
              id="remember" 
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="remember" className="ml-2 text-sm text-gray-700">
              Remember me
            </label>
          </div>
          <button type="button" className="text-sm text-blue-600 hover:text-blue-800">
            Forgot password?
          </button>
        </div>

        <div className="pt-4">
          {googleLoading ? (
            <div className="w-full bg-black text-white py-4 rounded-full flex justify-center items-center">
              <Loader />
            </div>
          ) : (
            <button 
              type="submit" 
              onClick={handleLoginUpWithEmail}
              className="w-full bg-black text-white py-4 rounded-full font-medium hover:bg-gray-800 transition-colors"
            >
              Login
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
            className="flex-1 flex items-center justify-center py-3 px-4 border border-gray-300 rounded-[50px] hover:bg-gray-50 transition-colors"
          >
            <FcGoogle  
              disabled={googleLoading}
              onClick={handleGoogleSignIn}
                className="w-5 h-5 mr-2" />
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
    </div>
    </div>
  );
}
