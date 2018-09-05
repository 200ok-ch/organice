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
      'handleRef',
      'handleTitleSpanRef',
      'handleTextareaRef',
      'handleTitleClick',
      'handleTextareaBlur',
      'handleTitleChange',
      'handleTitleFieldClick',
      'handleTodoClick',
    ]);

    this.state = {
      titleValue: this.calculateRawTitle(props.header),
      containerWidth: null,
    };
  }

  storeContainerWidth() {
    if (this.containerDiv) {
      this.setState({ containerWidth: this.containerDiv.offsetWidth });
    }
  }

  componentDidMount() {
    this.storeContainerWidth();
  }

  componentDidUpdate(prevProps) {
    const { header } = this.props;

    if (prevProps.inEditMode && !this.props.inEditMode) {
      this.props.org.updateHeaderTitle(header.get('id'), this.state.titleValue);
    }

    if (prevProps.header !== this.props.header) {
      this.setState({
        titleValue: this.calculateRawTitle(this.props.header),
      }, () => this.storeContainerWidth());
    }
  }

  handleRef(div) {
    this.containerDiv = div;
  }

  handleTitleSpanRef(span) {
    this.titleSpan = span;
  }

  handleTextareaRef(textarea) {
    this.textarea = textarea;
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

  handleTitleClick(event) {
    const { header, hasContent, isSelected } = this.props;

    if (hasContent && (!header.get('opened') || isSelected)) {
      this.props.org.toggleHeaderOpened(header.get('id'));
    }

    this.props.org.selectHeader(header.get('id'));
  }

  handleTodoClick() {
    const { header, shouldTapTodoToAdvance } = this.props;

    this.props.org.selectHeader(header.get('id'));

    if (shouldTapTodoToAdvance) {
      this.props.org.advanceTodoState();
    }
  }

  handleTextareaBlur() {
    this.props.org.exitEditMode();
  }

  handleTitleChange(event) {
    // If the last character typed was a newline at the end, exit edit mode.
    const newTitle = event.target.value;
    const lastCharacter = newTitle[newTitle.length - 1];
    if (this.state.titleValue === newTitle.substring(0, newTitle.length - 1) && lastCharacter === '\n') {
      this.props.org.exitEditMode();
      return;
    }

    this.setState({ titleValue: newTitle });
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
    const { containerWidth } = this.state;
    const todoKeyword = header.getIn(['titleLine', 'todoKeyword']);

    const titleStyle = {
      color,
      fontWeight: 'bold',
      wordBreak: 'break-word'
    };

    return (
      <div className="title-line"
           onClick={this.handleTitleClick}
           ref={this.handleRef}
           style={{width: containerWidth}}>
        {!inEditMode && !!todoKeyword ? (
          <span className={classNames('todo-keyword', `todo-keyword--${todoKeyword.toLowerCase()}`)}
                onClick={this.handleTodoClick}>
            {todoKeyword}
          </span>
        ) : ''}

        {inEditMode ? (
          <textarea autoFocus
                    className="textarea"
                    rows="3"
                    ref={this.handleTextareaRef}
                    value={this.state.titleValue}
                    onBlur={this.handleTextareaBlur}
                    onChange={this.handleTitleChange}
                    onClick={this.handleTitleFieldClick} />
        ) : (
          <div>
            <span style={titleStyle} ref={this.handleTitleSpanRef}>
              <AttributedString parts={header.getIn(['titleLine', 'title'])} />
              {!header.get('opened') && hasContent ? '...' : ''}
            </span>

            {header.getIn(['titleLine', 'tags']).size > 0 && (
              <div>
                {header.getIn(['titleLine', 'tags']).toSet().toList().filter(tag => !!tag).map(tag => (
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
      state.org.present.get('editMode') === 'title' && state.org.present.get('selectedHeaderId') === props.header.get('id')
    ),
    shouldTapTodoToAdvance: state.base.get('shouldTapTodoToAdvance'),
    isSelected: state.org.present.get('selectedHeaderId') === props.header.get('id'),
  };
};

const mapDispatchToProps = dispatch => {
  return {
    org: bindActionCreators(orgActions, dispatch),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(TitleLine);
