import React, { PureComponent } from 'react';

import './Header.css';

import classNames from 'classnames';

import TitleLine from '../TitleLine/TitleLine';

export default class Header extends PureComponent {
  render() {
    const { header, color, hasContent, isSelected } = this.props;

    const style = {
      paddingLeft: 20 * header.get('nestingLevel'),
    };

    const className = classNames('header', {
      'header--selected': isSelected,
    });

    return (
      <div className={className} style={style}>
        <div style={{marginLeft: -16}}>*</div>
        <TitleLine header={header}
                   color={color}
                   hasContent={hasContent}
                   isSelected={isSelected} />
        {/* TODO: add in HeaderContent here. */}
      </div>
    );
  }
}
