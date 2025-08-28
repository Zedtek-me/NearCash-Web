import React, { useEffect, useState } from "react";
import useAuth from "../../Hooks/Auths";
import { toast } from "react-toastify";
import NotificationDialog from "./NotificationDialog";

const NotificationSocket = () => {
  const [messages, setMessages] = useState('');
  const { userData } = useAuth();
  const baseURL = process.env.SOCKET_URL;
  const token = localStorage.getItem("nearcash_token");

  useEffect(() => {
    if (!userData?.id || !token) return;

    const socket = new WebSocket(
      `${baseURL}/notification/${userData.id}/?token=${token}`
    );

    socket.onopen = () => {
      console.log("Connected to WebSocket ✅");
    };

    socket.onmessage = (event) => {
      console.log("New message:", event.data);

      // store locally
      setMessages(event.data);

      // show toast
      toast.info(event.data, {
        position: "top-right",
        autoClose: 4000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
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
  }, [userData, token, baseURL]);

  return (
    <div>
         {!messages ? '' : <NotificationDialog message={messages} setMessage={setMessages} />}
    </div>
  );
};

export default NotificationSocket;
