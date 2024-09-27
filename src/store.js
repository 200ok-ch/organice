import { createStore, applyMiddleware, compose } from 'redux';
import { thunk } from 'redux-thunk';
import liveSync from './middleware/live_sync';
import toggleColorScheme from './middleware/toggle_color_scheme';
import rootReducer from './reducers';

const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

export default (initialState) =>
  createStore(
    rootReducer,
    initialState,
    composeEnhancers(applyMiddleware(thunk, liveSync, toggleColorScheme))
  );
