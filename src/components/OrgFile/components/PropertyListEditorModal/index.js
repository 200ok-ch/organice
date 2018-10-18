import React, { PureComponent } from 'react';

import './stylesheet.css';

import SlideUp from '../../../UI/SlideUp';

export default class PropertyListEditorModal extends PureComponent {
  render() {
    const { onClose } = this.props;

    return (
      <SlideUp shouldIncludeCloseButton onClose={onClose}>
        Property list editor modal
      </SlideUp>
    );
  }
}
