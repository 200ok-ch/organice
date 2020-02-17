import React, { PureComponent } from 'react';
import { connect } from 'react-redux';

import './stylesheet.css';

import Header from '../Header';

import { numSubheadersOfHeaderWithId, hasHeaderContent } from '../../../../lib/org_utils';

import _ from 'lodash';
import classNames from 'classnames';

class HeaderList extends PureComponent {
  constructor(props) {
    super(props);

    this.headerRefs = {};

    _.bindAll(this, ['handleHeaderRef']);
  }

  componentDidUpdate(prevProps) {
    if (prevProps.selectedHeaderId !== this.props.selectedHeaderId) {
      const selectedHeaderDiv = this.headerRefs[this.props.selectedHeaderId];
      if (!!selectedHeaderDiv) {
        const boundingRectangle = selectedHeaderDiv.getBoundingClientRect();
        const viewportHeight = document.documentElement.clientHeight;

        if (boundingRectangle.top > viewportHeight * 0.9 || boundingRectangle.bottom < 0) {
          selectedHeaderDiv.scrollIntoView();
        }
      }
    }
  }

  handleHeaderRef(headerId) {
    return div => (this.headerRefs[headerId] = div);
  }

  render() {
    const { headers, selectedHeaderId, focusedHeaderId, shouldDisableActions } = this.props;

    const headerRenderData = headers
      .map(header => {
        return {
          header,
          displayed: false,
          hasContent: hasHeaderContent(header),
        };
      })
      .toArray();

    headerRenderData.forEach((headerRenderDatum, index) => {
      const nestingLevel = headerRenderDatum.header.get('nestingLevel');

      const hasNoParents = headerRenderData
        .slice(0, index)
        .every(
          previousRenderDatum => previousRenderDatum.header.get('nestingLevel') >= nestingLevel
        );
      if (hasNoParents) {
        headerRenderDatum.displayed = true;
      }

      const followingHeaders = headerRenderData.slice(index + 1);
      for (
        let followingHeaderIndex = 0;
        followingHeaderIndex < followingHeaders.length;
        ++followingHeaderIndex
      ) {
        const followingHeader = followingHeaders[followingHeaderIndex];
        if (followingHeader.header.get('nestingLevel') <= nestingLevel) {
          break;
        }

        headerRenderDatum.hasContent = true;

        followingHeader.displayed =
          headerRenderDatum.header.get('opened') && headerRenderDatum.displayed;
      }
    });

    if (!!focusedHeaderId) {
      const focusedHeaderIndex = headerRenderData.findIndex(
        headerRenderDatum => headerRenderDatum.header.get('id') === focusedHeaderId
      );

      const previousHeaders = headerRenderData.slice(0, focusedHeaderIndex);
      previousHeaders.forEach(headerRenderDatum => (headerRenderDatum.displayed = false));

      const numSubheaders = numSubheadersOfHeaderWithId(headers, focusedHeaderId);
      const followingHeaders = headerRenderData.slice(focusedHeaderIndex + numSubheaders + 1);
      followingHeaders.forEach(headerRenderDatum => (headerRenderDatum.displayed = false));
    }

    const headerColors = [
      'var(--blue)',
      'var(--green)',
      'var(--cyan)',
      'var(--yellow)',
      'var(--blue)',
      'var(--green)',
      'var(--cyan)',
      'var(--yellow)',
    ];

    const displayedHeaderRenderData = headerRenderData.filter(
      headerRenderDatum => headerRenderDatum.displayed
    );

    const className = classNames('header-list-container', {
      'header-list-container--focused': !!focusedHeaderId,
    });
    return (
      <div className={className}>
        {displayedHeaderRenderData.map((headerRenderDatum, index) => {
          const header = headerRenderDatum.header;
          const color = headerColors[(header.get('nestingLevel') - 1) % headerColors.length];

          return (
            <Header
              key={header.get('id')}
              header={header}
              color={color}
              hasContent={headerRenderDatum.hasContent}
              isSelected={header.get('id') === selectedHeaderId}
              onRef={this.handleHeaderRef(header.get('id'))}
              shouldDisableActions={shouldDisableActions}
            />
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

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(HeaderList);
