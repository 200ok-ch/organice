import React, { PureComponent } from 'react';

import './Header.css';

import TitleLine from '../TitleLine/TitleLine';

export default class Header extends PureComponent {
  render() {
    const { header, color, hasContent } = this.props;

    const style = {
      paddingLeft: 20 * header.get('nestingLevel'),
    };

    return (
      <div className="header" style={style}>
        <div style={{marginLeft: -16}}>*</div>
        <TitleLine header={header}
                   color={color}
                   hasContent={hasContent} />
        {/* TODO: add in HeaderContent here. */}
      </div>
    );
  }
}
