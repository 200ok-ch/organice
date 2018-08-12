import React, { PureComponent } from 'react';

import AttributedString from '../../../AttributedString';

import './TablePart.css';

import _ from 'lodash';
import classNames from 'classnames';

export default class TablePart extends PureComponent {
  constructor(props) {
    super(props);

    _.bindAll(this, ['handleCellSelect']);
  }

  handleCellSelect(cellId) {
    return () => this.props.onCellSelect(cellId);
  }

  render() {
    const { table, selectedTableCellId } = this.props;

    return (
      <table className="table-part">
        <tbody>
          {table.get('contents').map(row => (
            <tr key={row.get('id')}>
              {row.get('contents').map(cell => {
                const className = classNames('table-part__cell', {
                  'table-part__cell--selected': cell.get('id') === selectedTableCellId
                });

                return (
                  <td className={className}
                      key={cell.get('id')}
                      onClick={this.handleCellSelect(cell.get('id'))}>
                    {cell.get('contents').size > 0 ? (
                      <AttributedString parts={cell.get('contents')} />
                    ) : (
                      ' '
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    );
  }
}
