import React, { useState, createContext } from "react";
import { Outlet } from "react-router";
import Header from "../Navs/Headers.jsx"
import Footer from "../Navs/Footers.jsx"


export default function Layout(){
    return (
        <div className="dashboard-layout">
            <Header/>
                <div className="dashboard-out text-white">
                    <Outlet/>
                </div>
            <Footer/>
        </div>
    )
}