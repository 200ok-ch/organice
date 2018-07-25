import { Map } from 'immutable';

const authenticate = (state, action) => {
  console.log("state = ", state);

  const r =  state.set('accessToken', action.accessToken);
  console.log("r = ", r);

  return r;
};

const signOut = (state, action) => (
  state.set('accessToken', null)
);

export default (state = new Map(), action) => {
  switch (action.type) {
  case 'AUTHENTICATE':
    return authenticate(state, action);
  case 'SIGN_OUT':
    return signOut(state, action);
  default:
    return state;
  }
};
