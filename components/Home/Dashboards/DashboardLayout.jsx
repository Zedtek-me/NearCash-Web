import React, { useState, createContext } from "react";
import { Outlet } from "react-router";


export default function Layout(){
    return (
        <div className="dashboard-layout">
            <Outlet/>
        </div>
    )
}