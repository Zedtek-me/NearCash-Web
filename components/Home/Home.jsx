import React from "react";
import Header from "./Navs/Headers.jsx";
import Footer from "./Navs/Footers.jsx";


const Home = ({ children }) => {
    return (
        <div className="home">
            <Header/>
            <div className="home__content">
                <h1>Home</h1>
                <p>This is the home page.</p>
                {
                    children
                }
            </div>
            <Footer/>
        </div>
    )
}

export default Home;