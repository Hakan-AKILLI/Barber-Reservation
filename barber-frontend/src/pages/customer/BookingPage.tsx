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

// --- DÜKKAN AÇIKSA GÖSTERİLECEK NORMAL RANDEVU EKRANI ---
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
        {/* SOL İÇERİK ALANI - Boşluklar (px-14, py-20) artırıldı */}
        <div className="flex-1 px-10 md:px-14 py-16 md:py-20 overflow-y-auto">
          {/* Başlık text-7xl/8xl yapıldı */}
          <h2 className="text-7xl md:text-8xl font-black tracking-tighter uppercase mb-4 text-[#1A1A1A]">RANDEVUNU SEÇ</h2>
          <p className="text-gray-500 mb-14 text-2xl font-medium">Bir gün ve boş saat seç.</p>

          <div className="flex flex-wrap gap-5 mb-16">
            {daysList.map((day) => (
              <button 
                key={day.value} 
                onClick={() => setSelectedDateObj(day)} 
                /* Gün butonları px-10, py-4 ve text-lg yapılarak irileştirildi */
                className={`px-10 py-4 text-lg border-2 border-[#1A1A1A] font-black uppercase tracking-wider cursor-pointer transition-colors ${
                  selectedDateObj.value === day.value 
                  ? 'bg-[#1A1A1A] text-white' 
                  : 'bg-transparent text-[#1A1A1A] hover:bg-gray-200'
                }`}
              >
                {day.label}
              </button>
            ))}
          </div>

          {/* Kutu padding'i p-12 yapıldı, gölge (shadow) 4px'ten 8px'e çıkarıldı */}
          <div className="bg-white border-2 border-[#1A1A1A] p-12 w-full max-w-5xl shadow-[8px_8px_0px_0px_rgba(26,26,26,0.1)]">
            <h3 className="text-3xl font-black uppercase tracking-widest mb-10 text-[#1A1A1A]">BOŞ SAATLER</h3>
            
            {loading ? (
              <p className="text-gray-500 font-bold text-xl animate-pulse">Saatler yükleniyor...</p>
            ) : slots.length === 0 ? (
              <p className="text-gray-500 font-bold text-xl border-2 border-dashed border-gray-300 p-10 text-center">Bu tarihte uygun saat bulunmuyor.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {slots.map((slot) => (
                  <button 
                    key={slot.id} 
                    onClick={() => setSelectedSlot(slot)} 
                    /* Saat butonları px-6, py-5 ve text-xl yapılarak daha rahat tıklanabilir hale getirildi */
                    className="px-6 py-5 border-2 border-[#1A1A1A] text-center font-black text-xl hover:bg-[#1A1A1A] hover:text-white cursor-pointer transition-colors"
                  >
                    {slot.startTime.slice(0, 5)}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* SAĞ SÜTUN - FOTOĞRAF ALANI */}
        <div className="hidden lg:flex w-[35%] border-l-2 border-[#1A1A1A] relative overflow-hidden bg-[#EBE9E1]">
          <img 
            src="/barber.jpeg" 
            alt="Berber Dükkanı" 
            className="w-full h-full object-cover"
          />
          
          <div className="absolute inset-0 bg-black/20 flex items-end p-8">
            <span className="text-white font-black text-3xl uppercase tracking-widest drop-shadow-lg">
              {shop.name}
            </span>
          </div>
        </div>
      </main>

      <AdminLoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} slug={slug || ''} />
      <CancelAppointmentModal isOpen={isCancelModalOpen} onClose={() => setIsCancelModalOpen(false)} />
      <BookingConfirmModal isOpen={!!selectedSlot} onClose={() => setSelectedSlot(null)} selectedSlot={selectedSlot} onSuccess={() => setRefreshKey(prev => prev + 1)} />
    </div>
  );
}