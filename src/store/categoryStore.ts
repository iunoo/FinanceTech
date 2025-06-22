import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';
import { useAuthStore } from './authStore';

export interface Category {
  id: string;
  userId: string;
  name: string;
  type: 'income' | 'expense';
  color: string;
  isDefault: boolean;
}

interface CategoryState {
  categories: Category[];
  isLoading: boolean;
  error: string | null;
  addCategory: (category: Omit<Category, 'id' | 'userId' | 'isDefault'>) => Promise<string | null>;
  updateCategory: (id: string, updates: Partial<Category>) => Promise<boolean>;
  deleteCategory: (id: string) => Promise<boolean>;
  getCategoriesByType: (type: 'income' | 'expense') => Category[];
  fetchCategories: () => Promise<void>;
}

export const useCategoryStore = create<CategoryState>()(
  persist(
    (set, get) => ({
      categories: [],
      isLoading: false,
      error: null,
      
      fetchCategories: async () => {
        const currentUser = useAuthStore.getState().user;
        if (!currentUser) return;
        
        set({ isLoading: true, error: null });
        
        try {
          const { data, error } = await supabase
            .from('categories')
            .select('*')
            .eq('user_id', currentUser.id);
            
          if (error) {
            throw error;
          }
          
          // Transform data to match our interface
          const categories: Category[] = data.map(category => ({
            id: category.id,
            userId: category.user_id,
            name: category.name,
            type: category.type as 'income' | 'expense',
            color: category.color,
            isDefault: category.is_default,
          }));
          
          set({ categories, isLoading: false });
        } catch (error: any) {
          console.error('Error fetching categories:', error.message);
          set({ error: error.message, isLoading: false });
        }
      },
      
      addCategory: async (category) => {
        const currentUser = useAuthStore.getState().user;
        if (!currentUser) return null;
        
        set({ isLoading: true, error: null });
        
        try {
          const { data, error } = await supabase
            .from('categories')
            .insert([
              {
                user_id: currentUser.id,
                name: category.name,
                type: category.type,
                color: category.color,
                is_default: false,
              }
            ])
            .select()
            .single();
            
          if (error) {
            throw error;
          }
          
          const newCategory: Category = {
            id: data.id,
            userId: data.user_id,
            name: data.name,
            type: data.type as 'income' | 'expense',
            color: data.color,
            isDefault: data.is_default,
          };
          
          set(state => ({
            categories: [...state.categories, newCategory],
            isLoading: false
          }));
          
          return newCategory.id;
        } catch (error: any) {
          console.error('Error adding category:', error.message);
          set({ error: error.message, isLoading: false });
          return null;
        }
      },
      
      updateCategory: async (id, updates) => {
        const currentUser = useAuthStore.getState().user;
        if (!currentUser) return false;
        
        // Don't allow updating default categories
        const category = get().categories.find(c => c.id === id);
        if (category?.isDefault) return false;
        
        set({ isLoading: true, error: null });
        
        try {
          const { error } = await supabase
            .from('categories')
            .update({
              name: updates.name,
              type: updates.type,
              color: updates.color,
            })
            .eq('id', id)
            .eq('user_id', currentUser.id)
            .eq('is_default', false); // Extra safety check
            
          if (error) {
            throw error;
          }
          
          set(state => ({
            categories: state.categories.map(c => 
              c.id === id ? { ...c, ...updates } : c
            ),
            isLoading: false
          }));
          
          return true;
        } catch (error: any) {
          console.error('Error updating category:', error.message);
          set({ error: error.message, isLoading: false });
          return false;
        }
      },
      
      deleteCategory: async (id) => {
        const currentUser = useAuthStore.getState().user;
        if (!currentUser) return false;
        
        // Don't allow deleting default categories
        const category = get().categories.find(c => c.id === id);
        if (category?.isDefault) return false;
        
        set({ isLoading: true, error: null });
        
        try {
          const { error } = await supabase
            .from('categories')
            .delete()
            .eq('id', id)
            .eq('user_id', currentUser.id)
            .eq('is_default', false); // Extra safety check
            
          if (error) {
            throw error;
          }
          
          set(state => ({
            categories: state.categories.filter(c => c.id !== id),
            isLoading: false
          }));
          
          return true;
        } catch (error: any) {
          console.error('Error deleting category:', error.message);
          set({ error: error.message, isLoading: false });
          return false;
        }
      },
      
      getCategoriesByType: (type) => {
        const { categories } = get();
        const currentUser = useAuthStore.getState().user;
        
        return categories.filter(c => 
          c.type === type && 
          c.userId === currentUser?.id
        );
      },
    }),
    {
      name: 'category-storage',
    }
  )
);