import React, { useState } from "react";


const ConvertAmount = () => {
    const [ sourceCurrency, setSourceCurrency ] = useState("")
    const [ destinationCurrency, setDestinationCurrency ] = useState("")

    return (
        <div className="convert-amount flex justify-center 
        items-center flex-nowrap text-black"
        >
            <div className="rate-data flex flex-row justify-start items-center p-5">
                <label className="m-5">From: </label>
                <select className="soure-currency m-5">
                    <option className="source-curr-opt">
                        NGN
                    </option>
                    <option className="source-curr-opt">
                        GHS
                    </option>
                    <option className="source-curr-opt">
                        CAD
                    </option>
                    <option className="source-curr-opt">
                        USD
                    </option>
                </select>
                <div className="source-amount">
                    <input type="text" name="source-amount" id="" inputMode="number"
                    className="w-[70%]"
                    />
                </div>
                <label className="m-5">To: </label>
                <select className="soure-currency m-5">
                    <option className="source-curr-opt">
                        USD
                    </option>
                    <option className="source-curr-opt">
                        CAD
                    </option>
                    <option className="source-curr-opt">
                        GHS
                    </option>
                    <option className="source-curr-opt">
                        NGN
                    </option>
                </select>
            </div>
        </div>
    )
}

export default ConvertAmount;
