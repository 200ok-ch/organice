import React, { PureComponent } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { is, Map } from 'immutable';

import './stylesheet.css';
import Table from '../Table/index';
import TableActionButtons from './components/TableActionButtons';
import { activatePopup } from '../../../../actions/base';
import { getTable } from '../../../../lib/org_utils';

const TableEditorModal = (props) => {
  const dispatch = useDispatch();
  const filePath = useSelector((state) => state.org.present.get('path'));
  const file = useSelector((state) => state.org.present.getIn(['files', filePath], Map()), is);
  const headerIndex = file.get('selectedHeaderIndex');
  const descriptionItemIndex = file.get('selectedDescriptionItemIndex');
  const tableGetter = getTable({ filePath, headerIndex, descriptionItemIndex });
  const table = useSelector(tableGetter, is);
  const shouldDisableActions = false;

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
      <TableActionButtons filePath={filePath} shouldDisableActions={shouldDisableActions} />
    </>
  );
};

export default TableEditorModal;
