import React, { Fragment, useState } from 'react';

import './stylesheet.css';

import { renderAsText } from '../../../../../../lib/timestamps';

export default ({ logBookEntries, onTimestampClick, shouldDisableActions }) => {
  const [isDrawerCollapsed, setIsDrawerCollapsed] = useState(true);

  const handleCollapseToggle = () => setIsDrawerCollapsed(!isDrawerCollapsed);

  // [TODO]
  const onClick = (ts) => () => (shouldDisableActions ? void 0 : onTimestampClick(ts.get('id')));

  return logBookEntries.size === 0 ? null : (
    <div className="logbook-entries-container">
      <div className="logbook-entries__logbook" onClick={handleCollapseToggle}>
        :LOGBOOK:
        {isDrawerCollapsed ? '...' : ''}
      </div>
      {!isDrawerCollapsed && (
        <Fragment>
          {logBookEntries.map(entry => (
            <div className="logbook-entries__item-container" key={entry.get('id')}>
              CLOCK:
              <span className="logbook-entries__item-start">
                {renderAsText(entry.get('start'))}
              </span>
              {entry.get('end') === null ? '' : (
                <Fragment>
                  --
                  <span className="logbook-entries__item-end">
                    {renderAsText(entry.get('end'))}
                  </span>
                </Fragment>
              )}
            </div>

          ))}
          <div className="logbook-entries__logbook">
            :END:
          </div>
        </Fragment>
      )}
    </div>
  );
};
