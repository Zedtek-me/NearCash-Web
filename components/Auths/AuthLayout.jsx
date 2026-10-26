import React from "react";
import { Outlet, useLocation, useNavigate } from "react-router";
import { ArrowLeft, Check, MapPin, ShieldCheck } from "lucide-react";
import useAuth from "../../hooks/useAuth.js";

const Layout = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { updateBtn } = useAuth();
  const isLogin = pathname !== "/auth/signup";

  const selectPage = (login) => {
    updateBtn({ login, signup: !login });
    navigate(login ? "/auth/login" : "/auth/signup");
  };

  return (
    <main className="min-h-screen bg-slate-100 p-3 text-slate-900 sm:p-6 lg:flex lg:items-center lg:justify-center">
      <div className="mx-auto flex min-h-[calc(100vh-1.5rem)] w-full max-w-6xl overflow-hidden rounded-2xl bg-white shadow-xl shadow-slate-900/10 sm:min-h-[calc(100vh-3rem)] sm:rounded-3xl lg:min-h-[740px]">
        <aside className="relative hidden w-[42%] flex-col justify-between overflow-hidden bg-slate-950 p-10 text-white lg:flex xl:p-12">
          <div aria-hidden="true" className="absolute -right-28 -top-24 h-80 w-80 rounded-full bg-indigo-500/20 blur-3xl" />
          <div aria-hidden="true" className="absolute -bottom-32 -left-24 h-80 w-80 rounded-full bg-indigo-700/20 blur-3xl" />

          <div className="relative">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500">
                <MapPin size={20} aria-hidden="true" />
              </span>
              <div>
                <p className="font-semibold tracking-tight">NearCash</p>
                <p className="text-[10px] font-medium tracking-[0.16em] text-slate-400">BY CADENCEPAY</p>
              </div>
            </div>

            <div className="mt-24 max-w-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-300">A clearer way to access cash</p>
              <h1 className="mt-4 text-4xl font-semibold leading-tight tracking-tight xl:text-[2.75rem]">
                Liquidity works better when it’s connected.
              </h1>
              <p className="mt-5 text-sm leading-7 text-slate-300">
                Connect with cash vendors, review the terms, and keep track of your transactions in one place.
              </p>
            </div>
          </div>

          <div className="relative space-y-3 border-t border-white/10 pt-6 text-sm text-slate-300">
            <p className="flex items-center gap-2.5"><Check size={16} className="text-indigo-300" /> Clear transaction status</p>
            <p className="flex items-center gap-2.5"><Check size={16} className="text-indigo-300" /> Local and vendor-to-vendor flows</p>
            <p className="mt-6 flex items-center gap-2 text-xs text-slate-500"><ShieldCheck size={14} /> Sign in to continue to your account</p>
          </div>
        </aside>

        <section className="flex w-full flex-col px-5 py-5 sm:px-10 sm:py-8 lg:w-[58%] lg:px-14 xl:px-20">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => navigate("/")}
              aria-label="Go back"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
            >
              <ArrowLeft size={17} aria-hidden="true" />
            </button>
            <div className="flex items-center gap-2 text-xs text-slate-500 lg:hidden">
              <MapPin size={15} className="text-indigo-600" />
              <span className="font-semibold text-slate-800">NearCash</span>
            </div>
          </div>

          <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-8 sm:py-10">
            <div className="mb-7">
              <p className="text-sm font-semibold text-indigo-600">Welcome to NearCash</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
                {isLogin ? "Sign in to your account" : "Create your account"}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                {isLogin ? "Continue to your NearCash dashboard." : "Get started as a client or a cash vendor."}
              </p>
            </div>

            <div className="grid grid-cols-2 rounded-xl bg-slate-100 p-1" role="tablist" aria-label="Authentication">
              <button
                type="button"
                role="tab"
                aria-selected={isLogin}
                onClick={() => selectPage(true)}
                className={`rounded-lg px-4 py-2.5 text-sm font-semibold transition ${isLogin ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
              >
                Sign in
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={!isLogin}
                onClick={() => selectPage(false)}
                className={`rounded-lg px-4 py-2.5 text-sm font-semibold transition ${!isLogin ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
              >
                Create account
              </button>
            </div>

            <div className="w-full">
              <Outlet />
            </div>
          </div>

          <p className="text-center text-xs text-slate-400">© {new Date().getFullYear()} CadencePay · NearCash</p>
        </section>
      </div>
    </main>
  );
};

export default Layout;
