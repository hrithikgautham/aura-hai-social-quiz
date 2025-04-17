
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
  loginWithGoogle: (isSignup?: boolean, redirectDomain?: string, redirectPath?: string) => Promise<void>;
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
  const [authFinalized, setAuthFinalized] = useState(false);

  useEffect(() => {
    // First, check for stored user to show something immediately
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
        // Don't set loading to false here - we still need to verify with Supabase
      } catch (error) {
        console.error('Error parsing stored user:', error);
      }
    }
    
    // Set up the auth state change listener
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
              setLoading(false);
              setAuthFinalized(true);
            } else {
              console.log("No user found in database, creating new user");
              
              const avatarUrl = session.user.user_metadata.avatar_url || 
                              session.user.user_metadata.picture ||
                              `https://images.unsplash.com/photo-${
                                PLACEHOLDER_IMAGES[Math.floor(Math.random() * PLACEHOLDER_IMAGES.length)]
                              }?w=150&h=150&fit=crop`;
              
              const username = session.user.user_metadata.full_name?.toLowerCase().replace(/\s+/g, '_') || 
                            session.user.email?.split('@')[0] || 
                            `user_${Math.random().toString(36).substring(2, 10)}`;
              
              const { data: newUser, error: insertError } = await supabase
                .from('users')
                .insert([{ 
                  id: session.user.id,
                  username: username,
                  avatar_url: avatarUrl,
                  email: session.user.email
                }])
                .select()
                .single();
              
              if (insertError) {
                console.error("Failed to create user record:", insertError);
                setLoading(false);
                setAuthFinalized(true);
              } else if (newUser) {
                console.log("Created new user:", newUser);
                setUser(newUser);
                localStorage.setItem('user', JSON.stringify(newUser));
                setLoading(false);
                setAuthFinalized(true);
              }
            }
          } catch (error) {
            console.error('Error handling user data after auth:', error);
            setLoading(false);
            setAuthFinalized(true);
          }
        } else if (event === 'SIGNED_OUT') {
          console.log("User signed out");
          setUser(null);
          localStorage.removeItem('user');
          setLoading(false);
          setAuthFinalized(true);
        } else {
          console.log("Other auth event, setting loading to false:", event);
          // For any other auth event, finish loading but don't clear the user
          // if we already have one in state or localStorage
          setLoading(false);
          setAuthFinalized(true);
        }
      }
    );

    // Then check the current session
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        console.log("Initial session check:", session);
        
        if (!session) {
          // No active session found, set loading to false
          setLoading(false);
          setAuthFinalized(true);
        }
        // If session exists, wait for onAuthStateChange to handle it
      } catch (error) {
        console.error("Error checking session:", error);
        setLoading(false);
        setAuthFinalized(true);
      }
    };
    
    checkSession();
    
    // Timeout as a failsafe
    const timeoutId = setTimeout(() => {
      if (loading) {
        console.log("Auth loading timed out after 5 seconds, forcing state update");
        setLoading(false);
        setAuthFinalized(true);
      }
    }, 5000); // Reduced from 10s to 5s to improve user experience
    
    return () => {
      subscription.unsubscribe();
      clearTimeout(timeoutId);
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
      const { data, error } = await supabase.auth.admin.listUsers();
      
      if (error) {
        console.log("Using fallback method to check if user exists");
        const { error: signInError } = await supabase.auth.signInWithOtp({
          email,
          options: {
            shouldCreateUser: false,
          },
        });
        
        return !signInError || !signInError.message.includes("User not found");
      }
      
      if (data && data.users) {
        return data.users.some((user: { email?: string }) => user.email === email);
      }
      
      return false;
    } catch (error) {
      console.error("Error checking if user exists:", error);
      return false;
    }
  };

  const loginWithGoogle = async (isSignup?: boolean, redirectDomain?: string, redirectPath?: string) => {
    try {
      const baseUrl = redirectDomain || window.location.origin;
      const redirectUrl = `${baseUrl}${redirectPath || '/dashboard'}`;
      
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
          interface GoogleJWTPayload {
            email?: string;
            name?: string;
            picture?: string;
            [key: string]: any;
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
      {authFinalized ? children : (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-r from-[#FFA99F] to-[#FF719A]">
          <div className="bg-white p-8 rounded-2xl shadow-lg">
            <div className="flex items-center space-x-4">
              <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#FF719A] to-[#FFA99F]">
                Initializing...
              </h2>
            </div>
            <div className="mt-4 flex justify-center">
              <div className="w-16 h-16 border-4 border-[#FF719A] border-t-transparent rounded-full animate-spin" />
            </div>
          </div>
        </div>
      )}
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
