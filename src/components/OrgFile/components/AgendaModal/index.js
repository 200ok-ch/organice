import React, { PureComponent } from 'react';

import './stylesheet.css';

import SlideUp from '../../../UI/SlideUp';

export default class AgendaModal extends PureComponent {
  render() {
    const { onClose } = this.props;

    return (
      <SlideUp shouldIncludeCloseButton onClose={onClose}>
        <h2 className="agenda__title">Agenda</h2>

        <div>Agenda modal</div>

        <br />
      </SlideUp>
    );
  }
}
