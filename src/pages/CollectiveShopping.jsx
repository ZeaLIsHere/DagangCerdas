import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../config/firebase';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, getDocs, setDoc } from 'firebase/firestore';
import CollectiveQuantityModal from '../components/CollectiveQuantityModal';
import { 
  ShoppingCart, 
  MapPin, 
  Store,
  Package,
  DollarSign,
  Users,
  AlertCircle,
  Plus,
  Check
} from 'lucide-react';

export default function CollectiveShopping() {
  const { currentUser } = useAuth();
  const [myProducts, setMyProducts] = useState([]);
  const [nearbyStores, setNearbyStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProducts, setSelectedProducts] = useState({});
  const [showQuantityModal, setShowQuantityModal] = useState(false);
  const [selectedStore, setSelectedStore] = useState(null);

  useEffect(() => {
    if (!currentUser) return;

    // Get user's products to find low stock items
    const productsQuery = query(
      collection(db, 'products'),
      where('userId', '==', currentUser.uid)
    );

    const unsubscribe = onSnapshot(productsQuery, (snapshot) => {
      const productsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Filter low stock products (stok <= 5)
      const lowStockProducts = productsData.filter(product => product.stok <= 5);
      setMyProducts(lowStockProducts);
      
      // Generate mock nearby stores based on user's low stock products
      generateNearbyStores(lowStockProducts);
      setLoading(false);
    });

    return unsubscribe;
  }, [currentUser]);

  const generateNearbyStores = (lowStockProducts) => {
    // Mock data for demo - Warung Mak Adan and other stores
    const mockStores = [
      {
        id: 'store-1',
        name: 'Warung Mak Adan',
        distance: '0.8 km',
        address: 'Jl. Mawar No. 15',
        avatar: '👵',
        restockNeeds: [
          {
            productName: 'Mie Instan',
            quantity: 2,
            unit: 'batch',
            category: 'Makanan Instan',
            estimatedPrice: 45000,
            urgency: 'high'
          },
          {
            productName: 'Teh Botol',
            quantity: 1,
            unit: 'karton',
            category: 'Minuman',
            estimatedPrice: 85000,
            urgency: 'medium'
          }
        ],
        commonProducts: lowStockProducts.filter(p => 
          ['Mie Instan', 'Indomie', 'Teh', 'Minuman'].some(keyword => 
            p.nama.toLowerCase().includes(keyword.toLowerCase())
          )
        ).slice(0, 2),
        rating: 4.8,
        totalCollaborations: 12
      },
      {
        id: 'store-2', 
        name: 'Toko Berkah Jaya',
        distance: '1.2 km',
        address: 'Jl. Melati No. 8',
        avatar: '🏪',
        restockNeeds: [
          {
            productName: 'Beras Premium',
            quantity: 3,
            unit: 'karung',
            category: 'Beras',
            estimatedPrice: 180000,
            urgency: 'high'
          },
          {
            productName: 'Minyak Goreng',
            quantity: 2,
            unit: 'jerigen',
            category: 'Minyak',
            estimatedPrice: 120000,
            urgency: 'medium'
          }
        ],
        commonProducts: lowStockProducts.filter(p => 
          ['Beras', 'Minyak'].some(keyword => 
            p.nama.toLowerCase().includes(keyword.toLowerCase())
          )
        ).slice(0, 2),
        rating: 4.6,
        totalCollaborations: 8
      }
    ];

    setNearbyStores(mockStores);
  };

  const toggleProductSelection = (storeId, productName) => {
    const key = `${storeId}-${productName}`;
    setSelectedProducts(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const joinCollectiveShopping = (storeId) => {
    const store = nearbyStores.find(s => s.id === storeId);
    if (!store) return;

    // Get selected products for this store
    const selectedItems = store.restockNeeds.filter(product => 
      selectedProducts[`${storeId}-${product.productName}`]
    );

    if (selectedItems.length === 0) {
      alert('Pilih minimal satu produk untuk bergabung belanja kolektif!');
      return;
    }

    // Open quantity modal
    setSelectedStore(store);
    setShowQuantityModal(true);
  };

  const handleConfirmCollectiveOrder = async (orderData) => {
    try {
      // 1. Save collective order to Firebase
      const orderRef = await addDoc(collection(db, 'collectiveOrders'), {
        ...orderData,
        userId: currentUser.uid,
        userEmail: currentUser.email,
        createdAt: serverTimestamp(),
        status: 'confirmed' // Langsung confirmed untuk demo
      });

      // 2. Process inventory restocking for each item
      const restockPromises = orderData.items.map(async (item) => {
        await processInventoryRestock(item);
      });

      await Promise.all(restockPromises);

      // 3. Add transaction record for collective purchase
      await addDoc(collection(db, 'transactions'), {
        userId: currentUser.uid,
        type: 'collective_purchase',
        items: orderData.items.map(item => ({
          nama: item.productName,
          quantity: item.quantity,
          harga: item.bulkPrice,
          totalPrice: item.totalPrice
        })),
        totalAmount: orderData.totalAmount,
        paymentMethod: 'collective',
        supplier: orderData.storeName,
        timestamp: serverTimestamp(),
        collectiveOrderId: orderRef.id
      });

      // Show success message
      alert(`✅ Belanja Kolektif Berhasil!\n\n🏪 Toko: ${orderData.storeName}\n💰 Total: Rp ${orderData.totalAmount.toLocaleString('id-ID')}\n💸 Penghematan: Rp ${orderData.totalSavings.toLocaleString('id-ID')}\n\n📦 Stok produk telah ditambahkan ke inventory Anda!\n🧾 Transaksi tercatat dalam riwayat pembelian.`);

      // Reset selected products for this store
      const newSelectedProducts = { ...selectedProducts };
      Object.keys(newSelectedProducts).forEach(key => {
        if (key.startsWith(orderData.storeId)) {
          delete newSelectedProducts[key];
        }
      });
      setSelectedProducts(newSelectedProducts);

    } catch (error) {
      console.error('Error creating collective order:', error);
      alert('❌ Gagal memproses belanja kolektif. Silakan coba lagi.');
    }
  };

  const processInventoryRestock = async (item) => {
    try {
      // Check if product already exists in user's inventory
      const productsQuery = query(
        collection(db, 'products'),
        where('userId', '==', currentUser.uid),
        where('nama', '==', item.productName)
      );

      const existingProducts = await getDocs(productsQuery);

      if (!existingProducts.empty) {
        // Product exists - update stock
        const existingProduct = existingProducts.docs[0];
        const currentStock = existingProduct.data().stok || 0;
        const newStock = currentStock + item.quantity;

        await updateDoc(doc(db, 'products', existingProduct.id), {
          stok: newStock,
          lastRestocked: serverTimestamp(),
          lastRestockQuantity: item.quantity,
          lastRestockPrice: item.bulkPrice,
          lastRestockSource: 'collective_purchase'
        });

        console.log(`Updated ${item.productName}: ${currentStock} + ${item.quantity} = ${newStock}`);
      } else {
        // Product doesn't exist - create new product
        const newProductData = {
          userId: currentUser.uid,
          nama: item.productName,
          kategori: item.category || 'Lainnya',
          harga: Math.round(item.bulkPrice * 1.3), // Set selling price 30% above bulk price
          stok: item.quantity,
          createdAt: serverTimestamp(),
          lastRestocked: serverTimestamp(),
          lastRestockQuantity: item.quantity,
          lastRestockPrice: item.bulkPrice,
          lastRestockSource: 'collective_purchase',
          addedViaCollective: true
        };

        await addDoc(collection(db, 'products'), newProductData);
        console.log(`Created new product: ${item.productName} with stock ${item.quantity}`);
      }
    } catch (error) {
      console.error(`Error processing restock for ${item.productName}:`, error);
      throw error;
    }
  };

  const calculateBulkSavings = (estimatedPrice) => {
    // Assume 15-25% savings for bulk purchase
    const savingsPercentage = 20;
    const savings = estimatedPrice * (savingsPercentage / 100);
    return { savings, percentage: savingsPercentage };
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
        <h1 className="text-2xl font-bold text-secondary mb-2">Belanja Kolektif</h1>
        <p className="text-gray-600">Toko terdekat dengan kebutuhan restok serupa</p>
      </div>

      {/* My Low Stock Products */}
      {myProducts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-amber-50 border border-amber-200 rounded-2xl p-4"
        >
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="font-bold text-amber-800">Produk Perlu Restok</h3>
              <p className="text-sm text-amber-600">Stok rendah, cocok untuk belanja kolektif</p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {myProducts.map((product, index) => (
              <span key={index} className="px-3 py-1 bg-amber-100 text-amber-700 text-sm rounded-full">
                {product.nama} ({product.stok} tersisa)
              </span>
            ))}
          </div>
        </motion.div>
      )}

      {/* Info Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-primary to-accent text-white rounded-2xl p-6"
      >
        <div className="flex items-center space-x-4 mb-4">
          <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
            <Store className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Toko Terdekat</h2>
            <p className="text-sm opacity-90">Dengan kebutuhan restok serupa</p>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="w-8 h-8 bg-white bg-opacity-20 rounded-lg flex items-center justify-center mx-auto mb-2">
              <MapPin className="w-4 h-4" />
            </div>
            <p className="text-xs">Lokasi terdekat</p>
          </div>
          <div className="text-center">
            <div className="w-8 h-8 bg-white bg-opacity-20 rounded-lg flex items-center justify-center mx-auto mb-2">
              <Package className="w-4 h-4" />
            </div>
            <p className="text-xs">Produk serupa</p>
          </div>
          <div className="text-center">
            <div className="w-8 h-8 bg-white bg-opacity-20 rounded-lg flex items-center justify-center mx-auto mb-2">
              <Users className="w-4 h-4" />
            </div>
            <p className="text-xs">Belanja bersama</p>
          </div>
        </div>
      </motion.div>

      {/* Nearby Stores Section */}
      <div>
        <div className="flex items-center space-x-2 mb-4">
          <Store className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-bold text-secondary">Toko Terdekat</h2>
          <span className="px-2 py-1 bg-primary text-white text-xs rounded-full">
            {nearbyStores.length} toko
          </span>
        </div>

        <div className="space-y-4">
          {nearbyStores.length === 0 ? (
            <div className="text-center py-12">
              <Store className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-500 mb-2">Belum ada toko terdekat</h3>
              <p className="text-gray-400">Toko dengan kebutuhan restok serupa akan muncul di sini</p>
            </div>
          ) : (
            nearbyStores.map((store, index) => (
              <motion.div
                key={store.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="card hover:shadow-lg transition-shadow"
              >
                {/* Store Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="text-3xl">{store.avatar}</div>
                    <div>
                      <h3 className="font-bold text-secondary">{store.name}</h3>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <MapPin className="w-4 h-4" />
                        <span>{store.distance} • {store.address}</span>
                      </div>
                      <div className="flex items-center space-x-2 mt-1">
                        <div className="flex items-center space-x-1">
                          <span className="text-yellow-500">★</span>
                          <span className="text-sm font-medium">{store.rating}</span>
                        </div>
                        <span className="text-sm text-gray-500">•</span>
                        <span className="text-sm text-gray-500">{store.totalCollaborations} kolaborasi</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Common Products */}
                {store.commonProducts.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center space-x-1">
                      <Package className="w-4 h-4" />
                      <span>Produk Serupa yang Anda Miliki:</span>
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {store.commonProducts.map((product, idx) => (
                        <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                          {product.nama} (stok: {product.stok})
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Store's Restock Needs */}
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center space-x-1">
                    <ShoppingCart className="w-4 h-4" />
                    <span>Kebutuhan Restok {store.name}:</span>
                  </h4>
                  
                  <div className="space-y-3">
                    {store.restockNeeds.map((product, idx) => (
                      <div key={idx} className="border border-gray-200 rounded-lg p-3">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <h5 className="font-medium text-gray-800">{product.productName}</h5>
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                product.urgency === 'high' ? 'bg-red-100 text-red-700' :
                                product.urgency === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-green-100 text-green-700'
                              }`}>
                                {product.urgency === 'high' ? 'Mendesak' :
                                 product.urgency === 'medium' ? 'Sedang' : 'Rendah'}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600">
                              {product.quantity} {product.unit} • {product.category}
                            </p>
                            <div className="flex items-center space-x-2 mt-1">
                              <DollarSign className="w-4 h-4 text-green-600" />
                              <span className="text-sm font-medium text-green-600">
                                Est. Rp {product.estimatedPrice.toLocaleString('id-ID')}
                              </span>
                              <span className="text-xs text-gray-500">
                                (Hemat {calculateBulkSavings(product.estimatedPrice).percentage}% jika beli bersama)
                              </span>
                            </div>
                          </div>
                          
                          <button
                            onClick={() => toggleProductSelection(store.id, product.productName)}
                            className={`ml-3 p-2 rounded-lg transition-colors ${
                              selectedProducts[`${store.id}-${product.productName}`]
                                ? 'bg-primary text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                            {selectedProducts[`${store.id}-${product.productName}`] ? (
                              <Check className="w-4 h-4" />
                            ) : (
                              <Plus className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                        
                        <div className="text-xs text-gray-500 bg-gray-50 rounded p-2">
                          💡 <strong>Ingin ikut beli produk ini juga?</strong> Pilih produk yang ingin Anda beli bersama dengan {store.name}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Button */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div className="text-sm text-gray-600">
                    {Object.keys(selectedProducts).filter(key => 
                      key.startsWith(store.id) && selectedProducts[key]
                    ).length} produk dipilih
                  </div>
                  
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => joinCollectiveShopping(store.id)}
                    className="bg-primary text-white px-6 py-2 rounded-lg font-medium flex items-center space-x-2 hover:bg-primary-dark transition-colors"
                  >
                    <Users className="w-4 h-4" />
                    <span>Gabung Belanja Kolektif</span>
                  </motion.button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Collective Quantity Modal */}
      <CollectiveQuantityModal
        isOpen={showQuantityModal}
        onClose={() => {
          setShowQuantityModal(false);
          setSelectedStore(null);
        }}
        store={selectedStore}
        selectedProducts={selectedProducts}
        onConfirm={handleConfirmCollectiveOrder}
      />
    </div>
  );
}
