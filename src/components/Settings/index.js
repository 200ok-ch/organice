import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import { withRouter, Link, useHistory } from 'react-router-dom';

import * as syncBackendActions from '../../actions/sync_backend';
import * as baseActions from '../../actions/base';
import * as orgActions from '../../actions/org';

import './stylesheet.css';

import TabButtons from '../UI/TabButtons';
import Switch from '../UI/Switch';
import ExternalLink from '../UI/ExternalLink';

const Settings = ({
  fontSize,
  bulletStyle,
  shouldTapTodoToAdvance,
  shouldStoreSettingsInSyncBackend,
  shouldLiveSync,
  showDeadlineDisplay,
  shouldSyncOnBecomingVisibile,
  shouldShowTitleInOrgFile,
  shouldLogIntoDrawer,
  shouldLogDone,
  closeSubheadersRecursively,
  shouldNotIndentOnExport,
  editorDescriptionHeightValue,
  agendaDefaultDeadlineDelayValue,
  agendaDefaultDeadlineDelayUnit,
  agendaStartOnWeekday,
  hasUnseenChangelog,
  syncBackend,
  preferEditRawValues,
  showClockDisplay,
  colorScheme,
  theme,
  base,
  org,
}) => {
  const history = useHistory();

  // This looks like hardcoding where it would be possible to dispatch
  // on the `location.origin`, but here we assure that every instance
  // of organice has a valid link to documentation. Self-building does
  // not insure that, because building and hosting docs is not part of
  // the application itself.
  const documentationHost = window.location.origin.match(/staging.organice.200ok.ch/)
    ? 'https://staging.organice.200ok.ch'
    : 'https://organice.200ok.ch';

  const handleSignOutClick = () => {
    if (window.confirm('Are you sure you want to sign out?')) {
      syncBackend.signOut();
      history.push('/');
    }
  };

  const handleKeyboardShortcutsClick = () => base.pushModalPage('keyboard_shortcuts_editor');

  const handleCaptureTemplatesClick = () => base.pushModalPage('capture_templates_editor');

  const handleFileSettingsClick = () => base.pushModalPage('file_settings_editor');

  const handleFontSizeChange = (newFontSize) => base.setFontSize(newFontSize);

  const handleColorSchemeClick = (colorScheme) => base.setColorScheme(colorScheme);

  const handleThemeClick = (theme) => base.setTheme(theme);

  const handleBulletStyleChange = (newBulletStyle) => base.setBulletStyle(newBulletStyle);

  const handleShouldTapTodoToAdvanceChange = () =>
    base.setShouldTapTodoToAdvance(!shouldTapTodoToAdvance);

  const handleEditorDescriptionHeightValueChange = (event) =>
    base.setEditorDescriptionHeightValue(event.target.value);

  const handleAgendaDefaultDeadlineDelayValueChange = (event) =>
    base.setAgendaDefaultDeadlineDelayValue(event.target.value);

  const handleAgendaDefaultDeadlineDelayUnitChange = (newDelayUnit) =>
    base.setAgendaDefaultDeadlineDelayUnit(newDelayUnit);

  const handleAgendaStartOnWeekdayChange = (value) => base.setAgendaStartOnWeekday(value);

  const handleShouldLiveSyncChange = () => base.setShouldLiveSync(!shouldLiveSync);

  const handleShowDeadlineDisplayChange = () => base.setShowDeadlineDisplay(!showDeadlineDisplay);

  const handleShouldSyncOnBecomingVisibleChange = () =>
    base.setShouldSyncOnBecomingVisibile(!shouldSyncOnBecomingVisibile);

  const handleShouldShowTitleInOrgFile = () =>
    base.setShouldShowTitleInOrgFile(!shouldShowTitleInOrgFile);

  const handleShouldLogIntoDrawer = () => base.setShouldLogIntoDrawer(!shouldLogIntoDrawer);
  const handleShouldLogDone = () => base.setShouldLogDone(!shouldLogDone);

  const handleCloseSubheadersRecursively = () =>
    base.setCloseSubheadersRecursively(!closeSubheadersRecursively);

  const handleShouldNotIndentOnExport = () =>
    base.setShouldNotIndentOnExport(!shouldNotIndentOnExport);

  const handleShouldStoreSettingsInSyncBackendChange = () =>
    base.setShouldStoreSettingsInSyncBackend(!shouldStoreSettingsInSyncBackend);

  const handleShowClockDisplayClick = () => org.setShowClockDisplay(!showClockDisplay);

  const handlePreferEditRawValues = () => base.setPreferEditRawValues(!preferEditRawValues);

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
        <div className="setting-label">Color scheme</div>
        <TabButtons
          buttons={['OS', 'Light', 'Dark']}
          selectedButton={colorScheme}
          onSelect={handleColorSchemeClick}
        />
      </div>

      <div className="setting-container">
        <div className="setting-label">Theme</div>
        <TabButtons
          buttons={['Solarized', 'One', 'Gruvbox', 'Smyck', 'Code']}
          selectedButton={theme}
          onSelect={handleThemeClick}
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
          Log into LOGBOOK drawer
          <div className="setting-label__description">
            Log TODO state changes into the LOGBOOK drawer instead of into the body of the heading
            (default). See the Orgmode documentation on{' '}
            <ExternalLink href="https://www.gnu.org/software/emacs/manual/html_node/org/Tracking-TODO-state-changes.html">
              <code>org-log-into-drawer</code>
            </ExternalLink>{' '}
            for more information.
          </div>
        </div>
        <Switch isEnabled={shouldLogIntoDrawer} onToggle={handleShouldLogIntoDrawer} />
      </div>

      <div className="setting-container">
        <div className="setting-label">
          Create a closing entry when a TODO is marked DONE
          <div className="setting-label__description">
            Create a clsoing entry when a TODO is makred DONE that will be added to the the logbook
            if logIntoDrawer has also been selected or the the body of the heading (default). See
            the Orgmode documentation on{' '}
            <ExternalLink href="https://orgmode.org/manual/Closing-items.html">
              <code>org-log-done</code>
            </ExternalLink>{' '}
            for more information.
          </div>
        </div>
        <Switch isEnabled={shouldLogDone} onToggle={handleShouldLogDone} />
      </div>

      <div className="setting-container">
        <div className="setting-label">
          When folding a header, fold all subheaders too
          <div className="setting-label__description">
            When folding a header, fold recursively all its subheaders, so that when the header is
            reopened all subheaders are folded, regardless of their state prior to folding. This is
            the default in Emacs Org mode. If this turned off, the fold-state of the subheaders is
            preserved when the header is unfolded.
          </div>
        </div>
        <Switch
          isEnabled={closeSubheadersRecursively}
          onToggle={handleCloseSubheadersRecursively}
        />
      </div>

      <div className="setting-container">
        <div className="setting-label">
          Disable hard indent on Org export
          <div className="setting-label__description">
            By default, the metadata body (including deadlines and drawers) of an exported org
            heading is indented according to its level. If instead you prefer to keep your body text
            flush-left, i.e.{' '}
            <ExternalLink href="https://orgmode.org/manual/Hard-indentation.html">
              <code>(setq org-adapt-indentation nil)</code>
            </ExternalLink>
            , then activate this setting. The raw content text is left unchanged.
          </div>
        </div>
        <Switch isEnabled={shouldNotIndentOnExport} onToggle={handleShouldNotIndentOnExport} />
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

      <div className="setting-container setting-container--vertical">
        <div className="setting-label">Description editor height</div>
        <div className="setting-label__description">
          This setting controls the height of the description editor on computers only. The height
          will be limited to ensure that all buttons are always visible. On mobile devices this
          setting is ignored and the editor will always be 8 rows high.
        </div>

        <div className="default-deadline-warning-container">
          <input
            type="number"
            min="2"
            className="textfield default-deadline-value-textfield"
            value={editorDescriptionHeightValue}
            onChange={handleEditorDescriptionHeightValueChange}
          />
        </div>
      </div>

      <div className="setting-container">
        <div className="setting-label">
          Start of week for weekly agenda
          <div className="setting-label__description">
            Akin to{' '}
            <ExternalLink href="https://orgmode.org/manual/Weekly_002fdaily-agenda.html">
              <code>org-agenda-start-on-weekday</code>
            </ExternalLink>
          </div>
        </div>
        <TabButtons
          buttons={['S', 'M', 'T', 'W', 'T', 'F', 'S', 'Today']}
          values={[0, 1, 2, 3, 4, 5, 6, -1]}
          titles={['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']}
          selectedButton={agendaStartOnWeekday}
          onSelect={handleAgendaStartOnWeekdayChange}
        />
      </div>

      <div className="setting-container">
        <div className="setting-label">
          Display time summaries
          <div className="setting-label__description">
            This puts overlays at the end of each headline, showing the total time recorded under
            that heading, including the time of any subheadings.
          </div>
        </div>
        <Switch isEnabled={showClockDisplay} onToggle={handleShowClockDisplayClick} />
      </div>

      <div className="setting-container">
        <div className="setting-label">
          Show Deadline Display
          <div className="setting-label__description">
            If enabled, the deadline will displayed on each header line.
          </div>
        </div>
        <Switch isEnabled={showDeadlineDisplay} onToggle={handleShowDeadlineDisplayChange} />
      </div>

      <div className="setting-container">
        <div className="setting-label">
          Prefer raw values
          <div className="setting-label__description">
            When editing title or description of a header, you can switch between editing the text
            part or the full content (including text representation of todo keywords, tags, schedule
            items, properties etc.) by clicking the "edit title" or "edit description" icon in the
            popup. This option allows you to view the full content first instead of on a second
            click.
          </div>
        </div>
        <Switch isEnabled={preferEditRawValues} onToggle={handlePreferEditRawValues} />
      </div>

      <div className="settings-buttons-container">
        <button className="btn settings-btn" onClick={handleCaptureTemplatesClick}>
          Capture templates
        </button>
        <button className="btn settings-btn" onClick={handleKeyboardShortcutsClick}>
          Keyboard shortcuts
        </button>
        <button className="btn settings-btn" onClick={handleFileSettingsClick}>
          File settings
        </button>

        <hr className="settings-button-separator" />

        <Link to="/changelog" className="btn settings-btn">
          Changelog
          {hasUnseenChangelog && (
            <div className="changelog-badge-container">
              <i className="fas fa-gift" />
              &nbsp; What's New?
            </div>
          )}
        </Link>

        <Link to="/sample" className="btn settings-btn">
          Help
        </Link>

        <button className="btn settings-btn">
          <ExternalLink href={`${documentationHost}/documentation.html`}>
            Documentation
            <i className="fas fa-external-link-alt fa-sm" />
          </ExternalLink>{' '}
        </button>

        <button className="btn settings-btn">
          <ExternalLink href="https://github.com/200ok-ch/organice">
            Github repo
            <i className="fas fa-external-link-alt fa-sm" />
          </ExternalLink>{' '}
        </button>

        <hr className="settings-button-separator" />

        <button className="btn settings-btn" onClick={handleSignOutClick}>
          Sign out
        </button>
      </div>
    </div>
  );
};

const mapStateToProps = (state) => {
  // The default values here only relate to the settings view. To set
  // defaults which get loaded on an initial run of organice, look at
  // `util/settings_persister.js::persistableFields`.
  const agendaStartOnWeekday = state.base.get('agendaStartOnWeekday');
  return {
    fontSize: state.base.get('fontSize') || 'Regular',
    bulletStyle: state.base.get('bulletStyle'),
    shouldTapTodoToAdvance: state.base.get('shouldTapTodoToAdvance'),
    editorDescriptionHeightValue: state.base.get('editorDescriptionHeightValue') || 8,
    agendaDefaultDeadlineDelayValue: state.base.get('agendaDefaultDeadlineDelayValue') || 5,
    agendaDefaultDeadlineDelayUnit: state.base.get('agendaDefaultDeadlineDelayUnit') || 'd',
    agendaStartOnWeekday: agendaStartOnWeekday == null ? 1 : +agendaStartOnWeekday,
    shouldStoreSettingsInSyncBackend: state.base.get('shouldStoreSettingsInSyncBackend'),
    shouldLiveSync: state.base.get('shouldLiveSync'),
    showDeadlineDisplay: state.base.get('showDeadlineDisplay'),
    shouldSyncOnBecomingVisibile: state.base.get('shouldSyncOnBecomingVisibile'),
    shouldShowTitleInOrgFile: state.base.get('shouldShowTitleInOrgFile'),
    shouldLogIntoDrawer: state.base.get('shouldLogIntoDrawer'),
    shouldLogDone: state.base.get('shouldLogDone'),
    closeSubheadersRecursively: state.base.get('closeSubheadersRecursively'),
    shouldNotIndentOnExport: state.base.get('shouldNotIndentOnExport'),
    hasUnseenChangelog: state.base.get('hasUnseenChangelog'),
    showClockDisplay: state.org.present.get('showClockDisplay'),
    preferEditRawValues: state.base.get('preferEditRawValues'),
    colorScheme: state.base.get('colorScheme'),
    theme: state.base.get('theme'),
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    syncBackend: bindActionCreators(syncBackendActions, dispatch),
    base: bindActionCreators(baseActions, dispatch),
    org: bindActionCreators(orgActions, dispatch),
  };
};

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(Settings));
