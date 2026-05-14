
import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import LoginButton from '../LoginButton';

test('renders LoginButton component', () => {
  render(
    <MemoryRouter>
      <LoginButton />
    </MemoryRouter>
  );
  const loginButtonElement = screen.getByText(/Log In/i);
  expect(loginButtonElement).toBeInTheDocument();
});
