import React, { useState } from "react";
import { useNavigate } from "react-router";


export default function FxRatePage(){
    const [ sourceCurrency, setSourceCurrency ] = useState("")
    const [ destinationCurrency, setDestinationCurrency ] = useState("")
    const navigate = useNavigate()

    return (
        <div className="fx-rate-page min-h-[100vh] text-white
            flex flex-col justify-center items-center
            text-center bg-gradient-to-br from-indigo-500 to-indigo-600 text-lg font-bold"
        >
            <div className="rate-data flex flex-wrap
            justify-between items-center"
            >
                <button type="button" className="text-left m-5
                bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900
                rounded-md p-2 text-nowrap self-start
                "
                    onClick={() => (
                        navigate("/get-rate")
                    )}
                    inputMode="none"
                >
                    Get Exchange Rate
                </button>
                <button type="button" className="text-left m-5
                bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900
                rounded-md p-2 text-nowrap self-start
                "
                title="Convert an amount from source to destination currency."
                onClick={() => (
                    navigate("/convert-amount")
                )}
                inputMode="none"
                >
                    Convert Currency Amount
                </button>
            </div>
        </div>
    )
}