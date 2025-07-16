import React from 'react';
import { render, fireEvent, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';

import DrawerActionButtons from './index';

afterEach(cleanup);

describe('DrawerActionButtons Integration Tests', () => {
  const defaultProps = {
    onSwitch: jest.fn(),
    onTitleClick: jest.fn(),
    onDescriptionClick: jest.fn(),
    onTagsClick: jest.fn(),
    onPropertiesClick: jest.fn(),
    onDeadlineClick: jest.fn(),
    onScheduledClick: jest.fn(),
    onAddNote: jest.fn(),
    onRemoveHeader: jest.fn(),
    activePopupType: null,
    editRawValues: false,
    setEditRawValues: jest.fn(),
    restorePreferEditRawValues: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Rendering', () => {
    test('renders correctly with default props', () => {
      const { container } = render(<DrawerActionButtons {...defaultProps} />);

      const drawerContainer = container.querySelector('.header-action-drawer-container');
      expect(drawerContainer).toBeInTheDocument();

      const row = container.querySelector('.header-action-drawer__row');
      expect(row).toBeInTheDocument();

      // Check that all action buttons are rendered
      const icons = container.querySelectorAll('i');
      expect(icons).toHaveLength(8); // 8 action buttons
    });

    test('renders title edit button with correct icon', () => {
      const { container } = render(<DrawerActionButtons {...defaultProps} />);

      const titleIcon = container.querySelector('.fa-pencil-alt');
      expect(titleIcon).toBeInTheDocument();
      expect(titleIcon).toHaveClass('fas', 'fa-lg');
    });

    test('renders description edit button with correct icon and test id', () => {
      const { container } = render(<DrawerActionButtons {...defaultProps} />);

      const descIcon = container.querySelector('.fa-edit');
      expect(descIcon).toBeInTheDocument();
      expect(descIcon).toHaveClass('fas', 'fa-lg');
      expect(descIcon).toHaveAttribute('data-testid', 'edit-header-title');
    });

    test('renders tags button with correct icon', () => {
      const { container } = render(<DrawerActionButtons {...defaultProps} />);

      const tagsIcon = container.querySelector('.fa-tags');
      expect(tagsIcon).toBeInTheDocument();
      expect(tagsIcon).toHaveClass('fas', 'fa-lg');
    });

    test('renders properties button with correct icon', () => {
      const { container } = render(<DrawerActionButtons {...defaultProps} />);

      const propsIcon = container.querySelector('.fa-list');
      expect(propsIcon).toBeInTheDocument();
      expect(propsIcon).toHaveClass('fas', 'fa-lg');
    });

    test('renders deadline button with correct icon', () => {
      const { container } = render(<DrawerActionButtons {...defaultProps} />);

      const deadlineIcon = container.querySelector('.fa-calendar-check');
      expect(deadlineIcon).toBeInTheDocument();
      expect(deadlineIcon).toHaveClass('fas', 'fa-lg');
    });

    test('renders scheduled button with correct icon', () => {
      const { container } = render(<DrawerActionButtons {...defaultProps} />);

      const scheduledIcon = container.querySelector('.fa-calendar-times');
      expect(scheduledIcon).toBeInTheDocument();
      expect(scheduledIcon).toHaveClass('far', 'fa-lg');
    });

    test('renders note button with correct icon', () => {
      const { container } = render(<DrawerActionButtons {...defaultProps} />);

      const noteIcon = container.querySelector('.fa-sticky-note');
      expect(noteIcon).toBeInTheDocument();
      expect(noteIcon).toHaveClass('far', 'fa-lg');
    });

    test('renders remove button with correct icon', () => {
      const { container } = render(<DrawerActionButtons {...defaultProps} />);

      const removeIcon = container.querySelector('.fa-trash');
      expect(removeIcon).toBeInTheDocument();
      expect(removeIcon).toHaveClass('fas', 'fa-lg');
    });
  });

  describe('Active Popup State Rendering', () => {
    test('highlights title editor when active', () => {
      const props = { ...defaultProps, activePopupType: 'title-editor' };
      const { container } = render(<DrawerActionButtons {...props} />);

      const titleIcon = container.querySelector('.fa-pencil-alt');
      expect(titleIcon).toHaveClass('drawer-action-button--selected');
    });

    test('highlights description editor when active', () => {
      const props = { ...defaultProps, activePopupType: 'description-editor' };
      const { container } = render(<DrawerActionButtons {...props} />);

      const descIcon = container.querySelector('.fa-edit');
      expect(descIcon).toHaveClass('drawer-action-button--selected');
    });

    test('highlights tags editor when active', () => {
      const props = { ...defaultProps, activePopupType: 'tags-editor' };
      const { container } = render(<DrawerActionButtons {...props} />);

      const tagsIcon = container.querySelector('.fa-tags');
      expect(tagsIcon).toHaveClass('drawer-action-button--selected');
    });

    test('highlights property list editor when active', () => {
      const props = { ...defaultProps, activePopupType: 'property-list-editor' };
      const { container } = render(<DrawerActionButtons {...props} />);

      const propsIcon = container.querySelector('.fa-list');
      expect(propsIcon).toHaveClass('drawer-action-button--selected');
    });

    test('highlights deadline editor when active', () => {
      const props = { ...defaultProps, activePopupType: 'deadline-editor' };
      const { container } = render(<DrawerActionButtons {...props} />);

      const deadlineIcon = container.querySelector('.fa-calendar-check');
      expect(deadlineIcon).toHaveClass('drawer-action-button--selected');
    });

    test('highlights scheduled editor when active', () => {
      const props = { ...defaultProps, activePopupType: 'scheduled-editor' };
      const { container } = render(<DrawerActionButtons {...props} />);

      const scheduledIcon = container.querySelector('.fa-calendar-times');
      expect(scheduledIcon).toHaveClass('drawer-action-button--selected');
    });

    test('highlights note editor when active', () => {
      const props = { ...defaultProps, activePopupType: 'note-editor' };
      const { container } = render(<DrawerActionButtons {...props} />);

      const noteIcon = container.querySelector('.fa-sticky-note');
      expect(noteIcon).toHaveClass('drawer-action-button--selected');
      const removeIcon = container.querySelector('.fa-trash');
      expect(removeIcon).toHaveClass('drawer-action-button--selected');
    });
  });

  describe('User Interactions', () => {
    test('handles title click when not active', () => {
      const { container } = render(<DrawerActionButtons {...defaultProps} />);

      const titleContainer = container
        .querySelector('.fa-pencil-alt')
        .closest('.header-action-drawer__ff-click-catcher-container');
      fireEvent.click(titleContainer);

      expect(defaultProps.onTitleClick).toHaveBeenCalledTimes(1);
      expect(defaultProps.restorePreferEditRawValues).toHaveBeenCalledTimes(1);
      expect(defaultProps.onSwitch).not.toHaveBeenCalled();
    });

    test('handles title click when active - toggles edit mode', () => {
      const props = { ...defaultProps, activePopupType: 'title-editor', editRawValues: false };
      const { container } = render(<DrawerActionButtons {...props} />);

      const titleContainer = container
        .querySelector('.fa-pencil-alt')
        .closest('.header-action-drawer__ff-click-catcher-container');
      fireEvent.click(titleContainer);

      expect(props.onTitleClick).toHaveBeenCalledTimes(1);
      expect(props.onSwitch).toHaveBeenCalledTimes(1);
      expect(props.setEditRawValues).toHaveBeenCalledWith(true);
    });

    test('handles description click when not active', () => {
      const { container } = render(<DrawerActionButtons {...defaultProps} />);

      const descContainer = container
        .querySelector('.fa-edit')
        .closest('.header-action-drawer__ff-click-catcher-container');
      fireEvent.click(descContainer);

      expect(defaultProps.onDescriptionClick).toHaveBeenCalledTimes(1);
      expect(defaultProps.restorePreferEditRawValues).toHaveBeenCalledTimes(1);
      expect(defaultProps.onSwitch).not.toHaveBeenCalled();
    });

    test('handles description click when active - toggles edit mode', () => {
      const props = { ...defaultProps, activePopupType: 'description-editor', editRawValues: true };
      const { container } = render(<DrawerActionButtons {...props} />);

      const descContainer = container
        .querySelector('.fa-edit')
        .closest('.header-action-drawer__ff-click-catcher-container');
      fireEvent.click(descContainer);

      expect(props.onDescriptionClick).toHaveBeenCalledTimes(1);
      expect(props.onSwitch).toHaveBeenCalledTimes(1);
      expect(props.setEditRawValues).toHaveBeenCalledWith(false);
    });

    test('handles tags click', () => {
      const { container } = render(<DrawerActionButtons {...defaultProps} />);

      const tagsContainer = container
        .querySelector('.fa-tags')
        .closest('.header-action-drawer__ff-click-catcher-container');
      fireEvent.click(tagsContainer);

      expect(defaultProps.onTagsClick).toHaveBeenCalledTimes(1);
    });

    test('handles properties click', () => {
      const { container } = render(<DrawerActionButtons {...defaultProps} />);

      const propsContainer = container
        .querySelector('.fa-list')
        .closest('.header-action-drawer__ff-click-catcher-container');
      fireEvent.click(propsContainer);

      expect(defaultProps.onPropertiesClick).toHaveBeenCalledTimes(1);
    });

    test('handles deadline click', () => {
      const { container } = render(<DrawerActionButtons {...defaultProps} />);

      const deadlineContainer = container
        .querySelector('.fa-calendar-check')
        .closest('.header-action-drawer__ff-click-catcher-container');
      fireEvent.click(deadlineContainer);

      expect(defaultProps.onDeadlineClick).toHaveBeenCalledTimes(1);
    });

    test('handles scheduled click', () => {
      const { container } = render(<DrawerActionButtons {...defaultProps} />);

      const scheduledContainer = container
        .querySelector('.fa-calendar-times')
        .closest('.header-action-drawer__ff-click-catcher-container');
      fireEvent.click(scheduledContainer);

      expect(defaultProps.onScheduledClick).toHaveBeenCalledTimes(1);
    });

    test('handles add note click', () => {
      const { container } = render(<DrawerActionButtons {...defaultProps} />);

      const noteContainer = container
        .querySelector('.fa-sticky-note')
        .closest('.header-action-drawer__ff-click-catcher-container');
      fireEvent.click(noteContainer);

      expect(defaultProps.onAddNote).toHaveBeenCalledTimes(1);
    });

    test('handles remove header click', () => {
      const { container } = render(<DrawerActionButtons {...defaultProps} />);

      const removeContainer = container
        .querySelector('.fa-trash')
        .closest('.header-action-drawer__ff-click-catcher-container');
      fireEvent.click(removeContainer);

      expect(defaultProps.onRemoveHeader).toHaveBeenCalledTimes(1);
    });
  });

  describe('Firefox Click Catcher', () => {
    test('renders Firefox click catcher containers for all buttons', () => {
      const { container } = render(<DrawerActionButtons {...defaultProps} />);

      const clickCatchers = container.querySelectorAll(
        '.header-action-drawer__ff-click-catcher-container'
      );
      expect(clickCatchers).toHaveLength(8);

      clickCatchers.forEach((catcher) => {
        const clickCatcherDiv = catcher.querySelector('.header-action-drawer__ff-click-catcher');
        expect(clickCatcherDiv).toBeInTheDocument();
      });
    });

    test('click catcher containers have proper titles', () => {
      const { container } = render(<DrawerActionButtons {...defaultProps} />);

      const titleContainer = container
        .querySelector('.fa-pencil-alt')
        .closest('.header-action-drawer__ff-click-catcher-container');
      expect(titleContainer).toHaveAttribute('title', 'Edit title');

      const descContainer = container
        .querySelector('.fa-edit')
        .closest('.header-action-drawer__ff-click-catcher-container');
      expect(descContainer).toHaveAttribute('title', 'Edit description');

      const tagsContainer = container
        .querySelector('.fa-tags')
        .closest('.header-action-drawer__ff-click-catcher-container');
      expect(tagsContainer).toHaveAttribute('title', 'Modify tags');

      const propsContainer = container
        .querySelector('.fa-list')
        .closest('.header-action-drawer__ff-click-catcher-container');
      expect(propsContainer).toHaveAttribute('title', 'Modify properties');

      const deadlineContainer = container
        .querySelector('.fa-calendar-check')
        .closest('.header-action-drawer__ff-click-catcher-container');
      expect(deadlineContainer).toHaveAttribute('title', 'Set deadline datetime');

      const scheduledContainer = container
        .querySelector('.fa-calendar-times')
        .closest('.header-action-drawer__ff-click-catcher-container');
      expect(scheduledContainer).toHaveAttribute('title', 'Set scheduled datetime');

      const noteContainer = container
        .querySelector('.fa-sticky-note')
        .closest('.header-action-drawer__ff-click-catcher-container');
      expect(noteContainer).toHaveAttribute('title', 'Add a note');

      const removeContainer = container
        .querySelector('.fa-trash')
        .closest('.header-action-drawer__ff-click-catcher-container');
      expect(removeContainer).toHaveAttribute('title', 'Delete this header');
    });
  });
});
