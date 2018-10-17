import React, { PureComponent } from 'react';

import './stylesheet.css';

import classNames from 'classnames';

export default class TabButtons extends PureComponent {
  handleButtonClick(buttonName) {
    return () => this.props.onSelect(buttonName);
  }

  render() {
    const { buttons, selectedButton, useEqualWidthTabs } = this.props;

    const containerClassName = classNames('tab-buttons', {
      'tab-buttons--equal-width-tabs': useEqualWidthTabs,
    });

    const style = {
      gridTemplateColumns: useEqualWidthTabs ? `repeat(${buttons.length}, 1fr)` : null,
    };

    return (
      <div className={containerClassName} style={style}>
        {buttons.map(buttonName => {
          const className = classNames('tab-buttons__btn', {
            'tab-buttons__btn--selected': buttonName === selectedButton,
          });

          return (
            <div
              key={buttonName}
              className={className}
              onClick={this.handleButtonClick(buttonName)}
            >
              {buttonName}
            </div>
          );
        })}
      </div>
    );
  }
}
