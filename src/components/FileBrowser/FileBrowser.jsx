import React, { Component } from 'react';
import { connect } from 'react-redux';

import './FileBrowser.css';

class FileBrowser extends Component {
  render() {
    return (
      <div>
        File browser
      </div>
    );
  }
}

const mapStateToProps = (state, props) => {
  return {};
};

const mapDispatchToProps = distpatch => {
  return {};
};

export default connect(mapStateToProps, mapDispatchToProps)(FileBrowser);
