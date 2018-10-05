import React, { PureComponent } from 'react';

import './stylesheet.css';

import SlideUp from '../../../UI/SlideUp';
import TabButtons from '../../../UI/TabButtons';

import _ from 'lodash';
import moment from 'moment';

export default class AgendaModal extends PureComponent {
  constructor(props) {
    super(props);

    _.bindAll(this, ['handleTimeframeTypeChange']);

    this.state = {
      timeframeType: 'Week',
    };
  }

  handleTimeframeTypeChange(timeframeType) {
    this.setState({ timeframeType });
  }

  render() {
    const { onClose } = this.props;
    const { timeframeType } = this.state;

    return (
      <SlideUp shouldIncludeCloseButton onClose={onClose}>
        <h2 className="agenda__title">Agenda</h2>

        <div className="agenda__tab-container">
          <TabButtons
            buttons={['Day', 'Week', 'Month']}
            selectedButton={timeframeType}
            onSelect={this.handleTimeframeTypeChange}
            useEqualWidthTabs
          />
        </div>

        <div className="agenda__timeframe-header-container">
          <i className="fas fa-chevron-left fa-lg" />
          <div className="agenda__timeframe-header">Sep 30 - Oct 6 (W40)</div>
          <i className="fas fa-chevron-right fa-lg" />
        </div>

        <br />
      </SlideUp>
    );
  }
}
