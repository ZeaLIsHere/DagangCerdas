import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../config/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { Bell, AlertTriangle, TrendingUp, Package, Star, Calendar, ChevronRight } from 'lucide-react';

export default function Notifications() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const notifications = useMemo(() => {
    const notifs = [];

    // Stock alerts
    const outOfStock = products.filter(p => p.stok === 0);
    const lowStock = products.filter(p => p.stok > 0 && p.stok <= 5);

    outOfStock.forEach(product => {
      notifs.push({
        id: `out-${product.id}`,
        type: 'error',
        icon: AlertTriangle,
        title: 'Stok Habis',
        message: `${product.nama} sudah habis`,
        time: 'Sekarang',
        priority: 3,
        actionable: true,
        actionText: 'Ke Halaman Stok',
        action: () => navigate('/stock')
      });
    });

    lowStock.forEach(product => {
      notifs.push({
        id: `low-${product.id}`,
        type: 'warning',
        icon: Package,
        title: 'Stok Menipis',
        message: `${product.nama} tinggal ${product.stok} ${product.satuan}`,
        time: 'Sekarang',
        priority: 2,
        actionable: false // Tidak ada action untuk stok menipis
      });
    });

    // Sales insights
    if (sales.length > 0) {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      
      const recentSales = sales.filter(sale => {
        const saleDate = sale.timestamp?.toDate();
        return saleDate && saleDate >= weekAgo;
      });

      if (recentSales.length > 0) {
        // Best selling product
        const productSales = {};
        recentSales.forEach(sale => {
          productSales[sale.productId] = (productSales[sale.productId] || 0) + 1;
        });

        const bestSellingProductId = Object.keys(productSales).reduce((a, b) => 
          productSales[a] > productSales[b] ? a : b
        );

        const bestSellingProduct = products.find(p => p.id === bestSellingProductId);
        const bestSellingCount = productSales[bestSellingProductId];

        if (bestSellingProduct && bestSellingCount > 3) {
          notifs.push({
            id: 'best-selling',
            type: 'success',
            icon: Star,
            title: 'Produk Terlaris',
            message: `${bestSellingProduct.nama} terjual ${bestSellingCount}x minggu ini`,
            time: '1 hari lalu',
            priority: 1
          });
        }

        // Daily sales trend
        const today = new Date();
        const todaySales = sales.filter(sale => {
          const saleDate = sale.timestamp?.toDate();
          return saleDate && saleDate.toDateString() === today.toDateString();
        });

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdaySales = sales.filter(sale => {
          const saleDate = sale.timestamp?.toDate();
          return saleDate && saleDate.toDateString() === yesterday.toDateString();
        });

        if (todaySales.length > yesterdaySales.length && todaySales.length > 5) {
          notifs.push({
            id: 'sales-trend',
            type: 'info',
            icon: TrendingUp,
            title: 'Penjualan Meningkat',
            message: `Hari ini ${todaySales.length} penjualan, kemarin ${yesterdaySales.length}`,
            time: '2 jam lalu',
            priority: 1
          });
        }
      }
    }

    // Business suggestions
    if (products.length > 0) {
      const highStockProducts = products.filter(p => p.stok > 50);
      if (highStockProducts.length > 0) {
        notifs.push({
          id: 'high-stock',
          type: 'info',
          icon: Package,
          title: 'Saran Bisnis',
          message: `${highStockProducts.length} produk memiliki stok berlebih. Pertimbangkan promosi.`,
          time: '1 hari lalu',
          priority: 1
        });
      }
    }

    // Sort by priority (higher first) then by type
    return notifs.sort((a, b) => {
      if (a.priority !== b.priority) return b.priority - a.priority;
      const typeOrder = { error: 3, warning: 2, success: 1, info: 0 };
      return typeOrder[b.type] - typeOrder[a.type];
    });
  }, [products, sales]);

  const getNotificationStyle = (type) => {
    switch (type) {
      case 'error':
        return 'border-red-200 bg-red-50';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50';
      case 'success':
        return 'border-green-200 bg-green-50';
      case 'info':
        return 'border-blue-200 bg-blue-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const getIconColor = (type) => {
    switch (type) {
      case 'error':
        return 'text-red-600';
      case 'warning':
        return 'text-yellow-600';
      case 'success':
        return 'text-green-600';
      case 'info':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
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
        <h1 className="text-2xl font-bold text-secondary mb-2">Notifikasi</h1>
        <p className="text-gray-600">Pantau status bisnis Anda</p>
      </div>

      {/* Notifications Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="card text-center">
          <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <p className="text-sm text-gray-600">Stok Habis</p>
          <p className="text-lg font-bold text-red-600">
            {notifications.filter(n => n.type === 'error').length}
          </p>
        </div>

        <div className="card text-center">
          <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center mx-auto mb-2">
            <Package className="w-5 h-5 text-yellow-600" />
          </div>
          <p className="text-sm text-gray-600">Peringatan</p>
          <p className="text-lg font-bold text-yellow-600">
            {notifications.filter(n => n.type === 'warning').length}
          </p>
        </div>

        <div className="card text-center">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-sm text-gray-600">Kabar Baik</p>
          <p className="text-lg font-bold text-green-600">
            {notifications.filter(n => n.type === 'success').length}
          </p>
        </div>

        <div className="card text-center">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
            <Bell className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-sm text-gray-600">Total</p>
          <p className="text-lg font-bold text-blue-600">{notifications.length}</p>
        </div>
      </div>

      {/* Notifications List */}
      {notifications.length === 0 ? (
        <div className="text-center py-12">
          <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-500 mb-2">Tidak ada notifikasi</h3>
          <p className="text-gray-400">Semua dalam kondisi baik!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification, index) => {
            const Icon = notification.icon;
            
            return (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`border rounded-lg p-4 ${getNotificationStyle(notification.type)} ${
                  notification.actionable ? 'cursor-pointer hover:shadow-md transition-shadow' : ''
                }`}
                onClick={notification.actionable ? notification.action : undefined}
              >
                <div className="flex items-start space-x-3">
                  <div className={`flex-shrink-0 ${getIconColor(notification.type)}`}>
                    <Icon size={20} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-secondary text-sm">
                        {notification.title}
                      </h3>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500">{notification.time}</span>
                        {notification.actionable && (
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                    </div>
                    <p className="text-gray-700 text-sm mb-2">{notification.message}</p>
                    {notification.actionable && (
                      <p className="text-xs text-blue-600 font-medium">
                        👆 {notification.actionText}
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Quick Actions */}
      {notifications.some(n => n.type === 'error' || n.type === 'warning') && (
        <div className="card">
          <h3 className="font-semibold text-secondary mb-3 flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            Panduan Tindakan
          </h3>
          <div className="space-y-3 text-sm">
            {notifications.filter(n => n.type === 'error').length > 0 && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 font-medium mb-1">🚨 Stok Habis - Perlu Tindakan Segera</p>
                <p className="text-red-600">Klik notifikasi "Stok Habis" untuk langsung ke halaman Stok dan tambah inventory.</p>
              </div>
            )}
            {notifications.filter(n => n.type === 'warning').length > 0 && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-yellow-700 font-medium mb-1">⚠️ Stok Menipis - Informasi</p>
                <p className="text-yellow-600">Produk ini masih tersedia tapi perlu diperhatikan untuk restok berikutnya.</p>
              </div>
            )}
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-700 font-medium mb-1">💡 Tips</p>
              <p className="text-blue-600">Hanya notifikasi "Stok Habis" yang bisa diklik untuk tindakan langsung.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
