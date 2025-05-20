import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router";
import Layout from "../components/Home/Layout.jsx";
import Home from "../components/Home/Home.jsx";
import Login from "../components/Auths/Login.jsx";
import SignUp from "../components/Auths/SignUp.jsx";


const App = () => {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Layout/>}>
                    <Route index element={<Home/>}/>
                    <Route path="signup" element={<SignUp/>}/>
                    <Route path="login" element={<Login/>}/>
                </Route>
            </Routes>
        </Router>
    )
}

export default App;