# DagangCerdas - Asisten Bisnis Virtual

Aplikasi Web Progresif (PWA) untuk pengusaha ultra-mikro yang mengubah data transaksi mentah menjadi saran bisnis praktis.

## 🚀 Fitur Utama

### 📊 Dashboard Cerdas
- Overview bisnis real-time
- Statistik penjualan dan pendapatan
- Analisis produk terlaris
- Notifikasi stok menipis

### 🛒 Sistem Kasir
- Interface mobile-first yang mudah digunakan
- Keranjang belanja interaktif
- Checkout cepat dengan satu sentuhan
- Kategorisasi produk otomatis

### 📦 Manajemen Stok
- Update stok dengan sistem batch
- Dukungan berbagai satuan (pcs, kg, liter, dll.)
- Peringatan stok menipis/habis
- Edit produk dengan mudah

### 🔔 Sistem Notifikasi
- Alert stok habis/menipis
- Insight penjualan otomatis
- Saran bisnis berbasis AI
- Tren penjualan harian

### 🤖 AI Analytics
- Analisis produk terlaris
- Rekomendasi restok
- Prediksi tren penjualan
- Saran optimasi bisnis

## 🛠️ Teknologi

### Frontend
- **React 18** - Framework UI modern
- **Vite** - Build tool cepat
- **Tailwind CSS** - Styling utility-first
- **Framer Motion** - Animasi smooth
- **React Router** - Navigasi SPA

### Backend
- **Firebase Firestore** - Database NoSQL real-time
- **Firebase Auth** - Autentikasi pengguna
- **Vercel Functions** - Serverless AI analytics

### PWA Features
- **Offline Support** - Bekerja tanpa internet
- **Install to Home Screen** - Seperti aplikasi native
- **Push Notifications** - Notifikasi real-time

## 📱 Setup & Installation

### 1. Clone Repository
```bash
git clone <repository-url>
cd dagangcerdas
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Firebase Configuration
1. Buat project di [Firebase Console](https://console.firebase.google.com)
2. Enable Authentication (Email/Password)
3. Enable Firestore Database
4. Copy config ke `src/config/firebase.js`:

```javascript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};
```

### 4. Firestore Security Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /products/{document} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
    }
    match /sales/{document} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
    }
  }
}
```

### 5. Development Server
```bash
npm run dev
```

### 6. Build for Production
```bash
npm run build
```

## 🚀 Deployment

### Vercel (Recommended)
1. Push code ke GitHub
2. Connect repository di [Vercel](https://vercel.com)
3. Deploy otomatis dengan CI/CD

### Manual Deployment
```bash
npm run build
# Upload dist/ folder ke hosting provider
```

## 📊 Database Schema

### Collection: `products`
```javascript
{
  id: "auto-generated",
  nama: "string",
  harga: "number",
  stok: "number",
  kategori: "string",
  batchSize: "number",
  satuan: "string",
  userId: "string",
  createdAt: "timestamp"
}
```

### Collection: `sales`
```javascript
{
  id: "auto-generated",
  productId: "string",
  productName: "string",
  price: "number",
  timestamp: "timestamp",
  userId: "string"
}
```

## 🎨 Design System

### Colors
- **Primary**: #FF7A00 (Orange)
- **Secondary**: #1E293B (Dark Blue)
- **Accent**: #F97316 (Light Orange)
- **Success**: #10B981 (Green)
- **Warning**: #F59E0B (Yellow)
- **Error**: #EF4444 (Red)

### Typography
- **Font**: Inter (Google Fonts)
- **Weights**: 300, 400, 500, 600, 700

## 📱 Mobile-First Design

Aplikasi didesain khusus untuk penggunaan mobile dengan:
- Touch-friendly interface
- Gesture navigation
- Responsive grid system
- Optimized for small screens

## 🔐 Security Features

- Firebase Authentication
- User data isolation
- Secure Firestore rules
- Input validation
- XSS protection

## 🚀 Performance

- Lazy loading components
- Image optimization
- Code splitting
- Service worker caching
- Minimal bundle size

## 📈 Analytics & Insights

AI-powered analytics memberikan:
- Identifikasi produk terlaris
- Prediksi kebutuhan stok
- Analisis tren penjualan
- Rekomendasi bisnis praktis

## 🛠️ Development

### Project Structure
```
src/
├── components/     # Reusable components
├── contexts/       # React contexts
├── pages/          # Page components
├── config/         # Configuration files
└── index.css       # Global styles

api/
└── analytics.js    # Vercel serverless function
```

### Available Scripts
- `npm run dev` - Development server
- `npm run build` - Production build
- `npm run preview` - Preview build
- `npm run lint` - ESLint check

## 🤝 Contributing

1. Fork repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## 📄 License

MIT License - see LICENSE file for details

## 📞 Support

Untuk bantuan dan pertanyaan:
- Email: support@dagangcerdas.com
- Documentation: [docs.dagangcerdas.com]
- Issues: GitHub Issues

---

**DagangCerdas** - Mengubah cara pengusaha mikro mengelola bisnis mereka dengan teknologi modern dan AI yang mudah digunakan.
