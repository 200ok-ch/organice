import React, { PureComponent, Fragment } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import { Redirect } from 'react-router-dom';

import { GlobalHotKeys } from 'react-hotkeys';

import './stylesheet.css';

import HeaderList from './components/HeaderList';
import ActionDrawer from './components/ActionDrawer';
import SyncConfirmationModal from './components/SyncConfirmationModal';
import TableEditorModal from './components/TableEditorModal';
import AgendaModal from './components/AgendaModal';
import SearchModal from './components/SearchModal';
import ExternalLink from '../UI/ExternalLink';
import Drawer from '../UI/Drawer/';
import UnifiedHeaderEditor, { UNIFIED_EDITOR_POPUP_TYPES } from './components/UnifiedHeaderEditor';

import * as baseActions from '../../actions/base';
import * as syncBackendActions from '../../actions/sync_backend';
import * as orgActions from '../../actions/org';
import * as captureActions from '../../actions/capture';
import { ActionCreators as undoActions } from 'redux-undo';

import sampleCaptureTemplates from '../../lib/sample_capture_templates';
import { calculateActionedKeybindings } from '../../lib/keybindings';
import {
  extractAllOrgTags,
  extractAllOrgProperties,
  changelogHash,
  STATIC_FILE_PREFIX,
} from '../../lib/org_utils';
import { parseCaptureTemplate } from '../../lib/capture_template_parsing';
import {
  parseTitleLine,
  parseMarkupAndCookies,
  parseRawText,
  _updateHeaderFromDescription,
  updatePlanningItemsFromHeader,
} from '../../lib/parse_org';
import { getTimestampAsText, timestampForDate } from '../../lib/timestamps';
import generateId from '../../lib/id_generator';
import { formatTextWrap } from '../../util/misc';

import _ from 'lodash';
import { fromJS, Map, Set } from 'immutable';
import { createRawDescriptionText, generateTitleLine } from '../../lib/export_org';
import FinderModal from './components/FinderModal';

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
      'handleCreateFirstHeader',
      'handleRemoveHeaderHotKey',
      'handleMoveHeaderUpHotKey',
      'handleMoveHeaderDownHotKey',
      'handleMoveHeaderLeftHotKey',
      'handleMoveHeaderRightHotKey',
      'handleUndoHotKey',
      'handleContainerRef',
      'handlePopupClose',
      'handleSearchPopupClose',
      'handleRefilePopupClose',
      'handleTitlePopupClose',
      'saveTitle',
      'handleTodoChange',
      'handleDescriptionPopupClose',
      'handleTablePopupClose',
      'handleSyncConfirmationPull',
      'handleSyncConfirmationPush',
      'handleSyncConfirmationCancel',
      'handleTagsChange',
      'handlePropertyListItemsChange',
      'handleTimestampChange',
      'getPopupCloseAction',
      'getPopupSwitchAction',
      'checkPopupAndHeader',
      'checkPopup',
      'handleCaptureFromEditor',
      'saveCaptureTitle',
      'handleCaptureTagsChange',
      'handleCapturePropertyListItemsChange',
      'handleCaptureTimestampChange',
      'handleCaptureDescriptionChange',
      'handleCaptureAddNote',
      'handleCaptureCreatePlanningItem',
      'handleCaptureRemovePlanningItem',
    ]);

    this.state = {
      hasUncaughtError: false,
      editRawValues: props.preferEditRawValues,
      captureMode: false,
      captureHeader: null,
      captureTemplate: null,
      captureShouldPrepend: false,
    };
  }

  componentDidMount() {
    const { staticFile, path } = this.props;

    if (!!staticFile) {
      this.props.org.setPath(STATIC_FILE_PREFIX + staticFile);
      if (staticFile === 'changelog') {
        this.props.base.setHasUnseenChangelog(false);
        changelogHash().then((hash) => {
          this.props.base.setLastSeenChangelogHeader(hash);
        });
      }

      setTimeout(() => (document.querySelector('.App').scrollTop = 0), 0);
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
    const { headers, pendingCapture, activePopupType, activePopupData } = this.props;
    if (!!pendingCapture && !!headers && headers.size > 0) {
      this.props.org.insertPendingCapture();
    }

    const { path } = this.props;
    if (!_.isEmpty(path) && path !== prevProps.path) {
      this.props.syncBackend.downloadFile(path);
      this.props.org.setPath(path);
    }

    // Intercept capture popup activation and switch to capture mode
    if (activePopupType === 'capture' && prevProps.activePopupType !== 'capture') {
      const { captureTemplates, todoKeywordSets } = this.props;

      // Look up template by ID first, then fall back to matching by description
      const template =
        captureTemplates.find(
          (template) => template.get('id') === activePopupData.get('templateId')
        ) ||
        captureTemplates.find(
          (template) => template.get('description') === activePopupData.get('templateDescription')
        );

      if (!template) {
        this.props.base.closePopup();
        return;
      }

      // Get headers for capture target file
      const targetPath = template.get('file');
      if (targetPath) {
        // Target file lookup reserved for future refile-to-header support
      }

      // Parse the template into structured fields
      const { header, initialSubEditor } = parseCaptureTemplate(
        template.get('template'),
        todoKeywordSets,
        Map()
      );

      // Store capture state first, then switch popup type in the callback
      // to ensure state is committed before the popup type triggers a re-render
      this.setState(
        {
          captureMode: true,
          captureHeader: header,
          captureTemplate: template,
          captureShouldPrepend: template.get('shouldPrepend', false),
        },
        () => {
          // Switch popup type to the initial sub-editor only after state is committed
          this.props.base.activatePopup(initialSubEditor);
        }
      );
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
    this.props.base.activatePopup('title-editor');
  }

  handleEditDescriptionHotKey() {
    this.props.base.activatePopup('description-editor');
  }

  handleExitEditModeHotKey() {
    const onClose = this.getPopupSwitchAction(this.props.activePopupType);
    onClose(
      ...(this.state.popupCloseActionValuesAccessor
        ? this.state.popupCloseActionValuesAccessor()
        : [])
    );
    this.props.base.closePopup();
    this.container.focus();
  }

  handleAddHeaderHotKey() {
    this.props.org.addHeaderAndEdit(this.props.selectedHeaderId);
  }

  handleCreateFirstHeader() {
    this.props.org.createFirstHeader();
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

  handleCaptureFromEditor() {
    let { captureHeader, captureTemplate, captureShouldPrepend } = this.state;
    if (!captureHeader || !captureTemplate) return;

    // Flush the current sub-editor's values to captureHeader before saving.
    const activePopupType = this.props.activePopupType;
    if (this.state.popupCloseActionValuesAccessor) {
      const values = this.state.popupCloseActionValuesAccessor();
      // Apply the values directly to captureHeader instead of going through setState
      if (activePopupType === 'title-editor' && values[0] !== undefined) {
        const titleValue = values[0];
        if (this.state.editRawValues) {
          const newTitleLine = parseTitleLine(titleValue.trim(), this.props.todoKeywordSets);
          captureHeader = captureHeader.set('titleLine', newTitleLine);
        } else {
          captureHeader = captureHeader
            .setIn(['titleLine', 'rawTitle'], titleValue)
            .setIn(['titleLine', 'title'], fromJS(parseMarkupAndCookies(titleValue)));
        }
      } else if (activePopupType === 'description-editor' && values[0] !== undefined) {
        captureHeader = _updateHeaderFromDescription(captureHeader, values[0]);
      }
    }

    this.props.org.insertCaptureFromHeader(
      captureTemplate.get('id'),
      captureHeader,
      captureShouldPrepend
    );

    // Reset capture state
    this.setState({
      captureMode: false,
      captureHeader: null,
      captureTemplate: null,
      captureShouldPrepend: false,
    });
  }

  saveCaptureTitle(titleValue) {
    // Use functional setState so this chains correctly with handleTodoChange
    this.setState((prevState) => {
      const { captureHeader } = prevState;
      if (!captureHeader) return null;

      if (prevState.editRawValues) {
        if (generateTitleLine(captureHeader.toJS(), false) !== titleValue) {
          // Re-parse the full title line to extract TODO keyword, rawTitle, and tags
          const newTitleLine = parseTitleLine(titleValue.trim(), this.props.todoKeywordSets);
          return { captureHeader: captureHeader.set('titleLine', newTitleLine) };
        }
      } else {
        if (captureHeader.getIn(['titleLine', 'rawTitle']) !== titleValue) {
          return {
            captureHeader: captureHeader
              .setIn(['titleLine', 'rawTitle'], titleValue)
              .setIn(['titleLine', 'title'], fromJS(parseMarkupAndCookies(titleValue))),
          };
        }
      }
      return null;
    });
  }

  handleCaptureTagsChange(newTags) {
    const { captureHeader } = this.state;
    if (!captureHeader) return;

    this.setState({
      captureHeader: captureHeader.setIn(['titleLine', 'tags'], newTags),
    });
  }

  handleCapturePropertyListItemsChange(newPropertyListItems) {
    const { captureHeader } = this.state;
    if (!captureHeader) return;

    this.setState({
      captureHeader: captureHeader.set('propertyListItems', newPropertyListItems),
    });
  }

  handleCaptureTimestampChange(popupData) {
    // Similar logic to handleTimestampChange but updates captureHeader state
    if (!!popupData.get('timestampId')) {
      return (_newTimestamp) => {
        // For captures, we don't have timestampId in description, only planning items
        console.warn('timestampId editing not supported in capture mode');
      };
    } else if (popupData.get('logEntryIndex') !== undefined) {
      return (_newTimestamp) => {
        console.warn('logEntry editing not supported in capture mode');
      };
    } else {
      return (newTimestamp) => {
        const { captureHeader } = this.state;
        if (!captureHeader) return;

        const planningItemIndex = popupData.get('planningItemIndex');
        this.setState({
          captureHeader: captureHeader.setIn(
            ['planningItems', planningItemIndex, 'timestamp'],
            newTimestamp.get('firstTimestamp')
          ),
        });
      };
    }
  }

  handleCaptureDescriptionChange(descriptionValue) {
    const { captureHeader } = this.state;
    if (!captureHeader) return;

    if (this.state.editRawValues) {
      this.setState({
        captureHeader: _updateHeaderFromDescription(captureHeader, descriptionValue),
      });
    } else {
      if (captureHeader.get('rawDescription') !== descriptionValue) {
        this.setState({
          captureHeader: _updateHeaderFromDescription(captureHeader, descriptionValue),
        });
      }
    }
  }

  handleCaptureAddNote(inputText, currentDate) {
    const { captureHeader } = this.state;
    if (!captureHeader) return;

    const wrappedInput = formatTextWrap(inputText, 70).replace(/\n(.)/g, '\n  $1');
    const timestamp = getTimestampAsText(currentDate, { isActive: false, withStartTime: true });
    const noteText = `- Note taken on ${timestamp} \\\\\n  ${wrappedInput}`;

    const updatedHeader = captureHeader.update('logNotes', (logNotes) =>
      parseRawText(noteText + (logNotes.isEmpty() ? '\n' : '')).concat(logNotes)
    );
    this.setState({
      captureHeader: updatedHeader.set(
        'planningItems',
        updatePlanningItemsFromHeader(updatedHeader)
      ),
    });
  }

  handleCaptureCreatePlanningItem(planningType) {
    const { captureHeader } = this.state;
    if (!captureHeader) return;

    const newPlanningItem = fromJS({
      id: generateId(),
      type: planningType,
      timestamp: timestampForDate(new Date()),
    });

    const updatedHeader = captureHeader.update('planningItems', (planningItems) =>
      planningItems ? planningItems.push(newPlanningItem) : fromJS([newPlanningItem])
    );
    const newIndex = updatedHeader.get('planningItems').size - 1;

    this.setState({ captureHeader: updatedHeader });

    // Re-open the popup with the new planning item index
    const popupType = { DEADLINE: 'deadline-editor', SCHEDULED: 'scheduled-editor' }[planningType];
    this.props.base.activatePopup(popupType, {
      headerId: captureHeader.get('id'),
      planningItemIndex: newIndex,
    });
  }

  handleCaptureRemovePlanningItem(planningItemIndex) {
    const { captureHeader } = this.state;
    if (!captureHeader) return;

    this.setState({
      captureHeader: captureHeader.removeIn(['planningItems', planningItemIndex]),
    });
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

  saveTitle(titleValue) {
    const { selectedHeader } = this.props;
    if (this.state.editRawValues) {
      if (generateTitleLine(selectedHeader.toJS(), false) !== titleValue) {
        this.props.org.updateHeaderTitle(selectedHeader.get('id'), titleValue);
      }
    } else {
      if (selectedHeader.getIn(['titleLine', 'rawTitle']) !== titleValue) {
        this.props.org.updateHeaderTitle(
          selectedHeader.get('id'),
          generateTitleLine(
            selectedHeader.setIn(['titleLine', 'rawTitle'], titleValue).toJS(),
            false
          )
        );
      }
    }
  }

  handleTitlePopupClose(titleValue) {
    this.saveTitle(titleValue);
    this.props.base.closePopup();
  }

  handleDescriptionPopupClose(descriptionValue) {
    const { selectedHeader } = this.props;
    if (this.state.editRawValues) {
      if (
        createRawDescriptionText(selectedHeader, false, this.props.dontIndent) !== descriptionValue
      ) {
        this.props.org.updateHeaderDescription(selectedHeader.get('id'), descriptionValue);
      }
    } else {
      if (selectedHeader.get('rawDescription') !== descriptionValue) {
        this.props.org.updateHeaderDescription(
          selectedHeader.get('id'),
          createRawDescriptionText(
            selectedHeader.set('rawDescription', descriptionValue),
            false,
            this.props.dontIndent
          )
        );
      }
    }
    this.props.base.closePopup();
  }

  handleTablePopupClose() {
    this.props.base.closePopup();
    this.props.org.setSelectedDescriptionItemIndex(null);
    this.props.org.selectHeaderIndex(null);
    this.props.org.setSelectedTableCellId(null);
    this.props.org.setSelectedTableId(null);
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

  handleTodoChange(newTodoKeyword) {
    if (this.state.captureMode) {
      // Use functional setState to avoid race with saveCaptureTitle (called just before this)
      this.setState((prevState) => {
        const { captureHeader } = prevState;
        if (!captureHeader) return null;
        return {
          captureHeader: captureHeader.setIn(
            ['titleLine', 'todoKeyword'],
            newTodoKeyword || undefined
          ),
        };
      });
      return;
    }
    this.props.org.setTodoState(
      this.props.selectedHeaderId,
      newTodoKeyword,
      this.props.shouldLogIntoDrawer
    );
  }

  getPopupSwitchAction(activePopupType) {
    if (this.state.captureMode) {
      // In capture mode, save to local state instead of dispatching Redux actions
      switch (activePopupType) {
        case 'title-editor':
          return (titleValue) => {
            if (titleValue !== undefined) {
              this.saveCaptureTitle(titleValue);
            }
          };
        case 'description-editor':
          return (descriptionValue) => {
            if (descriptionValue !== undefined) {
              this.handleCaptureDescriptionChange(descriptionValue);
            }
          };
        default:
          return () => {};
      }
    }

    switch (activePopupType) {
      case 'title-editor':
        return (titleValue) => this.handleTitlePopupClose(titleValue);
      case 'description-editor':
        return (descriptionValue) => this.handleDescriptionPopupClose(descriptionValue);
      default:
        return () => {};
    }
  }

  getPopupCloseAction(activePopupType) {
    if (this.state.captureMode) {
      // In capture mode, save to local state instead of dispatching Redux actions
      switch (activePopupType) {
        case 'title-editor':
          return (titleValue) => {
            if (titleValue !== undefined) {
              this.setState(
                (prevState) => {
                  const { captureHeader, editRawValues } = prevState;
                  if (!captureHeader) return null;
                  let updatedHeader;
                  if (editRawValues) {
                    const newTitleLine = parseTitleLine(
                      titleValue.trim(),
                      this.props.todoKeywordSets
                    );
                    updatedHeader = captureHeader.set('titleLine', newTitleLine);
                  } else {
                    updatedHeader = captureHeader
                      .setIn(['titleLine', 'rawTitle'], titleValue)
                      .setIn(['titleLine', 'title'], fromJS(parseMarkupAndCookies(titleValue)));
                  }
                  return { captureHeader: updatedHeader };
                },
                () => {
                  this.handleCaptureFromEditor();
                }
              );
            } else {
              this.handleCaptureFromEditor();
            }
          };
        case 'description-editor':
          return (descriptionValue) => {
            if (descriptionValue !== undefined) {
              this.handleCaptureDescriptionChange(descriptionValue);
            }
            this.props.base.closePopup();
          };
        default:
          return this.handlePopupClose;
      }
    }

    switch (activePopupType) {
      case 'search':
        return this.handleSearchPopupClose;
      case 'refile':
        return this.handleRefilePopupClose;
      case 'title-editor':
        return this.handleTitlePopupClose;
      case 'description-editor':
        return this.handleDescriptionPopupClose;
      case 'table-editor':
        return this.handleTablePopupClose;
      default:
        return this.handlePopupClose;
    }
  }

  getPopupMaxSize(activePopupType) {
    switch (activePopupType) {
      case 'agenda':
      case 'task-list':
      case 'search':
      case 'refile':
        return true;
      default:
        return false;
    }
  }

  renderActivePopup(_setPopupCloseActionValuesAccessor) {
    const { activePopupType, activePopupData, headers, shouldDisableActions } = this.props;

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
      case 'agenda':
        return (
          <AgendaModal headers={headers} onClose={this.getPopupCloseAction(activePopupType)} />
        );
      case 'search':
        return (
          <FinderModal headers={headers} onClose={this.getPopupCloseAction(activePopupType)} />
        );
      case 'refile':
        return <SearchModal context="refile" onClose={this.getPopupCloseAction(activePopupType)} />;
      case 'table-editor':
        return <TableEditorModal shouldDisableActions={shouldDisableActions} />;
      default:
        return null;
    }
  }

  // Some keyboard shortcuts only make sense when a header is selected and no popup is open
  checkPopupAndHeader(callback) {
    return (event) => {
      if (
        this.props.selectedHeader &&
        !this.props.activePopupType &&
        !this.props.shouldDisableActions
      ) {
        callback(event);
      }
    };
  }

  // Read only actions only need to be disabled when a popup is open
  checkPopup(callback) {
    return (event) => {
      if (!this.props.activePopupType) {
        callback(event);
      }
    };
  }

  render() {
    const {
      headers,
      linesBeforeHeadings,
      shouldDisableDirtyIndicator,
      shouldDisableSyncButtons,
      shouldDisableActions,
      isDirty,
      parsingErrorMessage,
      path,
      staticFile,
      customKeybindings,
      orgFileErrorMessage,
      activePopupType,
      activePopupData,
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
    const preventDefault = (callback) => (event) => {
      event.preventDefault();
      callback(event);
    };

    const handlers = {
      selectNextVisibleHeader: this.checkPopup(
        preventDefault(this.handleSelectNextVisibleHeaderHotKey)
      ),
      selectPreviousVisibleHeader: this.checkPopup(
        preventDefault(this.handleSelectPreviousVisibleHeaderHotKey)
      ),
      toggleHeaderOpened: this.checkPopup(
        preventDefault(this.handleToggleHeaderOpenedHotKey, true)
      ),
      advanceTodo: this.checkPopupAndHeader(preventDefault(this.handleAdvanceTodoHotKey)),
      editTitle: this.checkPopupAndHeader(preventDefault(this.handleEditTitleHotKey)),
      editDescription: this.checkPopupAndHeader(preventDefault(this.handleEditDescriptionHotKey)),
      exitEditMode: preventDefault(this.handleExitEditModeHotKey),
      addHeader: this.checkPopupAndHeader(preventDefault(this.handleAddHeaderHotKey)),
      removeHeader: this.checkPopupAndHeader(preventDefault(this.handleRemoveHeaderHotKey, true)),
      moveHeaderUp: this.checkPopupAndHeader(preventDefault(this.handleMoveHeaderUpHotKey)),
      moveHeaderDown: this.checkPopupAndHeader(preventDefault(this.handleMoveHeaderDownHotKey)),
      moveHeaderLeft: this.checkPopupAndHeader(preventDefault(this.handleMoveHeaderLeftHotKey)),
      moveHeaderRight: this.checkPopupAndHeader(preventDefault(this.handleMoveHeaderRightHotKey)),
      undo: this.checkPopupAndHeader(preventDefault(this.handleUndoHotKey)),
    };

    const setPopupCloseActionValuesAccessor = (v) => {
      this.setState({ popupCloseActionValuesAccessor: v });
    };

    // Check if this a legit Org file with content, just no headers
    const noHeadlineButContent = () => {
      return headers.size === 0 && linesBeforeHeadings.size > 0;
    };

    return (
      <GlobalHotKeys keyMap={keyMap} handlers={handlers}>
        <div className="org-file-container" tabIndex="-1" ref={this.handleContainerRef}>
          {headers.size === 0 ? (
            <div className="org-file__parsing-error-message">
              <h3>This file has no headlines</h3>

              {!!parsingErrorMessage ? (
                <Fragment>{parsingErrorMessage}</Fragment>
              ) : (
                <Fragment>
                  {noHeadlineButContent() ? (
                    <>
                      <p>Yes, your file has content. Do not worry, it is still there! </p>
                      <p>
                        However, interacting with Org files in organice happens on a per headline
                        basis. To use organice with this file, please create a new headline with the
                        button below. The existing content is then put into the description of this
                        new header.
                      </p>
                    </>
                  ) : (
                    <p></p>
                  )}
                  <p>Interact with your file by creating the first headline.</p>
                  <p>
                    <button className="btn" onClick={this.handleCreateFirstHeader}>
                      Create headline
                    </button>
                  </p>
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

          {activePopupType ? (
            <Drawer
              onClose={() => {
                this.getPopupCloseAction(activePopupType)(
                  ...(this.state.popupCloseActionValuesAccessor
                    ? this.state.popupCloseActionValuesAccessor()
                    : [])
                );
                this.setState({
                  editRawValues: this.props.preferEditRawValues,
                  captureMode: false,
                  captureHeader: null,
                  captureTemplate: null,
                  captureShouldPrepend: false,
                });
                this.container.focus();
              }}
              maxSize={this.getPopupMaxSize(activePopupType)}
            >
              {UNIFIED_EDITOR_POPUP_TYPES.includes(activePopupType) ? (
                <UnifiedHeaderEditor
                  activePopupType={activePopupType}
                  activePopupData={activePopupData}
                  selectedHeader={
                    this.state.captureMode ? this.state.captureHeader : this.props.selectedHeader
                  }
                  headers={headers}
                  todoKeywordSets={this.props.todoKeywordSets}
                  editRawValues={this.state.editRawValues}
                  dontIndent={this.props.dontIndent}
                  editorDescriptionHeightValue={this.props.editorDescriptionHeightValue}
                  shouldDisableActions={shouldDisableActions}
                  setPopupCloseActionValuesAccessor={setPopupCloseActionValuesAccessor}
                  saveTitle={this.state.captureMode ? this.saveCaptureTitle : this.saveTitle}
                  handleTodoChange={this.handleTodoChange}
                  handleTagsChange={
                    this.state.captureMode ? this.handleCaptureTagsChange : this.handleTagsChange
                  }
                  handlePropertyListItemsChange={
                    this.state.captureMode
                      ? this.handleCapturePropertyListItemsChange
                      : this.handlePropertyListItemsChange
                  }
                  handleTimestampChange={
                    this.state.captureMode
                      ? this.handleCaptureTimestampChange
                      : this.handleTimestampChange
                  }
                  onCreatePlanningItem={
                    this.state.captureMode ? this.handleCaptureCreatePlanningItem : null
                  }
                  onRemovePlanningItem={
                    this.state.captureMode ? this.handleCaptureRemovePlanningItem : null
                  }
                  allTags={extractAllOrgTags(headers)}
                  allOrgProperties={extractAllOrgProperties(headers)}
                  getPopupCloseAction={this.getPopupCloseAction}
                  onSwitch={() => {
                    this.getPopupSwitchAction(activePopupType)(
                      ...(this.state.popupCloseActionValuesAccessor
                        ? this.state.popupCloseActionValuesAccessor()
                        : [])
                    );
                  }}
                  setEditRawValues={(editRawValues) => this.setState({ editRawValues })}
                  restorePreferEditRawValues={() =>
                    this.setState({ editRawValues: this.props.preferEditRawValues })
                  }
                  captureMode={this.state.captureMode}
                  captureTemplate={this.state.captureTemplate}
                  captureShouldPrepend={this.state.captureShouldPrepend}
                  onAddNote={this.state.captureMode ? this.handleCaptureAddNote : null}
                  onCapture={this.handleCaptureFromEditor}
                  onTogglePrepend={() =>
                    this.setState({ captureShouldPrepend: !this.state.captureShouldPrepend })
                  }
                />
              ) : (
                this.renderActivePopup(setPopupCloseActionValuesAccessor)
              )}
            </Drawer>
          ) : null}
        </div>
      </GlobalHotKeys>
    );
  }
}

const mapStateToProps = (state) => {
  const files = state.org.present.get('files');
  const path = state.org.present.get('path');
  const loadedFiles = Set.fromKeys(files);
  const fileIsLoaded = (path) => loadedFiles.includes(path);
  const file = state.org.present.getIn(['files', path], Map());
  const headers = file.get('headers');
  const linesBeforeHeadings = file.get('linesBeforeHeadings');
  const selectedHeaderId = file.get('selectedHeaderId', null);
  const activePopup = state.base.get('activePopup', Map());

  return {
    loadedPath: path,
    files,
    headers,
    linesBeforeHeadings,
    selectedHeaderId,
    isDirty: file.get('isDirty'),
    fileIsLoaded,
    selectedHeader: headers && headers.find((header) => header.get('id') === selectedHeaderId),
    customKeybindings: state.base.get('customKeybindings'),
    dontIndent: state.base.get('shouldNotIndentOnExport'),
    shouldLogIntoDrawer: state.base.get('shouldLogIntoDrawer'),
    shouldLiveSync: state.base.get('shouldLiveSync'),
    showDeadlineDisplay: state.base.get('showDeadlineDisplay'),
    activePopupType: !!activePopup ? activePopup.get('type') : null,
    activePopupData: !!activePopup ? activePopup.get('data') : null,
    captureTemplates: state.capture.get('captureTemplates').concat(sampleCaptureTemplates),
    pendingCapture: state.org.present.get('pendingCapture'),
    closeSubheadersRecursively: state.base.get('closeSubheadersRecursively'),
    orgFileErrorMessage: state.org.present.get('orgFileErrorMessage'),
    preferEditRawValues: state.base.get('preferEditRawValues'),
    todoKeywordSets: file.get('todoKeywordSets'),
    editorDescriptionHeightValue: state.base.get('editorDescriptionHeightValue'),
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
