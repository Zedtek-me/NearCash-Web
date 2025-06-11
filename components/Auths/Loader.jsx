import React from "react";
import { LuLoader } from "react-icons/lu";


export default function Loader( { extraStyles } ) {
    return (
        <div className={
            "rounded-full w-60 h-fit p-2 border-black bg-blue-500 text-white text-center flex flex-col justify-center items-center"
            + extraStyles
        }>
            <LuLoader className="h-full w-full loader"/>
        </div>
    )
}