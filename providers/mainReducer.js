import authReducer from './reducers/auth';

const mainReducer = (state, action) => ({
  auth: authReducer(state.auth, action),
});

export default mainReducer;
