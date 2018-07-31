import React, { PureComponent } from 'react';
import { connect } from 'react-redux';

import './HeaderList.css';

import Header from '../Header';

import { numSubheadersOfHeaderWithId } from '../../../../lib/org_utils';

import classNames from 'classnames';

class HeaderList extends PureComponent {
  render() {
    const { headers, selectedHeaderId, focusedHeaderId } = this.props;

    const headerRenderData = headers.map(header => {
      return {
        header,
        displayed: false,
        hasContent: !!header.get('rawDescription'),
      };
    }).toArray();

    headerRenderData.forEach((headerRenderDatum, index) => {
      const nestingLevel = headerRenderDatum.header.get('nestingLevel');

      const hasNoParents = headerRenderData.slice(0, index).every(previousRenderDatum => (
        previousRenderDatum.header.get('nestingLevel') >= nestingLevel
      ));
      if (hasNoParents) {
        headerRenderDatum.displayed = true;
      }

      const followingHeaders = headerRenderData.slice(index + 1);
      for (let followingHeaderIndex = 0; followingHeaderIndex < followingHeaders.length; ++followingHeaderIndex) {
        const followingHeader = followingHeaders[followingHeaderIndex];
        if (followingHeader.header.get('nestingLevel') <= nestingLevel) {
          break;
        }

        headerRenderDatum.hasContent = true;

        followingHeader.displayed = headerRenderDatum.header.get('opened') && headerRenderDatum.displayed;
      }
    });

    if (!!focusedHeaderId) {
      const focusedHeaderIndex = headerRenderData.findIndex(headerRenderDatum => (
        headerRenderDatum.header.get('id') === focusedHeaderId
      ));

      const previousHeaders = headerRenderData.slice(0, focusedHeaderIndex);
      previousHeaders.forEach(headerRenderDatum => (
        headerRenderDatum.displayed = false
      ));

      const numSubheaders = numSubheadersOfHeaderWithId(headers, focusedHeaderId);
      const followingHeaders = headerRenderData.slice(focusedHeaderIndex + numSubheaders + 1);
      followingHeaders.forEach(headerRenderDatum => (
        headerRenderDatum.displayed = false
      ));
    }

    const headerColors = ['rgba(38, 143, 214, 1)', 'rgba(42, 164, 168, 1)',
                          'rgba(181, 142, 78, 1)', 'rgba(220, 64, 95, 1)',
                          'rgba(101, 128, 152, 1)', 'rgba(146, 164, 175, 1)',
                          'rgba(203, 85, 83, 1)', 'rgba(108, 119, 202, 1)'];

    const displayedHeaderRenderData = headerRenderData.filter(headerRenderDatum => (
      headerRenderDatum.displayed
    ));

    const className = classNames('header-list-container', {
      'header-list-container--focused': !!focusedHeaderId,
    });
    return (
      <div className={className}>
        {displayedHeaderRenderData.map((headerRenderDatum, index) => {
          const header = headerRenderDatum.header;
          const color = headerColors[(header.get('nestingLevel') - 1) % headerColors.length];

          return (
            <Header key={header.get('id')}
                    header={header}
                    color={color}
                    hasContent={headerRenderDatum.hasContent}
                    isSelected={header.get('id') === selectedHeaderId} />
          );
        })}
      </div>
    );
  }
}

const mapStateToProps = (state, props) => {
  return {
    headers: state.org.present.get('headers'),
    selectedHeaderId: state.org.present.get('selectedHeaderId'),
    focusedHeaderId: state.org.present.get('focusedHeaderId'),
  };
};

const mapDispatchToProps = dispatch => {
  return {};
};

export default connect(mapStateToProps, mapDispatchToProps)(HeaderList);
