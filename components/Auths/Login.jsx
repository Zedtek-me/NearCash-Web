import React, { useState } from "react";
import { handleState } from "../../utils/auths.js";
import Loader from "./Loader.jsx";
import { FcGoogle } from "react-icons/fc";
import { HiOutlineMail } from "react-icons/hi";
import { MdLockOutline } from "react-icons/md";
import { IoEyeOffOutline, IoEyeOutline } from "react-icons/io5";
import useAuth from "../../hooks/useAuth.js";
import { useStateValue } from "../../providers/stateProvider.jsx";
import { useMutation } from "@apollo/client";
import { LOGIN } from "./mutations/userMutations.js";
import { useNavigate } from "react-router";
import AuthActionTypes from "../../providers/reducers/auth/authTypes.js";
import toast from "react-hot-toast";

export default function Login(){
  const [data, setData] = useState({})
  const { updateUser } = useAuth()
  const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate()

     const [, dispatch] = Object.values(useStateValue());

    const [getAuthUrl, { loading: googleLoading }] = useMutation(LOGIN, {
  onCompleted: (data) => {
    const url = data?.login?.data?.authUrl;
    
    if (url) {
      window.location.href = url;
    }
  },
  onError: (err) => {
    toast.error(err?.message || "Sign-in failed!");
  }
});

 const handleGoogleSignIn = async () => {
     localStorage.setItem("auth_type", "login");
      localStorage.removeItem('nearcash_token');


   dispatch({
      type: AuthActionTypes.SET_AUTH_TYPE,
      payload: 'login'
    });
  try {
    await getAuthUrl({
      variables: {
        signinWith: "GOOGLE"
      }
    });
  } catch (err) {
    console.error("Google Sign-in error", err);
  }
};

const handleLoginWithEmail =  () => {
      localStorage.removeItem('nearcash_token');

   dispatch({
      type: AuthActionTypes.SET_AUTH_TYPE,
      payload: 'login'
    });
     getAuthUrl({
      variables: {
          email: data.email,
          password: data.password,
      }
    }).then(({ data, error: err }) => {
          const {user, token} = data?.login?.data || {};
          if(!(token && user))return;
          localStorage.setItem("nearcash_token", token)
          updateUser(user)
          navigate(`/dashboard/${user?.userType?.toLowerCase() || 'client'}`);
          toast.success(data?.login?.message);
        })
        .catch((err) => {
          toast.error((err?.[0]?.message || "Login failed!"));
        })
    };

  return (
    <div className="auth-form w-full pt-7">
      <div 
        className="flex flex-col space-y-6"
      >
        <div className="relative">
          <div className="flex min-h-14 items-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 transition focus-within:border-indigo-400 focus-within:ring-4 focus-within:ring-indigo-50">
            <HiOutlineMail className="w-5 h-5 text-gray-500 mr-3" />
            <div className="flex-1">
              <label htmlFor="email" className="block text-xs text-gray-500">Email Address</label>
              <input 
                type="email" 
                name="email" 
                id="email" 
                onChange={(e) => handleState(e, setData)}
                className="w-full bg-transparent text-gray-900 placeholder-gray-400 focus:outline-none text-sm"
                placeholder="you@example.com"
              />
            </div>
          </div>
        </div>

        <div className="relative">
          <div className="flex min-h-14 items-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 transition focus-within:border-indigo-400 focus-within:ring-4 focus-within:ring-indigo-50">
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
              className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="remember" className="ml-2 text-sm text-gray-700">
              Remember me
            </label>
          </div>
          <button type="button" className="text-sm font-medium text-indigo-600 transition hover:text-indigo-800">
            Forgot password?
          </button>
        </div>

        <div className="pt-4">
          {googleLoading ? (
            <div className="flex min-h-12 w-full items-center justify-center rounded-xl bg-slate-900 py-3 text-white">
              <Loader />
            </div>
          ) : (
            <button 
              type="submit" 
              onClick={handleLoginWithEmail}
              className="min-h-12 w-full rounded-xl bg-indigo-600 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
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
            <span className="bg-white px-4 text-slate-400">Or continue with</span>
          </div>
        </div>

        <div className="flex space-x-4">
          <button 
            type="button"
            className="flex min-h-12 flex-1 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-3 transition hover:bg-slate-50"
            disabled={googleLoading}
              onClick={handleGoogleSignIn}
          >
            <FcGoogle  
              
                className="w-5 h-5 mr-2" />
            <span className="text-sm font-medium text-gray-700">Google</span>
          </button>
        </div>
    </div>
    </div>
  );
}
