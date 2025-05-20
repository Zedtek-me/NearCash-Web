

export function handleSubmit(e, setLoader, data){
    e.preventDefault()
    setLoader(true)
    console.log("data to send to the backend::: ", data)
    // make a call to the backend here
}

export function handleState(e, stateSetter){
    let { name, value } = e.target;
    console.log(`name: ${name}\n value: ${value}`)
    stateSetter((prevState) => ({...prevState, [name]: value}));
}