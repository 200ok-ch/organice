const DEFAULT_BINDINGS = [
  ['Select next header', 'selectNextVisibleHeader', 'ctrl+down'],
  ['Select previous header', 'selectPreviousVisibleHeader', 'ctrl+up'],
  ['Toggle header opened', 'toggleHeaderOpened', 'tab'],
  ['Advance todo state', 'advanceTodo', 'alt+t'],
  ['Edit title', 'editTitle', 'ctrl+h'],
  ['Edit description', 'editDescription', 'ctrl+d'],
  //['Exit edit mode', 'exitEditMode', 'alt+enter'],
  ['Add header', 'addHeader', 'ctrl+enter'],
  ['Remove header', 'removeHeader', 'backspace'],
  ['Move header up', 'moveHeaderUp', 'alt+up'],
  ['Move header down', 'moveHeaderDown', 'alt+down'],
  ['Move header left', 'moveHeaderLeft', 'alt+shift+left'],
  ['Move header right', 'moveHeaderRight', 'alt+shift+right'],
  ['Undo', 'undo', 'ctrl+/'],
];

export const calculateNamedKeybindings = (customKeybindings) =>
  DEFAULT_BINDINGS.map(([bindingName, _bindingAction, binding]) => [
    bindingName,
    customKeybindings.get(bindingName, binding),
  ]);

export const calculateActionedKeybindings = (customKeybindings) =>
  DEFAULT_BINDINGS.map(([bindingName, bindingAction, binding]) => [
    bindingAction,
    customKeybindings.get(bindingName, binding),
  ]);
