import { createStore, applyMiddleware, compose } from 'redux';
import thunk from 'redux-thunk';
import googleAnalyticsLogger from './middleware/google_analytics_logging';
import liveSync from './middleware/live_sync';
import rootReducer from './reducers';

const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

export default initialState =>
  createStore(
    rootReducer,
    initialState,
    composeEnhancers(applyMiddleware(thunk, googleAnalyticsLogger, liveSync))
  );
