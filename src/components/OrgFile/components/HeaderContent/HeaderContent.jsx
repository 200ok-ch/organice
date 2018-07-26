import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import './HeaderContent.css';

import AttributedString from '../AttributedString/AttributedString';

class HeaderContent extends PureComponent {
  render() {
    const { header } = this.props;

    if (!header.get('opened')) {
      return <div></div>;
    }

    return (
      <div>
        <AttributedString parts={header.get('description')} />
      </div>
    );
  }
}

const mapStateToProps = (state, props) => {
  return {};
};

const mapDispatchToProps = dispatch => {
  return {};
};

export default connect(mapStateToProps, mapDispatchToProps)(HeaderContent);
