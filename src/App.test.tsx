import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import rootReducer from './slices';
import App from './App';

// Mock the route tree so ESM-only page deps (FullCalendar, Swiper…) are never loaded.
jest.mock('./Routes', () => () => <div data-testid="routes-mock" />);

const store = configureStore({ reducer: rootReducer, devTools: false });

test('renders without crashing', () => {
  render(
    <Provider store={store}>
      <MemoryRouter>
        <App />
      </MemoryRouter>
    </Provider>
  );
  // AppInitializer shows a loading spinner (role="status") before auth check completes
  expect(screen.getByRole('status')).toBeInTheDocument();
});
