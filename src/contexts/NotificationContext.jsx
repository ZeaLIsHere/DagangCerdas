import React, { createContext, useContext, useState } from 'react';

const NotificationContext = createContext();

export function useNotification() {
  return useContext(NotificationContext);
}

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);

  const addNotification = (notification) => {
    const id = Date.now().toString();
    const newNotification = {
      id,
      timestamp: new Date(),
      ...notification
    };
    
    setNotifications(prev => [newNotification, ...prev.slice(0, 4)]); // Keep max 5 notifications
    
    // Auto remove after 10 seconds if no action required
    if (!notification.persistent) {
      setTimeout(() => {
        removeNotification(id);
      }, 10000);
    }
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  // Predefined notification types
  const notifyStockOut = (product, onAction) => {
    addNotification({
      type: 'stock-out',
      title: 'Stok Habis',
      message: `${product.nama} sudah habis`,
      product: product,
      action: onAction,
      actionText: 'Tambah Stok',
      color: 'red',
      persistent: true
    });
  };

  const notifyLowStock = (product, onAction) => {
    addNotification({
      type: 'stock-low',
      title: 'Stok Menipis',
      message: `${product.nama} tinggal ${product.stok} item`,
      product: product,
      action: onAction,
      actionText: 'Tambah Stok',
      color: 'yellow',
      persistent: true
    });
  };

  const notifyTransactionSuccess = (total, method, onViewDetails) => {
    addNotification({
      type: 'transaction-success',
      title: 'Transaksi Berhasil',
      message: `Pembayaran Rp ${total.toLocaleString('id-ID')} ${method === 'qris' ? 'via QRIS' : 'tunai'} berhasil`,
      action: onViewDetails,
      actionText: 'Lihat Detail',
      color: 'green',
      persistent: false
    });
  };

  const notifyProductAdded = (productName, onViewProduct) => {
    addNotification({
      type: 'product-added',
      title: 'Produk Ditambahkan',
      message: `${productName} berhasil ditambahkan ke inventory`,
      action: onViewProduct,
      actionText: 'Lihat Produk',
      color: 'blue',
      persistent: false
    });
  };

  const notifyStockUpdated = (productName, newStock, onViewProduct) => {
    addNotification({
      type: 'stock-updated',
      title: 'Stok Diperbarui',
      message: `${productName} sekarang memiliki ${newStock} item`,
      action: onViewProduct,
      actionText: 'Lihat Produk',
      color: 'blue',
      persistent: false
    });
  };

  const value = {
    notifications,
    addNotification,
    removeNotification,
    clearAllNotifications,
    // Helper functions
    notifyStockOut,
    notifyLowStock,
    notifyTransactionSuccess,
    notifyProductAdded,
    notifyStockUpdated
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}
