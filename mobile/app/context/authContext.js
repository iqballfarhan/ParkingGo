import { createContext, useState, useContext } from "react";

export const authContext = createContext(null);

export default function AuthProvider({ children }) {
  const [isSignIn, setIsSignIn] = useState(true);
  const [role, setRole] = useState(null);
  const [user, setUser] = useState(null);

  return (
    <authContext.Provider value={{ 
      isSignIn, 
      setIsSignIn, 
      role, 
      setRole, 
      user, 
      setUser 
    }}>
      {children}
    </authContext.Provider>
  );
}

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(authContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
