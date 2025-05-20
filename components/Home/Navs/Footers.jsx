import React from "react";
import { NavLink, Link } from "react-router";

const Footers = () => {
    return (
        <div className="footer">
            <NavLink to="/" className="footer__link">Footer one</NavLink>
            <NavLink to="/" className="footer__link">Footer two</NavLink>
            <NavLink to="/" className="footer__link">Footer three</NavLink>
        </div>
    )
}

export default Footers;
