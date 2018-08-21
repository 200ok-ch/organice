import React, { PureComponent } from 'react';

import './ListPart.css';

import AttributedString from '../../../AttributedString/';
import Checkbox from '../../../../../UI/Checkbox/';

import classNames from 'classnames';

export default class ListPart extends PureComponent {
  renderContent() {
    const { part } = this.props;

    return part.get('items').map(item => {
      const lineContainerClass = classNames({
        'list-part__checkbox-container': item.get('isCheckbox'),
      });

      return (
        <li key={item.get('id')} value={item.get('forceNumber')}>
          <span className={lineContainerClass}>
            {item.get('isCheckbox') && <Checkbox state={item.get('checkboxState')} />}
            <AttributedString parts={item.get('titleLine')} />
          </span>
          <br />
          <AttributedString parts={item.get('contents')}
                            onTableCellSelect={this.props.onTableCellSelect}
                            selectedTableCellId={this.props.selectedTableCellId}
                            inTableEditMode={this.props.inTableEditMode}
                            onExitTableEditMode={this.props.onExitTableEditMode}
                            onTableCellValueUpdate={this.props.onTableCellValueUpdate} />
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
      <ul className="attributed-string__list-part">
        {this.renderContent()}
      </ul>
    );
  }
}
