import React from 'react';
import Landing from '../Landing';
import { mount, shallow } from 'enzyme';
import renderer from 'react-test-renderer';

import { MemoryRouter } from 'react-router-dom';

test('<Landing /> renders', () => {
  const component = renderer.create(
    <MemoryRouter>
      <Landing />
    </MemoryRouter>
  );

  expect(component.toJSON()).toMatchSnapshot();
});

test('<Landing /> handles sign in click', () => {
  const handleSignInClick = jest.fn();

  const component = mount(
    <MemoryRouter>
      <Landing onSignInClick={handleSignInClick} />
    </MemoryRouter>
  );

  const signInButton = component.findWhere(node => {
    try {
      return node.text().trim() === 'Sign in';
    } catch(error) {
      return false;
    }
  });

  signInButton.simulate('click');

  expect(handleSignInClick).toHaveBeenCalled();
});
