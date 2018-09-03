import React, { PureComponent, Fragment } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import { Redirect } from 'react-router-dom';

import { HotKeys } from 'react-hotkeys';

import './OrgFile.css';

import HeaderList from './components/HeaderList';
import ActionDrawer from './components/ActionDrawer';
import CaptureModal from './components/CaptureModal';
import SyncConfirmationModal from './components/SyncConfirmationModal';

import * as baseActions from '../../actions/base';
import * as dropboxActions from '../../actions/dropbox';
import * as orgActions from '../../actions/org';
import * as captureActions from '../../actions/capture';
import { ActionCreators as undoActions } from 'redux-linear-undo';

import { calculateActionedKeybindings } from '../../lib/keybindings';

import _ from 'lodash';

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
      'handleCaptureClose',
      'handleSyncConfirmationPull',
      'handleSyncConfirmationPush',
      'handleSyncConfirmationCancel',
    ]);

    this.state = {
      hasError: false,
    };
  }

  componentDidMount() {
    const { staticFile, path, loadedPath } = this.props;

    if (!!staticFile) {
      this.props.base.loadStaticFile(staticFile);

      if (staticFile === 'changelog') {
        this.props.base.setHasUnseenChangelog(false);
      }

      setTimeout(() => document.querySelector('html').scrollTop = 0, 0);
    } else if (!!path && path !== loadedPath) {
      this.props.dropbox.downloadFile(path);
    }
  }

  componentWillUnmount() {
    const { staticFile } = this.props;

    if (!!staticFile) {
      this.props.base.unloadStaticFile();
    } else {
      this.props.org.stopDisplayingFile();
    }
  }

  componentDidCatch() {
    this.setState({ hasError: true });
  }

  handleSelectNextVisibleHeaderHotKey() {
    this.props.org.selectNextVisibleHeader();
  }

  handleSelectPreviousVisibleHeaderHotKey() {
    this.props.org.selectPreviousVisibleHeader();
  }

  handleToggleHeaderOpenedHotKey() {
    const { selectedHeaderId } = this.props;

    if (selectedHeaderId) {
      this.props.org.toggleHeaderOpened(selectedHeaderId);
    }
  }

  handleAdvanceTodoHotKey() {
    this.props.org.advanceTodoState();
  }

  handleEditTitleHotKey() {
    this.props.org.enterTitleEditMode();
  }

  handleEditDescriptionHotKey() {
    this.props.org.openHeader(this.props.selectedHeaderId);
    this.props.org.enterDescriptionEditMode();
  }

  handleExitEditModeHotKey() {
    this.props.org.exitTitleEditMode();
    this.props.org.exitDescriptionEditMode();
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

  handleCaptureClose() {
    this.props.capture.disableCaptureModal();
  }

  handleSyncConfirmationPull() {
    this.props.org.sync({ forceAction: 'pull' });
    this.props.base.setDisplayingSyncConfirmationModal(false);
  }

  handleSyncConfirmationPush() {
    this.props.org.sync({ forceAction: 'push' });
    this.props.base.setDisplayingSyncConfirmationModal(false);
  }

  handleSyncConfirmationCancel() {
    this.props.base.setDisplayingSyncConfirmationModal(false);
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
      activeCaptureTemplate,
      isDisplayingSyncConfirmationModal,
      lastServerModifiedAt,
    } = this.props;

    if (!path && !staticFile) {
      return <Redirect to="/files" />;
    }

    if (!headers) {
      return <div></div>;
    }

    if (this.state.hasError) {
      return (
        <div className="error-message-container">
          Uh oh, you ran into a bug!

          <br />
          <br />

          This was probably the result of an error in attempting to parse your org file.
          It'd be super helpful if you could
          {' '}<a href="https://github.com/DanielDe/org-web/issues/new" target="_blank" rel="noopener noreferrer">create an issue</a>
          {' '}(and include the org file if possible!)
        </div>
      );
    }

    const keyMap = _.fromPairs(calculateActionedKeybindings(customKeybindings));

    // Automatically call preventDefault on all the keyboard events that come through for
    // these hotkeys.
    const preventDefaultAndHandleEditMode = (callback, ignoreInEditMode = false) => event => {
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
      selectNextVisibleHeader: preventDefaultAndHandleEditMode(this.handleSelectNextVisibleHeaderHotKey),
      selectPreviousVisibleHeader: preventDefaultAndHandleEditMode(this.handleSelectPreviousVisibleHeaderHotKey),
      toggleHeaderOpened: preventDefaultAndHandleEditMode(this.handleToggleHeaderOpenedHotKey, true),
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
                  If you think this is a bug, please
                  {' '}<a href="https://github.com/DanielDe/org-web/issues/new" target="_blank" rel="noopener noreferrer">create an issue</a>
                  {' '}and include the org file if possible!
                </Fragment>
              )}
            </div>
          ) : (
            <HeaderList shouldDisableActions={shouldDisableActions} />
          )}

          {isDirty && !shouldDisableDirtyIndicator && <div className="dirty-indicator">Unpushed changes</div>}

          {!!activeCaptureTemplate && (
            <CaptureModal template={activeCaptureTemplate}
                          headers={headers}
                          onCapture={this.handleCapture}
                          onClose={this.handleCaptureClose} />
          )}

          {isDisplayingSyncConfirmationModal && (
            <SyncConfirmationModal lastServerModifiedAt={lastServerModifiedAt}
                                   onPull={this.handleSyncConfirmationPull}
                                   onPush={this.handleSyncConfirmationPush}
                                   onCancel={this.handleSyncConfirmationCancel} />
          )}

          {!shouldDisableActions && <ActionDrawer shouldDisableSyncButtons={shouldDisableSyncButtons} />}
        </div>
      </HotKeys>
    );
  }
}

const mapStateToProps = (state, props) => {
  return {
    headers: state.org.present.get('headers'),
    isDirty: state.org.present.get('isDirty'),
    loadedPath: state.org.present.get('path'),
    selectedHeaderId: state.org.present.get('selectedHeaderId'),
    customKeybindings: state.base.get('customKeybindings'),
    inEditMode: state.org.present.get('inTitleEditMode') || state.org.present.get('inDescriptionEditMode') || state.org.present.get('inTableEditMode'),
    activeCaptureTemplate: state.capture.get('captureTemplates').find(template => (
      template.get('id') === state.capture.get('activeCaptureTemplateId')
    )),
    isDisplayingSyncConfirmationModal: state.base.get('isDisplayingSyncConfirmationModal'),
    lastServerModifiedAt: state.base.get('lastServerModifiedAt'),
  };
};

const mapDispatchToProps = dispatch => {
  return {
    base: bindActionCreators(baseActions, dispatch),
    dropbox: bindActionCreators(dropboxActions, dispatch),
    org: bindActionCreators(orgActions, dispatch),
    undo: bindActionCreators(undoActions, dispatch),
    capture: bindActionCreators(captureActions, dispatch),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(OrgFile);
