import React, { useState } from 'react';
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
    if (canSaveBookmark) {
      props.org.saveBookmark(context, searchFilter);
    }
  }

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
                // On iOS, setting autoFocus here will move the contents of
                // the drawer off the screen, because the keyboard pops up
                // late when the height is already set to '92%'. Some other
                // complications: There's no API to check if the keyboard is
                // open or not. When setting the height of the container to
                // something like 48% for iOS, this works on iPhone (tested
                // on Xs and 6S), but when the keyboard is closed, the
                // container is still small when the user wants to read the
                // longer list without the keyboard in the way. There might
                // be a better way: If the drawer wouldn't move, iOS likely
                // would set the heights correctly automatically.
                autoFocus={!isIos()}
                className={classNames('textfield', 'task-list__filter-input', {
                  'task-list__filter-input--invalid': !!searchFilter && !searchFilterValid,
                })}
                placeholder="e.g. -DONE doc|man :simple|easy :assignee:nobody|none"
                list="task-list__datalist-filter"
                onChange={handleFilterChange}
              />
            </div>

            <i
              className={
                'fas fa-lg fa-star bookmark__icon ' +
                (canSaveBookmark ? 'bookmark__icon__enabled' : '')
              }
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
