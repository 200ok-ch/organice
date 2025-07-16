import React, { useState, useRef, useEffect, useCallback } from 'react';

import './stylesheet.css';

import classNames from 'classnames';

const ShortcutRow = ({ name, binding, onBindingChange }) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const rebindAreaRef = useRef(null);

  const symbolizeKeybinding = useCallback((binding) => {
    if (!binding) {
      return '';
    }

    const replacements = [
      ['ctrl', '^'],
      ['alt', '⌥'],
      ['option', '⌥'],
      ['command', '⌘'],
      ['meta', '⌘'],
      ['shift', '⇧'],
      ['backspace', '⌫'],
      ['return', '⏎'],
      ['enter', '⏎'],
      ['left', '←'],
      ['right', '→'],
      ['up', '↑'],
      ['down', '↓'],
    ];

    return replacements.reduce(
      (currentBinding, [name, symbol]) => currentBinding.replace(RegExp(`${name}\\+?`), symbol),
      binding
    );
  }, []);

  const handleKeyPress = useCallback(
    (event) => {
      setIsEditMode(false);
      document.removeEventListener('keypress', handleKeyPress);

      let key = null;
      if (event.code.startsWith('Key')) {
        key = event.code.substr(3).toLowerCase();
      } else if (event.code.startsWith('Digit')) {
        key = event.code.substr(5);
      } else {
        key = {
          Minus: '-',
          Equal: '=',
          Backspace: 'backspace',
          Enter: 'enter',
          Return: 'return',
          Tab: 'tab',
          BracketLeft: '[',
          BracketRight: ']',
          Semicolon: ';',
          Quote: '"',
          Backslash: '\\',
          Comma: ',',
          Period: '.',
          Slash: '/',
        }[event.code];
      }

      if (!key) {
        return;
      }

      const modifiers = [
        ['ctrlKey', 'ctrl'],
        ['altKey', 'alt'],
        ['metaKey', 'meta'],
        ['shiftKey', 'shift'],
      ];

      const newModifiers = modifiers
        .filter(([modifier, _]) => event[modifier])
        .map(([_, symbol]) => symbol)
        .join('+');
      const newBinding = `${newModifiers}${!!newModifiers ? '+' : ''}${key}`;

      onBindingChange(name, newBinding);
    },
    [name, onBindingChange]
  );

  const handleRebindClick = useCallback(() => {
    setIsEditMode(true);
    document.addEventListener('keypress', handleKeyPress);
  }, [handleKeyPress]);

  const handleBlur = useCallback(() => {
    setIsEditMode(false);
  }, []);

  useEffect(() => {
    const rebindArea = rebindAreaRef.current;
    if (rebindArea) {
      rebindArea.addEventListener('blur', handleBlur);

      return () => {
        rebindArea.removeEventListener('blur', handleBlur);
      };
    }
  }, [handleBlur]);

  useEffect(() => {
    return () => {
      // Clean up any remaining event listeners to prevent memory leaks
      document.removeEventListener('keypress', handleKeyPress);
    };
  }, [handleKeyPress]);

  const rebindAreaClassName = classNames('keyboard-shortcut-container__shortcut-key', {
    'keyboard-shortcut-container__shortcut-key--edit-mode': isEditMode,
  });

  return (
    <div className="keyboard-shortcut-container">
      <div className="keyboard-shortcut-container__shortcut-name">{name}</div>
      <div
        className={rebindAreaClassName}
        onClick={handleRebindClick}
        tabIndex="-1"
        ref={rebindAreaRef}
      >
        {isEditMode ? '...' : symbolizeKeybinding(binding)}
      </div>
    </div>
  );
};

export default React.memo(ShortcutRow);
