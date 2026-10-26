import React, { useEffect, useState } from "react";
import { useMutation } from "@apollo/client";
import { AlertCircle, Bell, Loader2, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";
import { enableWebPush, isWebPushSupported } from "../../utils/webPush";
import { isFirebaseWebConfigured } from "../../configs/firebaseWeb";
import { REGISTER_FIREBASE_DEVICE } from "./mutations";
import useAuth from "../../hooks/useAuth";

export default function WebPushSettings() {
  const { userData } = useAuth();
  const userId = userData?.id;
  const [supported, setSupported] = useState(false);
  const [supportChecked, setSupportChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [registered, setRegistered] = useState(false);
  const [registrationChecked, setRegistrationChecked] = useState(false);
  const [registerDevice] = useMutation(REGISTER_FIREBASE_DEVICE);

  useEffect(() => {
    if (!userId) {
      setRegistrationChecked(false);
      return;
    }

    let hasRegistration = false;
    try {
      hasRegistration = Boolean(
        localStorage.getItem(`nearcash_web_push_installation:${userId}`)
      );
    } catch {
      // Storage may be disabled; still allow the user to enable push this session.
    }

    setRegistered(hasRegistration);
    setRegistrationChecked(true);
  }, [userId]);

  useEffect(() => {
    let active = true;
    isWebPushSupported().then((result) => {
      if (active) {
        setSupported(result);
        setSupportChecked(true);
      }
    });
    return () => { active = false; };
  }, []);

  const handleEnable = async () => {
    setLoading(true);
    setStatus("");
    try {
      const installationId = await enableWebPush();
      const { data } = await registerDevice({
        variables: { installationId },
      });
      const result = data?.registerFirebaseDevice;
      if (!result?.installationId) {
        throw new Error("The server did not confirm this browser registration.");
      }

      try {
        localStorage.setItem(
          `nearcash_web_push_installation:${userId}`,
          result.installationId
        );
      } catch (error) {
        console.error("Could not save this browser's Firebase registration locally.", error);
      }
      setRegistered(true);
      setStatus(result.message || "This browser is registered to your NearCash account.");
      toast.success("Browser notifications enabled.");
    } catch (error) {
      const message = error?.message || "Could not enable browser notifications.";
      setStatus(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const notConfigured = !isFirebaseWebConfigured;
  const availabilityMessage = notConfigured
    ? "Browser notifications aren’t configured for this build yet."
    : !supportChecked
      ? "Checking whether this browser supports notifications…"
      : !supported
        ? "This browser or connection can’t receive web push notifications."
        : "Your browser will ask for permission after you continue.";

  if (!userId || !registrationChecked || registered) return null;

  return (
    <section
      aria-labelledby="web-push-title"
      aria-busy={loading}
      className="relative mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-0 hidden w-1/3 bg-gradient-to-l from-indigo-50/80 to-transparent sm:block"
      />

      <div className="relative flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex min-w-0 items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 ring-1 ring-inset ring-indigo-100">
            <Bell size={22} strokeWidth={1.8} aria-hidden="true" />
          </div>

          <div className="min-w-0">
            <p className="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-indigo-600">
              Stay up to date
            </p>
            <h2 id="web-push-title" className="text-base font-semibold text-slate-900 sm:text-lg">
              Get important NearCash updates
            </h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
              Receive alerts about transaction updates and account activity that may need your attention.
            </p>

            <div className="mt-3 flex items-start gap-2 text-xs leading-5 text-slate-500">
              <ShieldCheck size={15} className="mt-0.5 shrink-0 text-slate-400" aria-hidden="true" />
              <span>{availabilityMessage} You can change permission later in your browser settings.</span>
            </div>

            {status && (
              <p className="mt-3 flex items-start gap-2 text-sm leading-5 text-rose-700" role="alert">
                <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
                <span>{status}</span>
              </p>
            )}
          </div>
        </div>

        <div className="flex shrink-0 flex-col gap-2 sm:items-end">
          <button
            type="button"
            onClick={handleEnable}
            disabled={loading || !supportChecked || !supported || notConfigured}
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" aria-hidden="true" />
            ) : (
              <Bell size={16} aria-hidden="true" />
            )}
            {loading ? "Setting up…" : "Enable notifications"}
          </button>
          <span className="text-center text-xs text-slate-500 sm:text-right">
            Notifications start only after you allow them.
          </span>
        </div>
      </div>
    </section>
  );
}
