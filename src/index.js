import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "../styles/index.css";
import { ApolloClient, ApolloProvider, InMemoryCache } from "@apollo/client";

let root = ReactDOM.createRoot(document.getElementById("root"));
export const apolloClient = new ApolloClient({
    uri: process.env.NEARCASH_GRAPHQL_API_URL,
    cache: new InMemoryCache()
})
const view = (
    <ApolloProvider client={apolloClient}>
        <App/>
    </ApolloProvider>
)
root.render(view)
