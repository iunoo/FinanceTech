import React, { useEffect, useState } from 'react';
import { Brain, Lightbulb, CheckCircle, X } from 'lucide-react';
import { useAnalyticsStore } from '../../store/analyticsStore';
import { useTransactionStore } from '../../store/transactionStore';
import { useThemeStore } from '../../store/themeStore';
import { toast } from '../../store/toastStore';

const SmartCategorization: React.FC = () => {
  const { smartCategories, generateSmartCategories, getSuggestedCategory } = useAnalyticsStore();
  const { transactions, updateTransaction } = useTransactionStore();
  const { isDark } = useThemeStore();
  const [testDescription, setTestDescription] = useState('');
  const [testAmount, setTestAmount] = useState(0);
  const [suggestion, setSuggestion] = useState<string | null>(null);

  useEffect(() => {
    generateSmartCategories();
  }, []);

  const handleTestSuggestion = () => {
    if (!testDescription.trim()) {
      toast.error('Masukkan deskripsi untuk ditest');
      return;
    }

    const suggested = getSuggestedCategory(testDescription, testAmount);
    setSuggestion(suggested);
    
    if (suggested) {
      toast.success(`Kategori yang disarankan: ${suggested}`);
    } else {
      toast.info('Tidak ada saran kategori untuk deskripsi ini');
    }
  };

  const getUncategorizedTransactions = () => {
    return transactions.filter(t => 
      !t.isTransfer && 
      !t.isBalanceAdjustment && 
      (t.category === 'Lainnya' || !t.category)
    ).slice(0, 10); // Limit to 10 for performance
  };

  const applySuggestionToTransaction = (transactionId: string, suggestedCategory: string) => {
    updateTransaction(transactionId, { category: suggestedCategory });
    toast.success(`Kategori "${suggestedCategory}" diterapkan ke transaksi`);
  };

  const uncategorizedTransactions = getUncategorizedTransactions();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-card p-6 rounded-lg">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-3 rounded-xl bg-green-500/10">
            <Brain className="w-6 h-6 text-green-500" />
          </div>
          <div>
            <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
              Smart Categorization
            </h2>
            <p className={`text-sm opacity-70 ${isDark ? 'text-white' : 'text-gray-600'}`}>
              AI otomatis menyarankan kategori berdasarkan deskripsi transaksi
            </p>
          </div>
        </div>

        {/* Test Area */}
        <div className="p-6 rounded-xl bg-white/5 border border-white/10">
          <h3 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>
            🧪 Test Smart Categorization
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="md:col-span-2">
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-700'}`}>
                Deskripsi Transaksi
              </label>
              <input
                type="text"
                value={testDescription}
                onChange={(e) => setTestDescription(e.target.value)}
                className={`w-full p-3 glass-input ${isDark ? 'text-white placeholder-gray-300' : 'text-gray-800 placeholder-gray-500'}`}
                placeholder="Contoh: Gojek ke kantor, Beli nasi padang, Netflix subscription"
                style={{ fontSize: '16px' }}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-700'}`}>
                Jumlah (Opsional)
              </label>
              <input
                type="number"
                value={testAmount}
                onChange={(e) => setTestAmount(Number(e.target.value))}
                className={`w-full p-3 glass-input ${isDark ? 'text-white placeholder-gray-300' : 'text-gray-800 placeholder-gray-500'}`}
                placeholder="0"
                style={{ fontSize: '16px' }}
              />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={handleTestSuggestion}
              className="px-6 py-3 bg-gradient-to-r from-green-500 to-teal-600 text-white rounded-lg font-medium hover:transform hover:scale-105 transition-all duration-200 flex items-center space-x-2"
            >
              <Brain className="w-4 h-4" />
              <span>Analisis</span>
            </button>
            
            {suggestion && (
              <div className="flex items-center space-x-2 px-4 py-2 bg-green-500/20 border border-green-500/30 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>
                  Saran: {suggestion}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Smart Categories Patterns */}
      <div className="glass-card p-6 rounded-lg">
        <h3 className={`text-lg font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-800'}`}>
          🎯 Pola Kategorisasi Otomatis
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {smartCategories.map((smartCat, index) => (
            <div key={index} className="p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-blue-500/20">
                    <Lightbulb className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <h4 className={`font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                      {smartCat.suggestedCategory}
                    </h4>
                    <p className={`text-sm opacity-70 ${isDark ? 'text-white' : 'text-gray-600'}`}>
                      Confidence: {(smartCat.confidence * 100).toFixed(0)}%
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>
                  Kata kunci:
                </p>
                <div className="flex flex-wrap gap-2">
                  {smartCat.description.split(', ').map((keyword, idx) => (
                    <span 
                      key={idx}
                      className="px-2 py-1 bg-blue-500/20 text-blue-500 rounded text-xs font-medium"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Uncategorized Transactions */}
      {uncategorizedTransactions.length > 0 && (
        <div className="glass-card p-6 rounded-lg">
          <h3 className={`text-lg font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-800'}`}>
            🔍 Transaksi yang Perlu Dikategorikan
          </h3>

          <div className="space-y-4">
            {uncategorizedTransactions.map((transaction) => {
              const suggestedCategory = getSuggestedCategory(transaction.description, transaction.amount);
              
              return (
                <div key={transaction.id} className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className={`p-2 rounded-lg ${
                          transaction.type === 'income' ? 'bg-green-500/20' : 'bg-red-500/20'
                        }`}>
                          <span className={`text-sm font-bold ${
                            transaction.type === 'income' ? 'text-green-500' : 'text-red-500'
                          }`}>
                            {transaction.type === 'income' ? '+' : '-'}
                          </span>
                        </div>
                        <div>
                          <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>
                            {transaction.description || 'Tidak ada deskripsi'}
                          </p>
                          <p className={`text-sm opacity-70 ${isDark ? 'text-white' : 'text-gray-600'}`}>
                            Rp {transaction.amount.toLocaleString('id-ID')} • {transaction.category}
                          </p>
                        </div>
                      </div>
                      
                      {suggestedCategory && (
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center space-x-2 px-3 py-1 bg-green-500/20 border border-green-500/30 rounded-lg">
                            <Brain className="w-4 h-4 text-green-500" />
                            <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>
                              Saran: {suggestedCategory}
                            </span>
                          </div>
                          <button
                            onClick={() => applySuggestionToTransaction(transaction.id, suggestedCategory)}
                            className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600 transition-colors"
                          >
                            Terapkan
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {uncategorizedTransactions.length === 10 && (
            <div className="mt-4 text-center">
              <p className={`text-sm opacity-70 ${isDark ? 'text-white' : 'text-gray-600'}`}>
                Menampilkan 10 transaksi pertama. Kategorikan transaksi ini untuk melihat lebih banyak.
              </p>
            </div>
          )}
        </div>
      )}

      {uncategorizedTransactions.length === 0 && (
        <div className="glass-card p-6 rounded-lg">
          <div className="text-center py-8">
            <CheckCircle className={`w-16 h-16 mx-auto mb-4 text-green-500`} />
            <p className={`text-lg font-bold text-green-500 mb-2`}>
              Semua Transaksi Sudah Dikategorikan!
            </p>
            <p className={`text-sm opacity-70 ${isDark ? 'text-white' : 'text-gray-600'}`}>
              Tidak ada transaksi yang perlu dikategorikan ulang
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SmartCategorization;