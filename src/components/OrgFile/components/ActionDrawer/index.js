import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import './ActionDrawer.css';

import ActionButton from './components/ActionButton';

class ActionDrawer extends PureComponent {
  render() {
    return (
      <div className="action-drawer-container nice-scroll">
        <ActionButton iconName="check" onClick={() => console.log('clickity')} isDisabled={false} />
        <ActionButton iconName="check" onClick={() => console.log('clickity')} isDisabled={true} />
        <ActionButton iconName="check" onClick={() => console.log('clickity')} isDisabled={true} />
        <ActionButton iconName="check" onClick={() => console.log('clickity')} isDisabled={true} />
        <ActionButton iconName="check" onClick={() => console.log('clickity')} isDisabled={false} />
        <ActionButton iconName="check" onClick={() => console.log('clickity')} isDisabled={false} />
        <ActionButton iconName="check" onClick={() => console.log('clickity')} isDisabled={false} />
        <ActionButton iconName="check" onClick={() => console.log('clickity')} isDisabled={false} />
        <ActionButton iconName="check" onClick={() => console.log('clickity')} isDisabled={false} />
        <ActionButton iconName="check" onClick={() => console.log('clickity')} isDisabled={false} />
        <ActionButton iconName="check" onClick={() => console.log('clickity')} isDisabled={false} />
        <ActionButton iconName="check" onClick={() => console.log('clickity')} isDisabled={false} />
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

export default connect(mapStateToProps, mapDispatchToProps)(ActionDrawer);
