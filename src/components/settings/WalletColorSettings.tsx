import React, { useState } from 'react';
import { Palette, Save, Plus, Trash2 } from 'lucide-react';
import { useWalletColorStore } from '../../store/walletColorStore';
import { useWalletStore } from '../../store/walletStore';
import { useThemeStore } from '../../store/themeStore';
import { toast } from '../../store/toastStore';
import WalletSelectionGrid from './components/WalletSelectionGrid';
import ColorRangeEditor from './components/ColorRangeEditor';

const WalletColorSettings: React.FC = () => {
  const { colorRanges, updateWalletColorRanges } = useWalletColorStore();
  const { wallets } = useWalletStore();
  const { isDark } = useThemeStore();
  const [ranges, setRanges] = useState(colorRanges);
  const [selectedWallets, setSelectedWallets] = useState<string[]>([]);

  const handleSave = () => {
    if (selectedWallets.length === 0) {
      toast.error('Pilih minimal satu dompet untuk diterapkan');
      return;
    }
    
    updateWalletColorRanges(selectedWallets, ranges);
    toast.success(`Pengaturan warna berhasil diterapkan ke ${selectedWallets.length} dompet!`);
  };

  const updateRange = (index: number, field: string, value: any) => {
    const newRanges = [...ranges];
    newRanges[index] = { ...newRanges[index], [field]: value };
    setRanges(newRanges);
  };

  const addRange = () => {
    const newRange = {
      min: 0,
      max: 100000,
      color: '#6B7280',
      label: 'Range Baru',
      icon: 'warning',
      glowEnabled: false
    };
    setRanges([...ranges, newRange]);
  };

  const removeRange = (index: number) => {
    if (ranges.length > 1) {
      const newRanges = ranges.filter((_, i) => i !== index);
      setRanges(newRanges);
    }
  };

  return (
    <div className="glass-card p-6 rounded-lg">
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 rounded-lg bg-purple-500/10">
          <Palette className="w-6 h-6 text-purple-500" />
        </div>
        <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
          Pengaturan Warna Saldo
        </h2>
      </div>

      {/* Wallet Selection Component */}
      <WalletSelectionGrid
        wallets={wallets}
        selectedWallets={selectedWallets}
        onSelectionChange={setSelectedWallets}
      />

      {/* Color Ranges Component */}
      <ColorRangeEditor
        ranges={ranges}
        onUpdateRange={updateRange}
        onAddRange={addRange}
        onRemoveRange={removeRange}
      />

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4">
        <button
          onClick={addRange}
          className="glass-button px-6 py-3 rounded-lg hover:transform hover:scale-105 transition-all duration-200 flex items-center space-x-2"
        >
          <Plus className={`w-4 h-4 ${isDark ? 'text-white' : 'text-gray-700'}`} />
          <span className={isDark ? 'text-white' : 'text-gray-800'}>Tambah Range</span>
        </button>

        <button
          onClick={handleSave}
          disabled={selectedWallets.length === 0}
          className="flex-1 min-w-[200px] py-3 px-6 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg font-medium hover:transform hover:scale-105 transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="w-5 h-5" />
          <span>
            {selectedWallets.length === 0 
              ? 'Pilih Dompet Terlebih Dahulu' 
              : `Terapkan ke ${selectedWallets.length} Dompet`
            }
          </span>
        </button>
      </div>
    </div>
  );
};

export default WalletColorSettings;