import React, { PureComponent } from 'react';
import { Motion, spring } from 'react-motion';

import { interpolateColors, rgbaObject, rgbaString } from '../../../lib/color';

import './stylesheet.css';

export default class Checkbox extends PureComponent {
  render() {
    const { state, onClick } = this.props;

    const uncheckedColor = rgbaObject(255, 255, 255, 1);
    const checkedColor = rgbaObject(94, 52, 140, 1);

    const checkboxStyle = {
      colorFactor: spring(
        {
          checked: 1,
          partial: 1,
          unchecked: 0,
        }[state],
        { stiffness: 300 }
      ),
    };

    return (
      <Motion style={checkboxStyle}>
        {style => {
          const backgroundColor = rgbaString(
            interpolateColors(uncheckedColor, checkedColor, style.colorFactor)
          );

          return (
            <div className="checkbox" onClick={onClick} style={{ backgroundColor }}>
              <div className="checkbox__inner-container">
                {state === 'checked' && <i className="fas fa-check" />}
                {state === 'partial' && <i className="fas fa-minus" />}
              </div>
            </div>
          );
        }}
      </Motion>
    );
  }
}
