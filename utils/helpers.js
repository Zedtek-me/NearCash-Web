

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
  let watchID = navigator.geolocation.watchPosition(
    (pos) => {
        console.log("postion gotten with the 'watchPosition' method call::: ", pos)
        let { coords: currentCoords } = pos
        updateFunc(currentCoords, userData, socket)
    },
    (err) => {
        console.log("error gotten with the 'watchPosition' method call::: ", err)
        errorFunc(err)
    }
)
  return navigator.geolocation.clearWatch(watchID)
}


export const updateUserPosition = (coordinates, userData, socket) => {
  let isVendorLocation = userData?.userType === "VENDOR";
  let data = {
    vendor_id: userData?.id,
    message_type: isVendorLocation ? "vendor_location_update" : "client_location_update",
    location: coordinates,
    business_id: userData?.selectedBusiness
  };
  console.log("payload to send to the backend for vendor current location::::: ", data)
  data = JSON.stringify(data);
  socket.send(data)
}


export const fetchUserLatestLocation = (userData, socket, txnId) => {
  let data = JSON.stringify({
    message_type: "retrieve_vendor_latest_location",
    vendor_id: userData?.id,
    txn_id: txnId
  })
  socket.send(data);
  return data;
}

export const getDateAndTimeFromDateTimeStr = (dateTime) => {
  const dT = new Date(dateTime);
  let date = dT.toLocaleDateString()
  let time = dT.toTimeString()
  return [date, time]
}

export const getItemFromLocalStorage = (keyName, defaultValue=null) => {
  let item = localStorage.getItem(keyName);
  if(!item) return defaultValue;
  return item;
}
