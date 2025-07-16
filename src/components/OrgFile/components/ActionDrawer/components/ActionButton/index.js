import React, { useCallback } from 'react';

import './stylesheet.css';

import classNames from 'classnames';

const ActionButton = ({
  iconName,
  subIconName,
  isDisabled,
  shouldRotateSubIcon,
  letter,
  additionalClassName,
  style,
  tooltip,
  shouldSpinSubIcon,
  onRef,
  onClick,
}) => {
  const handleClick = useCallback(() => {
    if (isDisabled) {
      return;
    }

    onClick();
  }, [onClick, isDisabled]);

  const className = classNames(
    'btn',
    'btn--circle',
    'action-drawer__btn',
    additionalClassName || '',
    {
      fas: !letter,
      'fa-lg': !letter,
      [`fa-${iconName}`]: !letter,
      'action-drawer__btn--with-sub-icon': !!subIconName,
      'btn--disabled': isDisabled,
      'action-drawer__btn--letter': !!letter,
    }
  );

  const subIconClassName = classNames(
    'fas',
    'fa-xs',
    `fa-${subIconName}`,
    'action-drawer__btn__sub-icon',
    {
      'action-drawer__btn__sub-icon--rotated': shouldRotateSubIcon,
      'fa-spin': shouldSpinSubIcon,
    }
  );

  return (
    <button className={className} onClick={handleClick} style={style} title={tooltip} ref={onRef}>
      {!!letter && letter}
      {!!subIconName && <i className={subIconClassName} />}
    </button>
  );
};

export default React.memo(ActionButton);
