import React from "react";
import { Outlet } from "react-router";


const Layout = () => {
    return (
        <div className="layout">
            <Outlet/>
        </div>
    )
}

export default Layout;
