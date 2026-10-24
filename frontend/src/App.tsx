import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './app/routes';
import { AppProviders } from './app/providers';

export const App: React.FC = () => {
  return (
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  );
};

export default App;
