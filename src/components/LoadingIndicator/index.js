import React, { useState, useEffect } from 'react';
import { Motion, spring } from 'react-motion';

import './stylesheet.css';

export default ({ message }) => {
  const [shouldRenderIndicator, setShouldRenderIndicator] = useState(true);
  const [lastMessage, setLastMessage] = useState(message);

  useEffect(
    () => {
      if (!!message) {
        setLastMessage(message);
        setShouldRenderIndicator(true);
      }
    },
    [message]
  );

  const handleAnimationRest = () => {
    if (!!message) {
      return;
    }

    setShouldRenderIndicator(false);
    setLastMessage(null);
  };

  const handleClick = () => setShouldRenderIndicator(false);

  if (!shouldRenderIndicator) {
    return null;
  }

  const style = {
    opacity: spring(!!message ? 0.9 : 0, { stiffness: 300 }),
  };

  return (
    <Motion style={style} onRest={handleAnimationRest}>
      {style => (
        <div className="loading-indicator" style={style} onClick={handleClick}>
          {lastMessage}
        </div>
      )}
    </Motion>
  );
};
