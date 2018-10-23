import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import { withRouter } from 'react-router-dom';

import * as syncBackendActions from '../../actions/sync_backend';
import * as baseActions from '../../actions/base';

import './stylesheet.css';

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
      'handleWeekStartChange',
      'handleShouldTapTodoToAdvanceChange',
      'handleAgendaDefaultDeadlineDelayValueChange',
      'handleAgendaDefaultDeadlineDelayUnitChange',
      'handleShouldStoreSettingsInSyncBackend',
      'handleChangelogClick',
      'handleHelpClick',
    ]);
  }

  handleSignOutClick() {
    if (window.confirm('Are you sure you want to sign out?')) {
      this.props.syncBackend.signOut();
    }
  }

  handleKeyboardShortcutsClick() {
    this.props.base.pushModalPage('keyboard_shortcuts_editor');
  }

  handleCaptureTemplatesClick() {
    this.props.base.pushModalPage('capture_templates_editor');
  }

  handleFontSizeChange(newFontSize) {
    this.props.base.setFontSize(newFontSize);
  }

  handleBulletStyleChange(newBulletStyle) {
    this.props.base.setBulletStyle(newBulletStyle);
  }

  handleWeekStartChange(newWeekStart) {
    this.props.base.setWeekStart(newWeekStart);
  }

  handleShouldTapTodoToAdvanceChange() {
    const { shouldTapTodoToAdvance } = this.props;

    this.props.base.setShouldTapTodoToAdvance(!shouldTapTodoToAdvance);
  }

  handleAgendaDefaultDeadlineDelayValueChange(e) {
    const target = e.target;
    this.props.base.setAgendaDefaultDeadlineDelayValue(target.value);
  }

  handleAgendaDefaultDeadlineDelayUnitChange(newDelayUnit) {
    this.props.base.setAgendaDefaultDeadlineDelayUnit(newDelayUnit);
  }

  handleShouldStoreSettingsInSyncBackend() {
    const { shouldStoreSettingsInSyncBackend } = this.props;

    this.props.base.setShouldStoreSettingsInSyncBackend(!shouldStoreSettingsInSyncBackend);
  }

  handleChangelogClick() {
    this.props.base.pushModalPage('changelog');
  }

  handleHelpClick() {
    this.props.base.pushModalPage('sample');
  }

  render() {
    const {
      fontSize,
      bulletStyle,
      shouldTapTodoToAdvance,
      shouldStoreSettingsInSyncBackend,
      agendaDefaultDeadlineDelayValue,
      agendaDefaultDeadlineDelayUnit,
      hasUnseenChangelog,
    } = this.props;

    return (
      <div className="settings-container">
        <div className="setting-container">
          <div className="setting-label">Font size</div>
          <TabButtons
            buttons={['Regular', 'Large']}
            selectedButton={fontSize}
            onSelect={this.handleFontSizeChange}
          />
        </div>

        <div className="setting-container">
          <div className="setting-label">Bullet style</div>
          <TabButtons
            buttons={['Classic', 'Fancy']}
            selectedButton={bulletStyle}
            onSelect={this.handleBulletStyleChange}
          />
        </div>

        <div className="setting-container">
          <div className="setting-label">Tap TODO to advance state</div>
          <Switch
            isEnabled={shouldTapTodoToAdvance}
            onToggle={this.handleShouldTapTodoToAdvanceChange}
          />
        </div>

        <div className="setting-container">
          <div className="setting-label">
            Store settings in sync backend
            <div className="setting-label__description">
              Store settings and keyboard shortcuts in a .org-web-config.json file in your sync
              backend to sync betweeen multiple devices.
            </div>
          </div>
          <Switch
            isEnabled={shouldStoreSettingsInSyncBackend}
            onToggle={this.handleShouldStoreSettingsInSyncBackend}
          />
        </div>

        <div className="setting-container setting-container--vertical">
          <div className="setting-label">Default DEADLINE warning period</div>

          <div className="default-deadline-warning-container">
            <input
              type="number"
              min="0"
              className="textfield default-deadline-value-textfield"
              value={agendaDefaultDeadlineDelayValue}
              onChange={this.handleAgendaDefaultDeadlineDelayValueChange}
            />

            <TabButtons
              buttons={'hdwmy'.split('')}
              selectedButton={agendaDefaultDeadlineDelayUnit}
              onSelect={this.handleAgendaDefaultDeadlineDelayUnitChange}
            />
          </div>
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
          <button className="btn settings-btn" onClick={this.handleHelpClick}>
            Help
          </button>
          <button className="btn settings-btn">
            <a
              href="https://github.com/DanielDe/org-web"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'white' }}
            >
              Github repo <i className="fas fa-external-link-alt fa-sm" />
            </a>
          </button>

          <hr className="settings-button-separator" />

          <button className="btn settings-btn">
            <a
              href="http://eepurl.com/dK5F9w"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'white' }}
            >
              Mailing list <i className="fas fa-external-link-alt fa-sm" />
            </a>
          </button>

          <div className="settings-button-help-text">
            Sign up for the mailing list if you're interested in getting occasional ({'<'}1 per
            week) updates on org-web. Or take a look at some{' '}
            <a
              href="https://us19.campaign-archive.com/home/?u=36b9d8082ddb55e6cc7e22339&id=f427625e31"
              target="_blank"
              rel="noopener noreferrer"
            >
              past emails
            </a>{' '}
            before you sign up. You can unsubscribe at any time!
          </div>

          <hr className="settings-button-separator" />

          <button className="btn settings-btn" onClick={this.handleSignOutClick}>
            Sign out
          </button>
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
    agendaDefaultDeadlineDelayValue: state.base.get('agendaDefaultDeadlineDelayValue') || 5,
    agendaDefaultDeadlineDelayUnit: state.base.get('agendaDefaultDeadlineDelayUnit') || 'd',
    shouldStoreSettingsInSyncBackend: state.base.get('shouldStoreSettingsInSyncBackend'),
    hasUnseenChangelog: state.base.get('hasUnseenChangelog'),
  };
};

const mapDispatchToProps = dispatch => {
  return {
    syncBackend: bindActionCreators(syncBackendActions, dispatch),
    base: bindActionCreators(baseActions, dispatch),
  };
};

export default withRouter(
  connect(
    mapStateToProps,
    mapDispatchToProps
  )(Settings)
);
