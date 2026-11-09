import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation, useParams } from 'react-router-dom';
import { getShopBySlug } from '../../services/api';
 
/* -------------------------------------------------------------------------- */
/*  Sabitler                                                                  */
/* -------------------------------------------------------------------------- */
 
/**
 * Sidebar genişliği. Değiştirmek için sadece bu sınıfı güncelleyin:
 * w-72 (288px) · w-80 (320px) · w-96 (384px) · w-[420px] (özel değer)
 */
const SIDEBAR_WIDTH = 'w-96';
 
interface NavItem {
  label: string;
  /** /:slug/admin sonrasındaki yol. Ana sayfa için boş bırakılır. */
  path: string;
}
 
const NAV_ITEMS: NavItem[] = [
  { label: 'Ana Sayfa', path: '' },
  { label: 'Takvim', path: 'calendar' },
  { label: 'Çalışma Saatleri', path: 'working-hours' },
  { label: 'Kara Liste', path: 'blacklist' },
  { label: 'Ayarlar', path: 'settings' },
];
 
/* -------------------------------------------------------------------------- */
/*  Bileşen                                                                   */
/* -------------------------------------------------------------------------- */
 
export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { slug } = useParams<{ slug: string }>();
 
  // Backend'den dükkan adını dinamik olarak çekmek için
  const [shopName, setShopName] = useState<string>('YÜKLENİYOR...');
 
  useEffect(() => {
    if (!slug) return;
 
    let isMounted = true;
 
    const fetchShopName = async () => {
      try {
        const shop = await getShopBySlug(slug);
        if (isMounted) setShopName(shop.name);
      } catch {
        if (isMounted) setShopName('BERBER ADI'); // Hata durumunda varsayılan
      }
    };
 
    fetchShopName();
 
    return () => {
      isMounted = false;
    };
  }, [slug]);
 
  const basePath = `/${slug}/admin`;
 
  const getFullPath = (item: NavItem) => (item.path ? `${basePath}/${item.path}` : basePath);
 
  // Ana sayfa birebir eşleşmeli, diğer sekmeler yol ile başlıyorsa aktif sayılır
  const isActive = (item: NavItem) => {
    const fullPath = getFullPath(item);
    if (item.path === '') {
      return location.pathname === fullPath || location.pathname === `${fullPath}/`;
    }
    return location.pathname.startsWith(fullPath);
  };
 
  const handleLogout = () => {
    localStorage.removeItem('adminToken'); // Çıkış yaparken token'ı temizle
    navigate(`/${slug}`);
  };
 
  return (
    <div className="min-h-screen bg-[#F6F5EFFF] text-gray-900 font-sans flex">
      {/* SOL SABİT SIDEBAR */}
      <aside
        className={`${SIDEBAR_WIDTH} shrink-0 bg-[#1A1A1A] text-white flex flex-col justify-between p-8 border-r border-gray-800`}
      >
        <div>
          {/* Dinamik Dükkan Adı */}
          <h1
            className="text-2xl font-black tracking-widest uppercase mb-12 truncate"
            title={shopName}
          >
            {shopName}
          </h1>
 
          <nav className="space-y-4 font-bold text-sm tracking-wide">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.label}
                onClick={() => navigate(getFullPath(item))}
                className={`w-full text-left px-4 py-3 transition-colors cursor-pointer ${
                  isActive(item)
                    ? 'bg-[#F6F5EFFF] text-gray-900'
                    : 'hover:bg-gray-800 text-gray-300'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>
 
        {/* Çıkış Yap Butonu */}
        <button
          onClick={handleLogout}
          className="text-left px-4 py-3 text-red-400 font-bold hover:bg-gray-800 transition cursor-pointer"
        >
          Çıkış Yap
        </button>
      </aside>
 
      {/* SAĞ DİNAMİK İÇERİK ALANI */}
      <main className="flex-1 min-w-0 p-12 overflow-y-auto">
        <Outlet /> {/* Alt sayfalar buraya yüklenecek */}
      </main>
    </div>
  );
}
 