import React from 'react';
import { UserProvider } from '@/context/UserContext'; // Importa o UserProvider
import { LanguageProvider } from '@/context/LanguageContext'; // Importa o LanguageProvider
import AppRoutes from '@/routes/Route';

export default function App() {
  return (
    <UserProvider>
      <LanguageProvider>
        <AppRoutes />
      </LanguageProvider>
    </UserProvider>
  );
}
