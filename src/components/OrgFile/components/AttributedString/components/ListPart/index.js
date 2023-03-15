import React, { Fragment } from 'react';
import { UnmountClosed as Collapse } from 'react-collapse';

import './stylesheet.css';

import AttributedString from '../../../AttributedString/';
import Checkbox from '../../../../../UI/Checkbox/';
import ListActionDrawer from './ListActionDrawer';

import classNames from 'classnames';

export default ({ part, subPartDataAndHandlers }) => {
  const handleCheckboxClick = (itemId) => () => subPartDataAndHandlers.onCheckboxClick(itemId);
  const handleListItemSelect = (itemId) => () => subPartDataAndHandlers.onListItemSelect(itemId);

  const shouldDisableActions = subPartDataAndHandlers.shouldDisableActions;
  const selectedListItemId = subPartDataAndHandlers.selectedListItemId;
  const inListTitleEditMode = subPartDataAndHandlers.inListTitleEditMode;

  const renderContent = () => {
    return part.get('items').map((item) => {
      const isItemSelected = item.get('id') === selectedListItemId;
      const lineContainerClass = classNames({
        'list-part__not_checkbox-container': !item.get('isCheckbox'),
        'list-part__checkbox-container': item.get('isCheckbox'),
        'list-part__item--selected': isItemSelected,
      });

      return (
        <li key={item.get('id')} value={item.get('forceNumber')}>
          <div className={lineContainerClass} onClick={handleListItemSelect(item.get('id'))}>
            {item.get('isCheckbox') && (
              <Checkbox
                onClick={handleCheckboxClick(item.get('id'))}
                state={item.get('checkboxState')}
              />
            )}
            {isItemSelected && inListTitleEditMode ? (
              // TODO K.Matsuda クラスコンポーネントに置き換え。現状ではハンドラでエラーが出る
              <div className="list-title-line__edit-container">
                <textarea
                  autoFocus
                  className="textarea"
                  rows="3"
                  ref={this.handleTextareaRef}
                  value={item.get('titleLine')}
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
                subPartDataAndHandlers={subPartDataAndHandlers}
              />
            )}
          </div>
          <Collapse isOpened={isItemSelected && !shouldDisableActions}>
            <ListActionDrawer subPartDataAndHandlers={subPartDataAndHandlers} />
          </Collapse>
          <AttributedString
            parts={item.get('contents')}
            subPartDataAndHandlers={subPartDataAndHandlers}
          />
        </li>
      );
    });
  };

  return (
    <Fragment>
      {part.get('isOrdered') ? (
        <ol className="attributed-string__list-part attributed-string__list-part--ordered">
          {renderContent()}
        </ol>
      ) : (
        <ul className="attributed-string__list-part">{renderContent()}</ul>
      )}
    </Fragment>
  );
};
