import React, { Fragment } from 'react';

import './stylesheet.css';

import { renderAsText } from '../../../../../../lib/timestamps';

export default ({ part, subPartDataAndHandlers: { onTimestampClick, shouldDisableActions } }) => {
  const handleClick = () => (shouldDisableActions ? void 0 : onTimestampClick(part.get('id')));

  const firstTimestamp = part.get('firstTimestamp');
  const secondTimestamp = part.get('secondTimestamp');

  return (
    <span className="attributed-string__timestamp-part" onClick={handleClick}>
      {!!firstTimestamp && renderAsText(firstTimestamp)}
      {!!secondTimestamp && (
        <Fragment>
          {'--'}
          {renderAsText(secondTimestamp)}
        </Fragment>
      )}
    </span>
  );
};
