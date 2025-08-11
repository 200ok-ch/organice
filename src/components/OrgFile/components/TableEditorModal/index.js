import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { is, Map } from 'immutable';
import { curry } from 'lodash/fp';

import './stylesheet.css';
import Table from '../Table/index';
import TableActionButtons from './components/TableActionButtons';
import { closePopup } from '../../../../actions/base';
import { getTable } from '../../../../lib/org_utils';

const getFilePath = (state) => state.org.present.get('path');
const getFile = curry((filePath, state) => {
  return state.org.present.getIn(['files', filePath], Map());
});

const TableEditorModal = () => {
  const dispatch = useDispatch();
  const filePath = useSelector(getFilePath);
  const file = useSelector(getFile(filePath), is);
  const headerIndex = file.get('selectedHeaderIndex');
  const descriptionItemIndex = file.get('selectedDescriptionItemIndex');
  const tableGetter = getTable({ filePath, headerIndex, descriptionItemIndex });
  const table = useSelector(tableGetter, is);

  const tableProps = {
    filePath,
    table,
    headerIndex,
    descriptionItemIndex,
  };

  const handlePopupClose = () => {
    dispatch(closePopup());
  };

  if (table.get('contents').size === 0 || table.getIn(['contents', 0, 'contents']).size === 0) {
    handlePopupClose();
  }

  return (
    <>
      <h2 className="drawer-modal__title">Edit table</h2>
      <div style={{ overflowX: 'auto', overflowY: 'auto' }}>
        <Table props={tableProps} />
      </div>
      <TableActionButtons filePath={filePath} />
    </>
  );
};

export default TableEditorModal;
