import React from "react";
import { useNavigate } from "react-router";
import { ArrowRight, Check, MapPin, ShieldCheck, WalletCards } from "lucide-react";
import useAuth from "../../hooks/useAuth";

export default function GetStarted() {
  const navigate = useNavigate();
  const { updateBtn } = useAuth();

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-5 text-white sm:px-8 sm:py-7">
      <div className="mx-auto flex min-h-[calc(100vh-3.5rem)] max-w-7xl flex-col">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500 text-white shadow-lg shadow-indigo-950/30">
              <MapPin size={20} strokeWidth={2.2} aria-hidden="true" />
            </span>
            <div>
              <p className="text-lg font-semibold tracking-tight">NearCash</p>
              <p className="text-[11px] font-medium tracking-wide text-slate-400">BY CADENCEPAY</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => handelAuthNavigate({ target: { name: "Login" } }, navigate, updateBtn)}
            className="rounded-lg px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-white/10 hover:text-white"
          >
            Log in
          </button>
        </header>

        <section className="my-auto grid items-center gap-12 py-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-20 lg:py-20">
          <div className="max-w-2xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-slate-300">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
              Cash access, built around your network
            </div>
            <h1 className="text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
              Move money with
              <span className="block text-indigo-300">more confidence.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-slate-300 sm:text-lg sm:leading-8">
              NearCash connects people and cash vendors, making it easier to find liquidity,
              agree on the details, and keep every transaction visible.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                name="Sign Up"
                onClick={(event) => handelAuthNavigate(event, navigate, updateBtn)}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-indigo-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-950/30 transition hover:bg-indigo-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
              >
                Create your account <ArrowRight size={16} aria-hidden="true" />
              </button>
              <button
                type="button"
                name="Login"
                onClick={(event) => handelAuthNavigate(event, navigate, updateBtn)}
                className="min-h-12 rounded-xl border border-white/15 px-6 py-3 text-sm font-semibold text-white transition hover:border-white/30 hover:bg-white/[0.06]"
              >
                I already have an account
              </button>
            </div>

            <div className="mt-9 flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-400">
              <span className="inline-flex items-center gap-2"><ShieldCheck size={16} className="text-indigo-300" /> Verified accounts</span>
              <span className="inline-flex items-center gap-2"><Check size={16} className="text-indigo-300" /> Clear transaction status</span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-xl">
            <div aria-hidden="true" className="absolute -inset-8 rounded-[2rem] bg-indigo-500/15 blur-3xl" />
            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-2xl shadow-black/30">
              <div className="flex items-center justify-between border-b border-white/10 px-5 py-4 sm:px-6">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/15 text-indigo-300">
                    <WalletCards size={18} aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-white">One marketplace</p>
                    <p className="mt-0.5 text-xs text-slate-400">For clients and cash vendors</p>
                  </div>
                </div>
                <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[11px] font-medium text-emerald-300">
                  NearCash
                </span>
              </div>

              <div className="p-5 sm:p-6">
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">How it works</p>
                <div className="mt-5 space-y-3">
                  {[
                    ["01", "Find liquidity", "Browse nearby vendors or source cash from another vendor."],
                    ["02", "Agree on the details", "Review the amount, collection method, and charges."],
                    ["03", "Track the transaction", "Follow status updates from request through completion."],
                  ].map(([number, title, detail]) => (
                    <div key={number} className="flex gap-4 rounded-xl border border-white/[0.07] bg-white/[0.025] p-4">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.06] text-xs font-semibold text-indigo-200">{number}</span>
                      <div>
                        <p className="text-sm font-semibold text-slate-100">{title}</p>
                        <p className="mt-1 text-xs leading-5 text-slate-400">{detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="mt-5 border-t border-white/10 pt-4 text-xs leading-5 text-slate-500">
                  Availability depends on participating vendors and their current liquidity.
                </p>
              </div>
            </div>
          </div>
        </section>

        <footer className="flex flex-col gap-2 border-t border-white/10 pt-5 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} CadencePay</span>
          <span>Built for clearer cash transactions.</span>
        </footer>
      </div>
    </main>
  );
}

export const handelAuthNavigate = (event, navigate, updateBtn) => {
  const name = event.currentTarget?.name?.toLowerCase() || event.target?.name?.toLowerCase();
  const isLogin = name === "login";
  updateBtn({ login: isLogin, signup: !isLogin });
  navigate(isLogin ? "/auth/login" : "/auth/signup");
};
