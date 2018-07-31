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

export const moveHeaderUp = headerId => ({
  type: 'MOVE_HEADER_UP', headerId,
});

export const moveHeaderDown = headerId => ({
  type: 'MOVE_HEADER_DOWN', headerId,
});

export const moveHeaderLeft = headerId => ({
  type: 'MOVE_HEADER_LEFT', headerId,
});

export const moveHeaderRight = headerId => ({
  type: 'MOVE_HEADER_RIGHT', headerId,
});

export const moveSubtreeLeft = headerId => ({
  type: 'MOVE_SUBTREE_LEFT', headerId,
});

export const moveSubtreeRight = headerId => ({
  type: 'MOVE_SUBTREE_RIGHT', headerId,
});

export const noOp = () => ({
  type: 'NO_OP',
});

export const applyOpennessState = () => ({
  type: 'APPLY_OPENNESS_STATE',
});

export const setDirty = isDirty => ({
  type: 'SET_DIRTY', isDirty,
});
