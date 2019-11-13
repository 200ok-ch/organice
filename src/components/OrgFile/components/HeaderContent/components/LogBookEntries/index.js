import React, { Fragment, useState } from 'react';

import './stylesheet.css';

import { renderAsText, timestampDuration } from '../../../../../../lib/timestamps';

export default ({ logBookEntries, onTimestampClick, shouldDisableActions }) => {
  const [isDrawerCollapsed, setIsDrawerCollapsed] = useState(true);

  const handleCollapseToggle = () => setIsDrawerCollapsed(!isDrawerCollapsed);

  const onClick = (entryIndex, type) => () =>
    shouldDisableActions ? void 0 : onTimestampClick(entryIndex, type);

  return logBookEntries.size === 0 ? null : (
    <div className="logbook-entries-container">
      <div className="logbook-entries__logbook" onClick={handleCollapseToggle}>
        :LOGBOOK:
        {isDrawerCollapsed ? '...' : ''}
      </div>
      {!isDrawerCollapsed && (
        <Fragment>
          {logBookEntries.map((entry, index) => (
            <div className="logbook-entries__item-container" key={entry.get('id')}>
              CLOCK:
              <span className="logbook-entries__item-start" onClick={onClick(index, 'start')}>
                {renderAsText(entry.get('start'))}
              </span>
              {entry.get('end') === null ? (
                ''
              ) : (
                <Fragment>
                  --
                  <span className="logbook-entries__item-end" onClick={onClick(index, 'end')}>
                    {renderAsText(entry.get('end'))}
                  </span>
                  <span className="logbook-entries__item-duration">
                    => {timestampDuration(entry.get('start'), entry.get('end'))}
                  </span>
                </Fragment>
              )}
            </div>
          ))}
          <div className="logbook-entries__logbook">:END:</div>
        </Fragment>
      )}
    </div>
  );
};
