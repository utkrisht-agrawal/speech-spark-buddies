import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface Profile {
  id: string;
  user_id: string;
  username: string;
  role: 'child' | 'parent' | 'therapist' | 'admin';
  full_name?: string;
  assessment_completed?: boolean;
  current_level?: number;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  signUp: (username: string, password: string, role: 'child' | 'parent' | 'therapist' | 'admin', fullName?: string) => Promise<{ error: any }>;
  signIn: (username: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<{ error: any }>;
  updateAssessmentStatus: (completed: boolean, currentLevel?: number) => Promise<{ error: any }>;
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
          // Fetch user profile - wait a bit for trigger to complete
          setTimeout(async () => {
            if (!mounted) return;
            
            try {
              console.log('Fetching profile for user:', session.user.id);
              
              // Retry logic for profile fetching (in case trigger is still processing)
              let profileData = null;
              let attempts = 0;
              const maxAttempts = 5;
              
              while (!profileData && attempts < maxAttempts) {
                const { data, error } = await supabase
                  .from('profiles')
                  .select('*')
                  .eq('user_id', session.user.id)
                  .maybeSingle();
                
                if (error) {
                  console.error('Profile fetch error:', error);
                  break;
                }
                
                if (data) {
                  profileData = data;
                  console.log('Profile found:', profileData);
                  break;
                }
                
                attempts++;
                console.log(`Profile not found, attempt ${attempts}/${maxAttempts}, retrying...`);
                await new Promise(resolve => setTimeout(resolve, 500)); // Wait 500ms before retry
              }
              
              if (mounted) {
                if (profileData) {
                  setProfile(profileData);
                } else {
                  console.log('Profile still not found after retries, using fallback');
                  // Create fallback profile object (don't insert to DB as trigger should handle it)
                  const userData = session.user.user_metadata || {};
                  setProfile({
                    id: session.user.id,
                    user_id: session.user.id,
                    username: userData.username || session.user.email?.split('@')[0] || 'user',
                    role: (userData.role as 'child' | 'parent' | 'therapist' | 'admin') || 'child',
                    full_name: userData.full_name || null,
                    assessment_completed: false
                  });
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
                  role: (userData.role as 'child' | 'parent' | 'therapist' | 'admin') || 'child',
                  full_name: userData.full_name || null,
                  assessment_completed: false
                });
                setLoading(false);
              }
            }
          }, 1000); // Increased delay to allow trigger to complete
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

  const signUp = async (username: string, password: string, role: 'child' | 'parent' | 'therapist' | 'admin', fullName?: string) => {
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

  const updateAssessmentStatus = async (completed: boolean, currentLevel?: number) => {
    if (!user?.id) {
      return { error: new Error('No user logged in') };
    }

    try {
      const updates: any = {
        assessment_completed: completed
      };
      
      if (currentLevel) {
        updates.current_level = currentLevel;
      }

      console.log('🔄 Updating assessment status:', { userId: user.id, updates });

      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single();

      console.log('📊 Assessment update result:', { data, error });

      if (!error && data) {
        // Update local profile state
        setProfile(prev => prev ? { ...prev, ...updates } : null);
        console.log('✅ Assessment status updated successfully:', data);
      }

      return { error };
    } catch (err) {
      console.error('❌ Error updating assessment status:', err);
      return { error: err };
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      session,
      signUp,
      signIn,
      signOut,
      updateAssessmentStatus,
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