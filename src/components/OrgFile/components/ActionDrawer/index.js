import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import './ActionDrawer.css';

import _ from 'lodash';

import * as orgActions from '../../../../actions/org';

import ActionButton from './components/ActionButton';

class ActionDrawer extends PureComponent {
  constructor(props) {
    super(props);

    _.bindAll(this, ['handleAdvanceTodoClick']);
  }

  handleAdvanceTodoClick() {
    this.props.org.advanceTodoState();
  }

  render() {
    return (
      <div className="action-drawer-container nice-scroll">
        <ActionButton iconName="check" isDisabled={false} onClick={this.handleAdvanceTodoClick} />
      </div>
    );
  }
}

const mapStateToProps = (state, props) => {
  return {};
};

const mapDispatchToProps = dispatch => {
  return {
    org: bindActionCreators(orgActions, dispatch),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(ActionDrawer);
