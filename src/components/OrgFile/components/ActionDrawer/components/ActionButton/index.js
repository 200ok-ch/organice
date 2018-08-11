import React, { PureComponent } from 'react';

import './ActionButton.css';

import classNames from 'classnames';
import _ from 'lodash';

export default class ActionButton extends PureComponent {
  constructor(props) {
    super(props);

    _.bindAll(this, ['handleClick']);
  }

  handleClick() {
    const { onClick, isDisabled } = this.props;

    if (isDisabled) {
      return;
    }

    onClick();
  }

  render() {
    const { iconName, subIconName, isDisabled } = this.props;

    const className = classNames('fas', 'fa-lg', `fa-${iconName}`, 'btn', 'btn--circle', 'action-drawer__btn', {
      'action-drawer__btn--with-sub-icon': !!subIconName,
      'btn--disabled': isDisabled,
    });

    return (
      <button className={className} onClick={this.handleClick}>
        {!!subIconName && <i className={`fas fa-xs fa-${subIconName} action-drawer__btn__sub-icon`} />}
      </button>
    );
  }
}
