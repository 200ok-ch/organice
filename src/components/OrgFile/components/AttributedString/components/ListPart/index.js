import React from 'react';

import './stylesheet.css';

import AttributedString from '../../../AttributedString/';
import Checkbox from '../../../../../UI/Checkbox/';

import classNames from 'classnames';

export default ({ part, subPartDataAndHandlers }) => {
  // TODO K.Matsuda handleCheckboxClick を復旧させる
  // const handleCheckboxClick = itemId => () => subPartDataAndHandlers.onCheckboxClick(itemId);
  const handleListItemSelect = (itemId) => () => subPartDataAndHandlers.onListItemSelect(itemId);

  const renderContent = () => {
    return part.get('items').map((item) => {
      const lineContainerClass = classNames({
        'list-part__checkbox-container': item.get('isCheckbox'),
      });

      return (
        <li key={item.get('id')} value={item.get('forceNumber')}>
          <span
            className={lineContainerClass}
            // TODO K.Matsuda handleCheckboxClick を復旧させる
            //onClick={item.get('isCheckbox') ? handleCheckboxClick(item.get('id')) : null}
            onClick={item.get('isCheckbox') ? handleListItemSelect(item.get('id')) : null}
          >
            {item.get('isCheckbox') && <Checkbox state={item.get('checkboxState')} />}
            <AttributedString
              parts={item.get('titleLine')}
              subPartDataAndHandlers={subPartDataAndHandlers}
            />
          </span>
          <br />
          <AttributedString
            parts={item.get('contents')}
            subPartDataAndHandlers={subPartDataAndHandlers}
          />
        </li>
      );
    });
  };

  return part.get('isOrdered') ? (
    <ol className="attributed-string__list-part attributed-string__list-part--ordered">
      {renderContent()}
    </ol>
  ) : (
    <ul className="attributed-string__list-part">{renderContent()}</ul>
  );
};
