import React, { useEffect } from "react";
import toast from "react-hot-toast";
import { Bell } from "lucide-react"; 
const NotificationDialog = ({
  message,
  setMessage,
}) => {

  useEffect(() => {
    setMessage(null);
  }, [setMessage]);


  useEffect(
    () => {
      const newTrxnMsg = (
        typeof message !== "string" && !Array.isArray(message) && "title" in message
      )
      if(newTrxnMsg){
        message = message.title
      }
    },
    [message]
  )
 
  return toast(
    (t) => (
      <div
        className="flex cursor-pointer items-center min-w-[6rem] bg-white rounded-lg shadow-md p-3 hover:bg-gray-50"
      >
        
        <div className="flex flex-col flex-1 ml-3">
          {/* <div className="flex items-center space-x-2">
            <h4 className="text-[#303030] text-xs font-bold leading-6">
              {message?.type}
            </h4>
            <Bell className="w-4 h-4 text-gray-600" />
          </div> */}

          <p className="text-[#606060] text-[11px] leading-5">
            {message}
          </p>
        </div>

      </div>
    ),
    {
      duration: 10000,
      position: "top-right",
    }
  );
};

export default NotificationDialog;
