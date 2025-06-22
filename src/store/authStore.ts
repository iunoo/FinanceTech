import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  name: string;
  telegramId?: string;
}

interface UserCredential {
  email: string;
  password: string;
  userId: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  users: User[];
  credentials: UserCredential[];
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      users: [],
      credentials: [],
      
      login: async (email: string, password: string) => {
        try {
          // Simulate API call
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Find user credentials
          const { credentials } = get();
          const userCred = credentials.find(
            cred => cred.email.toLowerCase() === email.toLowerCase() && cred.password === password
          );
          
          if (!userCred) {
            return false;
          }
          
          // Find user data
          const { users } = get();
          const user = users.find(u => u.id === userCred.userId);
          
          if (!user) {
            return false;
          }
          
          set({ user, isAuthenticated: true });
          return true;
        } catch (error) {
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
          
          // Create user
          const user: User = {
            id: userId,
            email,
            name,
          };
          
          // Create credentials
          const userCred: UserCredential = {
            email,
            password,
            userId
          };
          
          // Update state
          set(state => ({
            user,
            isAuthenticated: true,
            users: [...state.users, user],
            credentials: [...state.credentials, userCred]
          }));
          
          return true;
        } catch (error) {
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
    }),
    {
      name: 'auth-storage',
    }
  )
);