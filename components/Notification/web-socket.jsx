import React, { useEffect, useState } from "react";
import useAuth from "../../Hooks/Auths";
import { toast } from "react-toastify";
import NotificationDialog from "./NotificationDialog";
import {
  fetchAndUpdateUserCurrentLocation,
  updateUserPosition
} from "../../utils/helpers";
import { useStateValue } from "../../providers/stateProvider";
import { useWebSocket } from "./WebSocketProvider";

const NotificationSocket = () => {
  const socket = useWebSocket();  
  const [messages, setMessages] = useState("");
  const { userData } = useAuth();

  const [
    {
      businessStates: { selectedBusiness }
    }
  ] = Object.values(useStateValue());

  useEffect(() => {
    if (!socket || socket.readyState !== WebSocket.OPEN) return;

    console.log("🔔 NotificationSocket listening for messages...");

    const onMessage = (event) => {
      const data = JSON.parse(event.data);
      console.log("🔔 New WS message:", data);

      const { message_type } = data;
      // if (data?.includes('welcome')) {
      //   setMessages(event.data);
      // }


      if (message_type !== "vendor_location_update_ack") {
        setMessages(event.data);

        toast.info(event.data, {
          position: "top-right",
          autoClose: 4000,
        });
      }
    };

    const onError = (e) => console.log("WS error in Notification module:", e);
    const onClose = () => console.log("WS closed in Notification module");

    socket.addEventListener("message", onMessage);
    socket.addEventListener("error", onError);
    socket.addEventListener("close", onClose);

    if (userData) {
      fetchAndUpdateUserCurrentLocation(
        updateUserPosition,
        (err) => console.log("error fetching coordinates:", err),
        { ...userData, selectedBusiness },
        socket
      );
    }

    return () => {
      socket.removeEventListener("message", onMessage);
      socket.removeEventListener("error", onError);
      socket.removeEventListener("close", onClose);
    };
  }, [socket, userData, selectedBusiness]);

  return (
    <div>
      {messages && (
        <NotificationDialog message={messages} setMessage={setMessages} />
      )}
    </div>
  );
};

export default NotificationSocket;
