import React, { useEffect, useState } from "react";
import useAuth from "../../Hooks/Auths";

const NotificationSocket = () => {
  const [messages, setMessages] = useState([]);
    const { userData } = useAuth();
    const baseURL = process.env.SOCKET_URL;
    const token = localStorage.getItem('nearcash_token');
    console.log(baseURL, token, userData);
    

  useEffect(() => {
  

    const socket = new WebSocket(`${baseURL}/notification/${userData.id}/?token=${token}`);

    socket.onopen = () => {
      console.log("Connected to WebSocket ✅");
    };

    socket.onmessage = (event) => {
      console.log("New message:", event.data);
      setMessages((prev) => [...prev, event.data]);
    };

    socket.onerror = (error) => {
      console.error("WebSocket Error:", error);
    };

    socket.onclose = () => {
      console.log("WebSocket closed ❌");
    };

    return () => {
      socket.close();
    };
  }, [userData]);

  return (
    <div>
      <h2>Notifications</h2>
      <ul>
        {messages.map((msg, idx) => (
          <li key={idx}>{msg}</li>
        ))}
      </ul>
    </div>
  );
};

export default NotificationSocket;
