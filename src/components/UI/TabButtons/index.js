import React, { PureComponent } from 'react';

import './TabButtons.css';

import classNames from 'classnames';

export default class TabButtons extends PureComponent {
  handleButtonClick(buttonName) {
    return () => this.props.onSelect(buttonName);
  }

  render() {
    const { buttons, selectedButton } = this.props;

    return (
      <div className="tab-buttons">
        {buttons.map(buttonName => {
          const className = classNames('tab-buttons__btn', {
            'tab-buttons__btn--selected': buttonName === selectedButton,
          });

          return (
            <div key={buttonName}
                 className={className}
                 onClick={this.handleButtonClick(buttonName)}>
              {buttonName}
            </div>
          );
        })}
      </div>
    );
  }
}
