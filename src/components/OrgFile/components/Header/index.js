import React, { PureComponent } from 'react';
import { connect } from 'react-redux';

import './Header.css';

import classNames from 'classnames';

import TitleLine from '../TitleLine';
import HeaderContent from '../HeaderContent';

class Header extends PureComponent {
  render() {
    const { header, color, hasContent, isSelected, bulletStyle } = this.props;

    const style = {
      paddingLeft: 20 * header.get('nestingLevel'),
    };

    const className = classNames('header', {
      'header--selected': isSelected,
    });

    return (
      <div className={className} style={style}>
        <div style={{marginLeft: -16, color}}>{bulletStyle === 'Fancy' ? '●' : '*'}</div>
        <TitleLine header={header}
                   color={color}
                   hasContent={hasContent}
                   isSelected={isSelected} />
        <HeaderContent header={header} />
      </div>
    );
  }
}

const mapStateToProps = (state, props) => {
  return {
    bulletStyle: state.base.get('bulletStyle'),
  };
};

const mapDispatchToProps = () => ({});

export default connect(mapStateToProps, mapDispatchToProps)(Header);
