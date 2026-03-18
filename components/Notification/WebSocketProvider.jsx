import React, { createContext, useContext, useEffect, useState } from "react";
import useAuth from "../../hooks/useAuth";

const WebSocketContext = createContext(null);

export const WebSocketProvider = ({ children }) => {
  const { userData } = useAuth();
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!userData?.id) return;

    const token   = localStorage.getItem("nearcash_token");
    const baseURL = process.env.SOCKET_URL;
    const ws      = new WebSocket(`${baseURL}/notification/${userData.id}/?token=${token}`);

    ws.onerror = (e) => console.error("WebSocket error:", e);

    setSocket(ws);
    return () => ws.close();
  }, [userData?.id]);

  return (
    <WebSocketContext.Provider value={socket}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => useContext(WebSocketContext);
