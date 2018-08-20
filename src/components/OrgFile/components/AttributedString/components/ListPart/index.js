import React, { PureComponent } from 'react';

import './ListPart.css';

import AttributedString from '../../../AttributedString/';

export default class ListPart extends PureComponent {
  renderContent() {
    const { part } = this.props;

    return part.get('items').map(item => (
      <li key={item.get('id')} value={item.get('forceNumber')}>
        <AttributedString parts={item.get('titleLine')} />
        <br />
        <AttributedString parts={item.get('contents')}
                          onTableCellSelect={this.props.onTableCellSelect}
                          selectedTableCellId={this.props.selectedTableCellId}
                          inTableEditMode={this.props.inTableEditMode}
                          onExitTableEditMode={this.props.onExitTableEditMode}
                          onTableCellValueUpdate={this.props.onTableCellValueUpdate} />
      </li>
    ));
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
