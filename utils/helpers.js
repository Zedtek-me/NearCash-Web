
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

export function toggleAuthPageBtnClassList(e){
    console.log("toggleAuthPageBtnClassList::: ", e.target.classList)
    let btn = e.target;
    let btnBgShuffle = document.querySelector(".auth-btn-color-shuffle");
    console.log("btnBgShuffle::: ", btnBgShuffle)
    if(btn.classList.contains("login-btn")){
        btn.classList.add("z-10");
        btnBgShuffle.classList.add("left-btn-shuffle");
    }
    else{ btnBgShuffle.classList.add("right-btn-shuffle") }

}