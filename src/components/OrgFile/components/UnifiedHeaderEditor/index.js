import React, { PureComponent } from 'react';
import { fromJS } from 'immutable';

import './stylesheet.css';

import TitleEditorModal from '../TitleEditorModal';
import DescriptionEditorModal from '../DescriptionEditorModal';
import TagsEditorModal from '../TagsEditorModal';
import PropertyListEditorModal from '../PropertyListEditorModal';
import TimestampEditorModal from '../TimestampEditorModal';
import NoteEditorModal from '../NoteEditorModal';
import DrawerActionBar from '../DrawerActionBar';

import { timestampWithId, headerWithId } from '../../../../lib/org_utils';

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
  renderSubEditor() {
    const {
      activePopupType,
      activePopupData,
      selectedHeader,
      headers,
      todoKeywordSets,
      editRawValues,
      dontIndent,
      shouldDisableActions,
      setPopupCloseActionValuesAccessor,
      saveTitle,
      handleTodoChange,
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
        return (
          <TitleEditorModal
            editRawValues={editRawValues}
            todoKeywordSets={todoKeywordSets}
            onClose={getPopupCloseAction('title-editor')}
            saveTitle={saveTitle}
            onTodoClicked={handleTodoChange}
            header={selectedHeader}
            setPopupCloseActionValuesAccessor={setPopupCloseActionValuesAccessor}
          />
        );
      case 'description-editor':
        return (
          <DescriptionEditorModal
            editRawValues={editRawValues}
            header={selectedHeader}
            dontIndent={dontIndent}
            setPopupCloseActionValuesAccessor={setPopupCloseActionValuesAccessor}
          />
        );
      case 'tags-editor':
        return (
          <TagsEditorModal
            header={selectedHeader}
            allTags={allTags}
            onChange={handleTagsChange}
          />
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
        // In capture mode, the header isn't in Redux headers, so look it up from props
        const captureMode = this.props.captureMode;
        const headerId = activePopupData.get('headerId');
        const resolvedHeader = captureMode ? selectedHeader : headerWithId(headers, headerId);
        if (activePopupData.get('timestampId')) {
          editingTimestamp = captureMode ? null : timestampWithId(headers, activePopupData.get('timestampId'));
        } else if (activePopupData.get('logEntryIndex') !== undefined) {
          editingTimestamp = resolvedHeader ? fromJS({
            firstTimestamp: resolvedHeader.getIn([
              'logBookEntries',
              activePopupData.get('logEntryIndex'),
              activePopupData.get('entryType'),
            ]),
          }) : null;
        } else if (
          // for scheduled timestamp and deadline the modal can be opened when no timestamp exists
          (activePopupType !== 'scheduled-editor' && activePopupType !== 'deadline-editor') ||
          activePopupData.get('planningItemIndex') !== -1
        ) {
          editingTimestamp = resolvedHeader ? fromJS({
            firstTimestamp: resolvedHeader.getIn([
              'planningItems',
              activePopupData.get('planningItemIndex'),
              'timestamp',
            ]),
          }) : null;
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
              <span className="capture-header-bar__description" data-testid="capture-template-description">
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
              <button className="btn capture-header-bar__capture-btn" onClick={onCapture} data-testid="capture-confirm-button">
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
