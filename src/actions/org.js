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

export const enterTitleEditMode = () => ({
  type: 'ENTER_TITLE_EDIT_MODE',
});

export const exitTitleEditMode = () => ({
  type: 'EXIT_TITLE_EDIT_MODE',
});

export const updateHeaderTitle = (headerId, newRawTitle) => ({
  type: 'UPDATE_HEADER_TITLE', headerId, newRawTitle,
});

export const enterDescriptionEditMode = () => ({
  type: 'ENTER_DESCRIPTION_EDIT_MODE',
});

export const exitDescriptionEditMode = () => ({
  type: 'EXIT_DESCRIPTION_EDIT_MODE',
});

export const updateHeaderDescription = (headerId, newRawDescription) => ({
  type: 'UPDATE_HEADER_DESCRIPTION', headerId, newRawDescription,
});

export const addHeader = headerId => ({
  type: 'ADD_HEADER', headerId,
});

export const selectNextSiblingHeader = headerId => ({
  type: 'SELECT_NEXT_SIBLING_HEADER', headerId,
});

export const removeHeader = headerId => ({
  type: 'REMOVE_HEADER', headerId,
});
