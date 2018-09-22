import React, { PureComponent } from 'react';

import './Popup.css';

export default class Popup extends PureComponent {
  render() {
    const { children, shouldIncludeCloseButton, onClose } = this.props;

    const innerContainerStyle = {
      maxHeight: window.screen.height - 240,
    };

    return (
      <div className="popup-outer-container" onClick={onClose}>
        <div
          className="popup-inner-container nice-scroll"
          onClick={event => event.stopPropagation()}
          style={innerContainerStyle}
        >
          {shouldIncludeCloseButton && (
            <button className="fas fa-times fa-lg popup__close-button" onClick={onClose} />
          )}

          {children}
        </div>
      </div>
    );
  }
}
