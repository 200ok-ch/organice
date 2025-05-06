import React, { useState, useEffect, useRef } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { capitalize } from 'lodash';

import './stylesheet.css';

import classNames from 'classnames';
import HeaderListView from './components/HeaderListView';

import { isMobileBrowser, isIos } from '../../../../lib/browser_utils';
import { millisDuration } from '../../../../lib/timestamps';

import * as orgActions from '../../../../actions/org';

// INFO: SearchModal, AgendaModal and TaskListModal are very similar
// in structure and partially in logic. When changing one, consider
// changing all.
function SearchModal(props) {
  const [dateDisplayType, setdateDisplayType] = useState('absolute');
  const searchInputRef = useRef(null);
  const {
    searchFilter,
    searchFilterValid,
    searchFilterSuggestions,
    allBookmarks,
    context,
    showClockedTimes,
    clockedTime,
    activeClocks,
  } = props;
  const bookmarks = allBookmarks.get(context);
  const bookmarkChosen = bookmarks.contains(searchFilter);
  const canSaveBookmark = searchFilterValid && searchFilter.length !== 0;

  function handleHeaderClick(path, headerId) {
    props.onClose(path, headerId);
  }

  function handleToggleDateDisplayType() {
    setdateDisplayType(dateDisplayType === 'absolute' ? 'relative' : 'absolute');
  }

  function handleFilterChange(event) {
    props.org.setSearchFilterInformation(event.target.value, event.target.selectionStart, context);
  }

  function onBookmarkButtonClick() {
    if (bookmarkChosen) {
      props.org.deleteBookmark(context, searchFilter);
    } else if (canSaveBookmark) {
      props.org.saveBookmark(context, searchFilter);
    }
  }

  // On iOS, directly using the `autoFocus` prop on an input can cause the
  // input field to scroll off-screen when a drawer/modal appears and the
  // virtual keyboard slides up. The browser's attempt to scroll the focused
  // input into view can miscalculate due to the simultaneous UI changes.
  //
  // To mitigate this:
  // 1. On non-iOS devices: We programmatically focus the input with a slight
  //    delay (150ms). This allows the UI and keyboard animations to settle.
  // 2. On iOS devices: We now avoid auto-focusing altogether. The user
  //    will need to tap the input field to activate it. This provides a
  //    more stable experience on iOS.
  useEffect(() => {
    if (!isIos() && searchInputRef.current && context !== 'Clock List' && !activeClocks) {
      const timerId = setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }, 150);
      return () => clearTimeout(timerId);
    }
  }, [context, activeClocks]); // Re-run if context or activeClocks changes

  return (
    <>
      {context === 'search' ? (
        <div className="task-list__modal-title_search">
          {showClockedTimes ? (
            <span title="Sum of time logged on all search results directly (not including time logged on their children)">
              {millisDuration(clockedTime)}
            </span>
          ) : null}
        </div>
      ) : (
        <div className="task-list__modal-title">
          <h2 className="agenda__title">{capitalize(context)}</h2>
        </div>
      )}

      {activeClocks ? null : (
        <div className="search-input-container">
          <div className="search-input-line">
            <datalist id="task-list__datalist-filter">
              {(searchFilter.length === 0 ? bookmarks : searchFilterSuggestions).map(
                (string, idx) => (
                  <option key={idx} value={string} />
                )
              )}
            </datalist>

            <div className="search__input-container">
              <input
                type="text"
                value={searchFilter}
                // Disable auto-capitalization for convenience (autoComplete must also be off to
                // achieve this on Android).
                ref={searchInputRef}
                autoCapitalize="none"
                autoComplete="off"
                className={classNames('textfield', 'task-list__filter-input', {
                  'task-list__filter-input--invalid': !!searchFilter && !searchFilterValid,
                })}
                placeholder="e.g. -DONE doc|man :simple|easy :assignee:nobody|none"
                list="task-list__datalist-filter"
                onChange={handleFilterChange}
              />
            </div>

            <i
              className={classNames('fas fa-lg bookmark__icon ', {
                'fa-star': !bookmarkChosen,
                'fa-trash': bookmarkChosen,
                bookmark__icon__enabled: canSaveBookmark,
              })}
              onClick={onBookmarkButtonClick}
            />
          </div>
        </div>
      )}

      <div
        className="task-list__headers-container"
        // On mobile devices, the Drawer already handles the touch
        // event. Hence, scrolling within the Drawers container does
        // not work with the same event. Therefore, we're just opting
        // to scroll the whole drawer. That's not the best UX. And a
        // better CSS juggler than me is welcome to improve on it.
        style={isMobileBrowser ? undefined : { overflow: 'auto' }}
      >
        <HeaderListView
          onHeaderClick={handleHeaderClick}
          dateDisplayType={dateDisplayType}
          onToggleDateDisplayType={handleToggleDateDisplayType}
          context={activeClocks ? 'Clock List' : context}
        />
      </div>
    </>
  );
}

const mapStateToProps = (state) => {
  return {
    path: state.org.present.get('path'),
    searchFilter: state.org.present.getIn(['search', 'searchFilter']),
    searchFilterValid: state.org.present.getIn(['search', 'searchFilterValid']),
    searchFilterSuggestions: state.org.present.getIn(['search', 'searchFilterSuggestions']) || [],
    allBookmarks: state.org.present.get('bookmarks'),
    showClockedTimes: state.org.present.getIn(['search', 'showClockedTimes']),
    clockedTime: state.org.present.getIn(['search', 'clockedTime']),
  };
};

const mapDispatchToProps = (dispatch) => ({
  org: bindActionCreators(orgActions, dispatch),
});

export default connect(mapStateToProps, mapDispatchToProps)(SearchModal);
