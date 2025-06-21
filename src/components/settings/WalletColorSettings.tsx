import React, { useState } from 'react';
import { Palette, Save, Plus, Trash2, Eye, Settings } from 'lucide-react';
import { useWalletColorStore } from '../../store/walletColorStore';
import { useWalletStore } from '../../store/walletStore';
import { useThemeStore } from '../../store/themeStore';
import { toast } from '../../store/toastStore';

const WalletColorSettings: React.FC = () => {
  const { colorRanges, updateWalletColorRanges, updateColorRanges } = useWalletColorStore();
  const { wallets } = useWalletStore();
  const { isDark } = useThemeStore();
  const [ranges, setRanges] = useState(colorRanges);
  const [selectedWallets, setSelectedWallets] = useState<string[]>([]);
  const [previewBalance, setPreviewBalance] = useState(500000);

  const handleSave = () => {
    if (selectedWallets.length === 0) {
      // Update global settings if no wallets selected
      updateColorRanges(ranges);
      toast.success('Pengaturan warna global berhasil disimpan!');
    } else {
      // Update specific wallets
      updateWalletColorRanges(selectedWallets, ranges);
      toast.success(`Pengaturan warna berhasil diterapkan ke ${selectedWallets.length} dompet!`);
    }
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

  const toggleWalletSelection = (walletId: string) => {
    const newSelection = selectedWallets.includes(walletId) 
      ? selectedWallets.filter(id => id !== walletId)
      : [...selectedWallets, walletId];
    setSelectedWallets(newSelection);
  };

  const selectAllWallets = () => {
    setSelectedWallets(wallets.map(w => w.id));
  };

  const clearWalletSelection = () => {
    setSelectedWallets([]);
  };

  // Get color for preview balance
  const getPreviewColor = () => {
    const range = ranges.find(r => previewBalance >= r.min && previewBalance <= r.max);
    return range?.color || '#6B7280';
  };

  const getPreviewGlow = () => {
    const range = ranges.find(r => previewBalance >= r.min && previewBalance <= r.max);
    return range?.glowEnabled || false;
  };

  // Enhanced Toggle Switch Component
  const ToggleSwitch: React.FC<{ 
    checked: boolean; 
    onChange: (checked: boolean) => void;
    label: string;
  }> = ({ checked, onChange, label }) => (
    <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
      <div className="flex items-center space-x-3">
        <span className="text-lg">✨</span>
        <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>
          {label}
        </span>
      </div>
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only peer"
        />
        <div className={`
          relative w-14 h-7 rounded-full transition-all duration-300 ease-in-out
          ${checked 
            ? 'bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg shadow-purple-500/30' 
            : isDark ? 'bg-gray-600' : 'bg-gray-300'
          }
          peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300/20
        `}>
          <div className={`
            absolute top-0.5 left-0.5 bg-white rounded-full h-6 w-6 transition-all duration-300 ease-in-out
            transform ${checked ? 'translate-x-7' : 'translate-x-0'}
            shadow-md
          `}>
            <div className={`
              w-full h-full rounded-full flex items-center justify-center text-xs
              ${checked ? 'text-purple-500' : 'text-gray-400'}
            `}>
              {checked ? '✓' : '○'}
            </div>
          </div>
        </div>
      </label>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="glass-card p-6 rounded-lg">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-3 rounded-xl bg-purple-500/10">
            <Palette className="w-8 h-8 text-purple-500" />
          </div>
          <div>
            <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
              Pengaturan Warna Saldo
            </h2>
            <p className={`text-sm opacity-70 ${isDark ? 'text-white' : 'text-gray-600'}`}>
              Atur warna saldo dan efek glowing pada kotak dompet
            </p>
          </div>
        </div>

        {/* Live Preview */}
        <div className="mt-6 p-6 rounded-xl border-2 border-dashed border-purple-500/30 bg-purple-500/5">
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
              🎨 Live Preview
            </h3>
            <div className="flex items-center space-x-3">
              <label className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-700'}`}>
                Test Saldo:
              </label>
              <input
                type="number"
                value={previewBalance}
                onChange={(e) => setPreviewBalance(Number(e.target.value))}
                className={`w-32 px-3 py-2 glass-input text-sm ${isDark ? 'text-white' : 'text-gray-800'}`}
                placeholder="500000"
              />
            </div>
          </div>
          
          {/* Preview Wallet Card */}
          <div className="flex justify-center">
            <div 
              className={`
                p-6 rounded-xl border-2 transition-all duration-300 w-48 text-center
                ${getPreviewGlow() ? 'animate-pulse' : ''}
              `}
              style={{
                background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.95)',
                borderColor: getPreviewColor(),
                boxShadow: getPreviewGlow() 
                  ? `0 0 20px ${getPreviewColor()}, 0 0 40px ${getPreviewColor()}20` 
                  : '0 4px 12px rgba(0, 0, 0, 0.1)'
              }}
            >
              <div className="flex justify-center mb-3">
                <div className={`p-2 rounded-lg ${isDark ? 'bg-white/10' : 'bg-gray-100'}`}>
                  <Settings className={`w-6 h-6 ${isDark ? 'text-white' : 'text-gray-700'}`} />
                </div>
              </div>
              <div className={`text-lg font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                Preview Dompet
              </div>
              <p 
                className="text-sm font-bold"
                style={{ color: getPreviewColor() }}
              >
                Rp {previewBalance.toLocaleString('id-ID')}
              </p>
              <p className={`text-xs mt-2 opacity-60 ${isDark ? 'text-white' : 'text-gray-600'}`}>
                {ranges.find(r => previewBalance >= r.min && previewBalance <= r.max)?.label || 'Tidak ada range yang cocok'}
              </p>
              {getPreviewGlow() && (
                <p className="text-xs mt-1 text-purple-500 font-bold animate-pulse">
                  ✨ Efek Glowing Aktif
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Wallet Selection */}
      <div className="glass-card p-6 rounded-lg">
        <h3 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>
          🎯 Target Dompet
        </h3>
        
        <div className="flex flex-wrap gap-3 mb-4">
          <button
            onClick={selectAllWallets}
            className="glass-button px-4 py-2 rounded-lg hover:transform hover:scale-105 transition-all duration-200 text-sm"
          >
            <span className={isDark ? 'text-white' : 'text-gray-800'}>Pilih Semua</span>
          </button>
          <button
            onClick={clearWalletSelection}
            className="glass-button px-4 py-2 rounded-lg hover:transform hover:scale-105 transition-all duration-200 text-sm"
          >
            <span className={isDark ? 'text-white' : 'text-gray-800'}>Hapus Pilihan</span>
          </button>
          <div className="px-4 py-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <span className="text-blue-500 text-sm font-medium">
              {selectedWallets.length === 0 ? 'Global (Semua Dompet)' : `${selectedWallets.length} dompet dipilih`}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {wallets.map((wallet) => (
            <label 
              key={wallet.id} 
              className={`flex items-center space-x-2 p-3 rounded-lg cursor-pointer transition-all hover:scale-105 ${
                selectedWallets.includes(wallet.id) 
                  ? 'bg-blue-500/20 border-2 border-blue-500' 
                  : 'glass-button border-2 border-transparent'
              }`}
            >
              <input
                type="checkbox"
                checked={selectedWallets.includes(wallet.id)}
                onChange={() => toggleWalletSelection(wallet.id)}
                className="w-4 h-4 text-blue-600 bg-transparent border-2 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
              />
              <span className={`text-sm font-medium truncate ${isDark ? 'text-white' : 'text-gray-800'}`}>
                {wallet.name}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Color Ranges */}
      <div className="glass-card p-6 rounded-lg">
        <div className="flex items-center justify-between mb-6">
          <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
            🌈 Aturan Warna Saldo
          </h3>
          <button
            onClick={addRange}
            className="glass-button px-4 py-2 rounded-lg hover:transform hover:scale-105 transition-all duration-200 flex items-center space-x-2"
          >
            <Plus className={`w-4 h-4 ${isDark ? 'text-white' : 'text-gray-700'}`} />
            <span className={`text-sm ${isDark ? 'text-white' : 'text-gray-800'}`}>Tambah Range</span>
          </button>
        </div>
        
        <div className="space-y-6">
          {ranges.map((range, index) => (
            <div key={index} className="p-6 rounded-xl border-2 border-white/10 bg-white/5">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end">
                {/* Min Amount */}
                <div className="lg:col-span-2">
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-700'}`}>
                    Dari (Rp)
                  </label>
                  <input
                    type="number"
                    value={range.min === -Infinity ? '' : range.min}
                    onChange={(e) => updateRange(index, 'min', e.target.value === '' ? -Infinity : Number(e.target.value))}
                    className={`w-full p-3 glass-input text-sm ${isDark ? 'text-white' : 'text-gray-800'}`}
                    placeholder="Min"
                  />
                </div>

                {/* Max Amount */}
                <div className="lg:col-span-2">
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-700'}`}>
                    Sampai (Rp)
                  </label>
                  <input
                    type="number"
                    value={range.max === Infinity ? '' : range.max}
                    onChange={(e) => updateRange(index, 'max', e.target.value === '' ? Infinity : Number(e.target.value))}
                    className={`w-full p-3 glass-input text-sm ${isDark ? 'text-white' : 'text-gray-800'}`}
                    placeholder="Max"
                  />
                </div>

                {/* Color Picker */}
                <div className="lg:col-span-3">
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-700'}`}>
                    Warna
                  </label>
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <input
                        type="color"
                        value={range.color}
                        onChange={(e) => updateRange(index, 'color', e.target.value)}
                        className="w-12 h-12 rounded-xl border-2 border-white/20 cursor-pointer bg-transparent"
                        style={{ backgroundColor: range.color }}
                      />
                      <div 
                        className="absolute inset-0 rounded-xl border-2 border-white/20 pointer-events-none"
                        style={{ backgroundColor: range.color }}
                      />
                    </div>
                    <input
                      type="text"
                      value={range.color}
                      onChange={(e) => updateRange(index, 'color', e.target.value)}
                      className={`flex-1 p-3 glass-input text-sm ${isDark ? 'text-white' : 'text-gray-800'}`}
                      placeholder="#3B82F6"
                    />
                  </div>
                </div>

                {/* Label */}
                <div className="lg:col-span-3">
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-700'}`}>
                    Label
                  </label>
                  <input
                    type="text"
                    value={range.label}
                    onChange={(e) => updateRange(index, 'label', e.target.value)}
                    className={`w-full p-3 glass-input text-sm ${isDark ? 'text-white' : 'text-gray-800'}`}
                    placeholder="Contoh: Saldo Rendah"
                  />
                </div>

                {/* Icon Selection */}
                <div className="lg:col-span-1">
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-700'}`}>
                    Icon
                  </label>
                  <select
                    value={range.icon || 'warning'}
                    onChange={(e) => updateRange(index, 'icon', e.target.value)}
                    className={`w-full p-3 glass-input text-sm ${isDark ? 'text-white' : 'text-gray-800'}`}
                  >
                    <option value="warning" className={isDark ? 'bg-black' : 'bg-white'}>⚠️</option>
                    <option value="check" className={isDark ? 'bg-black' : 'bg-white'}>✅</option>
                    <option value="x" className={isDark ? 'bg-black' : 'bg-white'}>❌</option>
                    <option value="fire" className={isDark ? 'bg-black' : 'bg-white'}>🔥</option>
                    <option value="star" className={isDark ? 'bg-black' : 'bg-white'}>⭐</option>
                  </select>
                </div>

                {/* Delete Button */}
                <div className="lg:col-span-1 flex justify-center">
                  <button
                    onClick={() => removeRange(index)}
                    disabled={ranges.length <= 1}
                    className="glass-button p-3 rounded-lg hover:transform hover:scale-110 transition-all duration-200 hover:bg-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Hapus Range"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </div>

              {/* Enhanced Glow Effect Toggle */}
              <div className="mt-6">
                <ToggleSwitch
                  checked={range.glowEnabled || false}
                  onChange={(checked) => updateRange(index, 'glowEnabled', checked)}
                  label="Aktifkan efek glowing pada kotak dompet untuk range ini"
                />
              </div>

              {/* Range Preview */}
              <div className="mt-4 p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>
                    Preview: {range.label}
                  </span>
                  <div className="flex items-center space-x-3">
                    <div 
                      className={`
                        px-4 py-2 rounded-lg border-2 transition-all duration-300
                        ${range.glowEnabled ? 'animate-pulse' : ''}
                      `}
                      style={{
                        borderColor: range.color,
                        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.95)',
                        boxShadow: range.glowEnabled 
                          ? `0 0 15px ${range.color}` 
                          : '0 2px 8px rgba(0, 0, 0, 0.1)'
                      }}
                    >
                      <span 
                        className="text-sm font-bold"
                        style={{ color: range.color }}
                      >
                        Rp 150.000
                      </span>
                    </div>
                    <span className="text-lg">
                      {range.icon === 'warning' && '⚠️'}
                      {range.icon === 'check' && '✅'}
                      {range.icon === 'x' && '❌'}
                      {range.icon === 'fire' && '🔥'}
                      {range.icon === 'star' && '⭐'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Save Button */}
      <div className="glass-card p-6 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
              💾 Simpan Pengaturan
            </h3>
            <p className={`text-sm opacity-70 ${isDark ? 'text-white' : 'text-gray-600'}`}>
              {selectedWallets.length === 0 
                ? 'Akan diterapkan ke semua dompet sebagai pengaturan global'
                : `Akan diterapkan ke ${selectedWallets.length} dompet yang dipilih`
              }
            </p>
          </div>
          <button
            onClick={handleSave}
            className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl font-bold text-lg hover:transform hover:scale-105 transition-all duration-200 flex items-center space-x-3"
          >
            <Save className="w-6 h-6" />
            <span>
              {selectedWallets.length === 0 
                ? 'Simpan Global' 
                : `Terapkan ke ${selectedWallets.length} Dompet`
              }
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default WalletColorSettings;