export default (() => {
  let nextId = 1;
  return () => nextId++;
})();
