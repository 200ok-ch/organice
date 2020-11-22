import React, { PureComponent, Fragment } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import { Redirect } from 'react-router-dom';

import { HotKeys } from 'react-hotkeys';

import './stylesheet.css';

import HeaderList from './components/HeaderList';
import ActionDrawer from './components/ActionDrawer';
import CaptureModal from './components/CaptureModal';
import SyncConfirmationModal from './components/SyncConfirmationModal';
import TagsEditorModal from './components/TagsEditorModal';
import TimestampEditorModal from './components/TimestampEditorModal';
import PropertyListEditorModal from './components/PropertyListEditorModal';
import AgendaModal from './components/AgendaModal';
import TaskListModal from './components/TaskListModal';
import SearchModal from './components/SearchModal';
import ExternalLink from '../UI/ExternalLink';

import * as baseActions from '../../actions/base';
import * as syncBackendActions from '../../actions/sync_backend';
import * as orgActions from '../../actions/org';
import * as captureActions from '../../actions/capture';
import { ActionCreators as undoActions } from 'redux-undo';

import sampleCaptureTemplates from '../../lib/sample_capture_templates';
import { calculateActionedKeybindings } from '../../lib/keybindings';
import {
  timestampWithId,
  headerWithId,
  extractAllOrgTags,
  extractAllOrgProperties,
  changelogHash,
} from '../../lib/org_utils';

import _ from 'lodash';
import { fromJS, List, Set } from 'immutable';

class OrgFile extends PureComponent {
  constructor(props) {
    super(props);

    _.bindAll(this, [
      'handleSelectNextVisibleHeaderHotKey',
      'handleSelectPreviousVisibleHeaderHotKey',
      'handleToggleHeaderOpenedHotKey',
      'handleAdvanceTodoHotKey',
      'handleEditTitleHotKey',
      'handleEditDescriptionHotKey',
      'handleExitEditModeHotKey',
      'handleAddHeaderHotKey',
      'handleRemoveHeaderHotKey',
      'handleMoveHeaderUpHotKey',
      'handleMoveHeaderDownHotKey',
      'handleMoveHeaderLeftHotKey',
      'handleMoveHeaderRightHotKey',
      'handleUndoHotKey',
      'handleContainerRef',
      'handleCapture',
      'handlePopupClose',
      'handleSearchPopupClose',
      'handleRefilePopupClose',
      'handleSyncConfirmationPull',
      'handleSyncConfirmationPush',
      'handleSyncConfirmationCancel',
      'handleTagsChange',
      'handlePropertyListItemsChange',
    ]);

    this.state = {
      hasUncaughtError: false,
    };
  }

  componentDidMount() {
    const { staticFile, path } = this.props;

    if (!!staticFile) {
      this.props.base.loadStaticFile(staticFile);

      if (staticFile === 'changelog') {
        this.props.base.setHasUnseenChangelog(false);
        changelogHash().then((hash) => {
          this.props.base.setLastSeenChangelogHeader(hash);
        });
      }

      setTimeout(() => (document.querySelector('html').scrollTop = 0), 0);
    } else if (!_.isEmpty(path)) {
      if (this.props.fileIsLoaded(path)) {
        this.props.org.sync({ path, shouldSuppressMessages: true });
      } else {
        this.props.syncBackend.downloadFile(path);
      }
      this.props.org.setPath(path);
    }

    this.activatePopup();
  }

  // If a fragment is set in the URL (by the activatePopup base
  // action), activate the appropriate pop-up
  activatePopup() {
    const urlFragment = window.location.hash.substr(1);
    if (!_.isEmpty(urlFragment)) {
      this.props.base.activatePopup(urlFragment);
    }
  }

  componentWillUnmount() {
    const { staticFile } = this.props;

    if (!!staticFile) {
      this.props.base.unloadStaticFile();
    } else {
      this.props.org.resetFileDisplay();
    }
  }

  componentDidUpdate(prevProps) {
    const { headers, pendingCapture } = this.props;
    if (!!pendingCapture && !!headers && headers.size > 0) {
      this.props.org.insertPendingCapture();
    }

    const { path } = this.props;
    if (!_.isEmpty(path) && path !== prevProps.path) {
      this.props.syncBackend.downloadFile(path);
      this.props.org.setPath(path);
    }
  }

  componentDidCatch() {
    // TODO: Track the `error` into a bug tracker
    this.setState({ hasUncaughtError: true });
  }

  handleSelectNextVisibleHeaderHotKey() {
    this.props.org.selectNextVisibleHeader();
  }

  handleSelectPreviousVisibleHeaderHotKey() {
    this.props.org.selectPreviousVisibleHeader();
  }

  handleToggleHeaderOpenedHotKey() {
    const { selectedHeaderId, closeSubheadersRecursively } = this.props;

    if (selectedHeaderId) {
      this.props.org.toggleHeaderOpened(selectedHeaderId, closeSubheadersRecursively);
    }
  }

  handleAdvanceTodoHotKey() {
    this.props.org.advanceTodoState(null, this.props.shouldLogIntoDrawer);
  }

  handleEditTitleHotKey() {
    this.props.org.enterEditMode('title');
  }

  handleEditDescriptionHotKey() {
    this.props.org.openHeader(this.props.selectedHeaderId);
    this.props.org.enterEditMode('description');
  }

  handleExitEditModeHotKey() {
    this.props.org.exitEditMode();
    this.container.focus();
  }

  handleAddHeaderHotKey() {
    this.props.org.addHeaderAndEdit(this.props.selectedHeaderId);
  }

  handleRemoveHeaderHotKey() {
    const { selectedHeaderId } = this.props;

    this.props.org.selectNextSiblingHeader(selectedHeaderId);
    this.props.org.removeHeader(selectedHeaderId);
  }

  handleMoveHeaderUpHotKey() {
    this.props.org.moveHeaderUp(this.props.selectedHeaderId);
  }

  handleMoveHeaderDownHotKey() {
    this.props.org.moveHeaderDown(this.props.selectedHeaderId);
  }

  handleMoveHeaderLeftHotKey() {
    this.props.org.moveHeaderLeft(this.props.selectedHeaderId);
  }

  handleMoveHeaderRightHotKey() {
    this.props.org.moveHeaderRight(this.props.selectedHeaderId);
  }

  handleUndoHotKey() {
    this.props.undo.undo();
  }

  handleContainerRef(container) {
    this.container = container;
    if (this.container) {
      this.container.focus();
    }
  }

  handleCapture(templateId, content, shouldPrepend) {
    this.props.org.insertCapture(templateId, content, shouldPrepend);
  }

  handlePopupClose() {
    this.props.base.closePopup();
  }

  handleSearchPopupClose(path, headerId) {
    this.props.base.closePopup();
    if (path && headerId) {
      this.props.org.selectHeaderAndOpenParents(path, headerId);
    }
  }

  handleRefilePopupClose(targetPath, targetHeaderId) {
    this.props.base.closePopup();
    // When the user closes the drawer without selecting a header, do
    // not trigger refiling.
    if (targetHeaderId) {
      const { loadedPath, selectedHeaderId } = this.props;
      this.props.org.refileSubtree(loadedPath, selectedHeaderId, targetPath, targetHeaderId);
    }
  }

  handleSyncConfirmationPull(path) {
    this.props.org.sync({ path, forceAction: 'pull' });
    this.props.base.closePopup();
  }

  handleSyncConfirmationPush(path) {
    this.props.org.sync({ path, forceAction: 'push' });
    this.props.base.closePopup();
  }

  handleSyncConfirmationCancel() {
    this.props.base.closePopup();
  }

  handleTagsChange(newTags) {
    this.props.org.setHeaderTags(this.props.selectedHeaderId, newTags);
  }

  handlePropertyListItemsChange(newPropertyListItems) {
    this.props.org.updatePropertyListItems(this.props.selectedHeaderId, newPropertyListItems);
  }

  handleTimestampChange(popupData) {
    if (!!popupData.get('timestampId')) {
      return (newTimestamp) =>
        this.props.org.updateTimestampWithId(popupData.get('timestampId'), newTimestamp);
    } else if (popupData.get('logEntryIndex') !== undefined) {
      return (newTimestamp) =>
        this.props.org.updateLogEntryTime(
          popupData.get('headerId'),
          popupData.get('logEntryIndex'),
          popupData.get('entryType'),
          newTimestamp.get('firstTimestamp')
        );
    } else {
      return (newTimestamp) =>
        this.props.org.updatePlanningItemTimestamp(
          popupData.get('headerId'),
          popupData.get('planningItemIndex'),
          newTimestamp.get('firstTimestamp')
        );
    }
  }

  renderActivePopup() {
    const {
      activePopupType,
      activePopupData,
      captureTemplates,
      files,
      headers,
      selectedHeader,
    } = this.props;

    switch (activePopupType) {
      case 'sync-confirmation':
        return (
          <SyncConfirmationModal
            lastServerModifiedAt={activePopupData.get('lastServerModifiedAt')}
            lastSyncAt={activePopupData.get('lastSyncAt')}
            path={activePopupData.get('path')}
            onPull={() => this.handleSyncConfirmationPull(activePopupData.get('path'))}
            onPush={() => this.handleSyncConfirmationPush(activePopupData.get('path'))}
            onCancel={this.handleSyncConfirmationCancel}
          />
        );
      case 'capture':
        const template = captureTemplates.find(
          (template) => template.get('id') === activePopupData.get('templateId')
        );
        const path = template.get('file');
        let headersOfCaptureTarget = headers;
        if (path !== '') {
          const file = files.get(path);
          headersOfCaptureTarget = file ? file.get('headers') : List();
        }
        return (
          <CaptureModal
            template={template}
            headers={headersOfCaptureTarget}
            onCapture={this.handleCapture}
            onClose={this.handlePopupClose}
          />
        );
      case 'tags-editor':
        const allTags = extractAllOrgTags(headers);
        return !!selectedHeader ? (
          <TagsEditorModal
            header={selectedHeader}
            allTags={allTags}
            onClose={this.handlePopupClose}
            onChange={this.handleTagsChange}
          />
        ) : null;
      case 'timestamp-editor':
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
        } else {
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
            planningItemIndex={activePopupData.get('planningItemIndex')}
            singleTimestampOnly={!activePopupData.get('timestampId')}
            onClose={this.handlePopupClose}
            onChange={this.handleTimestampChange(activePopupData)}
          />
        );

      case 'property-list-editor':
        const allOrgProperties = extractAllOrgProperties(headers);
        return selectedHeader ? (
          <PropertyListEditorModal
            onClose={this.handlePopupClose}
            onChange={this.handlePropertyListItemsChange}
            propertyListItems={selectedHeader.get('propertyListItems')}
            allOrgProperties={allOrgProperties}
          />
        ) : null;
      case 'agenda':
        return <AgendaModal onClose={this.handlePopupClose} />;
      case 'task-list':
        return <TaskListModal onClose={this.handlePopupClose} />;
      case 'search':
        return <SearchModal onClose={this.handleSearchPopupClose} context="search" />;
      case 'refile':
        return <SearchModal onClose={this.handleRefilePopupClose} context="refile" />;
      default:
        return null;
    }
  }

  render() {
    const {
      headers,
      shouldDisableDirtyIndicator,
      shouldDisableSyncButtons,
      shouldDisableActions,
      isDirty,
      parsingErrorMessage,
      path,
      staticFile,
      customKeybindings,
      inEditMode,
      orgFileErrorMessage,
    } = this.props;

    if (!path && !staticFile) {
      return <Redirect to="/files" />;
    }

    if (this.state.hasUncaughtError) {
      return (
        <div className="error-message-container">
          Uh oh, you ran into a bug!
          <br />
          <br />
          This was probably the result of an error in attempting to parse your org file. It'd be
          super helpful if you could{' '}
          <ExternalLink href="https://github.com/200ok-ch/organice/issues/new">
            create an issue
          </ExternalLink>{' '}
          (and include the org file if possible!)
        </div>
      );
    }

    if (!!orgFileErrorMessage) {
      return <div className="error-message-container">{orgFileErrorMessage}</div>;
    }

    if (!headers) {
      return <div />;
    }

    const keyMap = _.fromPairs(calculateActionedKeybindings(customKeybindings));

    // Automatically call preventDefault on all the keyboard events that come through for
    // these hotkeys.
    const preventDefaultAndHandleEditMode = (callback, ignoreInEditMode = false) => (event) => {
      if (ignoreInEditMode && inEditMode) {
        return;
      }

      if (ignoreInEditMode && ['TEXTAREA', 'INPUT'].includes(document.activeElement.nodeName)) {
        return;
      }

      event.preventDefault();
      callback(event);
    };

    const handlers = {
      selectNextVisibleHeader: preventDefaultAndHandleEditMode(
        this.handleSelectNextVisibleHeaderHotKey
      ),
      selectPreviousVisibleHeader: preventDefaultAndHandleEditMode(
        this.handleSelectPreviousVisibleHeaderHotKey
      ),
      toggleHeaderOpened: preventDefaultAndHandleEditMode(
        this.handleToggleHeaderOpenedHotKey,
        true
      ),
      advanceTodo: preventDefaultAndHandleEditMode(this.handleAdvanceTodoHotKey),
      editTitle: preventDefaultAndHandleEditMode(this.handleEditTitleHotKey),
      editDescription: preventDefaultAndHandleEditMode(this.handleEditDescriptionHotKey),
      exitEditMode: preventDefaultAndHandleEditMode(this.handleExitEditModeHotKey),
      addHeader: preventDefaultAndHandleEditMode(this.handleAddHeaderHotKey),
      removeHeader: preventDefaultAndHandleEditMode(this.handleRemoveHeaderHotKey, true),
      moveHeaderUp: preventDefaultAndHandleEditMode(this.handleMoveHeaderUpHotKey),
      moveHeaderDown: preventDefaultAndHandleEditMode(this.handleMoveHeaderDownHotKey),
      moveHeaderLeft: preventDefaultAndHandleEditMode(this.handleMoveHeaderLeftHotKey),
      moveHeaderRight: preventDefaultAndHandleEditMode(this.handleMoveHeaderRightHotKey),
      undo: preventDefaultAndHandleEditMode(this.handleUndoHotKey),
    };

    return (
      <HotKeys keyMap={keyMap} handlers={handlers}>
        <div className="org-file-container" tabIndex="-1" ref={this.handleContainerRef}>
          {headers.size === 0 ? (
            <div className="org-file__parsing-error-message">
              <h3>Couldn't parse file</h3>

              {!!parsingErrorMessage ? (
                <Fragment>{parsingErrorMessage}</Fragment>
              ) : (
                <Fragment>
                  If you think this is a bug, please{' '}
                  <ExternalLink href="https://github.com/200ok-ch/organice/issues/new">
                    create an issue
                  </ExternalLink>{' '}
                  and include the org file if possible!
                </Fragment>
              )}
            </div>
          ) : (
            <HeaderList shouldDisableActions={shouldDisableActions} />
          )}

          {isDirty && !shouldDisableDirtyIndicator && (
            <div className="dirty-indicator">Unpushed changes</div>
          )}

          {!shouldDisableActions && (
            <ActionDrawer
              shouldDisableSyncButtons={shouldDisableSyncButtons}
              staticFile={staticFile}
            />
          )}

          {this.renderActivePopup()}
        </div>
      </HotKeys>
    );
  }
}

const mapStateToProps = (state) => {
  const files = state.org.present.get('files');
  const path = state.org.present.get('path');
  const loadedFiles = Set.fromKeys(files);
  const fileIsLoaded = (path) => loadedFiles.includes(path);
  const file = state.org.present.getIn(['files', path]);
  const headers = file ? file.get('headers') : null;
  const selectedHeaderId = file ? file.get('selectedHeaderId') : null;
  const activePopup = state.base.get('activePopup');

  return {
    files,
    headers,
    selectedHeaderId,
    isDirty: file ? file.get('isDirty') : null,
    fileIsLoaded,
    selectedHeader: headers && headers.find((header) => header.get('id') === selectedHeaderId),
    customKeybindings: state.base.get('customKeybindings'),
    shouldLogIntoDrawer: state.base.get('shouldLogIntoDrawer'),
    shouldLiveSync: state.base.get('shouldLiveSync'),
    inEditMode: !!file ? file.get('editMode') : null,
    activePopupType: !!activePopup ? activePopup.get('type') : null,
    activePopupData: !!activePopup ? activePopup.get('data') : null,
    captureTemplates: state.capture.get('captureTemplates').concat(sampleCaptureTemplates),
    pendingCapture: state.org.present.get('pendingCapture'),
    closeSubheadersRecursively: state.base.get('closeSubheadersRecursively'),
    orgFileErrorMessage: state.org.present.get('orgFileErrorMessage'),
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    base: bindActionCreators(baseActions, dispatch),
    syncBackend: bindActionCreators(syncBackendActions, dispatch),
    org: bindActionCreators(orgActions, dispatch),
    undo: bindActionCreators(undoActions, dispatch),
    capture: bindActionCreators(captureActions, dispatch),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(OrgFile);
