// src/providers/WebSocketProvider.jsx
import React, { createContext, useContext, useEffect, useState } from "react";
import useAuth from "../../Hooks/Auths";

const WebSocketContext = createContext(null);

export const WebSocketProvider = ({ children }) => {
  const { userData } = useAuth();
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!userData?.id) return;
    const token = localStorage.getItem("nearcash_token");
    const baseURL = process.env.SOCKET_URL;

    const ws = new WebSocket(
      `${baseURL}/notification/${userData.id}/?token=${token}`,
    );

    ws.onopen = () => console.log("🔗 WebSocket connected");
    ws.onclose = () => console.log("🔌 WebSocket closed");
    ws.onerror = (e) => console.error("❌ WebSocket error:", e);

    setSocket(ws);

    return () => ws.close();
  }, [userData?.id]);

  // userData

  return (
    <WebSocketContext.Provider value={socket}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => useContext(WebSocketContext);
