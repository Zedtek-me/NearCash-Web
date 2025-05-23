
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

export function toggleAuthPageBtnClassList(e, setActiveBtns){
    let btn = e.target;
    btn.classList.add("active-btn");
    if(btn.classList.contains("login-btn")){
      setActiveBtns((prevState) => ({...prevState, login: true, signup: false}))
    }
    else{
      setActiveBtns((prevState) => ({...prevState, login: false, signup: true}))
    }
}