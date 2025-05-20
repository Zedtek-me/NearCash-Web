import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router";
import Layout from "../components/Home/Layout.jsx";
import Home from "../components/Home/Home.jsx";


const App = () => {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Layout/>}>
                    <Route index element={<Home/>}/>
                </Route>
            </Routes>
        </Router>
    )
}

export default App;