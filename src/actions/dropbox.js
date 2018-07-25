export const authenticate = accessToken => ({
  type: 'AUTHENTICATE',
  accessToken,
});

export const signOut = () => ({
  type: 'SIGN_OUT',
});
