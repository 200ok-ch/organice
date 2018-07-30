import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import * as dropboxActions from '../../actions/dropbox';

import './Settings.css';

import _ from 'lodash';

class Settings extends PureComponent {
  constructor(props) {
    super(props);

    _.bindAll(this, ['handleSignOutClick']);
  }

  handleSignOutClick() {
    this.props.dropbox.signOut();
  }

  render() {
    return (
      <div>
        <div className="settings-buttons-container">
          <button className="btn settings-btn" onClick={this.handleSignOutClick}>Sign out</button>
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state, props) => {
  return {};
};

const mapDispatchToProps = dispatch => {
  return {
    dropbox: bindActionCreators(dropboxActions, dispatch),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(Settings);
