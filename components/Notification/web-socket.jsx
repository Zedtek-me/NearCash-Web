import React, { useEffect, useState } from "react";
import useAuth from "../../Hooks/Auths";
import { toast } from "react-toastify";
import NotificationDialog from "./NotificationDialog";
import { fetchUserCurrentLocation, updateUserPosition } from "../../utils/helpers";

const NotificationSocket = () => {
  const [messages, setMessages] = useState('');
  const { userData } = useAuth();
  const baseURL = process.env.SOCKET_URL;
  const token = localStorage.getItem("nearcash_token");

  useEffect(() => {
    // define a function to constantly fetch the location of the vendor
    // and send it to the backend for storing every 2 seconds
    if (!userData?.id || !token) return;

    const websocketURL = `${baseURL}/notification/${userData.id}/?token=${token}`;

    const socket = new WebSocket(
      websocketURL
    );

    socket.onopen = () => {
      console.log("Connected to WebSocket ✅");
    };

    socket.onmessage = (event) => {
      let data = JSON.parse(event.data)
      console.log("New message:", data);

      let { message_type } = data;
  
      //Only show relevant messages to users.
      if(message_type !== "vendor_location_update_ack"){
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
      }
    };

    socket.onerror = (error) => {
      console.error("WebSocket Error:", error);
    };

    socket.onclose = () => {
      console.log("WebSocket closed ❌");
    };

    const { userType } = userData;
    if(userType?.toLowerCase() === "vendor"){
      fetchUserCurrentLocation(
        updateUserPosition,
        (err) => console.log("error fetching user latest coordinates:::: ", err),
        userData, socket
      )
    }
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
