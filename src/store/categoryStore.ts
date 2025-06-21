import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  color: string;
  isDefault: boolean;
}

interface CategoryState {
  categories: Category[];
  addCategory: (category: Omit<Category, 'id' | 'isDefault'>) => void;
  updateCategory: (id: string, updates: Partial<Category>) => void;
  deleteCategory: (id: string) => void;
  getCategoriesByType: (type: 'income' | 'expense') => Category[];
}

const defaultCategories: Category[] = [
  // Income categories
  { id: '1', name: 'Gaji', type: 'income', color: '#10B981', isDefault: true },
  { id: '2', name: 'Freelance', type: 'income', color: '#3B82F6', isDefault: true },
  { id: '3', name: 'Investasi', type: 'income', color: '#8B5CF6', isDefault: true },
  { id: '4', name: 'Bisnis', type: 'income', color: '#F59E0B', isDefault: true },
  { id: '5', name: 'Bonus', type: 'income', color: '#EF4444', isDefault: true },
  { id: '6', name: 'Hadiah', type: 'income', color: '#EC4899', isDefault: true },
  { id: '7', name: 'Penjualan', type: 'income', color: '#06B6D4', isDefault: true },
  { id: '8', name: 'Lainnya', type: 'income', color: '#6B7280', isDefault: true },
  
  // Expense categories
  { id: '9', name: 'Makanan & Minuman', type: 'expense', color: '#EF4444', isDefault: true },
  { id: '10', name: 'Transportasi', type: 'expense', color: '#3B82F6', isDefault: true },
  { id: '11', name: 'Hiburan', type: 'expense', color: '#8B5CF6', isDefault: true },
  { id: '12', name: 'Belanja', type: 'expense', color: '#EC4899', isDefault: true },
  { id: '13', name: 'Tagihan', type: 'expense', color: '#F59E0B', isDefault: true },
  { id: '14', name: 'Kesehatan', type: 'expense', color: '#10B981', isDefault: true },
  { id: '15', name: 'Pendidikan', type: 'expense', color: '#06B6D4', isDefault: true },
  { id: '16', name: 'Rumah Tangga', type: 'expense', color: '#84CC16', isDefault: true },
  { id: '17', name: 'Pakaian', type: 'expense', color: '#F97316', isDefault: true },
  { id: '18', name: 'Teknologi', type: 'expense', color: '#6366F1', isDefault: true },
  { id: '19', name: 'Olahraga', type: 'expense', color: '#14B8A6', isDefault: true },
  { id: '20', name: 'Lainnya', type: 'expense', color: '#6B7280', isDefault: true },
];

export const useCategoryStore = create<CategoryState>()(
  persist(
    (set, get) => ({
      categories: defaultCategories,
      
      addCategory: (category) => {
        const newCategory: Category = {
          ...category,
          id: Date.now().toString(),
          isDefault: false,
        };
        set((state) => ({
          categories: [...state.categories, newCategory],
        }));
      },
      
      updateCategory: (id, updates) => {
        set((state) => ({
          categories: state.categories.map((c) =>
            c.id === id ? { ...c, ...updates } : c
          ),
        }));
      },
      
      deleteCategory: (id) => {
        const { categories } = get();
        const category = categories.find(c => c.id === id);
        if (category?.isDefault) {
          return; // Cannot delete default categories
        }
        set((state) => ({
          categories: state.categories.filter((c) => c.id !== id),
        }));
      },
      
      getCategoriesByType: (type) => {
        const { categories } = get();
        return categories.filter(c => c.type === type);
      },
    }),
    {
      name: 'category-storage',
    }
  )
);