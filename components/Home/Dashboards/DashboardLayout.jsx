import React from "react";
import { Outlet } from "react-router";
import Navbar from "../Navs/Headers.jsx"
import Footer from "../Navs/Footers.jsx"


export default function Layout(){
    return (
        <div className="dashboard-layout">
            <Navbar/>
                <div className="dashboard-out text-white">
                    <Outlet/>
                </div>
            <Footer/>
        </div>
    )
}