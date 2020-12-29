import React from 'react';
import { render, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import Landing from './';

afterEach(cleanup);

test('<Landing /> renders', () => {
  const { container } = render(
    <MemoryRouter>
      <Landing />
    </MemoryRouter>
  );

  expect(container).toMatchSnapshot();
});
