const DEFAULT_BINDINGS = [
  ['Select next header', 'selectNextVisibleHeader', 'ctrl+n'],
  ['Select previous header', 'selectPreviousVisibleHeader', 'ctrl+p'],
  ['Toggle header opened', 'toggleHeaderOpened', 'tab'],
  ['Advance todo state', 'advanceTodo', 'ctrl+t'],
  ['Edit title', 'editTitle', 'ctrl+h'],
  ['Edit description', 'editDescription', 'ctrl+d'],
  ['Exit edit mode', 'exitEditMode', 'command+enter'],
  ['Add header', 'addHeader', 'ctrl+enter'],
  ['Remove header', 'removeHeader', 'backspace'],
  ['Move header up', 'moveHeaderUp', 'ctrl+command+p'],
  ['Move header down', 'moveHeaderDown', 'ctrl+command+n'],
  ['Move header left', 'moveHeaderLeft', 'ctrl+command+b'],
  ['Move header right', 'moveHeaderRight', 'ctrl+command+f'],
  ['Undo', 'undo', 'ctrl+shift+-'],
];

export const calculateNamedKeybindings = customKeybindings =>
  DEFAULT_BINDINGS.map(([bindingName, _bindingAction, binding]) => [
    bindingName,
    customKeybindings.get(bindingName, binding),
  ]);

export const calculateActionedKeybindings = customKeybindings =>
  DEFAULT_BINDINGS.map(([bindingName, bindingAction, binding]) => [
    bindingAction,
    customKeybindings.get(bindingName, binding),
  ]);
