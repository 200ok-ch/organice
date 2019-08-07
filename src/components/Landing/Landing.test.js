import React from 'react';
import { mount } from 'enzyme';
import renderer from 'react-test-renderer';

import { MemoryRouter } from 'react-router-dom';

import Landing from './';

test('<Landing /> renders', () => {
  const component = renderer.create(
    <MemoryRouter>
      <Landing />
    </MemoryRouter>
  );

  expect(component.toJSON()).toMatchSnapshot();
});
