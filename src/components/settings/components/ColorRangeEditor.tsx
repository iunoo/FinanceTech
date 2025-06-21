import React from 'react';
import { Trash2 } from 'lucide-react';
import { useThemeStore } from '../../../store/themeStore';

interface ColorRangeEditorProps {
  ranges: any[];
  onUpdateRange: (index: number, field: string, value: any) => void;
  onAddRange: () => void;
  onRemoveRange: (index: number) => void;
}

const ColorRangeEditor: React.FC<ColorRangeEditorProps> = ({
  ranges,
  onUpdateRange,
  onRemoveRange
}) => {
  const { isDark } = useThemeStore();

  return (
    <div className="space-y-4 mb-6">
      <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>
        Aturan Warna Saldo
      </h3>
      
      {ranges.map((range, index) => (
        <div key={index} className="glass-button p-6 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
            {/* Min Amount */}
            <div className="md:col-span-2">
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-700'}`}>
                Dari (Rp)
              </label>
              <input
                type="number"
                value={range.min === -Infinity ? '' : range.min}
                onChange={(e) => onUpdateRange(index, 'min', e.target.value === '' ? -Infinity : Number(e.target.value))}
                className={`w-full p-3 glass-input text-sm ${isDark ? 'text-white' : 'text-gray-800'}`}
                placeholder="Min"
              />
            </div>

            {/* Max Amount */}
            <div className="md:col-span-2">
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-700'}`}>
                Sampai (Rp)
              </label>
              <input
                type="number"
                value={range.max === Infinity ? '' : range.max}
                onChange={(e) => onUpdateRange(index, 'max', e.target.value === '' ? Infinity : Number(e.target.value))}
                className={`w-full p-3 glass-input text-sm ${isDark ? 'text-white' : 'text-gray-800'}`}
                placeholder="Max"
              />
            </div>

            {/* Color */}
            <div className="md:col-span-3">
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-700'}`}>
                Warna
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={range.color}
                  onChange={(e) => onUpdateRange(index, 'color', e.target.value)}
                  className="w-12 h-12 rounded-lg border-2 border-white/20 cursor-pointer"
                />
                <input
                  type="text"
                  value={range.color}
                  onChange={(e) => onUpdateRange(index, 'color', e.target.value)}
                  className={`flex-1 p-3 glass-input text-sm ${isDark ? 'text-white' : 'text-gray-800'}`}
                />
              </div>
            </div>

            {/* Icon */}
            <div className="md:col-span-2">
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-700'}`}>
                Icon
              </label>
              <select
                value={range.icon || 'warning'}
                onChange={(e) => onUpdateRange(index, 'icon', e.target.value)}
                className={`w-full p-3 glass-input text-sm ${isDark ? 'text-white' : 'text-gray-800'}`}
              >
                <option value="warning">⚠️ Warning</option>
                <option value="check">✅ Check</option>
                <option value="x">❌ X</option>
              </select>
            </div>

            {/* Label */}
            <div className="md:col-span-2">
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-700'}`}>
                Label
              </label>
              <input
                type="text"
                value={range.label}
                onChange={(e) => onUpdateRange(index, 'label', e.target.value)}
                className={`w-full p-3 glass-input text-sm ${isDark ? 'text-white' : 'text-gray-800'}`}
                placeholder="Contoh: Saldo Rendah"
              />
            </div>

            {/* Delete Button */}
            <div className="md:col-span-1 flex justify-center">
              <button
                onClick={() => onRemoveRange(index)}
                disabled={ranges.length <= 1}
                className="glass-button p-3 rounded-lg hover:transform hover:scale-110 transition-all duration-200 hover:bg-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Hapus Range"
              >
                <Trash2 className="w-4 h-4 text-red-500" />
              </button>
            </div>
          </div>

          {/* Glow Effect Toggle */}
          <div className="mt-4 pt-4 border-t border-white/10">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={range.glowEnabled || false}
                onChange={(e) => onUpdateRange(index, 'glowEnabled', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>
                Aktifkan efek glowing untuk range ini
              </span>
            </label>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ColorRangeEditor;