import React, { PureComponent, Fragment } from 'react';

import './TimestampPart.css';

import { renderAsText } from '../../../../../../lib/timestamps';

import _ from 'lodash';

export default class TimestampPart extends PureComponent {
  constructor(props) {
    super(props);

    _.bindAll(this, ['handleClick']);
  }

  handleClick() {
    const {
      part,
      subPartDataAndHandlers: { onTimestampClick },
    } = this.props;
    onTimestampClick(part.get('id'));
  }

  render() {
    const { part } = this.props;
    const firstTimestamp = part.get('firstTimestamp');
    const secondTimestamp = part.get('secondTimestamp');

    return (
      <span className="attributed-string__timestamp-part" onClick={this.handleClick}>
        {!!firstTimestamp && renderAsText(firstTimestamp)}
        {!!secondTimestamp && (
          <Fragment>
            {'--'}
            {renderAsText(secondTimestamp)}
          </Fragment>
        )}
      </span>
    );
  }
}
