import React, { PureComponent, Fragment } from 'react';
import { UnmountClosed as Collapse } from 'react-collapse';

import './stylesheet.css';

import AttributedString from '../../../AttributedString/';
import Checkbox from '../../../../../UI/Checkbox/';
import ListActionDrawer from './ListActionDrawer';
import { attributedStringToRawText } from '../../../../../../lib/export_org';

import { getCurrentTimestampAsText } from '../../../../../../lib/timestamps';

import _ from 'lodash';
import classNames from 'classnames';
import { Map } from 'immutable';

export default class ListPart extends PureComponent {
  constructor(props) {
    super(props);

    _.bindAll(this, [
      'handleListItemSelect',
      'handleCheckboxClick',
      'handleTextareaBlur',
      'handleListTitleChange',
      'handleListContentsChange',
      'handleInsertTimestampListTitle',
      'handleInsertTimestampListContents',
      'handleTextareaRef',
    ]);

    this.state = {
      listTitleValues: this.generateListTitleValueMap(props.part),
      listContentsValues: this.generateListContentsValueMap(props.part),
      shouldIgnoreBlur: false,
    };
  }

  componentDidUpdate(prevProps) {
    const {
      subPartDataAndHandlers: {
        onListTitleValueUpdate,
        onListContentsValueUpdate,
        inListTitleEditMode,
        inListContentsEditMode,
        selectedListItemId,
      },
    } = this.props;
    const { listTitleValues, listContentsValues } = this.state;

    if (prevProps.subPartDataAndHandlers.inListTitleEditMode && !inListTitleEditMode) {
      if (listTitleValues.has(selectedListItemId)) {
        onListTitleValueUpdate(selectedListItemId, listTitleValues.get(selectedListItemId));
      }
    }

    if (prevProps.subPartDataAndHandlers.inListContentsEditMode && !inListContentsEditMode) {
      if (listContentsValues.has(selectedListItemId)) {
        onListContentsValueUpdate(selectedListItemId, listContentsValues.get(selectedListItemId));
      }
    }

    if (this.props.part !== prevProps.part) {
      this.setState({ listTitleValues: this.generateListTitleValueMap(this.props.part) });
      this.setState({ listContentsValues: this.generateListContentsValueMap(this.props.part) });
    }
  }

  generateListTitleValueMap(part) {
    return Map(
      part
        .get('items')
        .map((item) => [item.get('id'), attributedStringToRawText(item.get('titleLine'))])
    );
  }

  generateListContentsValueMap(part) {
    return Map(
      part
        .get('items')
        .map((item) => [item.get('id'), attributedStringToRawText(item.get('contents'))])
    );
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
    const { listTitleValues } = this.state;
    const {
      subPartDataAndHandlers: { selectedListItemId },
    } = this.props;

    this.setState({
      listTitleValues: listTitleValues.set(selectedListItemId, event.target.value),
    });
  }

  handleListContentsChange(event) {
    const { listContentsValues } = this.state;
    const {
      subPartDataAndHandlers: { selectedListItemId },
    } = this.props;

    this.setState({
      listContentsValues: listContentsValues.set(selectedListItemId, event.target.value),
    });
  }

  handleInsertTimestampListTitle() {
    // Clicking this button will unfocus the textarea, but we don't want to exit edit mode,
    // so instruct the blur handler to ignore the event.
    this.setState({ shouldIgnoreBlur: true });

    const { listTitleValues } = this.state;
    const {
      subPartDataAndHandlers: { selectedListItemId },
    } = this.props;
    const listTitleValue = listTitleValues.get(selectedListItemId);

    const insertionIndex = this.textarea.selectionStart;
    this.setState({
      listTitleValues: listTitleValues.set(
        selectedListItemId,
        listTitleValue.substring(0, insertionIndex) +
          getCurrentTimestampAsText() +
          listTitleValue.substring(this.textarea.selectionEnd || insertionIndex)
      ),
    });

    this.textarea.focus();
  }

  handleInsertTimestampListContents() {
    this.setState({ shouldIgnoreBlur: true });

    const { listContentsValues } = this.state;
    const {
      subPartDataAndHandlers: { selectedListItemId },
    } = this.props;
    const listContentsValue = listContentsValues.get(selectedListItemId);

    const insertionIndex = this.textarea.selectionStart;
    this.setState({
      listContentsValues: listContentsValues.set(
        selectedListItemId,
        listContentsValue.substring(0, insertionIndex) +
          getCurrentTimestampAsText() +
          listContentsValue.substring(this.textarea.selectionEnd || insertionIndex)
      ),
    });

    this.textarea.focus();
  }
  handleTextareaRef(textarea) {
    this.textarea = textarea;
  }

  renderContent() {
    const {
      part,
      subPartDataAndHandlers: {
        selectedListItemId,
        inListTitleEditMode,
        inListContentsEditMode,
        shouldDisableActions,
      },
    } = this.props;
    const { listTitleValues, listContentsValues } = this.state;

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
                  value={listTitleValues.get(item.get('id'))}
                  onBlur={this.handleTextareaBlur}
                  onChange={this.handleListTitleChange}
                />
                <div
                  className="list-title-line__insert-timestamp-button"
                  onClick={this.handleInsertTimestampListTitle}
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
          {isItemSelected && inListContentsEditMode ? (
            <div className="list-contents__edit-container">
              <textarea
                autoFocus
                className="textarea"
                rows="8"
                ref={this.handleTextareaRef}
                value={listContentsValues.get(item.get('id'))}
                onBlur={this.handleTextareaBlur}
                onChange={this.handleListContentsChange}
              />
              <div
                className="list-contents__insert-timestamp-button"
                onClick={this.handleInsertTimestampListContents}
              >
                <i className="fas fa-plus insert-timestamp-icon" />
                Insert timestamp
              </div>
            </div>
          ) : (
            <AttributedString
              parts={item.get('contents')}
              subPartDataAndHandlers={this.props.subPartDataAndHandlers}
            />
          )}
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
