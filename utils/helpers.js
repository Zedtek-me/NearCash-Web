import toast from "react-hot-toast";

let watchID = null;

export function toTitleCase(str) {
  if (!str) return "";
  return str.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
}

export function handleBackToggle(navigator, url = null) {
  if (!url) navigator(-1);
  navigator(url);
}

export function toggleAuthPageBtnClassList(e, setActiveBtns, navigator = null, authBtnUpdateFn) {
  const btn = e.target;
  if (btn.classList.contains("login-btn")) {
    authBtnUpdateFn({ login: true, signup: false });
    setActiveBtns((prev) => ({ ...prev, login: true, signup: false }));
    setTimeout(() => navigator?.("/auth/login"), 500);
  } else {
    authBtnUpdateFn({ login: false, signup: true });
    setActiveBtns((prev) => ({ ...prev, login: false, signup: true }));
    setTimeout(() => navigator?.("/auth/signup"), 500);
  }
}

/**
 * Requests location permission, then starts watchPosition to stream live
 * coordinates to the backend via WebSocket.
 * Returns a cleanup function that clears the watch.
 */
export const fetchAndUpdateUserCurrentLocation = (updateFunc, errorFunc, userData, socket) => {
  if (watchID !== null) {
    navigator.geolocation.clearWatch(watchID);
    watchID = null;
  }

  navigator.geolocation.getCurrentPosition(
    () => {
      watchID = navigator.geolocation.watchPosition(
        (pos) => updateFunc(pos.coords, userData, socket),
        (err) => {
          if (err.code === 2) toast.error("GPS signal lost. Move outside?");
        },
        { enableHighAccuracy: true, timeout: 200000, maximumAge: 5000 }
      );
    },
    (err) => errorFunc?.(err),
    { enableHighAccuracy: false, timeout: 200000 }
  );

  return () => {
    if (watchID !== null) {
      navigator.geolocation.clearWatch(watchID);
      watchID = null;
    }
  };
};

/**
 * Builds and sends a vendor_location_update or client_location_update
 * message to the backend via WebSocket.
 */
export const updateUserPosition = (coordinates, userData, socket) => {
  const isVendor = userData?.userType === "VENDOR";
  const payload  = JSON.stringify({
    message_type: isVendor ? "vendor_location_update" : "client_location_update",
    vendor_id:    isVendor ? userData?.id : userData?.transaction?.vendor?.id,
    client_id:    isVendor ? null : (userData?.id || userData?.transaction?.client?.id),
    txn_id:       userData?.transaction?.id,
    location: {
      latitude:  coordinates.latitude,
      longitude: coordinates.longitude,
    },
    business_id: userData?.selectedBusiness || userData?.transaction?.business_id,
  });

  if (!socket) return;

  if (socket.readyState === WebSocket.OPEN) {
    socket.send(payload);
  } else if (socket.readyState === WebSocket.CONNECTING) {
    socket.addEventListener("open", () => socket.send(payload), { once: true });
  }
};

/**
 * Sends retrieve_vendor_latest_location and retrieve_client_latest_location
 * messages so both sides receive each other's last known position.
 */
export const fetchUserLatestLocation = (userData, socket, txnId, vendorId, clientId = null) => {
  const isVendor = userData?.userType === "VENDOR";

  const ownPayload = JSON.stringify({
    message_type: isVendor ? "retrieve_vendor_latest_location" : "retrieve_client_latest_location",
    vendor_id: vendorId,
    client_id: clientId,
    txn_id:    txnId,
  });

  const otherPayload = JSON.stringify({
    message_type: isVendor ? "retrieve_client_latest_location" : "retrieve_vendor_latest_location",
    vendor_id: vendorId,
    client_id: clientId,
    txn_id:    txnId,
  });

  const sendWhenReady = () => {
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(ownPayload);
      socket.send(otherPayload);
    } else if (socket?.readyState === WebSocket.CONNECTING) {
      socket.addEventListener(
        "open",
        () => { socket.send(ownPayload); socket.send(otherPayload); },
        { once: true }
      );
    }
  };

  sendWhenReady();
};

export const getDateAndTimeFromDateTimeStr = (dateTime) => {
  const dT = new Date(dateTime);
  return [dT.toLocaleDateString(), dT.toTimeString()];
};

export const getItemFromLocalStorage = (keyName, defaultValue = null) => {
  const item = localStorage.getItem(keyName);
  return item ?? defaultValue;
};
