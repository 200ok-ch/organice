import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import { withRouter } from 'react-router-dom';

import * as dropboxActions from '../../actions/dropbox';
import * as baseActions from '../../actions/base';

import './Settings.css';

import TabButtons from '../UI/TabButtons';
import Switch from '../UI/Switch';

import _ from 'lodash';

class Settings extends PureComponent {
  constructor(props) {
    super(props);

    _.bindAll(this, [
      'handleSignOutClick',
      'handleKeyboardShortcutsClick',
      'handleCaptureTemplatesClick',
      'handleFontSizeChange',
      'handleBulletStyleChange',
      'handleShouldTapTodoToAdvanceChange',
      'handleShouldStoreSettingsInDropbox',
      'handleChangelogClick',
    ]);
  }

  handleSignOutClick() {
    if (window.confirm('Are you sure you want to sign out?')) {
      this.props.dropbox.signOut();
    }
  }

  handleKeyboardShortcutsClick() {
    this.props.base.setActiveModalPage('keyboard_shortcuts_editor');
  }

  handleCaptureTemplatesClick() {
    this.props.base.setActiveModalPage('capture_templates_editor');
  }

  handleFontSizeChange(newFontSize) {
    this.props.base.setFontSize(newFontSize);
  }

  handleBulletStyleChange(newBulletStyle) {
    this.props.base.setBulletStyle(newBulletStyle);
  }

  handleShouldTapTodoToAdvanceChange() {
    const { shouldTapTodoToAdvance } = this.props;

    this.props.base.setShouldTapTodoToAdvance(!shouldTapTodoToAdvance);
  }

  handleShouldStoreSettingsInDropbox() {
    const { shouldStoreSettingsInDropbox } = this.props;

    this.props.base.setShouldStoreSettingsInDropbox(!shouldStoreSettingsInDropbox);
  }

  handleChangelogClick() {
    this.props.base.setActiveModalPage('changelog');
  }

  render() {
    const {
      fontSize,
      bulletStyle,
      shouldTapTodoToAdvance,
      shouldStoreSettingsInDropbox,
      hasUnseenChangelog,
    } = this.props;

    return (
      <div className="settings-container">
        <div className="setting-container">
          <div className="setting-label">Font size</div>
          <TabButtons buttons={['Regular', 'Large']}
                      selectedButton={fontSize}
                      onSelect={this.handleFontSizeChange} />
        </div>

        <div className="setting-container">
          <div className="setting-label">Bullet style</div>
          <TabButtons buttons={['Classic', 'Fancy']}
                      selectedButton={bulletStyle}
                      onSelect={this.handleBulletStyleChange} />
        </div>

        <div className="setting-container">
          <div className="setting-label">Tap TODO to advance state</div>
          <Switch isEnabled={shouldTapTodoToAdvance}
                  onToggle={this.handleShouldTapTodoToAdvanceChange} />
        </div>

        <div className="setting-container">
          <div className="setting-label">
            Store settings in Dropbox
            <div className="setting-label__description">
              Store settings and keyboard shortcuts in a .org-web-config.json file in your Dropbox to sync betweeen multiple devices.
            </div>
          </div>
          <Switch isEnabled={shouldStoreSettingsInDropbox}
                  onToggle={this.handleShouldStoreSettingsInDropbox} />
        </div>

        <div className="settings-buttons-container">
          <button className="btn settings-btn" onClick={this.handleCaptureTemplatesClick}>
            Capture templates
          </button>
          <button className="btn settings-btn" onClick={this.handleKeyboardShortcutsClick}>
            Keyboard shortcuts
          </button>

          <hr className="settings-button-separator" />

          <button className="btn settings-btn" onClick={this.handleChangelogClick}>
            Changelog
            {hasUnseenChangelog && (
              <div className="changelog-badge-container">
                <i className="fas fa-gift" />
              </div>
            )}
          </button>
          <button className="btn settings-btn">
            <a href="https://github.com/DanielDe/org-web" target="_blank" rel="noopener noreferrer" style={{color: 'white'}}>
              Github repo <i className="fas fa-external-link-alt fa-sm" />
            </a>
          </button>

          <hr className="settings-button-separator" />

          <button className="btn settings-btn" onClick={this.handleSignOutClick}>Sign out</button>
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state, props) => {
  return {
    fontSize: state.base.get('fontSize') || 'Regular',
    bulletStyle: state.base.get('bulletStyle') || 'Classic',
    shouldTapTodoToAdvance: state.base.get('shouldTapTodoToAdvance'),
    shouldStoreSettingsInDropbox: state.base.get('shouldStoreSettingsInDropbox'),
    hasUnseenChangelog: state.base.get('hasUnseenChangelog'),
  };
};

const mapDispatchToProps = dispatch => {
  return {
    dropbox: bindActionCreators(dropboxActions, dispatch),
    base: bindActionCreators(baseActions, dispatch),
  };
};

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(Settings));
