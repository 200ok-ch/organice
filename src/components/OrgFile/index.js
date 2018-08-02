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
      'handleAddHeaderHotKey',
      'handleRemoveHeaderHotKey',
      'handleMoveHeaderUpHotKey',
      'handleMoveHeaderDownHotKey',
      'handleMoveHeaderLeftHotKey',
      'handleMoveHeaderRightHotKey',
      'handleUndoHotKey',
    ]);
  }

  componentDidMount() {
    const { staticFile, path, loadedPath } = this.props;

    if (!!staticFile) {
      this.props.base.loadStaticFile(staticFile);
    } else if (!!path && path !== loadedPath) {
      this.props.dropbox.downloadFile(path);
    }

    if (!!this.container) {
      this.container.focus();
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
    console.log('handleToggleHeaderOpenedHotKey');
  }

  handleAdvanceTodoHotKey() {
    console.log('handleAdvanceTodoHotKey');
  }

  handleEditTitleHotKey() {
    console.log('handleEditTitleHotKey');
  }

  handleEditDescriptionHotKey() {
    console.log('handleEditDescriptionHotKey');
  }

  handleAddHeaderHotKey() {
    console.log('handleAddHeaderHotKey');
  }

  handleRemoveHeaderHotKey() {
    console.log('handleRemoveHeaderHotKey');
  }

  handleMoveHeaderUpHotKey() {
    console.log('handleMoveHeaderUpHotKey');
  }

  handleMoveHeaderDownHotKey() {
    console.log('handleMoveHeaderDownHotKey');
  }

  handleMoveHeaderLeftHotKey() {
    console.log('handleMoveHeaderLeftHotKey');
  }

  handleMoveHeaderRightHotKey() {
    console.log('handleMoveHeaderRightHotKey');
  }

  handleUndoHotKey() {
    console.log('handleUndoHotKey');
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
    } = this.props;

    if (!path && !staticFile) {
      return <Redirect to="/files" />;
    }

    if (!headers) {
      return <div></div>;
    }

    // TODO: move this into a setting screen somewhere.
    const keyMap = {
      selectNextVisibleHeader: 'ctrl+n',
      selectPreviousVisibleHeader: 'ctrl+p',
      toggleHeaderOpened: 'tab',
      advanceTodo: 'ctrl+t',
      editTitle: 't',
      editDescription: 'd',
      addHeader: 'ctrl+enter',
      removeHeader: ['del', 'backspace'],
      moveHeaderUp: 'ctrl+command+p',
      moveHeaderDown: 'ctrl+command+n',
      moveHeaderLeft: 'ctrl+command+b',
      moveHeaderRight: 'ctrl+command+f',
      undo: 'ctrl+shift+-',
    };

    const handlers = {
      selectNextVisibleHeader: this.handleSelectNextVisibleHeaderHotKey,
      selectPreviousVisibleHeader: this.handleSelectPreviousVisibleHeaderHotKey,
      toggleHeaderOpened: this.handleToggleHeaderOpenedHotKey,
      advanceTodo: this.handleAdvanceTodoHotKey,
      editTitle: this.handleEditTitleHotKey,
      editDescription: this.handleEditDescriptionHotKey,
      addHeader: this.handleAddHeaderHotKey,
      removeHeader: this.handleRemoveHeaderHotKey,
      moveHeaderUp: this.handleMoveHeaderUpHotKey,
      moveHeaderDown: this.handleMoveHeaderDownHotKey,
      moveHeaderLeft: this.handleMoveHeaderLeftHotKey,
      moveHeaderRight: this.handleMoveHeaderRightHotKey,
      undo: this.handleUndoHotKey,
    };

    return (
      <HotKeys keyMap={keyMap} handlers={handlers}>
        <div ref={div => this.container = div}>
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
  };
};

const mapDispatchToProps = dispatch => {
  return {
    base: bindActionCreators(baseActions, dispatch),
    dropbox: bindActionCreators(dropboxActions, dispatch),
    org: bindActionCreators(orgActions, dispatch),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(OrgFile);
