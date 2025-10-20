
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


export const fetchUserCurrentLocation = (userType) => {
  if (userType.toLowerCase() === "vendor"){
      navigator.geolocation.watchPosition(
        (pos) => {
            console.log("postion gotten with the 'watchPosition' method call::: ", pos)
            let { coords: currentCoords } = pos
            console.log("current coordinates gotten:::: ", currentCoords)
            return currentCoords
        },
        (err) => {
            console.log("error gotten with the 'watchPosition' method call::: ", err)
            return {}
        }
    )
  }
}