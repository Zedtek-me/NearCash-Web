import authReducer from './reducers/auth';
import businessStateReducer from './reducers/business';

const mainReducer = (state, action) => ({
    auth: authReducer(state.auth, action),
    businessStates: businessStateReducer(state.businessStates, action)
  });

export default mainReducer;
