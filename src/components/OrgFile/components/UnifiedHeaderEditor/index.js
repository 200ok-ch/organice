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
        if (activePopupData.get('timestampId')) {
          editingTimestamp = timestampWithId(headers, activePopupData.get('timestampId'));
        } else if (activePopupData.get('logEntryIndex') !== undefined) {
          editingTimestamp = fromJS({
            firstTimestamp: headerWithId(headers, activePopupData.get('headerId')).getIn([
              'logBookEntries',
              activePopupData.get('logEntryIndex'),
              activePopupData.get('entryType'),
            ]),
          });
        } else if (
          // for scheduled timestamp and deadline the modal can be opened when no timestamp exists
          (activePopupType !== 'scheduled-editor' && activePopupType !== 'deadline-editor') ||
          activePopupData.get('planningItemIndex') !== -1
        ) {
          editingTimestamp = fromJS({
            firstTimestamp: headerWithId(headers, activePopupData.get('headerId')).getIn([
              'planningItems',
              activePopupData.get('planningItemIndex'),
              'timestamp',
            ]),
          });
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
          />
        );
      case 'note-editor':
        return <NoteEditorModal shouldDisableActions={shouldDisableActions} />;
      default:
        return null;
    }
  }

  render() {
    const { onSwitch, editRawValues, setEditRawValues, restorePreferEditRawValues } = this.props;

    return (
      <div className="unified-header-editor" data-testid="unified-header-editor">
        {this.renderSubEditor()}
        <DrawerActionBar
          onSwitch={onSwitch}
          editRawValues={editRawValues}
          setEditRawValues={setEditRawValues}
          restorePreferEditRawValues={restorePreferEditRawValues}
        />
      </div>
    );
  }
}

export default UnifiedHeaderEditor;
