export const displayFile = (path, contents) => ({
  type: 'DISPLAY_FILE',
  path, contents,
});

export const stopDisplayingFile = () => ({
  type: 'STOP_DISPLAYING_FILE',
});
