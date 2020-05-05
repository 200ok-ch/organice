import React from 'react';

import './stylesheet.css';

import classNames from 'classnames';

export default ({ buttons, selectedButton, useEqualWidthTabs, onSelect }) => {
  const handleButtonClick = (buttonName) => () => onSelect(buttonName);

  const containerClassName = classNames('tab-buttons', {
    'tab-buttons--equal-width-tabs': useEqualWidthTabs,
  });

  const style = {
    gridTemplateColumns: useEqualWidthTabs ? `repeat(${buttons.length}, 1fr)` : null,
  };

  return (
    <div className={containerClassName} style={style}>
      {buttons.map((buttonName) => {
        const className = classNames('tab-buttons__btn', {
          'tab-buttons__btn--selected': buttonName === selectedButton,
        });

        return (
          <div key={buttonName} className={className} onClick={handleButtonClick(buttonName)}>
            {buttonName}
          </div>
        );
      })}
    </div>
  );
};
