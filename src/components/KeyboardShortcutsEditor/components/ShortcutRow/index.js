import React, { PureComponent } from 'react';

import './ShortcutRow.css';

export default class ShortcutRow extends PureComponent {
  symbolizeKeybinding(binding) {
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

    return replacements.reduce((currentBinding, [name, symbol]) => (
      currentBinding.replace(RegExp(`${name}\\+?`), symbol)
    ), binding);
  }

  render() {
    const { name, binding } = this.props;

    return (
      <div className="keyboard-shortcut-container">
        <div className="keyboard-shortcut-container__shortcut-name">{name}</div>
        <div className="keyboard-shortcut-container__shortcut-key">{this.symbolizeKeybinding(binding)}</div>
      </div>
    );
  }
}
