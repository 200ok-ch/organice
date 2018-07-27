import React, { PureComponent } from 'react';
import { connect } from 'react-redux';

import './HeaderList.css';

import Header from '../Header';

class HeaderList extends PureComponent {
  render() {
    const { headers, selectedHeaderId } = this.props;

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

    const headerColors = ['rgba(38, 143, 214, 1)', 'rgba(42, 164, 168, 1)',
                          'rgba(181, 142, 78, 1)', 'rgba(220, 64, 95, 1)',
                          'rgba(101, 128, 152, 1)', 'rgba(146, 164, 175, 1)',
                          'rgba(203, 85, 83, 1)', 'rgba(108, 119, 202, 1)'];

    const displayedHeaderRenderData = headerRenderData.filter(headerRenderDatum => (
      headerRenderDatum.displayed
    ));

    return (
      <div className="header-list-container">
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
    headers: state.org.get('headers'),
    selectedHeaderId: state.org.get('selectedHeaderId'),
  };
};

const mapDispatchToProps = dispatch => {
  return {};
};

export default connect(mapStateToProps, mapDispatchToProps)(HeaderList);
