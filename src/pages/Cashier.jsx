import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { db } from '../config/firebase';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { ShoppingCart, Search, Filter, CreditCard } from 'lucide-react';
import ProductGrid from '../components/ProductGrid';
import CartModal from '../components/CartModal';
import CheckoutModal from '../components/CheckoutModal';

export default function Cashier() {
  const { currentUser } = useAuth();
  const { cart, getTotalItems } = useCart();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [categories, setCategories] = useState(['Semua']);

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
      
      setProducts(productsData);
      setFilteredProducts(productsData);
      
      // Extract unique categories
      const uniqueCategories = ['Semua', ...new Set(productsData.map(p => p.kategori || 'Umum'))];
      setCategories(uniqueCategories);
      
      setLoading(false);
    });

    return unsubscribe;
  }, [currentUser]);

  useEffect(() => {
    let filtered = products;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.nama.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory !== 'Semua') {
      filtered = filtered.filter(product => 
        (product.kategori || 'Umum') === selectedCategory
      );
    }

    // Only show products with stock
    filtered = filtered.filter(product => product.stok > 0);

    setFilteredProducts(filtered);
  }, [products, searchTerm, selectedCategory]);

  const handleCheckout = () => {
    if (cart.items.length === 0) return;
    
    // Close cart modal and open checkout modal
    setShowCart(false);
    setShowCheckout(true);
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
        <h1 className="text-2xl font-bold text-secondary">Kasir</h1>
        <p className="text-gray-600">Pilih produk untuk dijual</p>
      </div>

      {/* Search and Filter */}
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Cari produk..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>

        {/* Category Filter */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-2">
          <Filter className="text-gray-400 flex-shrink-0" size={20} />
          {categories.map(category => (
            <motion.button
              key={category}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                selectedCategory === category
                  ? 'bg-primary text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {category}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-12">
          <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-500 mb-2">
            {searchTerm || selectedCategory !== 'Semua' 
              ? 'Tidak ada produk yang sesuai' 
              : 'Tidak ada produk tersedia'
            }
          </h3>
          <p className="text-gray-400">
            {searchTerm || selectedCategory !== 'Semua'
              ? 'Coba ubah pencarian atau filter'
              : 'Tambahkan produk di halaman Dashboard'
            }
          </p>
        </div>
      ) : (
        <ProductGrid products={filteredProducts} />
      )}

      {/* Cart Modal */}
      <AnimatePresence>
        {showCart && (
          <CartModal
            onClose={() => setShowCart(false)}
            onCheckout={handleCheckout}
          />
        )}
      </AnimatePresence>

      {/* Checkout Modal */}
      <AnimatePresence>
        {showCheckout && (
          <CheckoutModal
            onClose={() => setShowCheckout(false)}
            userId={currentUser?.uid}
          />
        )}
      </AnimatePresence>

      {/* Floating Cart Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setShowCart(true)}
        className="fixed bottom-24 right-4 bg-primary text-white p-4 rounded-full shadow-lg z-40"
      >
        <ShoppingCart size={24} />
        {getTotalItems() > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-2 -right-2 bg-accent text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold"
          >
            {getTotalItems()}
          </motion.span>
        )}
      </motion.button>
    </div>
  );
}
