import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import rootReducer from './root-reducer';

export default initialState => (
  createStore(rootReducer, initialState, applyMiddleware(thunk))
);
