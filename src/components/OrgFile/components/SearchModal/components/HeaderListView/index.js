import React, { useEffect } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import * as orgActions from '../../../../../../actions/org';
import './stylesheet.css';

import TitleLine from '../../../TitleLine';

function HeaderListView(props) {
  const { context } = props;
  function handleHeaderClick(headerId) {
    return () => props.onHeaderClick(headerId);
  }

  // Populate filteredHeaders
  useEffect(() => {
    // No specific searchFilter and cursorPosition, but set the
    // context (like 'search' or 'refile')
    props.org.setSearchFilterInformation('', 0, context);
  }, [context, props.org]);

  const { headers } = props;

  return (
    <div className="agenda-day__container">
      <div className="agenda-day__headers-container">
        {headers.map(header => {
          return (
            <div key={header.get('id')} className="agenda-day__header-container">
              <div className="agenda-day__header__header-container">
                <TitleLine
                  header={header}
                  color="black"
                  hasContent={false}
                  isSelected={false}
                  shouldDisableActions
                  shouldDisableExplicitWidth
                  onClick={handleHeaderClick(header.get('id'))}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const mapStateToProps = state => ({
  // When no filtering has happened, yet (initial state), use all headers.
  headers:
    state.org.present.getIn(['search', 'filteredHeaders']) || state.org.present.get('headers'),
});

const mapDispatchToProps = dispatch => ({
  org: bindActionCreators(orgActions, dispatch),
});

export default connect(mapStateToProps, mapDispatchToProps)(HeaderListView);
