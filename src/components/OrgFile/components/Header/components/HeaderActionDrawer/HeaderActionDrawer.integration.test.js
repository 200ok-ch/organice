import React from 'react';
import { render, fireEvent, cleanup, act } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';

import HeaderActionDrawer from './index';

afterEach(cleanup);

// Mock timers for long press functionality
beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});

describe('HeaderActionDrawer Integration Tests', () => {
  const defaultProps = {
    onTitleClick: jest.fn(),
    onDescriptionClick: jest.fn(),
    onTagsClick: jest.fn(),
    onPropertiesClick: jest.fn(),
    isNarrowed: false,
    onNarrow: jest.fn(),
    onWiden: jest.fn(),
    onAddNewHeader: jest.fn(),
    onDeadlineClick: jest.fn(),
    onClockInOutClick: jest.fn(),
    onScheduledClick: jest.fn(),
    hasActiveClock: false,
    onShareHeader: jest.fn(),
    onRefileHeader: jest.fn(),
    onAddNote: jest.fn(),
    onDuplicateHeader: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Rendering', () => {
    test('renders correctly with default props', () => {
      const { container } = render(<HeaderActionDrawer {...defaultProps} />);
      
      const drawerContainer = container.querySelector('.header-action-drawer-container');
      expect(drawerContainer).toBeInTheDocument();
      
      const rows = container.querySelectorAll('.header-action-drawer__row');
      expect(rows).toHaveLength(2); // Two rows of action buttons
    });

    test('renders first row action buttons', () => {
      const { container } = render(<HeaderActionDrawer {...defaultProps} />);
      
      const firstRow = container.querySelectorAll('.header-action-drawer__row')[0];
      const icons = firstRow.querySelectorAll('i');
      
      expect(icons).toHaveLength(6); // 6 buttons in first row
      expect(firstRow.querySelector('.fa-pencil-alt')).toBeInTheDocument();
      expect(firstRow.querySelector('.fa-edit')).toBeInTheDocument();
      expect(firstRow.querySelector('.fa-tags')).toBeInTheDocument();
      expect(firstRow.querySelector('.fa-list')).toBeInTheDocument();
      expect(firstRow.querySelector('.fa-compress')).toBeInTheDocument(); // narrow button when not narrowed
      expect(firstRow.querySelector('.fa-plus')).toBeInTheDocument();
    });

    test('renders second row action buttons', () => {
      const { container } = render(<HeaderActionDrawer {...defaultProps} />);
      
      const secondRow = container.querySelectorAll('.header-action-drawer__row')[1];
      const icons = secondRow.querySelectorAll('i');
      
      expect(icons).toHaveLength(6); // 6 buttons in second row
      expect(secondRow.querySelector('.fa-share')).toBeInTheDocument();
      expect(secondRow.querySelector('.fa-calendar-check')).toBeInTheDocument();
      expect(secondRow.querySelector('.fa-calendar-check.far')).toBeInTheDocument(); // scheduled
      expect(secondRow.querySelector('.fa-hourglass-start')).toBeInTheDocument(); // clock in when no active clock
      expect(secondRow.querySelector('.fa-file-export')).toBeInTheDocument();
      expect(secondRow.querySelector('.fa-sticky-note')).toBeInTheDocument();
    });

    test('renders expand button when narrowed', () => {
      const props = { ...defaultProps, isNarrowed: true };
      const { container } = render(<HeaderActionDrawer {...props} />);
      
      const expandIcon = container.querySelector('.fa-expand');
      expect(expandIcon).toBeInTheDocument();
      expect(container.querySelector('.fa-compress')).not.toBeInTheDocument();
    });

    test('renders clock out button when has active clock', () => {
      const props = { ...defaultProps, hasActiveClock: true };
      const { container } = render(<HeaderActionDrawer {...props} />);
      
      const clockOutIcon = container.querySelector('.fa-hourglass-end');
      expect(clockOutIcon).toBeInTheDocument();
      expect(container.querySelector('.fa-hourglass-start')).not.toBeInTheDocument();
    });
  });

  describe('User Interactions - Basic Clicks', () => {
    test('handles title click', () => {
      const { container } = render(<HeaderActionDrawer {...defaultProps} />);
      
      const titleContainer = container.querySelector('.fa-pencil-alt').closest('.header-action-drawer__ff-click-catcher-container');
      fireEvent.click(titleContainer);
      
      expect(defaultProps.onTitleClick).toHaveBeenCalledTimes(1);
    });

    test('handles description click', () => {
      const { container } = render(<HeaderActionDrawer {...defaultProps} />);
      
      const descContainer = container.querySelector('.fa-edit').closest('.header-action-drawer__ff-click-catcher-container');
      fireEvent.click(descContainer);
      
      expect(defaultProps.onDescriptionClick).toHaveBeenCalledTimes(1);
    });

    test('handles tags click', () => {
      const { container } = render(<HeaderActionDrawer {...defaultProps} />);
      
      const tagsContainer = container.querySelector('.fa-tags').closest('.header-action-drawer__ff-click-catcher-container');
      fireEvent.click(tagsContainer);
      
      expect(defaultProps.onTagsClick).toHaveBeenCalledTimes(1);
    });

    test('handles properties click', () => {
      const { container } = render(<HeaderActionDrawer {...defaultProps} />);
      
      const propsContainer = container.querySelector('.fa-list').closest('.header-action-drawer__ff-click-catcher-container');
      fireEvent.click(propsContainer);
      
      expect(defaultProps.onPropertiesClick).toHaveBeenCalledTimes(1);
    });

    test('handles narrow click when not narrowed', () => {
      const { container } = render(<HeaderActionDrawer {...defaultProps} />);
      
      const narrowContainer = container.querySelector('.fa-compress').closest('.header-action-drawer__ff-click-catcher-container');
      fireEvent.click(narrowContainer);
      
      expect(defaultProps.onNarrow).toHaveBeenCalledTimes(1);
    });

    test('handles widen click when narrowed', () => {
      const props = { ...defaultProps, isNarrowed: true };
      const { container } = render(<HeaderActionDrawer {...props} />);
      
      const widenContainer = container.querySelector('.fa-expand').closest('.header-action-drawer__ff-click-catcher-container');
      fireEvent.click(widenContainer);
      
      expect(props.onWiden).toHaveBeenCalledTimes(1);
    });

    test('handles add new header click', () => {
      const { container } = render(<HeaderActionDrawer {...defaultProps} />);
      
      const addContainer = container.querySelector('.fa-plus').closest('.header-action-drawer__ff-click-catcher-container');
      fireEvent.click(addContainer);
      
      expect(defaultProps.onAddNewHeader).toHaveBeenCalledTimes(1);
    });

    test('handles share header click', () => {
      const { container } = render(<HeaderActionDrawer {...defaultProps} />);
      
      const shareContainer = container.querySelector('.fa-share').closest('.header-action-drawer__ff-click-catcher-container');
      fireEvent.click(shareContainer);
      
      expect(defaultProps.onShareHeader).toHaveBeenCalledTimes(1);
    });

    test('handles deadline click', () => {
      const { container } = render(<HeaderActionDrawer {...defaultProps} />);
      
      const deadlineContainer = container.querySelector('.fa-calendar-check.fas').closest('.header-action-drawer__ff-click-catcher-container');
      fireEvent.click(deadlineContainer);
      
      expect(defaultProps.onDeadlineClick).toHaveBeenCalledTimes(1);
    });

    test('handles scheduled click', () => {
      const { container } = render(<HeaderActionDrawer {...defaultProps} />);
      
      const scheduledContainer = container.querySelector('.fa-calendar-check.far').closest('.header-action-drawer__ff-click-catcher-container');
      fireEvent.click(scheduledContainer);
      
      expect(defaultProps.onScheduledClick).toHaveBeenCalledTimes(1);
    });

    test('handles clock in click when no active clock', () => {
      const { container } = render(<HeaderActionDrawer {...defaultProps} />);
      
      const clockContainer = container.querySelector('.fa-hourglass-start').closest('.header-action-drawer__ff-click-catcher-container');
      fireEvent.click(clockContainer);
      
      expect(defaultProps.onClockInOutClick).toHaveBeenCalledTimes(1);
    });

    test('handles clock out click when has active clock', () => {
      const props = { ...defaultProps, hasActiveClock: true };
      const { container } = render(<HeaderActionDrawer {...props} />);
      
      const clockContainer = container.querySelector('.fa-hourglass-end').closest('.header-action-drawer__ff-click-catcher-container');
      fireEvent.click(clockContainer);
      
      expect(props.onClockInOutClick).toHaveBeenCalledTimes(1);
    });

    test('handles refile header click', () => {
      const { container } = render(<HeaderActionDrawer {...defaultProps} />);
      
      const refileContainer = container.querySelector('.fa-file-export').closest('.header-action-drawer__ff-click-catcher-container');
      fireEvent.click(refileContainer);
      
      expect(defaultProps.onRefileHeader).toHaveBeenCalledTimes(1);
    });

    test('handles add note click', () => {
      const { container } = render(<HeaderActionDrawer {...defaultProps} />);
      
      const noteContainer = container.querySelector('.fa-sticky-note').closest('.header-action-drawer__ff-click-catcher-container');
      fireEvent.click(noteContainer);
      
      expect(defaultProps.onAddNote).toHaveBeenCalledTimes(1);
    });
  });

  describe('Long Press Functionality', () => {
    test('handles long press on add new header button', async () => {
      const { container } = render(<HeaderActionDrawer {...defaultProps} />);
      
      const addContainer = container.querySelector('.fa-plus').closest('.header-action-drawer__ff-click-catcher-container');
      
      // Start long press
      fireEvent.mouseDown(addContainer);
      
      // Fast forward time to trigger long press
      act(() => {
        jest.advanceTimersByTime(600);
      });
      
      expect(defaultProps.onDuplicateHeader).toHaveBeenCalledTimes(1);
      
      // End long press
      fireEvent.mouseUp(addContainer);
    });

    test('handles long press with touch events', async () => {
      const { container } = render(<HeaderActionDrawer {...defaultProps} />);
      
      const addContainer = container.querySelector('.fa-plus').closest('.header-action-drawer__ff-click-catcher-container');
      
      // Start long press with touch
      fireEvent.touchStart(addContainer);
      
      // Fast forward time to trigger long press
      act(() => {
        jest.advanceTimersByTime(600);
      });
      
      expect(defaultProps.onDuplicateHeader).toHaveBeenCalledTimes(1);
      
      // End long press
      fireEvent.touchEnd(addContainer);
    });

    test('cancels long press on mouse leave', async () => {
      const { container } = render(<HeaderActionDrawer {...defaultProps} />);
      
      const addContainer = container.querySelector('.fa-plus').closest('.header-action-drawer__ff-click-catcher-container');
      
      // Start long press
      fireEvent.mouseDown(addContainer);
      
      // Leave before long press completes
      fireEvent.mouseLeave(addContainer);
      
      // Fast forward time past long press threshold
      act(() => {
        jest.advanceTimersByTime(700);
      });
      
      expect(defaultProps.onDuplicateHeader).not.toHaveBeenCalled();
    });

    test('cancels long press on touch cancel', async () => {
      const { container } = render(<HeaderActionDrawer {...defaultProps} />);
      
      const addContainer = container.querySelector('.fa-plus').closest('.header-action-drawer__ff-click-catcher-container');
      
      // Start long press with touch
      fireEvent.touchStart(addContainer);
      
      // Cancel before long press completes
      fireEvent.touchCancel(addContainer);
      
      // Fast forward time past long press threshold
      act(() => {
        jest.advanceTimersByTime(700);
      });
      
      expect(defaultProps.onDuplicateHeader).not.toHaveBeenCalled();
    });

    test('prevents regular click after long press', async () => {
      const { container } = render(<HeaderActionDrawer {...defaultProps} />);
      
      const addContainer = container.querySelector('.fa-plus').closest('.header-action-drawer__ff-click-catcher-container');
      
      // Start long press
      fireEvent.mouseDown(addContainer);
      
      // Complete long press
      act(() => {
        jest.advanceTimersByTime(600);
      });
      
      // End long press and click
      fireEvent.mouseUp(addContainer);
      fireEvent.click(addContainer);
      
      expect(defaultProps.onDuplicateHeader).toHaveBeenCalledTimes(1);
      expect(defaultProps.onAddNewHeader).not.toHaveBeenCalled();
    });

    test('allows regular click when long press not triggered', () => {
      const { container } = render(<HeaderActionDrawer {...defaultProps} />);
      
      const addContainer = container.querySelector('.fa-plus').closest('.header-action-drawer__ff-click-catcher-container');
      
      // Quick click without long press
      fireEvent.click(addContainer);
      
      expect(defaultProps.onAddNewHeader).toHaveBeenCalledTimes(1);
      expect(defaultProps.onDuplicateHeader).not.toHaveBeenCalled();
    });
  });

  describe('Fallback Behavior', () => {
    test('uses onAddNewHeader as fallback when onDuplicateHeader not provided', async () => {
      const props = { ...defaultProps };
      delete props.onDuplicateHeader;
      
      const { container } = render(<HeaderActionDrawer {...props} />);
      
      const addContainer = container.querySelector('.fa-plus').closest('.header-action-drawer__ff-click-catcher-container');
      
      // Start long press
      fireEvent.mouseDown(addContainer);
      
      // Complete long press
      act(() => {
        jest.advanceTimersByTime(600);
      });
      
      expect(defaultProps.onAddNewHeader).toHaveBeenCalledTimes(1);
      
      fireEvent.mouseUp(addContainer);
    });
  });

  describe('Button Titles and Test IDs', () => {
    test('has correct titles for all buttons', () => {
      const { container } = render(<HeaderActionDrawer {...defaultProps} />);
      
      expect(container.querySelector('.fa-pencil-alt').closest('.header-action-drawer__ff-click-catcher-container')).toHaveAttribute('title', 'Edit header title');
      expect(container.querySelector('.fa-edit').closest('.header-action-drawer__ff-click-catcher-container')).toHaveAttribute('title', 'Edit header description');
      expect(container.querySelector('.fa-tags').closest('.header-action-drawer__ff-click-catcher-container')).toHaveAttribute('title', 'Modify tags');
      expect(container.querySelector('.fa-list').closest('.header-action-drawer__ff-click-catcher-container')).toHaveAttribute('title', 'Modify properties');
      expect(container.querySelector('.fa-compress').closest('.header-action-drawer__ff-click-catcher-container')).toHaveAttribute('title', 'Narrow to subtree (focusing in on some portion of the buffer, making the rest temporarily inaccessible.)');
      expect(container.querySelector('.fa-plus').closest('.header-action-drawer__ff-click-catcher-container')).toHaveAttribute('title', 'Create new header below (long-press to duplicate current header)');
    });

    test('has correct test IDs for testable elements', () => {
      const { container } = render(<HeaderActionDrawer {...defaultProps} />);
      
      expect(container.querySelector('[data-testid="edit-header-title"]')).toBeInTheDocument();
      expect(container.querySelector('[data-testid="header-action-narrow"]')).toBeInTheDocument();
      expect(container.querySelector('[data-testid="header-action-plus"]')).toBeInTheDocument();
      expect(container.querySelector('[data-testid="share"]')).toBeInTheDocument();
      expect(container.querySelector('[data-testid="org-clock-in"]')).toBeInTheDocument();
      expect(container.querySelector('[data-testid="org-refile"]')).toBeInTheDocument();
    });

    test('has correct test ID for clock out when active', () => {
      const props = { ...defaultProps, hasActiveClock: true };
      const { container } = render(<HeaderActionDrawer {...props} />);
      
      expect(container.querySelector('[data-testid="org-clock-out"]')).toBeInTheDocument();
      expect(container.querySelector('[data-testid="org-clock-in"]')).not.toBeInTheDocument();
    });
  });
});