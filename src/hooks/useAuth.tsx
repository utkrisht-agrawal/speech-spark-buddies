import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface Profile {
  id: string;
  user_id: string;
  username: string;
  role: 'child' | 'parent' | 'therapist';
  full_name?: string;
  assessment_completed?: boolean;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  signUp: (username: string, password: string, role: 'child' | 'parent' | 'therapist', fullName?: string) => Promise<{ error: any }>;
  signIn: (username: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<{ error: any }>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        
        if (!mounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user && mounted) {
          // Fetch user profile
          setTimeout(async () => {
            if (!mounted) return;
            
            try {
              console.log('Fetching profile for user:', session.user.id);
              let { data: profileData, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('user_id', session.user.id)
                .maybeSingle();
              
              console.log('Profile fetch result:', { profileData, error });
              
              if (mounted) {
                // If no profile exists, create one immediately
                if (!profileData) {
                  console.log('No profile found, creating one...');
                  const userData = session.user.user_metadata || {};
                  console.log('Creating profile with metadata:', userData);
                  
                  const { data: newProfile, error: insertError } = await supabase
                    .from('profiles')
                    .insert({
                      user_id: session.user.id,
                      username: userData.username || session.user.email?.split('@')[0] || 'user',
                      role: (userData.role as 'child' | 'parent' | 'therapist') || 'child',
                      full_name: userData.full_name || null
                    })
                    .select()
                    .single();
                  
                  if (!insertError && newProfile) {
                    console.log('Successfully created profile:', newProfile);
                    setProfile(newProfile);
                  } else {
                    console.error('Profile creation error:', insertError);
                    // Create a minimal profile to prevent infinite loading
                    setProfile({
                      id: session.user.id,
                      user_id: session.user.id,
                      username: userData.username || session.user.email?.split('@')[0] || 'user',
                      role: (userData.role as 'child' | 'parent' | 'therapist') || 'child',
                      full_name: userData.full_name || null
                    });
                  }
                } else {
                  console.log('Profile found:', profileData);
                  setProfile(profileData);
                }
                setLoading(false);
              }
            } catch (err) {
              console.error('Profile operation failed:', err);
              if (mounted) {
                // Create fallback profile to prevent infinite loading
                const userData = session.user.user_metadata || {};
                setProfile({
                  id: session.user.id,
                  user_id: session.user.id,
                  username: userData.username || session.user.email?.split('@')[0] || 'user',
                  role: (userData.role as 'child' | 'parent' | 'therapist') || 'child',
                  full_name: userData.full_name || null
                });
                setLoading(false);
              }
            }
          }, 100);
        } else {
          setProfile(null);
          setLoading(false);
        }
      }
    );

    // Check for existing session
    const initAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Session error:', error);
        }
        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
          if (!session) {
            setLoading(false);
          }
        }
      } catch (err) {
        console.error('Auth initialization failed:', err);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (username: string, password: string, role: 'child' | 'parent' | 'therapist', fullName?: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email: `${username}@voicebuddy.app`, // Using domain for email
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          username,
          role,
          full_name: fullName
        }
      }
    });
    
    return { error };
  };

  const signIn = async (username: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: `${username}@voicebuddy.app`,
      password
    });
    
    return { error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      session,
      signUp,
      signIn,
      signOut,
      loading
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}