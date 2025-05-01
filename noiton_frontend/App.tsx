import React from 'react';
import { UserProvider } from '@/context/UserContext'; // Importa o UserProvider
import AppRoutes from '@/routes/Route';

export default function App() {
  return (
    <UserProvider>
      <AppRoutes />
    </UserProvider>
  );
}
