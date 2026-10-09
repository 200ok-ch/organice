import React, { PureComponent } from 'react';
import { fromJS } from 'immutable';

import './stylesheet.css';

import _ from 'lodash';

import TabButtons from '../../../UI/TabButtons';
import TagsEditorModal from '../TagsEditorModal';
import PropertyListEditorModal from '../PropertyListEditorModal';
import TimestampEditorModal from '../TimestampEditorModal';
import NoteEditorModal from '../NoteEditorModal';
import DrawerActionBar from '../DrawerActionBar';

import { generateTitleLine, createRawDescriptionText } from '../../../../lib/export_org';
import { getCurrentTimestampAsText } from '../../../../lib/timestamps';
import { todoKeywordSetForKeyword, timestampWithId, headerWithId } from '../../../../lib/org_utils';
import { isMobileBrowser } from '../../../../lib/browser_utils';

// Header-editing popup types that use the unified editor
export const UNIFIED_EDITOR_POPUP_TYPES = [
  'title-editor',
  'description-editor',
  'tags-editor',
  'property-list-editor',
  'timestamp-editor',
  'scheduled-editor',
  'deadline-editor',
  'note-editor',
];

class UnifiedHeaderEditor extends PureComponent {
  constructor(props) {
    super(props);

    _.bindAll(this, [
      'handleTitleTextareaRef',
      'handleTitleTextareaFocus',
      'handleTitleChange',
      'handleTitleFieldClick',
      'handleTitleInsertTimestamp',
      'handleTitleTodoChange',
      'handleNextTodoKeywordSet',
      'handleDescriptionTextareaRef',
      'handleDescriptionChange',
      'handleDescriptionKeyDown',
      'handleDescriptionInsertTimestamp',
    ]);

    const header = props.selectedHeader;

    // Title editor state
    const todoKeywordSet = todoKeywordSetForKeyword(
      props.todoKeywordSets,
      header ? header.getIn(['titleLine', 'todoKeyword']) : undefined
    );

    this.state = {
      // Title state
      todoKeywordSet,
      todoKeywordSetIndex: props.todoKeywordSets
        ? props.todoKeywordSets.indexOf(todoKeywordSet)
        : 0,
      titleValue: header
        ? props.editRawValues
          ? this.calculateRawTitle(header)
          : header.getIn(['titleLine', 'rawTitle'])
        : '',
      // Description state
      descriptionValue: header
        ? props.editRawValues
          ? this.calculateRawDescription(header)
          : header.get('rawDescription')
        : '',
      editorDescriptionHeightValue: props.editorDescriptionHeightValue
        ? props.editorDescriptionHeightValue
        : '8',
    };
  }

  // --- Title editor methods ---

  handleTitleTextareaRef(textarea) {
    this.titleTextarea = textarea;
  }

  handleTitleTextareaFocus(event) {
    const { selectedHeader } = this.props;
    if (!selectedHeader) return;
    const rawTitle = selectedHeader.getIn(['titleLine', 'rawTitle']);
    if (rawTitle === '') {
      const text = event.target.value;
      event.target.selectionStart = text.length;
      event.target.selectionEnd = text.length;
    }
  }

  handleTitleChange(event) {
    const newTitle = event.target.value;
    const lastCharacter = newTitle[newTitle.length - 1];
    if (
      this.state.titleValue === newTitle.substring(0, newTitle.length - 1) &&
      lastCharacter === '\n'
    ) {
      this.props.getPopupCloseAction('title-editor')(newTitle);
      return;
    }
    this.setState({ titleValue: newTitle });
  }

  handleTitleFieldClick(event) {
    event.stopPropagation();
  }

  calculateRawTitle(header) {
    return generateTitleLine(header.toJS(), false);
  }

  handleTitleInsertTimestamp(event) {
    const { titleValue } = this.state;
    const insertionIndex = this.titleTextarea.selectionStart;
    this.setState({
      titleValue:
        titleValue.substring(0, insertionIndex) +
        getCurrentTimestampAsText() +
        titleValue.substring(this.titleTextarea.selectionEnd || insertionIndex),
    });
    this.titleTextarea.focus();
    event.stopPropagation();
  }

  handleTitleTodoChange(newTodoKeyword) {
    const currentTodoKeyword = this.props.selectedHeader
      ? this.props.selectedHeader.getIn(['titleLine', 'todoKeyword'])
      : undefined;
    const keyword = currentTodoKeyword === newTodoKeyword ? '' : newTodoKeyword;
    this.props.saveTitle(this.state.titleValue);
    this.props.handleTodoChange(keyword);
  }

  handleNextTodoKeywordSet() {
    const { todoKeywordSets } = this.props;
    const newIndex =
      this.state.todoKeywordSetIndex + 1 !== todoKeywordSets.size
        ? this.state.todoKeywordSetIndex + 1
        : 0;
    const newTodoKeywordSet =
      newIndex !== todoKeywordSets.size ? todoKeywordSets.get(newIndex) : todoKeywordSets.get(0);
    this.setState({
      todoKeywordSet: newTodoKeywordSet,
      todoKeywordSetIndex: newIndex,
    });
  }

  // --- Description editor methods ---

  handleDescriptionTextareaRef(textarea) {
    this.descriptionTextarea = textarea;
  }

  calculateRawDescription(header) {
    const dontIndent = this.props.dontIndent;
    return createRawDescriptionText(header, false, dontIndent);
  }

  descriptionModifier(event) {
    const {
      target: { value },
    } = event;
    const eachValList = value.split('\n');
    eachValList.forEach((item, index) => {
      if (item.startsWith('* ')) {
        eachValList[index] = '- ' + item.slice(2);
      }
    });
    return eachValList.join('\n');
  }

  handleDescriptionChange(event) {
    this.setState({ descriptionValue: this.descriptionModifier(event) });
  }

  handleDescriptionKeyDown(event) {
    if (event.key !== 'Enter') return;

    const textarea = this.descriptionTextarea;
    const { selectionStart, selectionEnd } = textarea;
    const { descriptionValue } = this.state;

    const textBeforeCursor = descriptionValue.substring(0, selectionStart);
    const lastNewlineIndex = textBeforeCursor.lastIndexOf('\n');
    const currentLine = textBeforeCursor.substring(lastNewlineIndex + 1);

    // Check for ordered list: "1. item" or "  2) item"
    const orderedMatch = currentLine.match(/^(\s*)(\d+)([.)]) (.*)$/);
    if (orderedMatch) {
      const [, indent, num, separator, content] = orderedMatch;
      event.preventDefault();
      if (content.trim() === '') {
        // Empty item — remove the prefix to exit list mode
        const lineStart = lastNewlineIndex + 1;
        const newValue =
          descriptionValue.substring(0, lineStart) + descriptionValue.substring(selectionStart);
        this.setState({ descriptionValue: newValue }, () => {
          textarea.selectionStart = lineStart;
          textarea.selectionEnd = lineStart;
        });
      } else {
        const nextNum = parseInt(num, 10) + 1;
        const prefix = '\n' + indent + nextNum + separator + ' ';
        const newValue =
          descriptionValue.substring(0, selectionStart) +
          prefix +
          descriptionValue.substring(selectionEnd);
        this.setState({ descriptionValue: newValue }, () => {
          const newCursorPos = selectionStart + prefix.length;
          textarea.selectionStart = newCursorPos;
          textarea.selectionEnd = newCursorPos;
        });
      }
      return;
    }

    // Check for unordered list: "- item" or "  + item",
    // optionally followed by a checkbox ("[ ]", "[X], "[-]")
    const unorderedMatch = currentLine.match(/^(\s*)([-+]) (\[[-X ]] )?(.*)$/);
    if (unorderedMatch) {
      const [, indent, bullet, optionalCheckbox, content] = unorderedMatch;
      const checkbox = optionalCheckbox ? optionalCheckbox : '';
      event.preventDefault();
      if (content.trim() === '') {
        // Empty item — remove the prefix to exit list mode
        const lineStart = lastNewlineIndex + 1;
        const newValue =
          descriptionValue.substring(0, lineStart) + descriptionValue.substring(selectionStart);
        this.setState({ descriptionValue: newValue }, () => {
          textarea.selectionStart = lineStart;
          textarea.selectionEnd = lineStart;
        });
      } else {
        const prefix = '\n' + indent + bullet + ' ';
        const newValue =
          descriptionValue.substring(0, selectionStart) +
          prefix +
          checkbox +
          descriptionValue.substring(selectionEnd);
        this.setState({ descriptionValue: newValue }, () => {
          const newCursorPos = selectionStart + prefix.length + checkbox.length;
          textarea.selectionStart = newCursorPos;
          textarea.selectionEnd = newCursorPos;
        });
      }
      return;
    }
  }

  handleDescriptionInsertTimestamp() {
    const { descriptionValue } = this.state;
    const insertionIndex = this.descriptionTextarea.selectionStart;
    this.setState({
      descriptionValue:
        descriptionValue.substring(0, insertionIndex) +
        getCurrentTimestampAsText() +
        descriptionValue.substring(this.descriptionTextarea.selectionEnd || insertionIndex),
    });
    this.descriptionTextarea.focus();
  }

  // --- Lifecycle ---

  componentDidMount() {
    this.updateCloseActionAccessor();
    // Title textarea: ensure cursor is at end after mount
    if (this.props.activePopupType === 'title-editor' && this.titleTextarea) {
      const len = this.titleTextarea.value.length;
      this.titleTextarea.selectionStart = len;
      this.titleTextarea.selectionEnd = len;
    }
  }

  componentDidUpdate(prevProps) {
    const { selectedHeader, editRawValues, activePopupType } = this.props;

    // Update close action accessor when sub-editor changes
    if (prevProps.activePopupType !== activePopupType) {
      this.updateCloseActionAccessor();
    }

    if (!selectedHeader) return;

    if (prevProps.selectedHeader !== selectedHeader || prevProps.editRawValues !== editRawValues) {
      if (activePopupType === 'title-editor') {
        this.setState({
          titleValue: editRawValues
            ? this.calculateRawTitle(selectedHeader)
            : selectedHeader.getIn(['titleLine', 'rawTitle']),
        });
        if (this.titleTextarea) this.titleTextarea.focus();
      }
      if (activePopupType === 'description-editor') {
        this.setState({
          descriptionValue: editRawValues
            ? this.calculateRawDescription(selectedHeader)
            : selectedHeader.get('rawDescription'),
        });
        if (this.descriptionTextarea) this.descriptionTextarea.focus();
      }
    }
  }

  updateCloseActionAccessor() {
    const { activePopupType, setPopupCloseActionValuesAccessor } = this.props;
    if (activePopupType === 'title-editor') {
      setPopupCloseActionValuesAccessor(() => [this.state.titleValue]);
    } else if (activePopupType === 'description-editor') {
      setPopupCloseActionValuesAccessor(() => [this.state.descriptionValue]);
    }
  }

  // --- Render sub-editors ---

  renderTitleEditor() {
    const { editRawValues, selectedHeader, todoKeywordSets } = this.props;
    const { todoKeywordSet, titleValue } = this.state;

    return (
      <>
        <h2 className="drawer-modal__title">{editRawValues ? 'Edit full title' : 'Edit title'}</h2>

        {editRawValues ? null : (
          <div className="todo-container">
            <TabButtons
              buttons={todoKeywordSet
                .get('keywords')
                .filter(
                  (todo) =>
                    todoKeywordSet
                      .get('completedKeywords')
                      .filter((completed) => todo === completed).size === 0
                )}
              selectedButton={
                selectedHeader ? selectedHeader.getIn(['titleLine', 'todoKeyword']) : undefined
              }
              onSelect={this.handleTitleTodoChange}
            />
            <TabButtons
              buttons={todoKeywordSet.get('completedKeywords').filter((todo) => todo !== '')}
              selectedButton={
                selectedHeader ? selectedHeader.getIn(['titleLine', 'todoKeyword']) : undefined
              }
              onSelect={this.handleTitleTodoChange}
            />

            {todoKeywordSets.size > 1 ? (
              <button
                className="btn-passive"
                onClick={this.handleNextTodoKeywordSet}
                title="Next keyword set"
              >
                Next set
              </button>
            ) : null}
          </div>
        )}

        <div className="title-line__edit-container">
          <textarea
            autoFocus
            className="textarea drag-handle"
            data-testid="titleLineInput"
            rows="3"
            ref={this.handleTitleTextareaRef}
            value={titleValue}
            onFocus={this.handleTitleTextareaFocus}
            onChange={this.handleTitleChange}
            onClick={this.handleTitleFieldClick}
          />
          <div
            className="title-line__insert-timestamp-button"
            onClick={this.handleTitleInsertTimestamp}
          >
            <i className="fas fa-plus insert-timestamp-icon" />
            Insert timestamp
          </div>
        </div>
      </>
    );
  }

  renderDescriptionEditor() {
    const { editRawValues } = this.props;
    const { descriptionValue, editorDescriptionHeightValue } = this.state;

    return (
      <>
        <h2 className="drawer-modal__title">
          {editRawValues ? 'Edit full description' : 'Edit description'}
        </h2>

        <div className="header-content__edit-container">
          <textarea
            autoFocus
            className="textarea drag-handle"
            data-testid="description-textarea"
            rows={isMobileBrowser ? '8' : editorDescriptionHeightValue}
            ref={this.handleDescriptionTextareaRef}
            value={descriptionValue}
            onChange={this.handleDescriptionChange}
            onKeyDown={this.handleDescriptionKeyDown}
          />
          <div
            className="header-content__insert-timestamp-button"
            onClick={this.handleDescriptionInsertTimestamp}
          >
            <i className="fas fa-plus insert-timestamp-icon" />
            Insert timestamp
          </div>
        </div>
      </>
    );
  }

  renderSubEditor() {
    const {
      activePopupType,
      activePopupData,
      selectedHeader,
      headers,
      shouldDisableActions,
      handleTagsChange,
      handlePropertyListItemsChange,
      handleTimestampChange,
      onCreatePlanningItem,
      onRemovePlanningItem,
      allTags,
      allOrgProperties,
      getPopupCloseAction,
    } = this.props;

    switch (activePopupType) {
      case 'title-editor':
        return this.renderTitleEditor();
      case 'description-editor':
        return this.renderDescriptionEditor();
      case 'tags-editor':
        return (
          <TagsEditorModal header={selectedHeader} allTags={allTags} onChange={handleTagsChange} />
        );
      case 'property-list-editor':
        return selectedHeader ? (
          <PropertyListEditorModal
            onChange={handlePropertyListItemsChange}
            propertyListItems={selectedHeader.get('propertyListItems')}
            allOrgProperties={allOrgProperties}
          />
        ) : null;
      case 'timestamp-editor':
      case 'scheduled-editor':
      case 'deadline-editor':
        let editingTimestamp = null;
        const captureMode = this.props.captureMode;
        const headerId = activePopupData.get('headerId');
        const resolvedHeader = captureMode ? selectedHeader : headerWithId(headers, headerId);
        if (activePopupData.get('timestampId')) {
          editingTimestamp = captureMode
            ? null
            : timestampWithId(headers, activePopupData.get('timestampId'));
        } else if (activePopupData.get('logEntryIndex') !== undefined) {
          editingTimestamp = resolvedHeader
            ? fromJS({
                firstTimestamp: resolvedHeader.getIn([
                  'logBookEntries',
                  activePopupData.get('logEntryIndex'),
                  activePopupData.get('entryType'),
                ]),
              })
            : null;
        } else if (
          (activePopupType !== 'scheduled-editor' && activePopupType !== 'deadline-editor') ||
          activePopupData.get('planningItemIndex') !== -1
        ) {
          editingTimestamp = resolvedHeader
            ? fromJS({
                firstTimestamp: resolvedHeader.getIn([
                  'planningItems',
                  activePopupData.get('planningItemIndex'),
                  'timestamp',
                ]),
              })
            : null;
        }

        return (
          <TimestampEditorModal
            headerId={activePopupData.get('headerId')}
            timestamp={editingTimestamp}
            timestampId={activePopupData.get('timestampId')}
            popupType={activePopupType}
            planningItemIndex={activePopupData.get('planningItemIndex')}
            singleTimestampOnly={!activePopupData.get('timestampId')}
            onClose={getPopupCloseAction(activePopupType)}
            onChange={handleTimestampChange(activePopupData)}
            onCreatePlanningItem={onCreatePlanningItem}
            onRemovePlanningItem={onRemovePlanningItem}
          />
        );
      case 'note-editor':
        return (
          <NoteEditorModal
            shouldDisableActions={shouldDisableActions}
            onAddNote={this.props.onAddNote}
          />
        );
      default:
        return null;
    }
  }

  render() {
    const {
      onSwitch,
      editRawValues,
      setEditRawValues,
      restorePreferEditRawValues,
      captureMode,
      captureTemplate,
      captureShouldPrepend,
      onCapture,
      onTogglePrepend,
      selectedHeader,
    } = this.props;

    return (
      <div className="unified-header-editor" data-testid="unified-header-editor">
        {captureMode && captureTemplate && (
          <div className="capture-header-bar" data-testid="capture-header-bar">
            <div className="capture-header-bar__template-info">
              <span className="capture-header-bar__letter">{captureTemplate.get('letter')}</span>
              <span
                className="capture-header-bar__description"
                data-testid="capture-template-description"
              >
                {captureTemplate.get('description')}
              </span>
            </div>
            <div className="capture-header-bar__controls">
              <label className="capture-header-bar__prepend-toggle">
                <input
                  type="checkbox"
                  checked={captureShouldPrepend}
                  onChange={onTogglePrepend}
                  data-testid="capture-prepend-checkbox"
                />
                <span>Prepend</span>
              </label>
              <button
                className="btn capture-header-bar__capture-btn"
                onClick={onCapture}
                data-testid="capture-confirm-button"
              >
                Capture
              </button>
            </div>
          </div>
        )}
        {this.renderSubEditor()}
        <DrawerActionBar
          onSwitch={onSwitch}
          editRawValues={editRawValues}
          setEditRawValues={setEditRawValues}
          restorePreferEditRawValues={restorePreferEditRawValues}
          captureMode={captureMode}
          captureHeader={captureMode ? selectedHeader : null}
        />
      </div>
    );
  }
}

export default UnifiedHeaderEditor;
