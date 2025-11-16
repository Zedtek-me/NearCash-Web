let watchID = null;

export function toTitleCase(str) {
    if (!str) {
      return "";
    }
    return str.toLowerCase().replace(/\b\w/g, function(char) {
      return char.toUpperCase();
    });
  }


export function handleBackToggle(navigator, url=null){
    if(!url) navigator(-1);
    navigator(url);
}

export function toggleAuthPageBtnClassList(e, setActiveBtns, navigator=null, authBtnUpdateFn) {
    let btn = e.target;
    if(btn.classList.contains("login-btn")){
      authBtnUpdateFn({ login: true, signup: false });
      setActiveBtns((prevState) => ({...prevState, login: true, signup: false}))
      setTimeout(()=> navigator?.("/auth/login"), 500);
    }
    else{
      authBtnUpdateFn({ login: false, signup: true });
      setActiveBtns((prevState) => ({...prevState, login: false, signup: true}))
      setTimeout(()=> navigator?.("/auth/signup"), 500);
    }
}


export const fetchAndUpdateUserCurrentLocation = (updateFunc, errorFunc, userData, socket) => {
 if (watchID !== null) {
    navigator.geolocation.clearWatch(watchID);
    watchID = null;
  }

  // First: Ask permission
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      console.log("GPS Permission GRANTED");
      toast.success("GPS ON");

      // Now start live tracking
      watchID = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude, accuracy } = pos.coords;
          console.log("LIVE GPS:", latitude, longitude, "±", accuracy + "m");

          updateFunc(pos.coords, userData, socket);
        },
        (err) => {
          console.error("GPS Error:", err.code, err.message);
          if (err.code === 2) {
            toast.error("GPS signal lost. Move outside?");
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 5000
        }
      );
    },
    (err) => {
      console.error("GPS Permission DENIED:", err);
    },
    { enableHighAccuracy: true, timeout: 10000 }
  );

  return () => {
    if (watchID !== null) {
      navigator.geolocation.clearWatch(watchID);
      watchID = null;
    }
  };
};


export const updateUserPosition = (coordinates, userData, socket) => {
  const location = {"lat":7.41,"lng":4.31};
  console.log("Updating user position to:", location);
  
  const payload = JSON.stringify({
    message_type: userData?.userType === "VENDOR" 
      ? "vendor_location_update" 
      : "client_location_update",
    vendor_id: userData?.id,
    txn_id: userData?.txnId,
    location: {
      latitude: coordinates.latitude,
      longitude: coordinates.longitude
    },
    business_id: userData?.selectedBusiness
  });

  const send = () => {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(payload);
    } else if (socket.readyState === WebSocket.CONNECTING) {
      socket.addEventListener('open', () => socket.send(payload), { once: true });
    }
  };

  send();
};


export const fetchUserLatestLocation = (userData, socket, txnId, vendorId) => {
  const payload = JSON.stringify({
    message_type: userData?.userType === "VENDOR" 
      ? "retrieve_vendor_latest_location" : "retrieve_client_latest_location",
    vendor_id: vendorId,
    txn_id: txnId
  });

  const sendWhenReady = () => {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(payload);
    } else if (socket.readyState === WebSocket.CONNECTING) {
      socket.addEventListener('open', () => socket.send(payload), { once: true });
    } else {
      console.warn("WebSocket closed. Cannot fetch location.");
    }
  };

  sendWhenReady();
  return payload;
};

export const getDateAndTimeFromDateTimeStr = (dateTime) => {
  const dT = new Date(dateTime);
  let date = dT.toLocaleDateString()
  let time = dT.toTimeString()
  return [date, time]
}