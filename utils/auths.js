import toast from "react-hot-toast";

export function handleState(e, stateSetter){
    let { name, value } = e.target;
    console.log(`name: ${name}\n value: ${value}`)
    stateSetter((prevState) => ({...prevState, [name]: value}));
}


export async function handleSocialAuth(authCode, gqlFunc, authType, socialType, navigate) {
  try {
    const result = await gqlFunc({
      variables: {
        code: authCode,
        authType,
        socialType,
      }
    });

    console.log("mutation completed! Data here::: ", result.data);

    return result.data;
  } catch (error) {
    console.log(`this is the error message returned: ${error.message}`);
    toast.error(`Invalid User!`);
    return null;
  }
}


export function checkCurrentSession(){
    let authToken = localStorage.getItem("nearcash_token")
   return authToken;
}

export const backArrowReturnFunc = (navigate) => {
    navigate(-1);
}