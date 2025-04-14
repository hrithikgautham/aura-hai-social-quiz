
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
    checkUser();
  }, []);

  async function checkUser() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      
      if (session?.user) {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id, username')
          .eq('id', session.user.id)
          .single();

        if (userError) throw userError;
        setUser(userData);
      }
    } catch (error) {
      console.error('Error checking user:', error);
    } finally {
      setLoading(false);
    }
  }

  const login = async (username: string) => {
    try {
      const { data: user, error } = await supabase
        .from('users')
        .select()
        .eq('username', username.toLowerCase())
        .single();

      if (error) throw error;

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: `${username.toLowerCase()}@aurahai.com`,
        password: username.toLowerCase(),
      });

      if (signInError) throw signInError;

      setUser(user);
    } catch (error) {
      console.error('Error logging in:', error);
      throw error;
    }
  };

  const signup = async (username: string) => {
    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email: `${username.toLowerCase()}@aurahai.com`,
        password: username.toLowerCase(),
      });

      if (signUpError) throw signUpError;

      const { data: user, error: insertError } = await supabase
        .from('users')
        .insert([{ username: username.toLowerCase() }])
        .select()
        .single();

      if (insertError) throw insertError;

      setUser(user);
    } catch (error) {
      console.error('Error signing up:', error);
      throw error;
    }
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setUser(null);
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
