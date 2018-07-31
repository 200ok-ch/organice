import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import googleAnalyticsLogger from './middleware/google_analytics_logging';
import rootReducer from './reducers';

export default initialState => (
  createStore(rootReducer, initialState, applyMiddleware(thunk, googleAnalyticsLogger))
);
