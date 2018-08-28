import React, { PureComponent } from 'react';
import { DragLayer } from 'react-dnd';

import './CaptureTemplateDragPreview.css';

import CaptureTemplate from '../CaptureTemplate/';

class CaptureTemplateDragPreview extends PureComponent {
  getDragStyles(currentOffset) {
    if (!currentOffset) {
      return {
        display: 'none',
      };
    }

    const transform = `translate(${currentOffset.x}px, ${currentOffset.y - 50}px)`;
    return {
      pointerEvents: 'none',
      transform,
      WebkitTransform: transform,
    };
  }

  render() {
    const { currentOffset, template } = this.props;

    return (
      <div className="capture-template-drag-preview-container"
           style={this.getDragStyles(currentOffset)}>
        {template && <CaptureTemplate template={template} />}
      </div>
    );
  }
}

const collect = monitor => {
  const item = monitor.getItem();

  return {
    id: item && item.id,
    template: item && item.template,
    currentOffset: monitor.getSourceClientOffset(),
  };
};

export default DragLayer(collect)(CaptureTemplateDragPreview);
