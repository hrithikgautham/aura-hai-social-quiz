
import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";

type AuthContextType = {
  user: { id: string; username: string } | null;
  loading: boolean;
  login: (username: string) => Promise<void>;
  signup: (username: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<{ id: string; username: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for user in localStorage on initial load
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Error parsing stored user:', error);
      }
    }
    setLoading(false);
  }, []);

  const login = async (username: string) => {
    try {
      const { data: user, error } = await supabase
        .from('users')
        .select()
        .eq('username', username.toLowerCase())
        .single();

      if (error) throw error;

      setUser(user);
      localStorage.setItem('user', JSON.stringify(user));
    } catch (error) {
      console.error('Error logging in:', error);
      throw error;
    }
  };

  const signup = async (username: string) => {
    try {
      const { data: user, error } = await supabase
        .from('users')
        .insert([{ username: username.toLowerCase() }])
        .select()
        .single();

      if (error) throw error;

      setUser(user);
      localStorage.setItem('user', JSON.stringify(user));
    } catch (error) {
      console.error('Error signing up:', error);
      throw error;
    }
  };

  const logout = async () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
