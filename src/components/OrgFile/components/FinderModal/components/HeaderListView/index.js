import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import * as orgActions from '../../../../../../actions/org';
import './stylesheet.css';

import { millisDuration } from '../../../../../../lib/timestamps';

import TitleLine from '../../../TitleLine';
import { getBreadcrumbsStringFunction } from '../../../../../../lib/org_utils';

function HeaderListView(props) {
  function handleHeaderClick(path, headerId) {
    return () => props.onHeaderClick(path, headerId);
  }

  const { headers, allHeaders, showClockedTimes } = props;

  return (
    <div className="agenda-day__container">
      <div className="agenda-day__headers-container">
        {Array.from(headers.entries(), ([path, headersOfFile]) => {
          const getBreadcrumbs = getBreadcrumbsStringFunction(allHeaders, path);
          return headersOfFile.map((header) => {
            return (
              <div key={header.get('id')} className="agenda-day__header-container">
                <div className="search__breadcrumbs">{getBreadcrumbs(header)}</div>
                <div className="agenda-day__header__header-container">
                  <TitleLine
                    header={header}
                    color="var(--base03)"
                    hasContent={false}
                    isSelected={false}
                    shouldDisableActions
                    shouldDisableExplicitWidth
                    onClick={handleHeaderClick(path, header.get('id'))}
                    addition={
                      showClockedTimes && header.get('totalFilteredTimeLoggedRecursive') !== 0
                        ? millisDuration(header.get('totalFilteredTimeLoggedRecursive'))
                        : null
                    }
                  />
                </div>
              </div>
            );
          });
        })}
      </div>
    </div>
  );
}

const mapStateToProps = (state) => {
  const files = state.org.present.get('files');
  return {
    allHeaders: files.map((file) => file.get('headers')),
  };
};

const mapDispatchToProps = (dispatch) => ({
  org: bindActionCreators(orgActions, dispatch),
});

export default connect(mapStateToProps, mapDispatchToProps)(HeaderListView);
