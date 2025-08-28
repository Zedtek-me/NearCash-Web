import React from "react";
import { LuLoader } from "react-icons/lu";


export default function Loader( { extraStyles } ) {
    return (
        <div className={
            "rounded-full w-60 h-6 p-2 bg-black text-white text-center flex flex-col justify-center items-center"
            + extraStyles
        }>
            <LuLoader className="h-full w-full loader"/>
        </div>
    )
}