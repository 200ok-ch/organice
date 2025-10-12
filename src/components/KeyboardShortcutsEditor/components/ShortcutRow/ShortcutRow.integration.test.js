import React from 'react';
import { render, fireEvent, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';

import ShortcutRow from './index';

afterEach(cleanup);

describe('ShortcutRow Integration Tests', () => {
  const defaultProps = {
    name: 'Test Shortcut',
    binding: 'ctrl+s',
    onBindingChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Rendering', () => {
    test('renders correctly with basic props', () => {
      const { container } = render(<ShortcutRow {...defaultProps} />);

      const shortcutContainer = container.querySelector('.keyboard-shortcut-container');
      expect(shortcutContainer).toBeInTheDocument();

      const nameElement = container.querySelector('.keyboard-shortcut-container__shortcut-name');
      expect(nameElement).toHaveTextContent('Test Shortcut');

      const keyElement = container.querySelector('.keyboard-shortcut-container__shortcut-key');
      expect(keyElement).toBeInTheDocument();
      expect(keyElement).toHaveTextContent('^s'); // symbolized version of ctrl+s
    });

    test('renders with empty binding', () => {
      const props = { ...defaultProps, binding: '' };
      const { container } = render(<ShortcutRow {...props} />);

      const keyElement = container.querySelector('.keyboard-shortcut-container__shortcut-key');
      expect(keyElement).toHaveTextContent('');
    });

    test('renders with null binding', () => {
      const props = { ...defaultProps, binding: null };
      const { container } = render(<ShortcutRow {...props} />);

      const keyElement = container.querySelector('.keyboard-shortcut-container__shortcut-key');
      expect(keyElement).toHaveTextContent('');
    });

    test('renders with complex binding', () => {
      const props = { ...defaultProps, binding: 'ctrl+shift+alt+a' };
      const { container } = render(<ShortcutRow {...props} />);

      const keyElement = container.querySelector('.keyboard-shortcut-container__shortcut-key');
      expect(keyElement).toHaveTextContent('^⇧⌥a'); // symbolized version
    });
  });

  describe('Keybinding Symbolization', () => {
    test('symbolizes ctrl key', () => {
      const props = { ...defaultProps, binding: 'ctrl+a' };
      const { container } = render(<ShortcutRow {...props} />);

      const keyElement = container.querySelector('.keyboard-shortcut-container__shortcut-key');
      expect(keyElement).toHaveTextContent('^a');
    });

    test('symbolizes alt key', () => {
      const props = { ...defaultProps, binding: 'alt+b' };
      const { container } = render(<ShortcutRow {...props} />);

      const keyElement = container.querySelector('.keyboard-shortcut-container__shortcut-key');
      expect(keyElement).toHaveTextContent('⌥b');
    });

    test('symbolizes option key (same as alt)', () => {
      const props = { ...defaultProps, binding: 'option+c' };
      const { container } = render(<ShortcutRow {...props} />);

      const keyElement = container.querySelector('.keyboard-shortcut-container__shortcut-key');
      expect(keyElement).toHaveTextContent('⌥c');
    });

    test('symbolizes command key', () => {
      const props = { ...defaultProps, binding: 'command+d' };
      const { container } = render(<ShortcutRow {...props} />);

      const keyElement = container.querySelector('.keyboard-shortcut-container__shortcut-key');
      expect(keyElement).toHaveTextContent('⌘d');
    });

    test('symbolizes meta key (same as command)', () => {
      const props = { ...defaultProps, binding: 'meta+e' };
      const { container } = render(<ShortcutRow {...props} />);

      const keyElement = container.querySelector('.keyboard-shortcut-container__shortcut-key');
      expect(keyElement).toHaveTextContent('⌘e');
    });

    test('symbolizes shift key', () => {
      const props = { ...defaultProps, binding: 'shift+f' };
      const { container } = render(<ShortcutRow {...props} />);

      const keyElement = container.querySelector('.keyboard-shortcut-container__shortcut-key');
      expect(keyElement).toHaveTextContent('⇧f');
    });

    test('symbolizes special keys', () => {
      const specialKeys = [
        ['backspace', '⌫'],
        ['return', '⏎'],
        ['enter', '⏎'],
        ['left', '←'],
        ['right', '→'],
        ['up', '↑'],
        ['down', '↓'],
      ];

      specialKeys.forEach(([key, symbol]) => {
        const props = { ...defaultProps, binding: key };
        const { container } = render(<ShortcutRow {...props} />);

        const keyElement = container.querySelector('.keyboard-shortcut-container__shortcut-key');
        expect(keyElement).toHaveTextContent(symbol);
      });
    });

    test('symbolizes multiple modifiers', () => {
      const props = { ...defaultProps, binding: 'ctrl+alt+shift+meta+g' };
      const { container } = render(<ShortcutRow {...props} />);

      const keyElement = container.querySelector('.keyboard-shortcut-container__shortcut-key');
      expect(keyElement).toHaveTextContent('^⌥⇧⌘g');
    });
  });

  describe('Edit Mode', () => {
    test('enters edit mode when clicked', () => {
      const { container } = render(<ShortcutRow {...defaultProps} />);

      const keyElement = container.querySelector('.keyboard-shortcut-container__shortcut-key');
      expect(keyElement).not.toHaveClass('keyboard-shortcut-container__shortcut-key--edit-mode');

      fireEvent.click(keyElement);

      expect(keyElement).toHaveClass('keyboard-shortcut-container__shortcut-key--edit-mode');
      expect(keyElement).toHaveTextContent('...');
    });

    test('exits edit mode on blur', () => {
      const { container } = render(<ShortcutRow {...defaultProps} />);

      const keyElement = container.querySelector('.keyboard-shortcut-container__shortcut-key');
      fireEvent.click(keyElement);

      expect(keyElement).toHaveClass('keyboard-shortcut-container__shortcut-key--edit-mode');

      fireEvent.blur(keyElement);

      expect(keyElement).not.toHaveClass('keyboard-shortcut-container__shortcut-key--edit-mode');
      expect(keyElement).toHaveTextContent('^s'); // back to original binding
    });

    test('has correct tabIndex for keyboard navigation', () => {
      const { container } = render(<ShortcutRow {...defaultProps} />);

      const keyElement = container.querySelector('.keyboard-shortcut-container__shortcut-key');
      expect(keyElement).toHaveAttribute('tabIndex', '-1');
    });
  });

  describe('Key Capture', () => {
    test('captures letter key press', () => {
      const { container } = render(<ShortcutRow {...defaultProps} />);

      const keyElement = container.querySelector('.keyboard-shortcut-container__shortcut-key');
      fireEvent.click(keyElement);

      // Simulate keypress event
      const keypressEvent = new KeyboardEvent('keypress', {
        code: 'KeyA',
        ctrlKey: false,
        altKey: false,
        metaKey: false,
        shiftKey: false,
      });

      document.dispatchEvent(keypressEvent);

      expect(defaultProps.onBindingChange).toHaveBeenCalledWith('Test Shortcut', 'a');
    });

    test('captures digit key press', () => {
      const { container } = render(<ShortcutRow {...defaultProps} />);

      const keyElement = container.querySelector('.keyboard-shortcut-container__shortcut-key');
      fireEvent.click(keyElement);

      const keypressEvent = new KeyboardEvent('keypress', {
        code: 'Digit5',
        ctrlKey: false,
        altKey: false,
        metaKey: false,
        shiftKey: false,
      });

      document.dispatchEvent(keypressEvent);

      expect(defaultProps.onBindingChange).toHaveBeenCalledWith('Test Shortcut', '5');
    });

    test('captures special key press', () => {
      const { container } = render(<ShortcutRow {...defaultProps} />);

      const keyElement = container.querySelector('.keyboard-shortcut-container__shortcut-key');
      fireEvent.click(keyElement);

      const keypressEvent = new KeyboardEvent('keypress', {
        code: 'Minus',
        ctrlKey: false,
        altKey: false,
        metaKey: false,
        shiftKey: false,
      });

      document.dispatchEvent(keypressEvent);

      expect(defaultProps.onBindingChange).toHaveBeenCalledWith('Test Shortcut', '-');
    });

    test('captures key press with ctrl modifier', () => {
      const { container } = render(<ShortcutRow {...defaultProps} />);

      const keyElement = container.querySelector('.keyboard-shortcut-container__shortcut-key');
      fireEvent.click(keyElement);

      const keypressEvent = new KeyboardEvent('keypress', {
        code: 'KeyS',
        ctrlKey: true,
        altKey: false,
        metaKey: false,
        shiftKey: false,
      });

      document.dispatchEvent(keypressEvent);

      expect(defaultProps.onBindingChange).toHaveBeenCalledWith('Test Shortcut', 'ctrl+s');
    });

    test('captures key press with multiple modifiers', () => {
      const { container } = render(<ShortcutRow {...defaultProps} />);

      const keyElement = container.querySelector('.keyboard-shortcut-container__shortcut-key');
      fireEvent.click(keyElement);

      const keypressEvent = new KeyboardEvent('keypress', {
        code: 'KeyA',
        ctrlKey: true,
        altKey: true,
        metaKey: true,
        shiftKey: true,
      });

      document.dispatchEvent(keypressEvent);

      expect(defaultProps.onBindingChange).toHaveBeenCalledWith(
        'Test Shortcut',
        'ctrl+alt+meta+shift+a'
      );
    });

    test('ignores unknown key codes', () => {
      const { container } = render(<ShortcutRow {...defaultProps} />);

      const keyElement = container.querySelector('.keyboard-shortcut-container__shortcut-key');
      fireEvent.click(keyElement);

      const keypressEvent = new KeyboardEvent('keypress', {
        code: 'UnknownKey',
        ctrlKey: false,
        altKey: false,
        metaKey: false,
        shiftKey: false,
      });

      document.dispatchEvent(keypressEvent);

      expect(defaultProps.onBindingChange).not.toHaveBeenCalled();
    });

    test('exits edit mode after capturing key', () => {
      const { container } = render(<ShortcutRow {...defaultProps} />);

      const keyElement = container.querySelector('.keyboard-shortcut-container__shortcut-key');
      fireEvent.click(keyElement);

      expect(keyElement).toHaveClass('keyboard-shortcut-container__shortcut-key--edit-mode');

      const keypressEvent = new KeyboardEvent('keypress', {
        code: 'KeyB',
        ctrlKey: false,
        altKey: false,
        metaKey: false,
        shiftKey: false,
      });

      document.dispatchEvent(keypressEvent);

      expect(keyElement).not.toHaveClass('keyboard-shortcut-container__shortcut-key--edit-mode');
    });

    test('removes keypress listener after capturing key', () => {
      const { container } = render(<ShortcutRow {...defaultProps} />);

      const keyElement = container.querySelector('.keyboard-shortcut-container__shortcut-key');
      fireEvent.click(keyElement);

      // First keypress should be captured
      const keypressEvent1 = new KeyboardEvent('keypress', {
        code: 'KeyA',
        ctrlKey: false,
        altKey: false,
        metaKey: false,
        shiftKey: false,
      });

      document.dispatchEvent(keypressEvent1);
      expect(defaultProps.onBindingChange).toHaveBeenCalledWith('Test Shortcut', 'a');

      // Second keypress should not be captured (listener removed)
      const keypressEvent2 = new KeyboardEvent('keypress', {
        code: 'KeyB',
        ctrlKey: false,
        altKey: false,
        metaKey: false,
        shiftKey: false,
      });

      document.dispatchEvent(keypressEvent2);
      expect(defaultProps.onBindingChange).toHaveBeenCalledTimes(1); // Still only called once
    });
  });

  describe('Special Key Mappings', () => {
    test('maps special key codes correctly', () => {
      const specialMappings = [
        ['Minus', '-'],
        ['Equal', '='],
        ['Backspace', 'backspace'],
        ['Enter', 'enter'],
        ['Return', 'return'],
        ['Tab', 'tab'],
        ['BracketLeft', '['],
        ['BracketRight', ']'],
        ['Semicolon', ';'],
        ['Quote', '"'],
        ['Backslash', '\\'],
        ['Comma', ','],
        ['Period', '.'],
        ['Slash', '/'],
      ];

      specialMappings.forEach(([code, expectedKey]) => {
        const { container } = render(<ShortcutRow {...defaultProps} />);

        const keyElement = container.querySelector('.keyboard-shortcut-container__shortcut-key');
        fireEvent.click(keyElement);

        const keypressEvent = new KeyboardEvent('keypress', {
          code,
          ctrlKey: false,
          altKey: false,
          metaKey: false,
          shiftKey: false,
        });

        document.dispatchEvent(keypressEvent);

        expect(defaultProps.onBindingChange).toHaveBeenCalledWith('Test Shortcut', expectedKey);

        // Clean up for next iteration
        jest.clearAllMocks();
      });
    });
  });
});
