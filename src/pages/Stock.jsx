import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../config/firebase';
import { collection, query, where, onSnapshot, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { Package, Plus, Edit3, Trash2, AlertTriangle, Search } from 'lucide-react';
import StockUpdateModal from '../components/StockUpdateModal';
import EditProductModal from '../components/EditProductModal';

export default function Stock() {
  const { currentUser } = useAuth();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showStockModal, setShowStockModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    if (!currentUser) return;

    const productsQuery = query(
      collection(db, 'products'),
      where('userId', '==', currentUser.uid)
    );

    const unsubscribe = onSnapshot(productsQuery, (snapshot) => {
      const productsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Sort by stock level (low stock first)
      productsData.sort((a, b) => a.stok - b.stok);
      
      setProducts(productsData);
      setFilteredProducts(productsData);
      setLoading(false);
    });

    return unsubscribe;
  }, [currentUser]);

  useEffect(() => {
    if (searchTerm) {
      const filtered = products.filter(product =>
        product.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.kategori || 'Umum').toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredProducts(filtered);
    } else {
      setFilteredProducts(products);
    }
  }, [products, searchTerm]);

  const handleStockUpdate = (product) => {
    setSelectedProduct(product);
    setShowStockModal(true);
  };

  const handleEditProduct = (product) => {
    setSelectedProduct(product);
    setShowEditModal(true);
  };

  const handleDeleteProduct = async (product) => {
    if (window.confirm(`Yakin ingin menghapus ${product.nama}?`)) {
      try {
        await deleteDoc(doc(db, 'products', product.id));
      } catch (error) {
        console.error('Error deleting product:', error);
        alert('Gagal menghapus produk');
      }
    }
  };

  const getStockStatus = (stock) => {
    if (stock === 0) return { label: 'Habis', color: 'text-red-600 bg-red-50' };
    if (stock <= 5) return { label: 'Menipis', color: 'text-yellow-600 bg-yellow-50' };
    if (stock <= 20) return { label: 'Normal', color: 'text-blue-600 bg-blue-50' };
    return { label: 'Banyak', color: 'text-green-600 bg-green-50' };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-secondary mb-2">Manajemen Stok</h1>
        <p className="text-gray-600">Kelola stok produk Anda</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Cari produk atau kategori..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
        />
      </div>

      {/* Stock Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="card text-center">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
            <Package className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-sm text-gray-600">Total Produk</p>
          <p className="text-lg font-bold text-secondary">{products.length}</p>
        </div>

        <div className="card text-center">
          <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <p className="text-sm text-gray-600">Stok Habis</p>
          <p className="text-lg font-bold text-red-600">
            {products.filter(p => p.stok === 0).length}
          </p>
        </div>

        <div className="card text-center">
          <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center mx-auto mb-2">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
          </div>
          <p className="text-sm text-gray-600">Stok Menipis</p>
          <p className="text-lg font-bold text-yellow-600">
            {products.filter(p => p.stok > 0 && p.stok <= 5).length}
          </p>
        </div>

        <div className="card text-center">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2">
            <Package className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-sm text-gray-600">Total Stok</p>
          <p className="text-lg font-bold text-green-600">
            {products.reduce((total, p) => total + p.stok, 0)}
          </p>
        </div>
      </div>

      {/* Products List */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-500 mb-2">
            {searchTerm ? 'Tidak ada produk yang sesuai' : 'Belum ada produk'}
          </h3>
          <p className="text-gray-400">
            {searchTerm ? 'Coba ubah kata kunci pencarian' : 'Tambahkan produk di halaman Dashboard'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredProducts.map((product, index) => {
            const stockStatus = getStockStatus(product.stok);
            
            return (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="card"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="font-semibold text-secondary">{product.nama}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${stockStatus.color}`}>
                        {stockStatus.label}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Harga: <span className="font-medium text-primary">Rp {product.harga.toLocaleString('id-ID')}</span></p>
                        <p className="text-gray-600">Kategori: <span className="font-medium">{product.kategori || 'Umum'}</span></p>
                      </div>
                      <div>
                        <p className="text-gray-600">Stok: <span className="font-bold">{product.stok} {product.satuan}</span></p>
                        {product.batchSize > 1 && (
                          <p className="text-gray-600">Batch: <span className="font-medium">{product.batchSize} {product.satuan}</span></p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleStockUpdate(product)}
                      className="p-2 bg-primary text-white rounded-lg"
                    >
                      <Plus size={16} />
                    </motion.button>
                    
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleEditProduct(product)}
                      className="p-2 bg-blue-500 text-white rounded-lg"
                    >
                      <Edit3 size={16} />
                    </motion.button>
                    
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleDeleteProduct(product)}
                      className="p-2 bg-red-500 text-white rounded-lg"
                    >
                      <Trash2 size={16} />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {showStockModal && selectedProduct && (
          <StockUpdateModal
            product={selectedProduct}
            onClose={() => {
              setShowStockModal(false);
              setSelectedProduct(null);
            }}
          />
        )}
        
        {showEditModal && selectedProduct && (
          <EditProductModal
            product={selectedProduct}
            onClose={() => {
              setShowEditModal(false);
              setSelectedProduct(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
