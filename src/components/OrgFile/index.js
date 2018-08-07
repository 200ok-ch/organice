import React, { PureComponent, Fragment } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import { Redirect } from 'react-router-dom';

import { HotKeys } from 'react-hotkeys';

import './OrgFile.css';

import HeaderList from './components/HeaderList';
import ActionDrawer from './components/ActionDrawer';

import * as baseActions from '../../actions/base';
import * as dropboxActions from '../../actions/dropbox';
import * as orgActions from '../../actions/org';
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
    ]);
  }

  componentDidMount() {
    const { staticFile, path, loadedPath } = this.props;

    if (!!staticFile) {
      this.props.base.loadStaticFile(staticFile);

      if (staticFile === 'whats_new') {
        this.props.base.setHasUnseenWhatsNew(false);
      }
    } else if (!!path && path !== loadedPath) {
      this.props.dropbox.downloadFile(path);
    }
  }

  componentWillUnmount() {
    const { staticFile } = this.props;

    if (!!staticFile) {
      this.props.base.unloadStaticFile();
    }
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
    const { selectedHeaderId } = this.props;

    this.props.org.addHeader(selectedHeaderId);
    this.props.org.selectNextSiblingHeader(selectedHeaderId);
    this.props.org.enterTitleEditMode();
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

  render() {
    const {
      headers,
      backButtonText,
      onBackClick,
      shouldDisableDirtyIndicator,
      shouldDisableSyncButtons,
      shouldDisableActionDrawer,
      isDirty,
      parsingErrorMessage,
      path,
      staticFile,
      customKeybindings,
    } = this.props;

    if (!path && !staticFile) {
      return <Redirect to="/files" />;
    }

    if (!headers) {
      return <div></div>;
    }

    const keyMap = _.fromPairs(calculateActionedKeybindings(customKeybindings));

    // Automatically call preventDefault on all the keyboard events that come through for
    // these hotkeys.
    const preventDefault = callback => event => {
      event.preventDefault();
      callback(event);
    };

    const handlers = {
      selectNextVisibleHeader: preventDefault(this.handleSelectNextVisibleHeaderHotKey),
      selectPreviousVisibleHeader: preventDefault(this.handleSelectPreviousVisibleHeaderHotKey),
      toggleHeaderOpened: preventDefault(this.handleToggleHeaderOpenedHotKey),
      advanceTodo: preventDefault(this.handleAdvanceTodoHotKey),
      editTitle: preventDefault(this.handleEditTitleHotKey),
      editDescription: preventDefault(this.handleEditDescriptionHotKey),
      exitEditMode: preventDefault(this.handleExitEditModeHotKey),
      addHeader: preventDefault(this.handleAddHeaderHotKey),
      removeHeader: preventDefault(this.handleRemoveHeaderHotKey),
      moveHeaderUp: preventDefault(this.handleMoveHeaderUpHotKey),
      moveHeaderDown: preventDefault(this.handleMoveHeaderDownHotKey),
      moveHeaderLeft: preventDefault(this.handleMoveHeaderLeftHotKey),
      moveHeaderRight: preventDefault(this.handleMoveHeaderRightHotKey),
      undo: preventDefault(this.handleUndoHotKey),
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
            <HeaderList />
          )}

          <div className="btn org-file__btn" onClick={onBackClick}>
            {backButtonText}
          </div>

          {isDirty && !shouldDisableDirtyIndicator && <div className="dirty-indicator">Unpushed changes</div>}

          {!shouldDisableActionDrawer && <ActionDrawer shouldDisableSyncButtons={shouldDisableSyncButtons} />}
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
  };
};

const mapDispatchToProps = dispatch => {
  return {
    base: bindActionCreators(baseActions, dispatch),
    dropbox: bindActionCreators(dropboxActions, dispatch),
    org: bindActionCreators(orgActions, dispatch),
    undo: bindActionCreators(undoActions, dispatch),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(OrgFile);
