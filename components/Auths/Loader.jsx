import React from "react";
import { LuLoader } from "react-icons/lu";


export default function Loader( { extraStyles } ) {
    return (
        <div className={
            "flex h-6 w-60 flex-col items-center justify-center rounded-full bg-indigo-600 p-2 text-center text-white"
            + extraStyles
        }>
            <LuLoader className="h-full w-full loader"/>
        </div>
    )
}
