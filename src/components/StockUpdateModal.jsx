import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Package, Plus } from 'lucide-react';
import { updateDoc, doc } from 'firebase/firestore';
import { db } from '../config/firebase';

export default function StockUpdateModal({ product, onClose }) {
  const [updateType, setUpdateType] = useState('manual'); // 'manual' or 'batch'
  const [quantity, setQuantity] = useState('');
  const [batchCount, setBatchCount] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let newStock = product.stok;
      
      if (updateType === 'manual') {
        newStock += parseInt(quantity);
      } else {
        const batchSize = product.batchSize || 1;
        newStock += parseInt(batchCount) * batchSize;
      }

      await updateDoc(doc(db, 'products', product.id), {
        stok: Math.max(0, newStock)
      });

      onClose();
    } catch (error) {
      console.error('Error updating stock:', error);
      alert('Gagal memperbarui stok');
    }

    setLoading(false);
  };

  const getPreviewStock = () => {
    let addition = 0;
    if (updateType === 'manual' && quantity) {
      addition = parseInt(quantity);
    } else if (updateType === 'batch' && batchCount) {
      const batchSize = product.batchSize || 1;
      addition = parseInt(batchCount) * batchSize;
    }
    return product.stok + addition;
  };

  return (
    <AnimatePresence>
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
          className="bg-white rounded-2xl w-full max-w-md max-h-[85vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-secondary">Update Stok</h2>
                <p className="text-sm text-gray-600">{product.nama}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Current Stock Info */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Stok Saat Ini</p>
                <p className="text-lg font-bold text-secondary">{product.stok} {product.satuan}</p>
              </div>
              <div>
                <p className="text-gray-600">Harga Satuan</p>
                <p className="text-lg font-bold text-primary">Rp {product.harga.toLocaleString('id-ID')}</p>
              </div>
            </div>
            {product.batchSize > 1 && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <p className="text-gray-600 text-sm">Ukuran Batch: <span className="font-medium">{product.batchSize} {product.satuan}</span></p>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Update Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Cara Menambah Stok
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setUpdateType('manual')}
                  className={`p-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                    updateType === 'manual'
                      ? 'border-primary bg-primary bg-opacity-10 text-primary'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  Manual
                </button>
                {product.batchSize > 1 && (
                  <button
                    type="button"
                    onClick={() => setUpdateType('batch')}
                    className={`p-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                      updateType === 'batch'
                        ? 'border-primary bg-primary bg-opacity-10 text-primary'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    Per Batch
                  </button>
                )}
              </div>
            </div>

            {/* Quantity Input */}
            {updateType === 'manual' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Jumlah Tambahan ({product.satuan})
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="input-field"
                  placeholder="Masukkan jumlah"
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Jumlah Batch (1 batch = {product.batchSize} {product.satuan})
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={batchCount}
                  onChange={(e) => setBatchCount(e.target.value)}
                  className="input-field"
                  placeholder="Masukkan jumlah batch"
                />
              </div>
            )}

            {/* Preview */}
            {((updateType === 'manual' && quantity) || (updateType === 'batch' && batchCount)) && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-700">
                  Stok setelah update: <span className="font-bold">{getPreviewStock()} {product.satuan}</span>
                </p>
              </div>
            )}

            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 btn-secondary"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={loading || (!quantity && !batchCount)}
                className="flex-1 btn-primary flex items-center justify-center space-x-2"
              >
                <Plus size={16} />
                <span>{loading ? 'Menyimpan...' : 'Update Stok'}</span>
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
