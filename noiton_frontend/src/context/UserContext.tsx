import React, { createContext, useContext, useState } from 'react';

interface UserContextProps {
  userCpf: string | null;
  setUserCpf: (cpf: string) => void;
}

const UserContext = createContext<UserContextProps | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userCpf, setUserCpf] = useState<string | null>(null);

  return (
    <UserContext.Provider value={{ userCpf, setUserCpf }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUserContext = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUserContext must be used within a UserProvider');
  }
  return context;
};
