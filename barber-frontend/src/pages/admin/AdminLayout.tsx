import { Outlet, useNavigate, useLocation, useParams } from 'react-router-dom';

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { slug } = useParams<{ slug: string }>();

  // Aktif sekmeyi bulmak için
  const isActive = (path: string) => location.pathname.includes(path);

  return (
    <div className="min-h-screen bg-[#F6F5EFFF] text-gray-900 font-sans flex">
      
      {/* SOL SABİT SIDEBAR */}
      <aside className="w-72 bg-[#1A1A1A] text-white flex flex-col justify-between p-8 border-r border-gray-800">
        <div>
          <h1 className="text-2xl font-black tracking-widest uppercase mb-12">
            BERBER ADI
          </h1>

          <nav className="space-y-4 font-bold text-sm tracking-wide">
            <button
              onClick={() => navigate(`/${slug}/admin`)}
              className={`w-full text-left px-4 py-3 transition-colors ${
                location.pathname === `/${slug}/admin` || location.pathname === `/${slug}/admin/`
                  ? 'bg-[#F6F5EFFF] text-gray-900' 
                  : 'hover:bg-gray-800 text-gray-300'
              }`}
            >
              Ana Sayfa
            </button>
            <button
              onClick={() => navigate(`/${slug}/admin/calendar`)}
              className={`w-full text-left px-4 py-3 transition-colors ${
                isActive('calendar') ? 'bg-[#F6F5EFFF] text-gray-900' : 'hover:bg-gray-800 text-gray-300'
              }`}
            >
              Takvim
            </button>
            <button
              onClick={() => navigate(`/${slug}/admin/working-hours`)}
              className={`w-full text-left px-4 py-3 transition-colors ${
                isActive('working-hours') ? 'bg-[#F6F5EFFF] text-gray-900' : 'hover:bg-gray-800 text-gray-300'
              }`}
            >
              Çalışma Saatleri
            </button>
            <button
              onClick={() => navigate(`/${slug}/admin/settings`)}
              className={`w-full text-left px-4 py-3 transition-colors ${
                isActive('settings') ? 'bg-[#F6F5EFFF] text-gray-900' : 'hover:bg-gray-800 text-gray-300'
              }`}
            >
              Ayarlar
            </button>
          </nav>
        </div>

        {/* Çıkış Yap Butonu */}
        <button
          onClick={() => navigate(`/${slug}`)}
          className="text-left px-4 py-3 text-red-400 font-bold hover:bg-gray-800 transition"
        >
          Çıkış Yap
        </button>
      </aside>

      {/* SAĞ DİNAMİK İÇERİK ALANI */}
      <main className="flex-1 p-12 overflow-y-auto">
        <Outlet /> {/* Alt sayfalar buraya yüklenecek */}
      </main>

    </div>
  );
}