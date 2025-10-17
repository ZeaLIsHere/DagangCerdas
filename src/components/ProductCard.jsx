import React from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, AlertTriangle } from 'lucide-react';

export default function ProductCard({ product, onSell }) {
  const isLowStock = product.stok <= 5;
  const isOutOfStock = product.stok <= 0;

  return (
    <div className="card">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-secondary mb-1">{product.nama}</h3>
          <p className="text-lg font-bold text-primary">
            Rp {product.harga.toLocaleString('id-ID')}
          </p>
        </div>
        {isLowStock && (
          <div className="flex items-center space-x-1 text-warning">
            <AlertTriangle size={16} />
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Stok:</span>
          <span className={`font-medium ${isOutOfStock ? 'text-error' : isLowStock ? 'text-warning' : 'text-success'}`}>
            {product.stok}
          </span>
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onSell(product)}
          disabled={isOutOfStock}
          className={`flex items-center space-x-2 px-3 py-2 rounded-lg font-medium transition-colors ${
            isOutOfStock
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-primary text-white hover:bg-accent'
          }`}
        >
          <ShoppingCart size={16} />
          <span>{isOutOfStock ? 'Habis' : 'Jual'}</span>
        </motion.button>
      </div>
    </div>
  );
}
