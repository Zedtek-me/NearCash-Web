import React, {
  useContext, useReducer, createContext
} from 'react';
import PropTypes from 'prop-types';
import mainReducer from './mainReducer';
import initialState from './initialState';

export const StateContext = createContext();

const StateProvider = ({ children }) => {
  const [state, dispatch] = useReducer(mainReducer, initialState);
  const stateWithSession = {
    ...state,
  };

  // eslint-disable-next-line react/jsx-no-constructed-context-values
  const values = { state: stateWithSession, dispatch };
  return (
    <StateContext.Provider value={values}>
      {children}
    </StateContext.Provider>
  );
};

export const useStateValue = () => useContext(StateContext);

StateProvider.propTypes = {
  children: PropTypes.instanceOf(Object)
};

StateProvider.defaultProps = {
  children: {}
};

export default StateProvider;
