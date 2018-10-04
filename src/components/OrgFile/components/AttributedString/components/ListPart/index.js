import React, { PureComponent } from 'react';

import './stylesheet.css';

import AttributedString from '../../../AttributedString/';
import Checkbox from '../../../../../UI/Checkbox/';

import classNames from 'classnames';
import _ from 'lodash';

export default class ListPart extends PureComponent {
  constructor(props) {
    super(props);

    _.bindAll(this, ['handleCheckboxClick']);
  }

  handleCheckboxClick(itemId) {
    return () => this.props.subPartDataAndHandlers.onCheckboxClick(itemId);
  }

  renderContent() {
    const { part, subPartDataAndHandlers } = this.props;

    return part.get('items').map(item => {
      const lineContainerClass = classNames({
        'list-part__checkbox-container': item.get('isCheckbox'),
      });

      return (
        <li key={item.get('id')} value={item.get('forceNumber')}>
          <span
            className={lineContainerClass}
            onClick={item.get('isCheckbox') ? this.handleCheckboxClick(item.get('id')) : null}
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
  }

  render() {
    const { part } = this.props;

    return part.get('isOrdered') ? (
      <ol className="attributed-string__list-part attributed-string__list-part--ordered">
        {this.renderContent()}
      </ol>
    ) : (
      <ul className="attributed-string__list-part">{this.renderContent()}</ul>
    );
  }
}
