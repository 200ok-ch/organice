import React from 'react';
import { render, fireEvent, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';

import ActionButton from './index';

afterEach(cleanup);

describe('ActionButton Integration Tests', () => {
  const defaultProps = {
    iconName: 'plus',
    onClick: jest.fn(),
    isDisabled: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Rendering', () => {
    test('renders correctly with basic props', () => {
      const { container } = render(<ActionButton {...defaultProps} />);

      const button = container.querySelector('button');
      expect(button).toBeInTheDocument();
      expect(button).toHaveClass(
        'btn',
        'btn--circle',
        'action-drawer__btn',
        'fas',
        'fa-lg',
        'fa-plus'
      );
    });

    test('renders with letter instead of icon', () => {
      const props = { ...defaultProps, letter: 'A', iconName: undefined };
      const { container } = render(<ActionButton {...props} />);

      const button = container.querySelector('button');
      expect(button).toHaveTextContent('A');
      expect(button).toHaveClass('action-drawer__btn--letter');
      expect(button).not.toHaveClass('fas', 'fa-lg');
    });

    test('renders with sub-icon', () => {
      const props = { ...defaultProps, subIconName: 'check' };
      const { container } = render(<ActionButton {...props} />);

      const button = container.querySelector('button');
      const subIcon = container.querySelector('.action-drawer__btn__sub-icon');

      expect(button).toHaveClass('action-drawer__btn--with-sub-icon');
      expect(subIcon).toBeInTheDocument();
      expect(subIcon).toHaveClass('fas', 'fa-xs', 'fa-check');
    });

    test('renders with rotated sub-icon', () => {
      const props = { ...defaultProps, subIconName: 'arrow', shouldRotateSubIcon: true };
      const { container } = render(<ActionButton {...props} />);

      const subIcon = container.querySelector('.action-drawer__btn__sub-icon');
      expect(subIcon).toHaveClass('action-drawer__btn__sub-icon--rotated');
    });

    test('renders with spinning sub-icon', () => {
      const props = { ...defaultProps, subIconName: 'spinner', shouldSpinSubIcon: true };
      const { container } = render(<ActionButton {...props} />);

      const subIcon = container.querySelector('.action-drawer__btn__sub-icon');
      expect(subIcon).toHaveClass('fa-spin');
    });

    test('renders with disabled state', () => {
      const props = { ...defaultProps, isDisabled: true };
      const { container } = render(<ActionButton {...props} />);

      const button = container.querySelector('button');
      expect(button).toHaveClass('btn--disabled');
    });

    test('renders with additional className', () => {
      const props = { ...defaultProps, additionalClassName: 'custom-class' };
      const { container } = render(<ActionButton {...props} />);

      const button = container.querySelector('button');
      expect(button).toHaveClass('custom-class');
    });

    test('renders with custom style', () => {
      const props = { ...defaultProps, style: { backgroundColor: 'red' } };
      const { container } = render(<ActionButton {...props} />);

      const button = container.querySelector('button');
      expect(button).toHaveStyle('background-color: red');
    });

    test('renders with tooltip', () => {
      const props = { ...defaultProps, tooltip: 'Test tooltip' };
      const { container } = render(<ActionButton {...props} />);

      const button = container.querySelector('button');
      expect(button).toHaveAttribute('title', 'Test tooltip');
    });
  });

  describe('User Interactions', () => {
    test('handles click events when enabled', () => {
      const onClick = jest.fn();
      const props = { ...defaultProps, onClick };
      const { container } = render(<ActionButton {...props} />);

      const button = container.querySelector('button');
      fireEvent.click(button);

      expect(onClick).toHaveBeenCalledTimes(1);
    });

    test('does not handle click events when disabled', () => {
      const onClick = jest.fn();
      const props = { ...defaultProps, onClick, isDisabled: true };
      const { container } = render(<ActionButton {...props} />);

      const button = container.querySelector('button');
      fireEvent.click(button);

      expect(onClick).not.toHaveBeenCalled();
    });

    test('handles multiple clicks when enabled', () => {
      const onClick = jest.fn();
      const props = { ...defaultProps, onClick };
      const { container } = render(<ActionButton {...props} />);

      const button = container.querySelector('button');
      fireEvent.click(button);
      fireEvent.click(button);
      fireEvent.click(button);

      expect(onClick).toHaveBeenCalledTimes(3);
    });
  });

  describe('Ref Handling', () => {
    test('forwards ref correctly', () => {
      const onRef = jest.fn();
      const props = { ...defaultProps, onRef };
      render(<ActionButton {...props} />);

      expect(onRef).toHaveBeenCalledWith(expect.any(HTMLButtonElement));
    });
  });

  describe('Props Combinations', () => {
    test('renders correctly with all props combined', () => {
      const onClick = jest.fn();
      const onRef = jest.fn();
      const props = {
        iconName: 'edit',
        subIconName: 'check',
        shouldRotateSubIcon: true,
        shouldSpinSubIcon: false,
        letter: null,
        additionalClassName: 'test-class',
        style: { color: 'blue' },
        tooltip: 'Edit button',
        isDisabled: false,
        onClick,
        onRef,
      };

      const { container } = render(<ActionButton {...props} />);

      const button = container.querySelector('button');
      expect(button).toHaveClass(
        'btn',
        'btn--circle',
        'action-drawer__btn',
        'test-class',
        'fas',
        'fa-lg',
        'fa-edit',
        'action-drawer__btn--with-sub-icon'
      );
      expect(button).toHaveStyle('color: blue');
      expect(button).toHaveAttribute('title', 'Edit button');

      const subIcon = container.querySelector('.action-drawer__btn__sub-icon');
      expect(subIcon).toHaveClass(
        'fas',
        'fa-xs',
        'fa-check',
        'action-drawer__btn__sub-icon--rotated'
      );
      expect(subIcon).not.toHaveClass('fa-spin');

      fireEvent.click(button);
      expect(onClick).toHaveBeenCalledTimes(1);
      expect(onRef).toHaveBeenCalledWith(expect.any(HTMLButtonElement));
    });
  });
});
