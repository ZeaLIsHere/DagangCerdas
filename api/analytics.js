// Vercel Serverless Function for AI Analytics
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { sales, products } = req.body;

    if (!sales || !products) {
      return res.status(400).json({ error: 'Sales and products data required' });
    }

    // Simple AI Analytics Logic
    const insights = generateInsights(sales, products);

    res.status(200).json({
      success: true,
      insights,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}

function generateInsights(sales, products) {
  const insights = [];

  // Get sales from last 7 days
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  
  const recentSales = sales.filter(sale => {
    const saleDate = new Date(sale.timestamp);
    return saleDate >= weekAgo;
  });

  // 1. Best Selling Product Analysis
  const productSales = {};
  recentSales.forEach(sale => {
    productSales[sale.productId] = (productSales[sale.productId] || 0) + 1;
  });

  if (Object.keys(productSales).length > 0) {
    const bestSellingProductId = Object.keys(productSales).reduce((a, b) => 
      productSales[a] > productSales[b] ? a : b
    );
    
    const bestSellingProduct = products.find(p => p.id === bestSellingProductId);
    const bestSellingCount = productSales[bestSellingProductId];

    if (bestSellingProduct && bestSellingCount > 0) {
      insights.push({
        type: 'best_seller',
        title: 'Produk Terlaris',
        message: `${bestSellingProduct.nama} adalah produk terlaris dengan ${bestSellingCount} penjualan minggu ini`,
        recommendation: bestSellingCount > 5 
          ? `Pertimbangkan untuk menambah stok ${bestSellingProduct.nama} karena permintaan tinggi`
          : `Promosikan ${bestSellingProduct.nama} lebih gencar untuk meningkatkan penjualan`,
        priority: 'high'
      });
    }
  }

  // 2. Stock Level Analysis
  const lowStockProducts = products.filter(p => p.stok > 0 && p.stok <= 5);
  const outOfStockProducts = products.filter(p => p.stok === 0);

  if (outOfStockProducts.length > 0) {
    insights.push({
      type: 'stock_alert',
      title: 'Stok Habis',
      message: `${outOfStockProducts.length} produk kehabisan stok`,
      recommendation: 'Segera restok produk yang habis untuk menghindari kehilangan penjualan',
      priority: 'critical',
      products: outOfStockProducts.map(p => p.nama)
    });
  }

  if (lowStockProducts.length > 0) {
    insights.push({
      type: 'low_stock',
      title: 'Stok Menipis',
      message: `${lowStockProducts.length} produk memiliki stok rendah`,
      recommendation: 'Siapkan rencana restok untuk produk dengan stok menipis',
      priority: 'medium',
      products: lowStockProducts.map(p => ({ nama: p.nama, stok: p.stok }))
    });
  }

  // 3. Sales Trend Analysis
  const dailySales = {};
  recentSales.forEach(sale => {
    const date = new Date(sale.timestamp).toDateString();
    dailySales[date] = (dailySales[date] || 0) + 1;
  });

  const salesDays = Object.keys(dailySales).length;
  const averageDailySales = salesDays > 0 ? recentSales.length / salesDays : 0;

  if (averageDailySales > 0) {
    insights.push({
      type: 'sales_trend',
      title: 'Tren Penjualan',
      message: `Rata-rata ${Math.round(averageDailySales)} penjualan per hari`,
      recommendation: averageDailySales > 10 
        ? 'Penjualan Anda sangat baik! Pertimbangkan untuk menambah variasi produk'
        : averageDailySales > 5
        ? 'Penjualan stabil. Coba strategi promosi untuk meningkatkan penjualan'
        : 'Penjualan masih rendah. Fokus pada promosi dan layanan pelanggan',
      priority: averageDailySales > 10 ? 'low' : 'medium'
    });
  }

  // 4. Revenue Analysis
  const weeklyRevenue = recentSales.reduce((sum, sale) => sum + sale.price, 0);
  const dailyAverageRevenue = salesDays > 0 ? weeklyRevenue / salesDays : 0;

  if (weeklyRevenue > 0) {
    insights.push({
      type: 'revenue',
      title: 'Analisis Pendapatan',
      message: `Pendapatan minggu ini: Rp ${weeklyRevenue.toLocaleString('id-ID')}`,
      recommendation: dailyAverageRevenue > 100000 
        ? 'Pendapatan harian sangat baik! Pertahankan momentum ini'
        : dailyAverageRevenue > 50000
        ? 'Pendapatan cukup baik. Cari peluang untuk meningkatkan margin keuntungan'
        : 'Fokus pada strategi peningkatan penjualan dan efisiensi operasional',
      priority: 'medium',
      weeklyRevenue,
      dailyAverageRevenue: Math.round(dailyAverageRevenue)
    });
  }

  // 5. Product Performance Analysis
  const slowMovingProducts = products.filter(product => {
    const productSaleCount = productSales[product.id] || 0;
    return product.stok > 20 && productSaleCount < 2;
  });

  if (slowMovingProducts.length > 0) {
    insights.push({
      type: 'slow_moving',
      title: 'Produk Kurang Laku',
      message: `${slowMovingProducts.length} produk memiliki penjualan rendah dengan stok tinggi`,
      recommendation: 'Pertimbangkan promosi khusus atau diskon untuk produk yang kurang laku',
      priority: 'low',
      products: slowMovingProducts.map(p => ({ nama: p.nama, stok: p.stok }))
    });
  }

  // Sort insights by priority
  const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
  insights.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);

  return insights;
}
