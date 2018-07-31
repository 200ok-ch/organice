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

    _.bindAll(this, [
      'handleTitleClick',
      'handleTextareaBlur',
      'handleTitleChange',
      'handleTitleFieldClick',
      'handleTodoClick',
    ]);

    this.state = {
      titleValue: this.calculateRawTitle(props.header),
    };
  }

  componentWillReceiveProps(nextProps) {
    const { header } = this.props;

    if (this.props.inEditMode && !nextProps.inEditMode) {
      this.props.org.updateHeaderTitle(header.get('id'), this.state.titleValue);
    }

    this.setState({ titleValue: this.calculateRawTitle(nextProps.header) });
  }

  calculateRawTitle(header) {
    const todoKeyword = header.getIn(['titleLine', 'todoKeyword']);
    const tags = header.getIn(['titleLine', 'tags']);

    let titleValue = header.getIn(['titleLine', 'rawTitle']);

    if (!!todoKeyword) {
      titleValue = `${todoKeyword} ${titleValue}`;
    }

    if (!!tags && tags.size > 0) {
      titleValue = `${titleValue} :${tags.join(':')}:`;
    }

    return titleValue;
  }

  handleTitleClick() {
    const { header, hasContent, isSelected } = this.props;

    if (hasContent && (!header.get('opened') || isSelected)) {
      this.props.org.toggleHeaderOpened(header.get('id'));
    }

    this.props.org.selectHeader(header.get('id'));
  }

  handleTodoClick() {
    const { header, tapTodoToAdvance } = this.props;

    this.props.org.selectHeader(header.get('id'));

    if (tapTodoToAdvance === 'Yes') {
      this.props.org.advanceTodoState();
    }
  }

  handleTextareaBlur() {
    this.props.org.exitTitleEditMode();
  }

  handleTitleChange(event) {
    this.setState({ titleValue: event.target.value });
  }

  handleTitleFieldClick(event) {
    event.stopPropagation();
  }

  render() {
    const {
      header,
      color,
      hasContent,
      inEditMode,
    } = this.props;
    const todoKeyword = header.getIn(['titleLine', 'todoKeyword']);

    const titleStyle = {
      color,
      fontWeight: 'bold',
    };

    return (
      <div className="title-line" onClick={this.handleTitleClick}>
        {!inEditMode && !!todoKeyword ? (
          <span className={classNames('todo-keyword', `todo-keyword--${todoKeyword.toLowerCase()}`)}
                onClick={this.handleTodoClick}>
            {todoKeyword}
          </span>
        ) : ''}

        {inEditMode ? (
          <textarea autoFocus
                    className="textarea"
                    rows="2"
                    value={this.state.titleValue}
                    onBlur={this.handleTextareaBlur}
                    onChange={this.handleTitleChange}
                    onClick={this.handleTitleFieldClick} />
        ) : (
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
        )}
      </div>
    );
  }
}

const mapStateToProps = (state, props) => {
  return {
    inEditMode: (
      state.org.present.get('inTitleEditMode') && state.org.present.get('selectedHeaderId') === props.header.get('id')
    ),
    tapTodoToAdvance: state.base.get('tapTodoToAdvance'),
  };
};

const mapDispatchToProps = dispatch => {
  return {
    org: bindActionCreators(orgActions, dispatch),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(TitleLine);
