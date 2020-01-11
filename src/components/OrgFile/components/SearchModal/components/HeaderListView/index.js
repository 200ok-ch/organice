import React from 'react';
import { connect } from 'react-redux';

import './stylesheet.css';

import TitleLine from '../../../TitleLine';

function HeaderListView(props) {
  function handleHeaderClick(headerId) {
    return () => props.onHeaderClick(headerId);
  }

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

const mapDispatchToProps = dispatch => ({});

export default connect(mapStateToProps, mapDispatchToProps)(HeaderListView);
