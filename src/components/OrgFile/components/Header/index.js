import React, { PureComponent } from 'react';
import { connect } from 'react-redux';

import './Header.css';

import classNames from 'classnames';

import TitleLine from '../TitleLine';
import HeaderContent from '../HeaderContent';

import { headerWithId } from '../../../../lib/org_utils';

class Header extends PureComponent {
  render() {
    const { header, color, hasContent, isSelected, bulletStyle, focusedHeader } = this.props;

    const indentLevel = !!focusedHeader ? (
      header.get('nestingLevel') - focusedHeader.get('nestingLevel') + 1
    ) : header.get('nestingLevel');

    const style = {
      paddingLeft: 20 * indentLevel,
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
  const focusedHeader = !!state.org.present.get('focusedHeaderId') ? (
    headerWithId(state.org.present.get('headers'), state.org.present.get('focusedHeaderId'))
  ) : null;

  return {
    bulletStyle: state.base.get('bulletStyle'),
    focusedHeader,
  };
};

const mapDispatchToProps = () => ({});

export default connect(mapStateToProps, mapDispatchToProps)(Header);
