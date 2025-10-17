import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { db } from '../config/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';

const StoreContext = createContext();

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
}

export function StoreProvider({ children }) {
  const { currentUser } = useAuth();
  const [stores, setStores] = useState([]);
  const [currentStore, setCurrentStore] = useState(null);
  const [loading, setLoading] = useState(true);

  // Listen to user's stores
  useEffect(() => {
    if (!currentUser) {
      setStores([]);
      setCurrentStore(null);
      setLoading(false);
      return;
    }

    const storesQuery = query(
      collection(db, 'stores'),
      where('userId', '==', currentUser.uid)
    );

    const unsubscribe = onSnapshot(storesQuery, (snapshot) => {
      const storesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setStores(storesData);

      // Set current store (first store or previously selected)
      const savedStoreId = localStorage.getItem('currentStoreId');
      let selectedStore = null;

      if (savedStoreId) {
        selectedStore = storesData.find(store => store.id === savedStoreId);
      }

      if (!selectedStore && storesData.length > 0) {
        selectedStore = storesData[0];
      }

      setCurrentStore(selectedStore);
      setLoading(false);
    });

    return unsubscribe;
  }, [currentUser]);

  // Switch to different store
  const switchStore = (storeId) => {
    const store = stores.find(s => s.id === storeId);
    if (store) {
      setCurrentStore(store);
      localStorage.setItem('currentStoreId', storeId);
    }
  };

  // Update store data
  const updateStore = async (storeId, updateData) => {
    try {
      const storeRef = doc(db, 'stores', storeId);
      await updateDoc(storeRef, updateData);
    } catch (error) {
      console.error('Error updating store:', error);
      throw error;
    }
  };

  // Get store statistics
  const getStoreStats = (storeId) => {
    const store = stores.find(s => s.id === storeId);
    return {
      totalProducts: store?.totalProducts || 0,
      totalSales: store?.totalSales || 0,
      totalRevenue: store?.totalRevenue || 0,
      isActive: store?.isActive || false
    };
  };

  const value = {
    stores,
    currentStore,
    loading,
    switchStore,
    updateStore,
    getStoreStats
  };

  return (
    <StoreContext.Provider value={value}>
      {children}
    </StoreContext.Provider>
  );
}
