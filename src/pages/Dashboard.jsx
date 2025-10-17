import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { db } from '../config/firebase';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { Plus, TrendingUp, Package, DollarSign, AlertTriangle } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import AddProductModal from '../components/AddProductModal';
import SalesInsights from '../components/SalesInsights';

export default function Dashboard() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [insights, setInsights] = useState(null);

  useEffect(() => {
    if (!currentUser) return;

    // Listen to products
    const productsQuery = query(
      collection(db, 'products'),
      where('userId', '==', currentUser.uid)
    );

    const unsubscribeProducts = onSnapshot(productsQuery, (snapshot) => {
      const productsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setProducts(productsData);
      setLoading(false);
    });

    // Listen to sales
    const salesQuery = query(
      collection(db, 'sales'),
      where('userId', '==', currentUser.uid)
    );

    const unsubscribeSales = onSnapshot(salesQuery, (snapshot) => {
      const salesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSales(salesData);
    });

    return () => {
      unsubscribeProducts();
      unsubscribeSales();
    };
  }, [currentUser]);

  const handleSell = (product) => {
    console.log('handleSell called with product:', product);
    
    if (product.stok <= 0) {
      alert('Stok habis!');
      return;
    }

    try {
      // Add product to cart with quantity 1
      console.log('Adding item to cart...');
      addItem({
        id: product.id,
        nama: product.nama,
        harga: product.harga,
        satuan: product.satuan || 'pcs'
      });
      
      console.log('Item added, navigating to cashier...');
      // Navigate to cashier page
      navigate('/cashier');
    } catch (error) {
      console.error('Error in handleSell:', error);
    }
  };

  const getTotalRevenue = () => {
    return sales.reduce((total, sale) => total + sale.price, 0);
  };

  const getTodayRevenue = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return sales.filter(sale => {
      const saleDate = sale.timestamp?.toDate() || new Date(sale.timestamp);
      return saleDate >= today && saleDate < tomorrow;
    }).reduce((total, sale) => total + sale.price, 0);
  };

  const getTotalProducts = () => {
    return products.length;
  };

  const getLowStockProducts = () => {
    return products.filter(product => product.stok <= 5);
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
        <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>Dashboard</h1>
        <p style={{ color: 'var(--color-text-secondary)' }}>Kelola bisnis Anda dengan mudah</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => navigate('/today-revenue')}
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Total Pendapatan Hari Ini</p>
              <p className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>
                Rp {getTodayRevenue().toLocaleString('id-ID')}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Produk</p>
              <p className="text-lg font-bold text-secondary">{getTotalProducts()}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Penjualan Hari Ini</p>
              <p className="text-lg font-bold text-secondary">
                {sales.filter(sale => {
                  const today = new Date();
                  const saleDate = sale.timestamp?.toDate();
                  return saleDate && saleDate.toDateString() === today.toDateString();
                }).length}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Stok Menipis</p>
              <p className="text-lg font-bold text-secondary">{getLowStockProducts().length}</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Sales Insights */}
      <SalesInsights sales={sales} products={products} />

      {/* Products Section */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Produk Anda</h2>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 text-white px-4 py-2 rounded-lg"
          style={{ backgroundColor: 'var(--color-primary)' }}
        >
          <Plus size={16} />
          <span>Tambah</span>
        </motion.button>
      </div>

      {/* Products Grid */}
      {products.length === 0 ? (
        <div className="text-center py-12">
          <Package className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--color-text-secondary)', opacity: 0.5 }} />
          <h3 className="text-lg font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>Belum ada produk</h3>
          <p className="mb-4" style={{ color: 'var(--color-text-secondary)', opacity: 0.7 }}>Tambahkan produk pertama Anda untuk memulai</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary"
          >
            Tambah Produk
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {products.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <ProductCard product={product} onSell={handleSell} />
            </motion.div>
          ))}
        </div>
      )}

      {/* Add Product Modal */}
      {showAddModal && (
        <AddProductModal
          onClose={() => setShowAddModal(false)}
          userId={currentUser.uid}
        />
      )}
    </div>
  );
}
