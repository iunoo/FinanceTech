import React, { useState } from 'react';
import { Plus, Edit, Trash2, X } from 'lucide-react';
import { useCategoryStore } from '../../store/categoryStore';
import { useThemeStore } from '../../store/themeStore';
import { toast } from '../../store/toastStore';

const CategorySettings: React.FC = () => {
  const { categories, addCategory, updateCategory, deleteCategory } = useCategoryStore();
  const { isDark } = useThemeStore();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'expense' as 'income' | 'expense',
    color: '#3B82F6'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Nama kategori wajib diisi');
      return;
    }

    if (editingCategory) {
      updateCategory(editingCategory.id, formData);
      toast.success('Kategori berhasil diperbarui!');
    } else {
      addCategory(formData);
      toast.success('Kategori berhasil ditambahkan!');
    }

    resetForm();
  };

  const handleDelete = (category: any) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus kategori "${category.name}"?`)) {
      deleteCategory(category.id);
      toast.success('Kategori berhasil dihapus!');
    }
  };

  const handleEdit = (category: any) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      type: category.type,
      color: category.color
    });
    setIsFormOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'expense',
      color: '#3B82F6'
    });
    setEditingCategory(null);
    setIsFormOpen(false);
  };

  return (
    <div 
      className="p-6 rounded-lg"
      style={{
        background: isDark 
          ? 'rgba(255, 255, 255, 0.05)' 
          : 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(15px)',
        WebkitBackdropFilter: 'blur(15px)',
        border: isDark 
          ? '1px solid rgba(255, 255, 255, 0.1)' 
          : '1px solid rgba(0, 0, 0, 0.1)',
        boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
      }}
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
          Kelola Kategori
        </h2>
        <button
          onClick={() => setIsFormOpen(true)}
          className="glass-button px-4 py-2 rounded-lg hover:transform hover:scale-105 transition-all duration-200 flex items-center space-x-2"
        >
          <Plus className={`w-4 h-4 ${isDark ? 'text-white' : 'text-gray-700'}`} />
          <span className={isDark ? 'text-white' : 'text-gray-800'}>Tambah Kategori</span>
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <h3 className={`text-lg font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-800'}`}>
            Kategori Pemasukan
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {categories.filter(c => c.type === 'income').map((category) => (
              <div key={category.id} className="glass-button p-3 rounded-lg flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: category.color }}
                  />
                  <span className={isDark ? 'text-white' : 'text-gray-800'}>{category.name}</span>
                </div>
                <div className="flex space-x-1">
                  <button
                    onClick={() => handleEdit(category)}
                    className="glass-button p-1 rounded hover:transform hover:scale-110 transition-all duration-200"
                  >
                    <Edit className={`w-3 h-3 ${isDark ? 'text-white' : 'text-gray-700'}`} />
                  </button>
                  <button
                    onClick={() => handleDelete(category)}
                    className="glass-button p-1 rounded hover:transform hover:scale-110 transition-all duration-200 hover:bg-red-500/20"
                  >
                    <Trash2 className="w-3 h-3 text-red-500" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className={`text-lg font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-800'}`}>
            Kategori Pengeluaran
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {categories.filter(c => c.type === 'expense').map((category) => (
              <div key={category.id} className="glass-button p-3 rounded-lg flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: category.color }}
                  />
                  <span className={isDark ? 'text-white' : 'text-gray-800'}>{category.name}</span>
                </div>
                <div className="flex space-x-1">
                  <button
                    onClick={() => handleEdit(category)}
                    className="glass-button p-1 rounded hover:transform hover:scale-110 transition-all duration-200"
                  >
                    <Edit className={`w-3 h-3 ${isDark ? 'text-white' : 'text-gray-700'}`} />
                  </button>
                  <button
                    onClick={() => handleDelete(category)}
                    className="glass-button p-1 rounded hover:transform hover:scale-110 transition-all duration-200 hover:bg-red-500/20"
                  >
                    <Trash2 className="w-3 h-3 text-red-500" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Form Modal */}
      {isFormOpen && (
        <div 
          className="fixed inset-0 flex items-center justify-center z-50 p-4"
          style={{
            background: isDark 
              ? 'rgba(0, 0, 0, 0.8)' 
              : 'rgba(255, 255, 255, 0.3)',
            backdropFilter: 'blur(25px)',
            WebkitBackdropFilter: 'blur(25px)',
          }}
        >
          <div 
            className="p-6 rounded-lg w-full max-w-md"
            style={{
              background: isDark 
                ? 'rgba(255, 255, 255, 0.05)' 
                : 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(15px)',
              WebkitBackdropFilter: 'blur(15px)',
              border: isDark 
                ? '1px solid rgba(255, 255, 255, 0.1)' 
                : '1px solid rgba(0, 0, 0, 0.1)',
              boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
            }}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                {editingCategory ? 'Edit Kategori' : 'Tambah Kategori'}
              </h3>
              <button
                onClick={resetForm}
                className="glass-button p-2 rounded-lg hover:transform hover:scale-110 transition-all duration-200"
              >
                <X className={`w-5 h-5 ${isDark ? 'text-white' : 'text-gray-700'}`} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-700'}`}>
                  Nama Kategori
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className={`w-full p-3 glass-input ${isDark ? 'text-white placeholder-gray-300' : 'text-gray-800 placeholder-gray-500'}`}
                  placeholder="Masukkan nama kategori"
                  required
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-700'}`}>
                  Jenis Kategori
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
                  className={`w-full p-3 glass-input ${isDark ? 'text-white' : 'text-gray-800'}`}
                >
                  <option value="income">Pemasukan</option>
                  <option value="expense">Pengeluaran</option>
                </select>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-700'}`}>
                  Warna Kategori
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                    className="w-12 h-12 rounded-lg border-2 border-white/20 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData.color}
                    onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                    className={`flex-1 p-3 glass-input ${isDark ? 'text-white placeholder-gray-300' : 'text-gray-800 placeholder-gray-500'}`}
                    placeholder="#3B82F6"
                  />
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className={`flex-1 py-3 px-4 glass-button rounded-lg font-medium transition-all duration-200 hover:transform hover:scale-105 ${
                    isDark ? 'text-white' : 'text-gray-800'
                  }`}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium hover:transform hover:scale-105 transition-all duration-200"
                >
                  {editingCategory ? 'Perbarui' : 'Tambah'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategorySettings;