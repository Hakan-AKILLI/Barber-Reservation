import { useState, useEffect } from 'react';
import { Routes, Route, useParams, useNavigate } from 'react-router-dom';
import { getAvailableSlots, bookAppointment, getShopBySlug, adminLogin } from './services/api';
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminWorkingHours from './pages/admin/AdminWorkingHours';
import AdminCalendar from './pages/admin/AdminCalendar';

interface Shop {
  id: number;
  name: string;
  slug: string;
  phone: string;
  address: string;
  active: boolean;
}

interface TimeSlot {
  id: number;
  slotDate: string;
  startTime: string;
  endTime: string;
  booked: boolean;
  active: boolean;
  shop: Shop;
}

// Ana Ekran Bileşenimiz (BookingPage)
function BookingPage() {
  const { slug } = useParams<{ slug: string }>(); 
  const navigate = useNavigate();
  const [shop, setShop] = useState<Shop | null>(null);
  const [shopError, setShopError] = useState(false);

  const getFormattedDate = (addDays: number) => {
    const date = new Date();
    date.setDate(date.getDate() + addDays);
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`; 
  };

  const daysList = [
    { label: 'Bugün', value: getFormattedDate(0) },
    { label: 'Yarın', value: getFormattedDate(1) },
    { label: 'Gün 3', value: getFormattedDate(2) },
    { label: 'Gün 4', value: getFormattedDate(3) },
    { label: 'Gün 5', value: getFormattedDate(4) },
    { label: 'Gün 6', value: getFormattedDate(5) },
    { label: 'Gün 7', value: getFormattedDate(6) },
  ];

  const [selectedDate, setSelectedDate] = useState(daysList[0].value);
  const [slots, setSlots] = useState<TimeSlot[]>([]); 
  const [loading, setLoading] = useState(false);
  
  // Randevu Modal & Form State'leri
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [serviceType, setServiceType] = useState(''); 
  const [pnrCode, setPnrCode] = useState<string | null>(null); 
  const [isBooking, setIsBooking] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Berber Giriş Modal State'leri
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState(false);

  // Dükkan Bilgisini Çek
  useEffect(() => {
    const fetchShop = async () => {
      if (!slug) return;
      try {
        const shopData = await getShopBySlug(slug);
        setShop(shopData);
      } catch (error) {
        console.error("Dükkan bulunamadı:", error);
        setShopError(true);
      }
    };
    fetchShop();
  }, [slug]);

  // Saatleri Çek
  useEffect(() => {
    const fetchSlots = async () => {
      if (!shop) return; 
      
      setLoading(true);
      try {
        const data = await getAvailableSlots(shop.id, selectedDate);
        setSlots(data);
      } catch (error) {
        console.error("Saatler çekilemedi:", error);
        setSlots([]); 
      } finally {
        setLoading(false);
      }
    };

    fetchSlots();
  }, [selectedDate, refreshKey, shop]);

  // Randevu Oluştur
  const handleBook = async () => {
    if (!selectedSlot || !customerName || !customerPhone || !serviceType || !shop) {
      alert("Lütfen ad, telefon ve talep alanlarını doldurun.");
      return;
    }
    
    setIsBooking(true);
    try {
      const payload = {
        timeSlotId: selectedSlot.id,
        customerName: customerName,
        customerPhone: customerPhone,
        serviceType: serviceType
      };
      
      const result = await bookAppointment(payload);
      setPnrCode(result.cancellationCode || result.pnrCode || "KOD-ALINAMADI");
      
    } catch (error) {
      console.error("Randevu oluşturulurken hata:", error);
      alert("Randevu oluşturulamadı. Lütfen tekrar deneyin.");
    } finally {
      setIsBooking(false);
    }
  };

  // Berber Girişi Yap
  const handleAdminLogin = async () => {
    if (!adminUsername || !adminPassword) {
      setLoginError(true);
      return;
    }

    setIsLoggingIn(true);
    setLoginError(false);
    try {
      const response = await adminLogin({ username: adminUsername, password: adminPassword });
      const token = response.token || response;
      localStorage.setItem('adminToken', typeof token === 'string' ? token : JSON.stringify(token));
      
      setIsLoginOpen(false);
      setAdminUsername('');
      setAdminPassword('');
      setLoginError(false);

      // Başarılı giriş sonrası admin paneline yönlendir
      navigate(`/${slug}/admin`);
      
    } catch (error) {
      console.error("Giriş hatası:", error);
      setLoginError(true);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleCopy = async () => {
    if (pnrCode) {
      await navigator.clipboard.writeText(pnrCode);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000); 
    }
  };

  const closeModal = () => {
    setSelectedSlot(null);
    setPnrCode(null);
    setCustomerName('');
    setCustomerPhone('');
    setServiceType('');
  };

  const handleReturnHome = () => {
    closeModal(); 
    setRefreshKey(prev => prev + 1); 
  };

  if (shopError) {
    return (
      <div className="min-h-screen bg-[#F6F5EFFF] flex items-center justify-center">
        <h1 className="text-3xl font-black uppercase text-red-600 tracking-widest">
          DÜKKAN BULUNAMADI
        </h1>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="min-h-screen bg-[#F6F5EFFF] flex items-center justify-center">
        <h1 className="text-2xl font-bold uppercase animate-pulse tracking-widest">
          DÜKKAN YÜKLENİYOR...
        </h1>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F5EFFF] text-gray-900 font-sans flex flex-col relative">
      <header className="flex justify-between items-center px-8 py-5 border-b border-gray-300">
        <h1 className="text-3xl font-black tracking-widest uppercase">
          {shop.name}
        </h1>
        <div className="flex gap-4">
          <button className="px-6 py-2 border border-gray-900 text-gray-900 font-bold hover:bg-gray-100 transition">
            Randevu İptal
          </button>
          <button 
            onClick={() => setIsLoginOpen(true)}
            className="px-6 py-2 bg-[#1A1A1A] text-white font-bold hover:bg-black transition"
          >
            Berber Girişi
          </button>
        </div>
      </header>

      <main className="flex flex-1 overflow-hidden">
        <div className="flex-1 px-8 py-12 overflow-y-auto">
          <h2 className="text-6xl font-black tracking-tighter uppercase mb-2">
            RANDEVUNU SEÇ
          </h2>
          <p className="text-gray-600 mb-10 text-lg">
            Bir gün ve boş saat seç. Giriş gerekmez.
          </p>

          <div className="flex flex-wrap gap-3 mb-10">
            {daysList.map((day) => (
              <button
                key={day.value}
                onClick={() => setSelectedDate(day.value)}
                className={`px-6 py-2 border border-gray-900 font-bold transition-colors ${
                  selectedDate === day.value
                    ? 'bg-[#1A1A1A] text-white' 
                    : 'bg-transparent text-gray-900 hover:bg-gray-100' 
                }`}
              >
                {day.label}
              </button>
            ))}
          </div>

          <div className="bg-white border border-gray-200 p-8 w-full max-w-4xl shadow-sm">
            <h3 className="text-xl font-bold uppercase tracking-wide mb-6">
              BOŞ SAATLER
            </h3>
            
            {loading ? (
              <p className="text-gray-500 font-medium">Saatler yükleniyor...</p>
            ) : slots.length === 0 ? (
              <p className="text-red-500 font-medium">Bu tarihte boş saat bulunmuyor.</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {slots.map((slot) => (
                  <button
                    key={slot.id}
                    onClick={() => setSelectedSlot(slot)}
                    className="px-4 py-3 border border-gray-900 text-center font-bold hover:bg-[#1A1A1A] hover:text-white transition-colors"
                  >
                    {slot.startTime.slice(0, 5)}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="hidden lg:flex w-[35%] bg-[#EBE9E1] border-l border-dashed border-gray-400 items-center justify-center">
          <span className="text-gray-500 font-medium tracking-widest text-center px-4">
            [ {shop.name} FOTOĞRAFI ]
          </span>
        </div>
      </main>

      {/* 1. RANDEVU ONAY MODALI */}
      {selectedSlot && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#F6F5EFFF] flex flex-col md:flex-row gap-8 p-8 w-full max-w-4xl shadow-2xl relative">
            
            <div className="flex-1">
              <h3 className="text-3xl font-black uppercase tracking-tighter mb-6">
                RANDEVU ONAYI
              </h3>
              
              <div className="bg-[#1A1A1A] text-white p-4 mb-6 font-bold text-lg">
                [{selectedSlot.slotDate}] • [{selectedSlot.startTime.slice(0, 5)}]
              </div>

              {!pnrCode && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold mb-1">Ad Soyad</label>
                    <input 
                      type="text" 
                      placeholder="Adınız" 
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full border border-gray-300 p-3 outline-none focus:border-[#1A1A1A] transition-colors bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-1">Telefon</label>
                    <input 
                      type="tel" 
                      placeholder="05XX XXX XX XX" 
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full border border-gray-300 p-3 outline-none focus:border-[#1A1A1A] transition-colors bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-1">Talep</label>
                    <input 
                      type="text" 
                      placeholder="Örn. Saç + Sakal" 
                      value={serviceType}
                      onChange={(e) => setServiceType(e.target.value)}
                      className="w-full border border-gray-300 p-3 outline-none focus:border-[#1A1A1A] transition-colors bg-white"
                    />
                  </div>
                  
                  <div className="border border-dashed border-gray-400 p-6 text-center text-gray-500 mb-6 mt-4">
                    reCAPTCHA
                  </div>

                  <div className="flex gap-4">
                    <button 
                      onClick={closeModal}
                      className="flex-1 border-2 border-[#1A1A1A] py-3 font-bold text-[#1A1A1A] hover:bg-gray-200 transition-colors"
                    >
                      İptal
                    </button>
                    <button 
                      onClick={handleBook}
                      disabled={isBooking}
                      className="flex-1 bg-[#1A1A1A] border-2 border-[#1A1A1A] text-white py-3 font-bold hover:bg-black transition-colors disabled:opacity-50"
                    >
                      {isBooking ? 'Onaylanıyor...' : 'Randevuyu Onayla'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {pnrCode && (
              <div className="flex-1 border-2 border-[#1A1A1A] p-8 flex flex-col justify-center bg-white relative">
                <h4 className="text-xl font-black uppercase tracking-wide mb-2">
                  RANDEVUNUZ OLUŞTURULDU
                </h4>
                <p className="text-gray-600 font-medium mb-6">
                  İptal etmek isterseniz kodunuz:
                </p>
                
                <div className="border-2 border-dashed border-[#1A1A1A] py-6 flex flex-col items-center justify-center">
                  <span className="text-4xl font-black tracking-widest mb-4">
                    [ {pnrCode} ]
                  </span>
                  <button 
                    onClick={handleCopy}
                    className={`text-sm font-bold border-2 px-4 py-1 transition-colors ${
                      isCopied 
                        ? 'border-green-600 bg-green-600 text-white' 
                        : 'border-[#1A1A1A] text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white'
                    }`}
                  >
                    {isCopied ? 'KOPYALANDI ✓' : 'KOPYALA'}
                  </button>
                </div>

                <button 
                  onClick={handleReturnHome}
                  className="mt-8 bg-[#1A1A1A] text-white py-3 px-6 font-bold hover:bg-black w-full"
                >
                  ANA SAYFAYA DÖN
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. BERBER GİRİŞ MODALI */}
      {isLoginOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#F6F5EFFF] p-8 w-full max-w-md shadow-2xl relative border-2 border-[#1A1A1A]">
            
            <h3 className="text-2xl font-black uppercase tracking-tighter mb-2">
              BERBER GİRİŞİ
            </h3>
            <p className="text-gray-600 text-sm mb-6">
              Yönetim paneline erişmek için giriş yapın.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold mb-1">Kullanıcı Adı</label>
                <input 
                  type="text" 
                  placeholder="admin" 
                  value={adminUsername}
                  onChange={(e) => {
                    setAdminUsername(e.target.value);
                    if (loginError) setLoginError(false);
                  }}
                  className={`w-full border p-3 outline-none transition-colors bg-white ${
                    loginError ? 'border-red-600 border-2' : 'border-gray-300 focus:border-[#1A1A1A]'
                  }`}
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">Şifre</label>
                <input 
                  type="password" 
                  placeholder="••••••" 
                  value={adminPassword}
                  onChange={(e) => {
                    setAdminPassword(e.target.value);
                    if (loginError) setLoginError(false);
                  }}
                  className={`w-full border p-3 outline-none transition-colors bg-white ${
                    loginError ? 'border-red-600 border-2' : 'border-gray-300 focus:border-[#1A1A1A]'
                  }`}
                />
                {loginError && (
                  <p className="text-red-600 text-xs font-bold mt-1.5 uppercase tracking-wide">
                    Kullanıcı adı ya da şifre yanlış.
                  </p>
                )}
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  onClick={() => {
                    setIsLoginOpen(false);
                    setLoginError(false);
                  }}
                  className="flex-1 border-2 border-[#1A1A1A] py-3 font-bold text-[#1A1A1A] hover:bg-gray-200 transition-colors"
                >
                  İptal
                </button>
                <button 
                  onClick={handleAdminLogin}
                  disabled={isLoggingIn}
                  className="flex-1 bg-[#1A1A1A] border-2 border-[#1A1A1A] text-white py-3 font-bold hover:bg-black transition-colors disabled:opacity-50"
                >
                  {isLoggingIn ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

// Ana App Bileşeni ve Yönlendirmeler
export default function App() {
  return (
<Routes>
  {/* Müşteri Randevu Sayfası */}
  <Route path="/:slug" element={<BookingPage />} />

  {/* Berber Yönetim Paneli */}
  <Route path="/:slug/admin" element={<AdminLayout />}>
    <Route index element={<AdminDashboard />} />
    <Route path="working-hours" element={<AdminWorkingHours />} />
    <Route path="calendar" element={<AdminCalendar />} /> {/* <-- BU SATIRI EKLEYİN */}
  </Route>
</Routes>
  );
}