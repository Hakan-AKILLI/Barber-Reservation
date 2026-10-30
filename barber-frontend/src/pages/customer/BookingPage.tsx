import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getAvailableSlots, getShopBySlug } from '../../services/api';
import type { Shop, TimeSlot } from '../../types';

// Modallar
import AdminLoginModal from '../../components/modals/AdminLoginModal';
import CancelAppointmentModal from '../../components/modals/CancelAppointmentModal';
import BookingConfirmModal from '../../components/modals/BookingConfirmModal';

export default function BookingPage() {
  const { slug } = useParams<{ slug: string }>(); 
  const [shop, setShop] = useState<Shop | null>(null);
  const [shopError, setShopError] = useState(false);

  // Gün Listesi Oluşturma
  const daysList = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    
    let label: string;
    
    if (i === 0) {
      label = 'Bugün';
    } else if (i === 1) {
      label = 'Yarın';
    } else {
      const dayName = d.toLocaleDateString('tr-TR', { weekday: 'long' });
      label = dayName.charAt(0).toUpperCase() + dayName.slice(1);
    }
    return { label, value, isToday: i === 0 }; // YENİ: isToday bayrağı eklendi
  });

  const [selectedDateObj, setSelectedDateObj] = useState(daysList[0]);
  const [slots, setSlots] = useState<TimeSlot[]>([]); 
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Modal Kontrolleri
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  useEffect(() => {
    const fetchShop = async () => {
      if (!slug) return;
      try {
        const shopData = await getShopBySlug(slug);
        setShop(shopData);
      } catch {
        setShopError(true);
      }
    };
    fetchShop();
  }, [slug]);

  useEffect(() => {
    const fetchSlots = async () => {
      if (!shop || !shop.active) return;
      setLoading(true);
      try {
        const data = await getAvailableSlots(shop.id, selectedDateObj.value);
        
        let filteredSlots = data;
        
        // EĞER SEÇİLİ GÜN "BUGÜN" İSE ŞU ANKİ SAATTEN GEÇMİŞ OLANLARI GİZLE
        if (selectedDateObj.isToday) {
          const now = new Date();
          const currentHour = now.getHours();
          const currentMinute = now.getMinutes();

          filteredSlots = data.filter((slot: TimeSlot) => {
            const [slotHour, slotMinute] = slot.startTime.split(':').map(Number);
            // Slot saati şu andan büyükse VEYA saat aynı ama dakika büyükse göster
            if (slotHour > currentHour) return true;
            if (slotHour === currentHour && slotMinute >= currentMinute) return true;
            return false;
          });
        }
        
        setSlots(filteredSlots);
      } catch {
        setSlots([]); 
      } finally {
        setLoading(false);
      }
    };
    fetchSlots();
  }, [selectedDateObj, refreshKey, shop]);

  if (shopError) return <div className="min-h-screen bg-[#F6F5EFFF] flex items-center justify-center"><h1 className="text-3xl font-black uppercase text-red-600">DÜKKAN BULUNAMADI</h1></div>;
  if (!shop) return <div className="min-h-screen bg-[#F6F5EFFF] flex items-center justify-center"><h1 className="text-2xl font-bold uppercase animate-pulse">DÜKKAN YÜKLENİYOR...</h1></div>;

  if (!shop.active) {
    return (
      <div className="min-h-screen bg-[#F6F5EFFF] text-gray-900 font-sans flex flex-col relative">
        <header className="flex justify-between items-center px-10 py-6 border-b-2 border-[#1A1A1A]">
          <h1 className="text-3xl md:text-4xl font-black tracking-widest uppercase">{shop.name}</h1>
          <div className="flex gap-4">
            <button onClick={() => setIsCancelModalOpen(true)} className="px-6 py-3 border-2 border-[#1A1A1A] font-black uppercase tracking-wider hover:bg-gray-100 transition cursor-pointer">Randevu İptal</button>
            <button onClick={() => setIsLoginOpen(true)} className="px-6 py-3 bg-[#1A1A1A] text-white font-black uppercase tracking-wider border-2 border-[#1A1A1A] hover:bg-black transition cursor-pointer">Berber Girişi</button>
          </div>
        </header>

        <main className="flex flex-1 items-center justify-center p-8">
          <div className="max-w-2xl w-full p-12 text-center bg-white border-4 border-[#1A1A1A] shadow-[8px_8px_0px_0px_rgba(26,26,26,1)] relative">
            <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-red-600 text-white px-6 py-2 font-black tracking-widest uppercase text-sm border-2 border-[#1A1A1A]">
              BİLGİLENDİRME
            </div>
            <h2 className="text-4xl md:text-5xl font-black tracking-tighter uppercase mb-6 text-[#1A1A1A] mt-6">
              DÜKKAN ŞU AN KAPALI
            </h2>
            <p className="text-gray-600 text-lg font-bold">
              İşletmemiz geçici olarak online randevu alımına kapalıdır. Lütfen daha sonra tekrar deneyiniz.
            </p>
          </div>
        </main>
        <AdminLoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} slug={slug || ''} />
        <CancelAppointmentModal isOpen={isCancelModalOpen} onClose={() => setIsCancelModalOpen(false)} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F5EFFF] text-gray-900 font-sans flex flex-col relative">
      <header className="flex justify-between items-center px-10 py-6 border-b-2 border-[#1A1A1A] bg-[#F6F5EFFF] z-10">
        <h1 className="text-3xl md:text-4xl font-black tracking-widest uppercase">{shop.name}</h1>
        <div className="flex gap-4">
          <button onClick={() => setIsCancelModalOpen(true)} className="px-6 py-3 border-2 border-[#1A1A1A] font-black uppercase tracking-wider hover:bg-gray-100 transition cursor-pointer">Randevu İptal</button>
          <button onClick={() => setIsLoginOpen(true)} className="px-6 py-3 bg-[#1A1A1A] text-white font-black uppercase tracking-wider border-2 border-[#1A1A1A] hover:bg-black transition cursor-pointer">Berber Girişi</button>
        </div>
      </header>

      <main className="flex flex-1 overflow-hidden h-[calc(100vh-100px)]">
        <div className="flex-1 px-10 py-16 overflow-y-auto">
          <h2 className="text-6xl md:text-7xl font-black tracking-tighter uppercase mb-3 text-[#1A1A1A]">RANDEVUNU SEÇ</h2>
          <p className="text-gray-500 mb-12 text-xl font-medium">Bir gün ve boş saat seç.</p>

          <div className="flex flex-wrap gap-4 mb-14">
            {daysList.map((day) => (
              <button 
                key={day.value} 
                onClick={() => setSelectedDateObj(day)} 
                className={`px-8 py-3 border-2 border-[#1A1A1A] font-black uppercase tracking-wider cursor-pointer transition-colors ${
                  selectedDateObj.value === day.value 
                  ? 'bg-[#1A1A1A] text-white' 
                  : 'bg-transparent text-[#1A1A1A] hover:bg-gray-200'
                }`}
              >
                {day.label}
              </button>
            ))}
          </div>

          <div className="bg-white border-2 border-[#1A1A1A] p-10 w-full max-w-5xl shadow-[4px_4px_0px_0px_rgba(26,26,26,0.1)]">
            <h3 className="text-2xl font-black uppercase tracking-widest mb-8 text-[#1A1A1A]">BOŞ SAATLER</h3>
            {loading ? (
              <p className="text-gray-500 font-bold text-lg animate-pulse">Saatler yükleniyor...</p>
            ) : slots.length === 0 ? (
              <p className="text-gray-500 font-bold text-lg border-2 border-dashed border-gray-300 p-8 text-center">Bu tarihte uygun saat bulunmuyor.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
                {slots.map((slot) => (
                  <button 
                    key={slot.id} 
                    onClick={() => setSelectedSlot(slot)} 
                    className="px-4 py-4 border-2 border-[#1A1A1A] text-center font-black text-lg hover:bg-[#1A1A1A] hover:text-white cursor-pointer transition-colors"
                  >
                    {slot.startTime.slice(0, 5)}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="hidden lg:flex w-[35%] bg-[#EBE9E1] border-l-2 border-dashed border-gray-400 items-center justify-center relative overflow-hidden">
          <span className="text-gray-400 font-bold tracking-widest text-center px-4">[ {shop.name} FOTOĞRAFI ]</span>
        </div>
      </main>

      <AdminLoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} slug={slug || ''} />
      <CancelAppointmentModal isOpen={isCancelModalOpen} onClose={() => setIsCancelModalOpen(false)} />
      <BookingConfirmModal isOpen={!!selectedSlot} onClose={() => setSelectedSlot(null)} selectedSlot={selectedSlot} onSuccess={() => setRefreshKey(prev => prev + 1)} />
    </div>
  );
}