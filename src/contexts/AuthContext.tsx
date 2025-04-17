
import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";

type User = {
  id: string;
  username: string;
  is_admin?: boolean;
  avatar_url?: string | null;
  email?: string | null;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (username: string) => Promise<void>;
  signup: (username: string) => Promise<void>;
  logout: () => Promise<void>;
  loginWithGoogle: (isSignup?: boolean) => Promise<void>;
  updateUsername: (newUsername: string) => Promise<boolean>;
  checkUsernameExists: (username: string) => Promise<boolean>;
  signInWithIdToken: (token: string, isSignup?: boolean) => Promise<{success: boolean; error?: string}>;
  checkIfUserExists: (email: string) => Promise<boolean>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const PLACEHOLDER_IMAGES = [
  'photo-1488590528505-98d2b5aba04b',
  'photo-1518770660439-4636190af475',
  'photo-1461749280684-dccba630e2f6',
  'photo-1486312338219-ce68d2c6f44d',
  'photo-1581091226825-a6a2a5aee1b5',
  'photo-1485827404703-0ad4aaf24ca7',
  'photo-1526374965328-7f61d4dc18c5',
  'photo-1531297484001-80022131f5a1',
  'photo-1487058792275-04dcbce3278c',
  'photo-1605810230434-7631ac76ec81',
  'photo-1473091534202-14dd9538aa97',
  'photo-1519389950473-47ba0277781c',
  'photo-1460925895917-afdab827c52f',
  'photo-1581090464777-f3220bbe1b8b',
  'photo-1498050108023-c5249f4df085',
  'photo-1434494878577-86c23bcb06b9',
  'photo-1534972195531-d756b9bfa9f2',
  'photo-1536148935331-408321065b18',
  'photo-1555099962-4199820d5349',
  'photo-1517694712202-14dd9538aa97'
];

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Error parsing stored user:', error);
      }
    }
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth state changed:", event, session?.user?.email);
        
        if (session?.user) {
          try {
            const { data: existingUser, error: fetchError } = await supabase
              .from('users')
              .select('*')
              .eq('id', session.user.id)
              .single();

            if (existingUser) {
              console.log("User found in database:", existingUser);
              setUser(existingUser);
              localStorage.setItem('user', JSON.stringify(existingUser));
            } else {
              console.log("No user found in database despite successful auth");
            }
          } catch (error) {
            console.error('Error fetching user data after auth:', error);
          } finally {
            setLoading(false);
          }
        } else if (event === 'SIGNED_OUT') {
          console.log("User signed out");
          setUser(null);
          localStorage.removeItem('user');
          setLoading(false);
        } else {
          setLoading(false);
        }
      }
    );

    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setLoading(false);
      }
    };
    
    checkSession();
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (username: string) => {
    try {
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
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
      const avatarUrl = `https://images.unsplash.com/photo-${
        PLACEHOLDER_IMAGES[Math.floor(Math.random() * PLACEHOLDER_IMAGES.length)]
      }?w=150&h=150&fit=crop`;

      const { data: user, error } = await supabase
        .from('users')
        .insert([{ 
          username: username.toLowerCase(),
          avatar_url: avatarUrl
        }])
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

  const checkIfUserExists = async (email: string): Promise<boolean> => {
    try {
      // If we have admin access, use the admin API
      const { data, error } = await supabase.auth.admin.listUsers();
      
      if (error) {
        console.log("Using fallback method to check if user exists");
        // Fallback: try to sign in without creating a user
        const { error: signInError } = await supabase.auth.signInWithOtp({
          email,
          options: {
            shouldCreateUser: false,
          },
        });
        
        return !signInError || !signInError.message.includes("User not found");
      }
      
      if (data && data.users) {
        // Properly type the users array
        return data.users.some((user: { email?: string }) => user.email === email);
      }
      
      return false;
    } catch (error) {
      console.error("Error checking if user exists:", error);
      return false;
    }
  };

  const loginWithGoogle = async (isSignup?: boolean) => {
    try {
      // Get the current origin for redirections
      const origin = window.location.origin;
      const redirectUrl = `${origin}/dashboard`;
      console.log(`Initiating Google login with redirect to: ${redirectUrl}`);
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent'
          }
        }
      });
      
      if (error) {
        console.error("Error initiating Google OAuth:", error);
        throw error;
      }
      
      console.log("Google OAuth initiated:", data);
      
    } catch (error) {
      console.error('Error with Google authentication:', error);
      throw error;
    }
  };
  
  const signInWithIdToken = async (token: string, isSignup?: boolean): Promise<{success: boolean; error?: string}> => {
    try {
      const tokenParts = token.split('.');
      if (tokenParts.length === 3) {
        try {
          // Define a proper interface for the Google JWT payload
          interface GoogleJWTPayload {
            email?: string;
            name?: string;
            picture?: string;
            [key: string]: any; // Allow for other properties
          }
          
          const payload = JSON.parse(atob(tokenParts[1])) as GoogleJWTPayload;
          
          if (payload.email) {
            const userExists = await checkIfUserExists(payload.email);
            
            if (isSignup && userExists) {
              return { 
                success: false, 
                error: "Account already exists. Please use the login option instead." 
              };
            }
            
            if (!isSignup && !userExists) {
              return { 
                success: false, 
                error: "Account doesn't exist. Please sign up first." 
              };
            }
          }
        } catch (e) {
          console.error("Error parsing token:", e);
        }
      }
      
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token,
      });
      
      if (error) throw error;
      
      console.log("Google ID token authentication successful:", data);
      return { success: true };
    } catch (error: any) {
      console.error('Error signing in with ID token:', error);
      return { 
        success: false, 
        error: error.message || "Authentication failed" 
      };
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      
      setUser(null);
      localStorage.removeItem('user');
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  const updateUsername = async (newUsername: string) => {
    try {
      if (!user) throw new Error("User not logged in");
      
      const { error } = await supabase
        .from('users')
        .update({ username: newUsername.toLowerCase() })
        .eq('id', user.id);

      if (error) throw error;
      
      const updatedUser = { ...user, username: newUsername.toLowerCase() };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      return true;
    } catch (error) {
      console.error('Error updating username:', error);
      return false;
    }
  };

  const checkUsernameExists = async (username: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('username')
        .eq('username', username.toLowerCase())
        .single();
      
      return !!data;
    } catch (error) {
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      login, 
      signup, 
      logout, 
      loginWithGoogle,
      signInWithIdToken,
      updateUsername, 
      checkUsernameExists,
      checkIfUserExists 
    }}>
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
