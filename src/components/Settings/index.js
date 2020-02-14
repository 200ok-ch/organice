import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import { withRouter, Link } from 'react-router-dom';

import * as syncBackendActions from '../../actions/sync_backend';
import * as baseActions from '../../actions/base';

import './stylesheet.css';

import TabButtons from '../UI/TabButtons';
import Switch from '../UI/Switch';

const Settings = ({
  fontSize,
  bulletStyle,
  shouldTapTodoToAdvance,
  shouldDoubleTapToEdit,
  shouldStoreSettingsInSyncBackend,
  shouldLiveSync,
  shouldSyncOnBecomingVisibile,
  shouldShowTitleInOrgFile,
  agendaDefaultDeadlineDelayValue,
  agendaDefaultDeadlineDelayUnit,
  hasUnseenChangelog,
  syncBackend,
  base,
}) => {
  const handleSignOutClick = () =>
    window.confirm('Are you sure you want to sign out?') ? syncBackend.signOut() : void 0;

  const handleKeyboardShortcutsClick = () => base.pushModalPage('keyboard_shortcuts_editor');

  const handleCaptureTemplatesClick = () => base.pushModalPage('capture_templates_editor');

  const handleFontSizeChange = newFontSize => base.setFontSize(newFontSize);

  const handleBulletStyleChange = newBulletStyle => base.setBulletStyle(newBulletStyle);

  const handleShouldTapTodoToAdvanceChange = () =>
    base.setShouldTapTodoToAdvance(!shouldTapTodoToAdvance);

  const handleShouldDoubleTapToEdit = () =>
    base.setShouldDoubleTapToEdit(!shouldDoubleTapToEdit);

  const handleAgendaDefaultDeadlineDelayValueChange = event =>
    base.setAgendaDefaultDeadlineDelayValue(event.target.value);

  const handleAgendaDefaultDeadlineDelayUnitChange = newDelayUnit =>
    base.setAgendaDefaultDeadlineDelayUnit(newDelayUnit);

  const handleShouldLiveSyncChange = () => base.setShouldLiveSync(!shouldLiveSync);

  const handleShouldSyncOnBecomingVisibleChange = () =>
    base.setShouldSyncOnBecomingVisibile(!shouldSyncOnBecomingVisibile);

  const handleShouldShowTitleInOrgFile = () =>
    base.setShouldShowTitleInOrgFile(!shouldShowTitleInOrgFile);

  const handleShouldStoreSettingsInSyncBackendChange = () =>
    base.setShouldStoreSettingsInSyncBackend(!shouldStoreSettingsInSyncBackend);

  const handleChangelogClick = () => base.pushModalPage('changelog');

  return (
    <div className="settings-container">
      <div className="setting-container">
        <div className="setting-label">Font size</div>
        <TabButtons
          buttons={['Regular', 'Large']}
          selectedButton={fontSize}
          onSelect={handleFontSizeChange}
        />
      </div>

      <div className="setting-container">
        <div className="setting-label">Bullet style</div>
        <TabButtons
          buttons={['Classic', 'Fancy']}
          selectedButton={bulletStyle}
          onSelect={handleBulletStyleChange}
        />
      </div>

      <div className="setting-container">
        <div className="setting-label">Tap TODO to advance state</div>
        <Switch isEnabled={shouldTapTodoToAdvance} onToggle={handleShouldTapTodoToAdvanceChange} />
      </div>

      <div className="setting-container">
        <div className="setting-label">Double tap title or description to edit</div>
        <Switch isEnabled={shouldDoubleTapToEdit} onToggle={handleShouldDoubleTapToEdit} />
      </div>

      <div className="setting-container">
        <div className="setting-label">
          Live sync
          <div className="setting-label__description">
            If enabled, changes are automatically pushed to the sync backend as you make them.
          </div>
        </div>
        <Switch isEnabled={shouldLiveSync} onToggle={handleShouldLiveSyncChange} />
      </div>

      <div className="setting-container">
        <div className="setting-label">
          Sync on application becoming visible
          <div className="setting-label__description">
            If enabled, the current org file is pulled from the sync backend when the browser tab
            becomes visible. This prevents you from having a stale file before starting to make
            changes to it.
          </div>
        </div>
        <Switch
          isEnabled={shouldSyncOnBecomingVisibile}
          onToggle={handleShouldSyncOnBecomingVisibleChange}
        />
      </div>

      <div className="setting-container">
        <div className="setting-label">
          Show Org filename as Title
          <div className="setting-label__description">
            When in an Org file view, it shows the filename in the HeaderBar.
          </div>
        </div>
        <Switch isEnabled={shouldShowTitleInOrgFile} onToggle={handleShouldShowTitleInOrgFile} />
      </div>

      <div className="setting-container">
        <div className="setting-label">
          Store settings in sync backend
          <div className="setting-label__description">
            Store settings and keyboard shortcuts in a .organice-config.json file in your sync
            backend to sync between multiple devices.
          </div>
        </div>
        <Switch
          isEnabled={shouldStoreSettingsInSyncBackend}
          onToggle={handleShouldStoreSettingsInSyncBackendChange}
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
            onChange={handleAgendaDefaultDeadlineDelayValueChange}
          />

          <TabButtons
            buttons={'hdwmy'.split('')}
            selectedButton={agendaDefaultDeadlineDelayUnit}
            onSelect={handleAgendaDefaultDeadlineDelayUnitChange}
          />
        </div>
      </div>

      <div className="settings-buttons-container">
        <button className="btn settings-btn" onClick={handleCaptureTemplatesClick}>
          Capture templates
        </button>
        <button className="btn settings-btn" onClick={handleKeyboardShortcutsClick}>
          Keyboard shortcuts
        </button>

        <hr className="settings-button-separator" />

        <button className="btn settings-btn" onClick={handleChangelogClick}>
          Changelog
          {hasUnseenChangelog && (
            <div className="changelog-badge-container">
              <i className="fas fa-gift" />
              &nbsp; What's New?
            </div>
          )}
        </button>

        <Link to="/sample" className="btn settings-btn">
          Help
        </Link>

        <button className="btn settings-btn">
          <a
            href="https://organice.200ok.ch/documentation.html"
            target="_blank"
            rel="noopener noreferrer"
          >
            Documentation <i className="fas fa-external-link-alt fa-sm" />
          </a>
        </button>

        <button className="btn settings-btn">
          <a href="https://github.com/200ok-ch/organice" target="_blank" rel="noopener noreferrer">
            Github repo <i className="fas fa-external-link-alt fa-sm" />
          </a>
        </button>

        <hr className="settings-button-separator" />

        <button className="btn settings-btn" onClick={handleSignOutClick}>
          Sign out
        </button>
      </div>
    </div>
  );
};

const mapStateToProps = (state, props) => {
  return {
    fontSize: state.base.get('fontSize') || 'Regular',
    bulletStyle: state.base.get('bulletStyle') || 'Classic',
    shouldTapTodoToAdvance: state.base.get('shouldTapTodoToAdvance'),
    shouldDoubleTapToEdit: state.base.get('shouldDoubleTapToEdit'),
    agendaDefaultDeadlineDelayValue: state.base.get('agendaDefaultDeadlineDelayValue') || 5,
    agendaDefaultDeadlineDelayUnit: state.base.get('agendaDefaultDeadlineDelayUnit') || 'd',
    shouldStoreSettingsInSyncBackend: state.base.get('shouldStoreSettingsInSyncBackend'),
    shouldLiveSync: state.base.get('shouldLiveSync'),
    shouldSyncOnBecomingVisibile: state.base.get('shouldSyncOnBecomingVisibile'),
    shouldShowTitleInOrgFile: state.base.get('shouldShowTitleInOrgFile'),
    hasUnseenChangelog: state.base.get('hasUnseenChangelog'),
  };
};

const mapDispatchToProps = dispatch => {
  return {
    syncBackend: bindActionCreators(syncBackendActions, dispatch),
    base: bindActionCreators(baseActions, dispatch),
  };
};

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(Settings));
