import React, { PureComponent } from 'react';

import './stylesheet.css';

import SlideUp from '../../../UI/SlideUp';
import TabButtons from '../../../UI/TabButtons';

import _ from 'lodash';
import moment from 'moment';

export default class AgendaModal extends PureComponent {
  constructor(props) {
    super(props);

    _.bindAll(this, [
      'handleTimeframeTypeChange',
      'handleNextDateClick',
      'handlePreviousDateClick',
    ]);

    this.state = {
      date: moment(),
      timeframeType: 'Week',
    };
  }

  handleTimeframeTypeChange(timeframeType) {
    this.setState({ timeframeType });
  }

  handleNextDateClick() {
    console.log('next');
    const { date, timeframeType } = this.state;

    switch (timeframeType) {
      case 'Day':
        this.setState({ date: date.clone().add(1, 'day') });
        break;
      case 'Week':
        this.setState({ date: date.clone().add(1, 'week') });
        break;
      case 'Month':
        this.setState({ date: date.clone().add(1, 'month') });
        break;
      default:
        return '';
    }
  }

  handlePreviousDateClick() {
    console.log('previous');
    const { date, timeframeType } = this.state;

    switch (timeframeType) {
      case 'Day':
        this.setState({ date: date.clone().subtract(1, 'day') });
        break;
      case 'Week':
        this.setState({ date: date.clone().subtract(1, 'week') });
        break;
      case 'Month':
        this.setState({ date: date.clone().subtract(1, 'month') });
        break;
      default:
        return '';
    }
  }

  calculateTimeframeHeader() {
    const { date, timeframeType } = this.state;

    switch (timeframeType) {
      case 'Day':
        return date.format('MMMM Do');
      case 'Week':
        const weekStart = date.clone().startOf('week');
        const weekEnd = weekStart.clone().add(1, 'week');
        return `${weekStart.format('MMM Do')} - ${weekEnd.format('MMM Do')} (W${weekStart.format(
          'w'
        )})`;
      case 'Month':
        return date.format('MMMM');
      default:
        return '';
    }
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
          <i className="fas fa-chevron-left fa-lg" onClick={this.handlePreviousDateClick} />
          <div className="agenda__timeframe-header">{this.calculateTimeframeHeader()}</div>
          <i className="fas fa-chevron-right fa-lg" onClick={this.handleNextDateClick} />
        </div>
        <br />
        <br />
        <br />
        <br />
        <br />
        <br />
        <br />
        <br />
        <br />
        <br />
        <br />
        <br />
        <br />
        <br />
        <br />
        <br />
        <br />
        <br />
        <br />
        <br />
      </SlideUp>
    );
  }
}
