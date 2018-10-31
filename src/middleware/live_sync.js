import { sync } from '../actions/org';

export default store => next => action => {
  if (action.dirtying && store.getState().base.get('shouldLiveSync')) {
    store.dispatch(sync({ shouldSuppressMessages: true }));
  }

  return next(action);
};
