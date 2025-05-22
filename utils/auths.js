import axios from "axios";

const axiosInstance = axios.create({
    baseURL: process.env.NEARCASH_API_URL,
});

export function handleSubmit(e, setLoader, data){
    e.preventDefault()
    setLoader(true)
    console.log("data to send to the backend::: ", data)
    // make a call to the backend here
    setTimeout(() => setLoader(false), 2000)
}

export function handleState(e, stateSetter){
    let { name, value } = e.target;
    console.log(`name: ${name}\n value: ${value}`)
    stateSetter((prevState) => ({...prevState, [name]: value}));
}


export function checkAuth(userStateSetter){
    /**determines if user has a current session.
     * if so, updates the user state with the user info
     */
    let authToken = localStorage.getItem("nearcash_token")
    if(!authToken) return;
    let headers = {
        "Authorization": `Bearer ${authToken}`,
        "Content-Type": "application/json",
        "Accept": "application/json"
    }
    axiosInstance.get("/auth/user", { headers })
        .then((response) => {
            console.log("user info::: ", response.data)
            userStateSetter(response.data)
        })
        .catch((error) => {
            console.error("error::: ", error)
            userStateSetter(null)
        })

}