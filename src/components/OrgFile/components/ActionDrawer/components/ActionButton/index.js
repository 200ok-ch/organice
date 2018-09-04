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
    const {
      iconName,
      subIconName,
      isDisabled,
      shouldRotateSubIcon,
      letter,
      additionalClassName,
      style,
      tooltip,
    } = this.props;

    const className = classNames('btn', 'btn--circle', 'action-drawer__btn', additionalClassName || '', {
      'fas': !letter,
      'fa-lg': !letter,
      [`fa-${iconName}`]: !letter,
      'action-drawer__btn--with-sub-icon': !!subIconName,
      'btn--disabled': isDisabled,
      'action-drawer__btn--letter': !!letter,
    });

    const subIconClassName = classNames('fas', 'fa-xs', `fa-${subIconName}`, 'action-drawer__btn__sub-icon', {
      'action-drawer__btn__sub-icon--rotated': shouldRotateSubIcon,
    });

    return (
      <button className={className} onClick={this.handleClick} style={style} title={tooltip}>
        {!!letter && letter}
        {!!subIconName && <i className={subIconClassName} />}
      </button>
    );
  }
}
