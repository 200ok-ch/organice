import React, { PureComponent } from 'react';

import './Checkbox.css';

import classNames from 'classnames';

export default class Checkbox extends PureComponent {
  render() {
    const { state, onClick } = this.props;

    const className = classNames('checkbox', {
      'checkbox--checked': state === 'checked',
      'checkbox--partial': state === 'partial',
    });

    return (
      <div className={className} onClick={onClick}>
        <div className="checkbox__inner-container">
          {state === 'checked' && <i className="fas fa-check" />}
          {state === 'partial' && <i className="fas fa-minus" />}
        </div>
      </div>
    );
  }
}
