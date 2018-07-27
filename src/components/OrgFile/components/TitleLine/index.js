import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import './TitleLine.css';

import _ from 'lodash';
import classNames from 'classnames';

import * as orgActions from '../../../../actions/org';

import AttributedString from '../AttributedString';

class TitleLine extends PureComponent {
  constructor(props) {
    super(props);

    _.bindAll(this, ['handleTitleClick']);
  }

  handleTitleClick() {
    const { header, hasContent, isSelected } = this.props;

    if (hasContent && (!header.get('opened') || isSelected)) {
      this.props.org.toggleHeaderOpened(header.get('id'));
    }

    this.props.org.selectHeader(header.get('id'));
  }

  render() {
    const { header, color, hasContent } = this.props;
    const todoKeyword = header.getIn(['titleLine', 'todoKeyword']);

    const titleStyle = {
      color,
      fontWeight: 'bold',
    };

    return (
      <div className="title-line" onClick={this.handleTitleClick}>
        {!!todoKeyword ? (
          <span className={classNames('todo-keyword', `todo-keyword--${todoKeyword.toLowerCase()}`)}>
            {todoKeyword}
          </span>
        ) : ''}

        <div>
          <span style={titleStyle}>
            <AttributedString parts={header.getIn(['titleLine', 'title'])} />
            {!header.get('opened') && hasContent ? '...' : ''}
          </span>

          {header.getIn(['titleLine', 'tags']).size > 0 && (
            <div>
              {header.getIn(['titleLine', 'tags']).toSet().toList().map(tag => (
                <div className="header-tag" key={tag}>{tag}</div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state, props) => {
  return {};
};

const mapDispatchToProps = dispatch => {
  return {
    org: bindActionCreators(orgActions, dispatch),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(TitleLine);
