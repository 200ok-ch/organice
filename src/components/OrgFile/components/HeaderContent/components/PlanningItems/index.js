import React, { useCallback } from 'react';

import './stylesheet.css';

import { renderAsText } from '../../../../../../lib/timestamps';
import { isRegularPlanningItem } from '../../../../../../lib/org_utils';

const PlanningItems = React.memo(({ planningItems, onClick }) => {
  const handleTimestampClick = useCallback(
    (planningType, planningItemIndex) => {
      return () => onClick(planningType, planningItemIndex);
    },
    [onClick]
  );

  const planningItemsToRender = planningItems.filter((x) => isRegularPlanningItem(x));
  if (planningItemsToRender.isEmpty()) return null;

  return (
    <div>
      {planningItemsToRender.map((planningItem, index) => (
        <div key={planningItem.get('id')} className="planning-items__item-container">
          <div className="planning-item__type">{planningItem.get('type')}: </div>
          <div
            className="planning-item__timestamp"
            onClick={handleTimestampClick(planningItem.get('type'), index)}
          >
            {renderAsText(planningItem.get('timestamp'))}
          </div>
        </div>
      ))}
    </div>
  );
});

PlanningItems.displayName = 'PlanningItems';

export default PlanningItems;
