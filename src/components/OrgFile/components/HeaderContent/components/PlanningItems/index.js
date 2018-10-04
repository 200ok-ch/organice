import React, { PureComponent } from 'react';

import './stylesheet.css';

import { renderAsText } from '../../../../../../lib/timestamps';

import _ from 'lodash';

export default class PlanningItems extends PureComponent {
  constructor(props) {
    super(props);

    _.bindAll(this, ['handleTimestampClick']);
  }

  handleTimestampClick(planningItemIndex) {
    return () => this.props.onClick(planningItemIndex);
  }

  render() {
    const { planningItems } = this.props;

    if (planningItems.size === 0) {
      return null;
    }

    return (
      <div>
        {planningItems.map((planningItem, index) => (
          <div key={planningItem.get('id')} className="planning-items__item-container">
            <div className="planning-item__type">{planningItem.get('type')}: </div>
            <div className="planning-item__timestamp" onClick={this.handleTimestampClick(index)}>
              {renderAsText(planningItem.get('timestamp'))}
            </div>
          </div>
        ))}
      </div>
    );
  }
}
