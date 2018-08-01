export default history => {
  if (history.length === 2) {
    history.push('/');
  } else {
    history.goBack();
  }
};
