import React, { PureComponent, Fragment } from 'react';
import { UnmountClosed as Collapse } from 'react-collapse';

import './stylesheet.css';

import AttributedString from '../../../AttributedString/';
import Checkbox from '../../../../../UI/Checkbox/';
import ListActionDrawer from './ListActionDrawer';

import { getCurrentTimestampAsText } from '../../../../../../lib/timestamps';

import _ from 'lodash';
import classNames from 'classnames';

export default class ListPart extends PureComponent {
  constructor(props) {
    super(props);

    _.bindAll(this, [
      'handleListItemSelect',
      'handleCheckboxClick',
      'handleTextareaBlur',
      'handleListTitleChange',
      'handleInsertTimestamp',
      'handleTextareaRef',
    ]);

    this.state = {
      shouldIgnoreBlur: false,
    };
  }

  componentDidUpdate(prevProps) {
    // TODO K.Matsuda componentDidUpdate
  }

  handleListItemSelect(itemId) {
    return () => this.props.subPartDataAndHandlers.onListItemSelect(itemId);
  }

  handleCheckboxClick(itemId) {
    return () => this.props.subPartDataAndHandlers.onCheckboxClick(itemId);
  }

  handleTextareaBlur() {
    setTimeout(() => {
      if (!this.state.shouldIgnoreBlur) {
        this.props.subPartDataAndHandlers.onExitListTitleEditMode();
      } else {
        this.setState({ shouldIgnoreBlur: false });
      }
    }, 0);
  }

  handleListTitleChange(event) {
    // TODO K.Matsuda handleListTitleChange
  }

  handleInsertTimestamp() {
    // TODO K.Matsuda handleInsertTimestamp
  }

  handleTextareaRef(textarea) {
    this.textarea = textarea;
  }

  renderContent() {
    const {
      part,
      subPartDataAndHandlers: { selectedListItemId, inListTitleEditMode, shouldDisableActions },
    } = this.props;
    return part.get('items').map((item) => {
      const isItemSelected = item.get('id') === selectedListItemId;
      const lineContainerClass = classNames({
        'list-part__not_checkbox-container': !item.get('isCheckbox'),
        'list-part__checkbox-container': item.get('isCheckbox'),
        'list-part__item--selected': isItemSelected,
      });

      return (
        <li key={item.get('id')} value={item.get('forceNumber')}>
          <div className={lineContainerClass} onClick={this.handleListItemSelect(item.get('id'))}>
            {item.get('isCheckbox') && (
              <Checkbox
                onClick={this.handleCheckboxClick(item.get('id'))}
                state={item.get('checkboxState')}
              />
            )}
            {isItemSelected && inListTitleEditMode ? (
              <div className="list-title-line__edit-container">
                <textarea
                  autoFocus
                  className="textarea"
                  rows="3"
                  ref={this.handleTextareaRef}
                  value={item.getIn('titleLine')}
                  onBlur={this.handleTextareaBlur}
                  onChange={this.handleListTitleChange}
                />
                <div
                  className="list-title-line__insert-timestamp-button"
                  onClick={this.handleInsertTimestamp}
                >
                  <i className="fas fa-plus insert-timestamp-icon" />
                  Insert timestamp
                </div>
              </div>
            ) : (
              <AttributedString
                parts={item.get('titleLine')}
                subPartDataAndHandlers={this.props.subPartDataAndHandlers}
              />
            )}
          </div>
          <Collapse isOpened={isItemSelected && !shouldDisableActions}>
            <ListActionDrawer subPartDataAndHandlers={this.props.subPartDataAndHandlers} />
          </Collapse>
          <AttributedString
            parts={item.get('contents')}
            subPartDataAndHandlers={this.props.subPartDataAndHandlers}
          />
        </li>
      );
    });
  }

  render() {
    return (
      <Fragment>
        {this.props.part.get('isOrdered') ? (
          <ol className="attributed-string__list-part attributed-string__list-part--ordered">
            {this.renderContent()}
          </ol>
        ) : (
          <ul className="attributed-string__list-part">{this.renderContent()}</ul>
        )}
      </Fragment>
    );
  }
}
