import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import { withRouter } from 'react-router-dom';

import { Map } from 'immutable';

import ShortcutRow from './components/ShortcutRow';

import * as baseActions from '../../actions/base';

import goBackOrToRoot from '../../util/go_back_or_to_root';

import './KeyboardShortcutsEditor.css';

import _ from 'lodash';

class KeyboardShortcutsEditor extends PureComponent {
  DEFAULT_BINDINGS = [
    ['Select next header', 'ctrl+n'],
    ['Select previous header', 'ctrl+p'],
    ['Toggle header opened', 'tab'],
    ['Advance todo state', 'ctrl+t'],
    ['Edit title', 'ctrl+h'],
    ['Edit description', 'ctrl+d'],
    ['Exit edit mode', 'command+enter'],
    ['Add header', 'ctrl+enter'],
    ['Remove header', 'backspace'],
    ['Move header up', 'ctrl+command+p'],
    ['Move header down', 'ctrl+command+n'],
    ['Move header left', 'ctrl+command+b'],
    ['Move header right', 'ctrl+command+f'],
    ['Undo', 'ctrl+shift+-'],
  ];

  constructor(props) {
    super(props);

    _.bindAll(this, ['handleBindingChange', 'handleDoneClick']);
  }

  handleBindingChange(bindingName, newBinding) {
    const alreadyInUseBinding = this.getKeybindings().filter(([_, binding]) => (
      binding === newBinding
    ))[0];

    if (!!alreadyInUseBinding) {
      alert(`That binding is already in use for "${alreadyInUseBinding[0]}"`);
      return;
    }

    this.props.base.setCustomKeybinding(bindingName, newBinding);
  }

  handleDoneClick() {
    goBackOrToRoot(this.props.history);
  }

  getKeybindings() {
    const { customKeybindings } = this.props;

    return this.DEFAULT_BINDINGS.map(([bindingName, binding]) => (
      [bindingName, customKeybindings.get(bindingName, binding)]
    ));
  }

  render() {
    return (
      <div className="keyboard-shortcuts-editor-container">
        {this.getKeybindings().map(([name, binding]) => (
          <ShortcutRow key={name}
                       name={name}
                       binding={binding}
                       onBindingChange={this.handleBindingChange} />
        ))}

        <div className="keyboard-shortcuts-editor__btn-container">
          <div className="btn settings-btn" onClick={this.handleDoneClick}>Done</div>
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state, props) => {
  return {
    customKeybindings: state.base.get('customKeybindings') || Map()
  };
};

const mapDispatchToProps = dispatch => {
  return {
    base: bindActionCreators(baseActions, dispatch),
  };
};

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(KeyboardShortcutsEditor));
