import React from "react";
import { NavLink, Link } from "react-router";


const Headers = () => {
    return (
        <div className="headers">
            <NavLink to="/" className="header__link">Header one</NavLink>
            <NavLink to="/" className="header__link">Header two</NavLink>
            <NavLink to="/" className="header__link">Header three</NavLink>
        </div>
    )
}
export default Headers;
