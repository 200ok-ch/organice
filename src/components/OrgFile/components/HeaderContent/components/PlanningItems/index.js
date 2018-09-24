import React, { PureComponent } from 'react';

import './PlanningItems.css';

import { renderAsText } from '../../../../../../lib/timestamps';

export default class PlanningItems extends PureComponent {
  render() {
    const { planningItems } = this.props;

    if (planningItems.size === 0) {
      return null;
    }

    console.log('planningItems = ', planningItems.toJS());

    return (
      <div>
        {planningItems.map(planningItem => (
          <div key={planningItem.get('id')} className="planning-items__item-container">
            <div className="planning-item__type">{planningItem.get('type')}: </div>
            <div className="planning-item__timestamp">
              {renderAsText(planningItem.get('timestamp'))}
            </div>
          </div>
        ))}
      </div>
    );
  }
}
