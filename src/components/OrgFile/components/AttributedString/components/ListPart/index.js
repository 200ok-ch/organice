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
  const isListItemSelected = part
    .get('items')
    .some((item) => item.get('id') === selectedListItemId);

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
            <AttributedString
              parts={item.get('titleLine')}
              subPartDataAndHandlers={subPartDataAndHandlers}
            />
          </div>
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
      <Collapse isOpened={isListItemSelected && !shouldDisableActions}>
        <ListActionDrawer subPartDataAndHandlers={subPartDataAndHandlers} />
      </Collapse>
    </Fragment>
  );
};
