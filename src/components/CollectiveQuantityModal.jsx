import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Plus, 
  Minus, 
  ShoppingCart,
  Package,
  DollarSign,
  AlertCircle,
  Check
} from 'lucide-react';

export default function CollectiveQuantityModal({ 
  isOpen, 
  onClose, 
  store, 
  selectedProducts, 
  onConfirm 
}) {
  const [quantities, setQuantities] = useState({});
  const [loading, setLoading] = useState(false);

  // Initialize quantities when modal opens
  React.useEffect(() => {
    if (isOpen && store) {
      const initialQuantities = {};
      store.restockNeeds.forEach(product => {
        if (selectedProducts[`${store.id}-${product.productName}`]) {
          initialQuantities[product.productName] = 1; // Default quantity
        }
      });
      setQuantities(initialQuantities);
    }
  }, [isOpen, store, selectedProducts]);

  const selectedItems = store?.restockNeeds.filter(product => 
    selectedProducts[`${store.id}-${product.productName}`]
  ) || [];

  const updateQuantity = (productName, change) => {
    setQuantities(prev => {
      const currentQty = prev[productName] || 1;
      const newQty = Math.max(1, currentQty + change);
      return {
        ...prev,
        [productName]: newQty
      };
    });
  };

  const setQuantity = (productName, value) => {
    const qty = Math.max(1, parseInt(value) || 1);
    setQuantities(prev => ({
      ...prev,
      [productName]: qty
    }));
  };

  const calculateTotal = () => {
    return selectedItems.reduce((total, product) => {
      const qty = quantities[product.productName] || 1;
      const bulkPrice = product.estimatedPrice * 0.8; // 20% discount for bulk
      return total + (bulkPrice * qty);
    }, 0);
  };

  const calculateSavings = () => {
    return selectedItems.reduce((savings, product) => {
      const qty = quantities[product.productName] || 1;
      const regularPrice = product.estimatedPrice;
      const bulkPrice = regularPrice * 0.8;
      return savings + ((regularPrice - bulkPrice) * qty);
    }, 0);
  };

  const handleConfirm = async () => {
    setLoading(true);
    
    const orderData = {
      storeId: store.id,
      storeName: store.name,
      items: selectedItems.map(product => ({
        ...product,
        quantity: quantities[product.productName] || 1,
        bulkPrice: product.estimatedPrice * 0.8,
        totalPrice: (product.estimatedPrice * 0.8) * (quantities[product.productName] || 1)
      })),
      totalAmount: calculateTotal(),
      totalSavings: calculateSavings(),
      orderDate: new Date(),
      status: 'confirmed'
    };

    try {
      await onConfirm(orderData);
      onClose();
    } catch (error) {
      console.error('Error confirming collective order:', error);
      alert('❌ Gagal memproses pesanan. Silakan coba lagi.');
    }
    
    setLoading(false);
  };

  if (!store) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                  <ShoppingCart className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-secondary">Tentukan Quantity</h2>
                  <p className="text-sm text-gray-600">Belanja kolektif dengan {store.name}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Content - Scrollable */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-4">
                {/* Store Info */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-2xl">{store.avatar}</span>
                    <div>
                      <h3 className="font-semibold text-blue-800">{store.name}</h3>
                      <p className="text-sm text-blue-600">{store.distance} • {store.address}</p>
                    </div>
                  </div>
                </div>

                {/* Selected Products */}
                <div>
                  <h3 className="font-semibold text-gray-800 mb-3 flex items-center space-x-2">
                    <Package className="w-4 h-4" />
                    <span>Produk yang Dipilih ({selectedItems.length})</span>
                  </h3>
                  
                  <div className="space-y-3">
                    {selectedItems.map((product, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-800">{product.productName}</h4>
                            <p className="text-sm text-gray-600">{product.category}</p>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className="text-sm text-gray-500 line-through">
                                Rp {product.estimatedPrice.toLocaleString('id-ID')}
                              </span>
                              <span className="text-sm font-medium text-green-600">
                                Rp {(product.estimatedPrice * 0.8).toLocaleString('id-ID')}
                              </span>
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                                -20%
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Quantity Selector */}
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">Quantity:</span>
                          <div className="flex items-center space-x-3">
                            <button
                              onClick={() => updateQuantity(product.productName, -1)}
                              className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center transition-colors"
                            >
                              <Minus className="w-4 h-4 text-gray-600" />
                            </button>
                            
                            <input
                              type="number"
                              min="1"
                              value={quantities[product.productName] || 1}
                              onChange={(e) => setQuantity(product.productName, e.target.value)}
                              className="w-16 text-center border border-gray-300 rounded-lg py-1 text-sm font-medium"
                            />
                            
                            <button
                              onClick={() => updateQuantity(product.productName, 1)}
                              className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center transition-colors"
                            >
                              <Plus className="w-4 h-4 text-gray-600" />
                            </button>
                          </div>
                        </div>

                        {/* Subtotal */}
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Subtotal:</span>
                            <span className="font-semibold text-gray-800">
                              Rp {((product.estimatedPrice * 0.8) * (quantities[product.productName] || 1)).toLocaleString('id-ID')}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Order Summary */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-semibold text-green-800 mb-3 flex items-center space-x-2">
                    <DollarSign className="w-4 h-4" />
                    <span>Ringkasan Pesanan</span>
                  </h3>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-green-700">Total Harga Bulk:</span>
                      <span className="font-semibold text-green-800">
                        Rp {calculateTotal().toLocaleString('id-ID')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-green-700">Total Penghematan:</span>
                      <span className="font-semibold text-green-600">
                        Rp {calculateSavings().toLocaleString('id-ID')}
                      </span>
                    </div>
                    <div className="pt-2 border-t border-green-300">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-green-800">Hemat:</span>
                        <span className="text-lg font-bold text-green-600">
                          {((calculateSavings() / (calculateTotal() + calculateSavings())) * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Info */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="w-4 h-4 text-green-600 mt-0.5" />
                    <div className="text-sm text-green-700">
                      <p className="font-medium mb-1">Informasi Belanja Kolektif:</p>
                      <ul className="text-xs space-y-1">
                        <li>• 📦 Stok akan langsung ditambahkan ke inventory Anda</li>
                        <li>• 💰 Harga sudah termasuk diskon bulk purchase 20%</li>
                        <li>• 🧾 Transaksi tercatat sebagai pembelian kolektif</li>
                        <li>• 🏪 Produk baru akan dibuat jika belum ada di inventory</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 p-4">
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 btn-secondary"
                >
                  Batal
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={loading || selectedItems.length === 0}
                  className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Memproses Restok...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center space-x-2">
                      <Check size={16} />
                      <span>Restok Sekarang</span>
                    </div>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
