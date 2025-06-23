import AuthActionTypes from './authTypes';

const authReducer = (auth, action) => {
  switch (action.type) {
    case AuthActionTypes.SET_AUTH_TYPE:
      return {
        ...auth,
        authType: action.payload
      };
    default:
      return auth;
  }
};

export default authReducer;
