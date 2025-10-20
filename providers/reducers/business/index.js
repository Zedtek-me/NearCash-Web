

const businessStateReducer = (currentBuzState, action) => {
    switch(action.type){
        case "UPDATE_SELECTED_BUSINESS":
            let updatedState =  {
                ...currentBuzState,
                selectedBusiness: action.value
            }
            return updatedState;
        default:
            return currentBuzState;
    }
}

export default businessStateReducer;