import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "../styles/index.css";
import AuthProvider from "../components/Auths/AuthContextProvider.jsx";
import StateProvider from "../providers/stateProvider.jsx";
import { ApolloProvider } from "@apollo/client";
import getApolloClient from "../utils/graphQl.js";
import CToaster from "../utils/components/CToaster/index.js";
import { WebSocketProvider } from "../components/Notification/WebSocketProvider.jsx";
import "leaflet/dist/leaflet.css";

const root = ReactDOM.createRoot(document.getElementById("root"));

const renderApp = async () => {
  const apolloClient = await getApolloClient();

  root.render(
    <React.StrictMode>
      <CToaster />
      <ApolloProvider client={apolloClient}>
        <StateProvider>
          <AuthProvider>
            <WebSocketProvider>
              <App />
            </WebSocketProvider>
          </AuthProvider>
        </StateProvider>
      </ApolloProvider>
    </React.StrictMode>
  );
};

renderApp();
