import { Map } from 'immutable';

const setLoadingMessage = (state, action) => {
  return state.set('loadingMessage', action.loadingMessage);
};

const hideLoadingMessage = (state, action) => {
  return state.set('loadingMessage', null);
};

export default (state = new Map(), action) => {
  switch (action.type) {
  case 'SET_LOADING_MESSAGE':
    return setLoadingMessage(state, action);
  case 'HIDE_LOADING_MESSAGE':
    return hideLoadingMessage(state, action);
  default:
    return state;
  }
};
