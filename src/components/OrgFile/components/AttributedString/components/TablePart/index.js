import React, { PureComponent } from 'react';

import AttributedString from '../../../AttributedString';

import './TablePart.css';

import { getNextId } from '../../../../../../lib/parse_org';

export default class TablePart extends PureComponent {
  render() {
    const { table } = this.props;
    console.log("table = ", table.toJS());

    return (
      <table className="table-part">
        <tbody>
          {table.get('contents').map(row => (
            <tr key={getNextId()}>
              {row.map(cellContents => (
                <td className="table-part__cell" key={getNextId()}>
                  <AttributedString parts={cellContents} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    );
  }
}
