import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { passwordUtils, encryptionUtils, sessionUtils } from '../utils/security';

interface User {
  id: string;
  email: string;
  name: string;
  telegramId?: string;
}

interface UserCredential {
  email: string;
  password: string; // This will be hashed
  userId: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  users: User[];
  credentials: UserCredential[];
  lastActivity: number;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  checkSession: () => boolean;
  updateActivity: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      users: [],
      credentials: [],
      lastActivity: Date.now(),
      
      login: async (email: string, password: string) => {
        try {
          // Simulate API call
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Find user credentials
          const { credentials } = get();
          const userCred = credentials.find(
            cred => cred.email.toLowerCase() === email.toLowerCase()
          );
          
          if (!userCred) {
            return false;
          }
          
          // Verify password with bcrypt
          const isPasswordValid = await passwordUtils.comparePassword(password, userCred.password);
          
          if (!isPasswordValid) {
            return false;
          }
          
          // Find user data
          const { users } = get();
          const user = users.find(u => u.id === userCred.userId);
          
          if (!user) {
            return false;
          }
          
          set({ 
            user, 
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
          // Simulate API call
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Check if user already exists
          const { credentials } = get();
          const existingUser = credentials.find(
            cred => cred.email.toLowerCase() === email.toLowerCase()
          );
          
          if (existingUser) {
            return false;
          }
          
          // Create new user ID
          const userId = Date.now().toString();
          
          // Hash password
          const hashedPassword = await passwordUtils.hashPassword(password);
          
          // Create user
          const user: User = {
            id: userId,
            email,
            name,
          };
          
          // Create credentials with hashed password
          const userCred: UserCredential = {
            email,
            password: hashedPassword,
            userId
          };
          
          // Update state
          set(state => ({
            user,
            isAuthenticated: true,
            lastActivity: Date.now(),
            users: [...state.users, user],
            credentials: [...state.credentials, userCred]
          }));
          
          return true;
        } catch (error) {
          console.error('Registration error:', error);
          return false;
        }
      },
      
      logout: () => {
        set({ user: null, isAuthenticated: false });
      },
      
      updateUser: (updates: Partial<User>) => {
        const { user, users } = get();
        if (user) {
          const updatedUser = { ...user, ...updates };
          
          set({ 
            user: updatedUser,
            users: users.map(u => u.id === user.id ? updatedUser : u)
          });
        }
      },
      
      checkSession: () => {
        const { lastActivity, logout } = get();
        
        if (Date.now() - lastActivity > sessionUtils.SESSION_TIMEOUT) {
          logout();
          return false;
        }
        
        return true;
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