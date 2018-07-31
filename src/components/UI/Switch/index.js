import React, { PureComponent } from 'react';
import { Motion, spring } from 'react-motion';

import { interpolateColors, rgbaObject, rgbaString } from '../../../lib/color';

import './Switch.css';

export default class Switch extends PureComponent {
  render() {
    const { isEnabled, onToggle } = this.props;

    const disabledColor = rgbaObject(255, 255, 255, 1);
    const enabledColor = rgbaObject(94, 52, 140, 1);

    const switchStyle = {
      colorFactor: spring(isEnabled ? 1 : 0, { stiffness: 300 }),
    };

    const grabberStyle = {
      marginLeft: spring(isEnabled ? 42 : 0, { stiffness : 300 }),
    };

    return (
      <Motion style={switchStyle}>
        {style => {
          const backgroundColor = rgbaString(interpolateColors(disabledColor, enabledColor, style.colorFactor));

          return (
            <div className="switch"
                 style={{backgroundColor}}
                 onClick={onToggle}>
              <Motion style={grabberStyle}>
                {style => <div className="switch__grabber" style={style} />}
              </Motion>
            </div>
          );
        }}
      </Motion>
    );
  }
}
