import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../config/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { 
  BarChart3, 
  TrendingUp, 
  Calendar, 
  DollarSign, 
  Package, 
  ShoppingCart,
  Filter,
  Download,
  ChevronDown,
  ChevronUp,
  X,
  Lightbulb,
  Target,
  Clock,
  TrendingDown
} from 'lucide-react';

export default function Statistics() {
  const { currentUser } = useAuth();
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterPeriod, setFilterPeriod] = useState('today'); // today, week, month, year, custom
  const [customDateRange, setCustomDateRange] = useState({
    start: '',
    end: ''
  });
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [showInsightModal, setShowInsightModal] = useState(false);

  useEffect(() => {
    if (!currentUser) return;

    // Listen to sales data
    const salesQuery = query(
      collection(db, 'sales'),
      where('userId', '==', currentUser.uid)
    );

    const unsubscribeSales = onSnapshot(salesQuery, (snapshot) => {
      const salesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Sort by timestamp in JavaScript (newest first)
      salesData.sort((a, b) => {
        if (!a.timestamp || !b.timestamp) return 0;
        return b.timestamp.toDate() - a.timestamp.toDate();
      });
      
      setSales(salesData);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching sales:', error);
      setLoading(false);
    });

    // Listen to products data
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
    }, (error) => {
      console.error('Error fetching products:', error);
    });

    return () => {
      unsubscribeSales();
      unsubscribeProducts();
    };
  }, [currentUser]);

  // Filter sales based on selected period
  const getFilteredSales = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    return sales.filter(sale => {
      if (!sale.timestamp) return false;
      
      const saleDate = sale.timestamp.toDate();
      
      switch (filterPeriod) {
        case 'today':
          return saleDate >= today;
        
        case 'week':
          const weekAgo = new Date(today);
          weekAgo.setDate(weekAgo.getDate() - 7);
          return saleDate >= weekAgo;
        
        case 'month':
          const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
          return saleDate >= monthStart;
        
        case 'year':
          const yearStart = new Date(now.getFullYear(), 0, 1);
          return saleDate >= yearStart;
        
        case 'custom':
          if (!customDateRange.start || !customDateRange.end) return true;
          const startDate = new Date(customDateRange.start);
          const endDate = new Date(customDateRange.end);
          endDate.setHours(23, 59, 59, 999); // Include end of day
          return saleDate >= startDate && saleDate <= endDate;
        
        default:
          return true;
      }
    });
  };

  const filteredSales = getFilteredSales();

  // Calculate statistics
  const getTotalRevenue = () => {
    return filteredSales.reduce((total, sale) => total + sale.price, 0);
  };

  const getTotalTransactions = () => {
    return filteredSales.length;
  };

  const getAverageTransaction = () => {
    const total = getTotalRevenue();
    const count = getTotalTransactions();
    return count > 0 ? total / count : 0;
  };

  const getTopProducts = () => {
    const productSales = {};
    
    filteredSales.forEach(sale => {
      if (productSales[sale.productName]) {
        productSales[sale.productName].count += 1;
        productSales[sale.productName].revenue += sale.price;
      } else {
        productSales[sale.productName] = {
          name: sale.productName,
          count: 1,
          revenue: sale.price
        };
      }
    });

    return Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  };

  // Group sales by date for chart
  const getSalesByDate = () => {
    const salesByDate = {};
    
    filteredSales.forEach(sale => {
      const date = sale.timestamp.toDate().toLocaleDateString('id-ID');
      if (salesByDate[date]) {
        salesByDate[date] += sale.price;
      } else {
        salesByDate[date] = sale.price;
      }
    });

    return Object.entries(salesByDate)
      .sort(([a], [b]) => new Date(a.split('/').reverse().join('-')) - new Date(b.split('/').reverse().join('-')))
      .slice(-7); // Last 7 days
  };

  const getPeriodLabel = () => {
    switch (filterPeriod) {
      case 'today': return 'Hari Ini';
      case 'week': return '7 Hari Terakhir';
      case 'month': return 'Bulan Ini';
      case 'year': return 'Tahun Ini';
      case 'custom': return 'Periode Kustom';
      default: return 'Semua Data';
    }
  };

  // Get busiest day of the week
  const getBusiestDay = () => {
    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const weekSales = sales.filter(sale => {
      if (!sale.timestamp) return false;
      const saleDate = sale.timestamp.toDate();
      return saleDate >= weekAgo;
    });

    const dayCount = {};
    const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    
    weekSales.forEach(sale => {
      const dayOfWeek = sale.timestamp.toDate().getDay();
      const dayName = dayNames[dayOfWeek];
      dayCount[dayName] = (dayCount[dayName] || 0) + 1;
    });

    if (Object.keys(dayCount).length === 0) return null;

    const busiestDay = Object.entries(dayCount)
      .sort(([,a], [,b]) => b - a)[0];
    
    return {
      day: busiestDay[0],
      count: busiestDay[1],
      dayIndex: dayNames.indexOf(busiestDay[0])
    };
  };

  // Get sales data for the busiest day
  const getBusiestDayDetails = () => {
    const busiestDay = getBusiestDay();
    if (!busiestDay) return null;

    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);

    // Find the most recent occurrence of the busiest day
    const busiestDaySales = sales.filter(sale => {
      if (!sale.timestamp) return false;
      const saleDate = sale.timestamp.toDate();
      return saleDate >= weekAgo && saleDate.getDay() === busiestDay.dayIndex;
    });

    // Group by product
    const productSales = {};
    let totalRevenue = 0;

    busiestDaySales.forEach(sale => {
      totalRevenue += sale.price;
      if (productSales[sale.productName]) {
        productSales[sale.productName].count += 1;
        productSales[sale.productName].revenue += sale.price;
      } else {
        productSales[sale.productName] = {
          name: sale.productName,
          count: 1,
          revenue: sale.price
        };
      }
    });

    return {
      day: busiestDay.day,
      totalTransactions: busiestDay.count,
      totalRevenue,
      products: Object.values(productSales).sort((a, b) => b.revenue - a.revenue)
    };
  };

  // Generate AI suggestions based on busiest day analysis
  const getAISuggestions = () => {
    const details = getBusiestDayDetails();
    if (!details) return [];

    const suggestions = [];
    const { day, totalTransactions, totalRevenue, products } = details;
    const avgTransaction = totalRevenue / totalTransactions;

    // Suggestion based on day pattern
    if (['Sabtu', 'Minggu'].includes(day)) {
      suggestions.push({
        type: 'schedule',
        title: 'Optimasi Jadwal Weekend',
        content: `Hari ${day} adalah hari tersibuk Anda. Pastikan stok produk terlaris mencukupi dan pertimbangkan untuk menambah jam operasional di weekend.`
      });
    } else {
      suggestions.push({
        type: 'schedule',
        title: 'Pola Hari Kerja',
        content: `Hari ${day} menunjukkan aktivitas tinggi di hari kerja. Manfaatkan momentum ini dengan promosi khusus atau bundle produk.`
      });
    }

    // Suggestion based on top product
    if (products.length > 0) {
      const topProduct = products[0];
      suggestions.push({
        type: 'product',
        title: 'Fokus Produk Unggulan',
        content: `${topProduct.name} adalah produk terlaris di hari ${day} dengan ${topProduct.count} penjualan. Pastikan stok selalu tersedia dan pertimbangkan untuk membuat varian atau bundle.`
      });
    }

    // Suggestion based on revenue
    if (avgTransaction > 10000) {
      suggestions.push({
        type: 'pricing',
        title: 'Strategi Premium',
        content: `Rata-rata transaksi Rp ${avgTransaction.toLocaleString('id-ID')} menunjukkan customer willing to pay premium. Pertimbangkan untuk menaikkan margin atau menambah produk premium.`
      });
    } else {
      suggestions.push({
        type: 'volume',
        title: 'Strategi Volume',
        content: `Dengan rata-rata transaksi Rp ${avgTransaction.toLocaleString('id-ID')}, fokus pada peningkatan volume penjualan dengan promosi bundle atau diskon quantity.`
      });
    }

    // Suggestion based on product diversity
    if (products.length >= 3) {
      suggestions.push({
        type: 'diversity',
        title: 'Diversifikasi Berhasil',
        content: `Anda berhasil menjual ${products.length} jenis produk berbeda di hari ${day}. Pertahankan variasi produk dan analisis cross-selling opportunity.`
      });
    }

    return suggestions;
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
        <h1 className="text-2xl font-bold text-secondary mb-2">Data & Statistik</h1>
        <p className="text-gray-600">Analisis penjualan dan performa bisnis Anda</p>
      </div>

      {/* Filter Section - Accordion Style */}
      <div className="card">
        <button
          onClick={() => setIsFilterOpen(!isFilterOpen)}
          className="w-full flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors"
        >
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-secondary">Filter Periode</h3>
            <span className="text-sm text-gray-500">({getPeriodLabel()})</span>
          </div>
          {isFilterOpen ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </button>

        <motion.div
          initial={false}
          animate={{ 
            height: isFilterOpen ? 'auto' : 0,
            opacity: isFilterOpen ? 1 : 0
          }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="overflow-hidden"
        >
          <div className="pt-4 space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { value: 'today', label: 'Hari Ini' },
                { value: 'week', label: '7 Hari' },
                { value: 'month', label: 'Bulan Ini' },
                { value: 'year', label: 'Tahun Ini' },
                { value: 'custom', label: 'Kustom' }
              ].map(period => (
                <button
                  key={period.value}
                  onClick={() => setFilterPeriod(period.value)}
                  className={`p-2 rounded-lg text-sm font-medium transition-colors ${
                    filterPeriod === period.value
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {period.label}
                </button>
              ))}
            </div>

            {filterPeriod === 'custom' && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="grid grid-cols-2 gap-3"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dari</label>
                  <input
                    type="date"
                    value={customDateRange.start}
                    onChange={(e) => setCustomDateRange(prev => ({ ...prev, start: e.target.value }))}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sampai</label>
                  <input
                    type="date"
                    value={customDateRange.end}
                    onChange={(e) => setCustomDateRange(prev => ({ ...prev, end: e.target.value }))}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Pendapatan</p>
              <p className="text-lg font-bold text-secondary">
                Rp {getTotalRevenue().toLocaleString('id-ID')}
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
              <ShoppingCart className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Transaksi</p>
              <p className="text-lg font-bold text-secondary">{getTotalTransactions()}</p>
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
              <p className="text-sm text-gray-600">Rata-rata/Transaksi</p>
              <p className="text-lg font-bold text-secondary">
                Rp {getAverageTransaction().toLocaleString('id-ID')}
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
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Produk</p>
              <p className="text-lg font-bold text-secondary">{products.length}</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Busiest Day Insight */}
      {getBusiestDay() && (
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowInsightModal(true)}
          className="w-full text-left card bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200 hover:shadow-md transition-all duration-200"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-secondary mb-1">Insight Mingguan</h3>
              <p className="text-sm text-gray-700">
                Transaksi terbanyak terjadi pada hari{' '}
                <span className="font-bold text-blue-600">{getBusiestDay().day}</span>{' '}
                dalam minggu ini dengan{' '}
                <span className="font-bold text-blue-600">{getBusiestDay().count} transaksi</span>
              </p>
              <p className="text-xs text-blue-500 mt-1"> Tap untuk detail & saran AI</p>
            </div>
          </div>
        </motion.button>
      )}

      {/* Sales Chart */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-secondary">Grafik Penjualan</h3>
          </div>
        </div>

        <div className="space-y-3">
          {getSalesByDate().map(([date, revenue], index) => {
            const maxRevenue = Math.max(...getSalesByDate().map(([, rev]) => rev));
            const percentage = maxRevenue > 0 ? (revenue / maxRevenue) * 100 : 0;
            
            return (
              <div key={date} className="flex items-center space-x-3">
                <div className="w-16 text-xs text-gray-600">{date}</div>
                <div className="flex-1 bg-gray-200 rounded-full h-4 relative">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ delay: index * 0.1, duration: 0.5 }}
                    className="bg-primary h-4 rounded-full"
                  />
                </div>
                <div className="w-20 text-xs text-gray-800 text-right">
                  Rp {revenue.toLocaleString('id-ID')}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top Products */}
      <div className="card">
        <div className="flex items-center space-x-2 mb-4">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-secondary">Produk Terlaris</h3>
        </div>

        <div className="space-y-3">
          {getTopProducts().map((product, index) => (
            <div key={product.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm font-bold">
                  {index + 1}
                </div>
                <div>
                  <p className="font-medium text-secondary">{product.name}</p>
                  <p className="text-sm text-gray-600">{product.count} terjual</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-success">
                  Rp {product.revenue.toLocaleString('id-ID')}
                </p>
              </div>
            </div>
          ))}
          
          {getTopProducts().length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Package className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>Belum ada data penjualan untuk periode ini</p>
            </div>
          )}
        </div>
      </div>

      {/* Insight Detail Modal */}
      {showInsightModal && getBusiestDayDetails() && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setShowInsightModal(false)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-secondary">Detail Hari {getBusiestDayDetails().day}</h2>
                  <p className="text-sm text-gray-600">Analisis penjualan & saran AI</p>
                </div>
              </div>
              <button
                onClick={() => setShowInsightModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
              <div className="p-6 space-y-6">
                {/* Summary Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <DollarSign className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium text-green-800">Total Pendapatan</span>
                    </div>
                    <p className="text-lg font-bold text-green-700">
                      Rp {getBusiestDayDetails().totalRevenue.toLocaleString('id-ID')}
                    </p>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <ShoppingCart className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-800">Total Transaksi</span>
                    </div>
                    <p className="text-lg font-bold text-blue-700">
                      {getBusiestDayDetails().totalTransactions}
                    </p>
                  </div>
                </div>

                {/* Products Sold */}
                <div>
                  <h3 className="font-semibold text-secondary mb-3 flex items-center">
                    <Package className="w-4 h-4 mr-2" />
                    Produk Terjual
                  </h3>
                  <div className="space-y-2">
                    {getBusiestDayDetails().products.map((product, index) => (
                      <div key={product.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white text-xs font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium text-secondary">{product.name}</p>
                            <p className="text-xs text-gray-600">{product.count} terjual</p>
                          </div>
                        </div>
                        <p className="font-bold text-success">
                          Rp {product.revenue.toLocaleString('id-ID')}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* AI Suggestions */}
                <div>
                  <h3 className="font-semibold text-secondary mb-3 flex items-center">
                    <Lightbulb className="w-4 h-4 mr-2 text-yellow-500" />
                    Saran AI untuk Bisnis Anda
                  </h3>
                  <div className="space-y-3">
                    {getAISuggestions().map((suggestion, index) => {
                      const getIcon = (type) => {
                        switch (type) {
                          case 'schedule': return <Clock className="w-4 h-4" />;
                          case 'product': return <Package className="w-4 h-4" />;
                          case 'pricing': return <TrendingUp className="w-4 h-4" />;
                          case 'volume': return <TrendingDown className="w-4 h-4" />;
                          case 'diversity': return <Target className="w-4 h-4" />;
                          default: return <Lightbulb className="w-4 h-4" />;
                        }
                      };

                      const getColor = (type) => {
                        switch (type) {
                          case 'schedule': return 'text-blue-600 bg-blue-50 border-blue-200';
                          case 'product': return 'text-green-600 bg-green-50 border-green-200';
                          case 'pricing': return 'text-purple-600 bg-purple-50 border-purple-200';
                          case 'volume': return 'text-orange-600 bg-orange-50 border-orange-200';
                          case 'diversity': return 'text-pink-600 bg-pink-50 border-pink-200';
                          default: return 'text-gray-600 bg-gray-50 border-gray-200';
                        }
                      };

                      return (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className={`p-4 rounded-lg border ${getColor(suggestion.type)}`}
                        >
                          <div className="flex items-start space-x-3">
                            <div className={`p-2 rounded-lg ${getColor(suggestion.type)}`}>
                              {getIcon(suggestion.type)}
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-secondary mb-1">{suggestion.title}</h4>
                              <p className="text-sm text-gray-700">{suggestion.content}</p>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
