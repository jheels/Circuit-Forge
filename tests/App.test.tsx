import React from 'react';
import { render, screen } from '@testing-library/react';
import App from '../src/App';

test('renders hello world', () => {
  render(<App />);
  const linkElement = screen.getByText(/jheels/i);
  expect(linkElement).toBeInTheDocument();
});