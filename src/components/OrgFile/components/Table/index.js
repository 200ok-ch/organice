import React from 'react';
import TableCell from './TableCell/index';
import './stylesheet.css';

const Table = ({ props: { filePath, table, headerIndex, descriptionItemIndex } }) => {
  return (
    <table className="table-part">
      <tbody>
        {table.get('contents').map((row, rowIndex) => {
          return (
            <tr key={row.get('id')}>
              {row.get('contents').map((cell, columnIndex) => {
                const cellId = cell.get('id');
                const cellProps = {
                  filePath,
                  headerIndex,
                  descriptionItemIndex,
                  cellId,
                  row: rowIndex,
                  column: columnIndex,
                };
                return <TableCell key={cellId} props={cellProps} />;
              })}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};

export default Table;
