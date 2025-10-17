import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../config/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { 
  X, 
  Package, 
  MapPin, 
  DollarSign,
  Users,
  Calendar,
  Target,
  AlertCircle,
  Save
} from 'lucide-react';

export default function CreateCollectiveOrderModal({ isOpen, onClose }) {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    productName: '',
    productCategory: '',
    targetQuantity: '',
    minQuantity: '',
    unit: 'kg',
    regularPrice: '',
    collectivePrice: '',
    location: '',
    deadline: '',
    description: '',
    supplierInfo: ''
  });

  const unitOptions = [
    'kg', 'gram', 'liter', 'ml', 'pcs', 'pack', 'box', 'karton', 'sak', 'ton'
  ];

  const categoryOptions = [
    'Beras & Biji-bijian',
    'Minyak Goreng',
    'Gula & Pemanis',
    'Tepung & Bumbu',
    'Makanan Kaleng',
    'Minuman',
    'Snack & Kue',
    'Produk Susu',
    'Frozen Food',
    'Alat Tulis',
    'Perlengkapan Toko',
    'Lainnya'
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const calculateSavings = () => {
    const regular = parseFloat(formData.regularPrice) || 0;
    const collective = parseFloat(formData.collectivePrice) || 0;
    const minQty = parseFloat(formData.minQuantity) || 0;
    
    if (regular > 0 && collective > 0 && minQty > 0) {
      const savings = (regular - collective) * minQty;
      const percentage = ((regular - collective) / regular * 100).toFixed(1);
      return { savings, percentage };
    }
    return { savings: 0, percentage: 0 };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Calculate deadline timestamp
      const deadlineDate = new Date(formData.deadline);
      
      await addDoc(collection(db, 'collectiveOrders'), {
        ...formData,
        targetQuantity: parseInt(formData.targetQuantity),
        minQuantity: parseInt(formData.minQuantity),
        regularPrice: parseFloat(formData.regularPrice),
        collectivePrice: parseFloat(formData.collectivePrice),
        deadline: deadlineDate,
        createdBy: currentUser.uid,
        createdByEmail: currentUser.email,
        createdAt: serverTimestamp(),
        status: 'active',
        currentQuantity: 0,
        participantCount: 0,
        participants: []
      });

      // Reset form
      setFormData({
        productName: '',
        productCategory: '',
        targetQuantity: '',
        minQuantity: '',
        unit: 'kg',
        regularPrice: '',
        collectivePrice: '',
        location: '',
        deadline: '',
        description: '',
        supplierInfo: ''
      });

      onClose();
    } catch (error) {
      console.error('Error creating collective order:', error);
      alert('Gagal membuat pesanan kolektif');
    }

    setLoading(false);
  };

  const isFormValid = () => {
    return formData.productName && 
           formData.targetQuantity && 
           formData.minQuantity && 
           formData.regularPrice && 
           formData.collectivePrice && 
           formData.location && 
           formData.deadline;
  };

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
                  <Package className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-secondary">Buat Pesanan Kolektif</h2>
                  <p className="text-sm text-gray-600">Ajak UMKM lain berbelanja bersama</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Form Content - Scrollable */}
            <div className="flex-1 overflow-y-auto p-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Product Info */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-800 flex items-center space-x-2">
                    <Package className="w-4 h-4" />
                    <span>Informasi Produk</span>
                  </h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nama Produk *
                    </label>
                    <input
                      type="text"
                      name="productName"
                      value={formData.productName}
                      onChange={handleInputChange}
                      className="input-field"
                      placeholder="Contoh: Beras Premium 5kg"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Kategori Produk
                    </label>
                    <select
                      name="productCategory"
                      value={formData.productCategory}
                      onChange={handleInputChange}
                      className="input-field"
                    >
                      <option value="">Pilih kategori</option>
                      {categoryOptions.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Quantity & Pricing */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-800 flex items-center space-x-2">
                    <Target className="w-4 h-4" />
                    <span>Target & Harga</span>
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Target Quantity *
                      </label>
                      <input
                        type="number"
                        name="targetQuantity"
                        value={formData.targetQuantity}
                        onChange={handleInputChange}
                        className="input-field"
                        placeholder="100"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Satuan *
                      </label>
                      <select
                        name="unit"
                        value={formData.unit}
                        onChange={handleInputChange}
                        className="input-field"
                        required
                      >
                        {unitOptions.map(unit => (
                          <option key={unit} value={unit}>{unit}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Minimum Quantity per Peserta *
                    </label>
                    <input
                      type="number"
                      name="minQuantity"
                      value={formData.minQuantity}
                      onChange={handleInputChange}
                      className="input-field"
                      placeholder="5"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Harga Normal (per {formData.unit}) *
                      </label>
                      <input
                        type="number"
                        name="regularPrice"
                        value={formData.regularPrice}
                        onChange={handleInputChange}
                        className="input-field"
                        placeholder="15000"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Harga Grosir (per {formData.unit}) *
                      </label>
                      <input
                        type="number"
                        name="collectivePrice"
                        value={formData.collectivePrice}
                        onChange={handleInputChange}
                        className="input-field"
                        placeholder="12000"
                        required
                      />
                    </div>
                  </div>

                  {/* Savings Calculator */}
                  {formData.regularPrice && formData.collectivePrice && formData.minQuantity && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-green-800">Potensi Penghematan</p>
                          <p className="text-xs text-green-600">
                            Per {formData.minQuantity} {formData.unit}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-green-600">
                            {calculateSavings().percentage}%
                          </p>
                          <p className="text-xs text-green-600">
                            Rp {calculateSavings().savings.toLocaleString('id-ID')}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Location & Deadline */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-800 flex items-center space-x-2">
                    <MapPin className="w-4 h-4" />
                    <span>Lokasi & Waktu</span>
                  </h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Area/Kota *
                    </label>
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      className="input-field"
                      placeholder="Contoh: Jakarta Selatan"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Batas Waktu *
                    </label>
                    <input
                      type="datetime-local"
                      name="deadline"
                      value={formData.deadline}
                      onChange={handleInputChange}
                      className="input-field"
                      required
                    />
                  </div>
                </div>

                {/* Additional Info */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Deskripsi Produk
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      className="input-field"
                      rows="3"
                      placeholder="Deskripsi detail produk, kualitas, dll..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Info Supplier/Distributor
                    </label>
                    <input
                      type="text"
                      name="supplierInfo"
                      value={formData.supplierInfo}
                      onChange={handleInputChange}
                      className="input-field"
                      placeholder="Nama supplier atau distributor"
                    />
                  </div>
                </div>
              </form>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 p-4">
              <div className="flex items-center space-x-3 mb-3">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                <p className="text-xs text-gray-600">
                  Pastikan semua informasi akurat. Pesanan tidak dapat diubah setelah dibuat.
                </p>
              </div>
              
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 btn-secondary"
                >
                  Batal
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!isFormValid() || loading}
                  className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Membuat...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center space-x-2">
                      <Save size={16} />
                      <span>Buat Pesanan</span>
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
