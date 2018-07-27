export const displayFile = (path, contents) => ({
  type: 'DISPLAY_FILE', path, contents,
});

export const stopDisplayingFile = () => ({
  type: 'STOP_DISPLAYING_FILE',
});

export const toggleHeaderOpened = headerId => ({
  type: 'TOGGLE_HEADER_OPENED', headerId,
});

export const selectHeader = headerId => ({
  type: 'SELECT_HEADER', headerId,
});

export const advanceTodoState = () => ({
  type: 'ADVANCE_TODO_STATE',
});
