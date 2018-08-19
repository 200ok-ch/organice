export default (() => {
  let nextId = 0;
  return () => nextId++;
})();
