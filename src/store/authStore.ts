import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase, getCurrentUser, getCurrentSession } from '../lib/supabase';
import { passwordUtils, sessionUtils } from '../utils/security';
import { toast } from './toastStore';

interface User {
  id: string;
  email: string;
  name: string;
  telegramId?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  lastActivity: number;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => Promise<boolean>;
  checkSession: () => Promise<boolean>;
  updateActivity: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      lastActivity: Date.now(),
      
      login: async (email: string, password: string) => {
        try {
          // Authenticate with Supabase
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          
          if (error) {
            console.error('Login error:', error.message);
            return false;
          }
          
          if (!data.user) {
            return false;
          }
          
          // Get user profile data
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();
            
          if (profileError) {
            console.error('Profile fetch error:', profileError.message);
          }
          
          // Set user data
          const userData: User = {
            id: data.user.id,
            email: data.user.email || '',
            name: profileData?.name || data.user.email?.split('@')[0] || 'User',
            telegramId: profileData?.telegram_id,
          };
          
          set({ 
            user: userData, 
            isAuthenticated: true,
            lastActivity: Date.now()
          });
          
          return true;
        } catch (error) {
          console.error('Login error:', error);
          return false;
        }
      },
      
      register: async (name: string, email: string, password: string) => {
        try {
          // Register with Supabase
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                name,
              },
            },
          });
          
          if (error) {
            console.error('Registration error:', error.message);
            return false;
          }
          
          if (!data.user) {
            return false;
          }
          
          // Create profile record
          const { error: profileError } = await supabase
            .from('profiles')
            .insert([
              {
                id: data.user.id,
                name,
                email: data.user.email,
              },
            ]);
            
          if (profileError) {
            console.error('Profile creation error:', profileError.message);
          }
          
          // Set user data
          const userData: User = {
            id: data.user.id,
            email: data.user.email || '',
            name,
          };
          
          set({ 
            user: userData, 
            isAuthenticated: true,
            lastActivity: Date.now()
          });
          
          return true;
        } catch (error) {
          console.error('Registration error:', error);
          return false;
        }
      },
      
      logout: async () => {
        try {
          await supabase.auth.signOut();
        } catch (error) {
          console.error('Logout error:', error);
        }
        
        set({ user: null, isAuthenticated: false });
      },
      
      updateUser: async (updates: Partial<User>) => {
        const { user } = get();
        if (!user) return false;
        
        try {
          // Update auth metadata if name is being updated
          if (updates.name) {
            const { error: authError } = await supabase.auth.updateUser({
              data: { name: updates.name }
            });
            
            if (authError) {
              console.error('Auth update error:', authError.message);
              return false;
            }
          }
          
          // Update profile record
          const { error: profileError } = await supabase
            .from('profiles')
            .update({
              name: updates.name || user.name,
              telegram_id: updates.telegramId,
            })
            .eq('id', user.id);
            
          if (profileError) {
            console.error('Profile update error:', profileError.message);
            return false;
          }
          
          // Update local state
          set({ user: { ...user, ...updates } });
          return true;
        } catch (error) {
          console.error('User update error:', error);
          return false;
        }
      },
      
      checkSession: async () => {
        try {
          // Check if session is expired based on last activity
          const { lastActivity, logout } = get();
          
          if (Date.now() - lastActivity > sessionUtils.SESSION_TIMEOUT) {
            await logout();
            return false;
          }
          
          // Check if we have a valid Supabase session
          const session = await getCurrentSession();
          
          if (!session) {
            set({ user: null, isAuthenticated: false });
            return false;
          }
          
          // If we have a session but no user data, fetch it
          if (!get().user) {
            const user = await getCurrentUser();
            
            if (user) {
              // Get user profile data
              const { data: profileData } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();
                
              set({ 
                user: {
                  id: user.id,
                  email: user.email || '',
                  name: profileData?.name || user.email?.split('@')[0] || 'User',
                  telegramId: profileData?.telegram_id,
                },
                isAuthenticated: true,
                lastActivity: Date.now()
              });
            }
          }
          
          return true;
        } catch (error) {
          console.error('Session check error:', error);
          return false;
        }
      },
      
      updateActivity: () => {
        set({ lastActivity: Date.now() });
        sessionUtils.updateLastActivity();
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);