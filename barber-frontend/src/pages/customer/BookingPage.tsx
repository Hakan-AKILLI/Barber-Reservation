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
    return { label, value };
  });

  const [selectedDate, setSelectedDate] = useState(daysList[0].value);
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
      if (!shop) return; 
      setLoading(true);
      try {
        const data = await getAvailableSlots(shop.id, selectedDate);
        setSlots(data);
      } catch  {
        setSlots([]); 
      } finally {
        setLoading(false);
      }
    };
    fetchSlots();
  }, [selectedDate, refreshKey, shop]);

  if (shopError) return <div className="min-h-screen bg-[#F6F5EFFF] flex items-center justify-center"><h1 className="text-3xl font-black uppercase text-red-600">DÜKKAN BULUNAMADI</h1></div>;
  if (!shop) return <div className="min-h-screen bg-[#F6F5EFFF] flex items-center justify-center"><h1 className="text-2xl font-bold uppercase animate-pulse">DÜKKAN YÜKLENİYOR...</h1></div>;

  return (
    <div className="min-h-screen bg-[#F6F5EFFF] text-gray-900 font-sans flex flex-col relative">
      <header className="flex justify-between items-center px-8 py-5 border-b border-gray-300">
        <h1 className="text-3xl font-black tracking-widest uppercase">{shop.name}</h1>
        <div className="flex gap-4">
          <button onClick={() => setIsCancelModalOpen(true)} className="px-6 py-2 border border-gray-900 text-gray-900 font-bold hover:bg-gray-100 transition cursor-pointer">Randevu İptal</button>
          <button onClick={() => setIsLoginOpen(true)} className="px-6 py-2 bg-[#1A1A1A] text-white font-bold hover:bg-black transition cursor-pointer">Berber Girişi</button>
        </div>
      </header>

      <main className="flex flex-1 overflow-hidden">
        <div className="flex-1 px-8 py-12 overflow-y-auto">
          <h2 className="text-6xl font-black tracking-tighter uppercase mb-2">RANDEVUNU SEÇ</h2>
          <p className="text-gray-600 mb-10 text-lg">Bir gün ve boş saat seç. Giriş gerekmez.</p>

          <div className="flex flex-wrap gap-3 mb-10">
            {daysList.map((day) => (
              <button key={day.value} onClick={() => setSelectedDate(day.value)} className={`px-6 py-2 border border-gray-900 font-bold cursor-pointer transition-colors ${selectedDate === day.value ? 'bg-[#1A1A1A] text-white' : 'bg-transparent text-gray-900 hover:bg-gray-100'}`}>
                {day.label}
              </button>
            ))}
          </div>

          <div className="bg-white border border-gray-200 p-8 w-full max-w-4xl shadow-sm">
            <h3 className="text-xl font-bold uppercase tracking-wide mb-6">BOŞ SAATLER</h3>
            {loading ? <p className="text-gray-500 font-medium">Saatler yükleniyor...</p> : slots.length === 0 ? <p className="text-red-500 font-medium">Bu tarihte boş saat bulunmuyor.</p> : (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {slots.map((slot) => (
                  <button key={slot.id} onClick={() => setSelectedSlot(slot)} className="px-4 py-3 border border-gray-900 text-center font-bold hover:bg-[#1A1A1A] hover:text-white cursor-pointer transition-colors">
                    {slot.startTime.slice(0, 5)}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="hidden lg:flex w-[35%] bg-[#EBE9E1] border-l border-dashed border-gray-400 items-center justify-center">
          <span className="text-gray-500 font-medium tracking-widest text-center px-4">[ {shop.name} FOTOĞRAFI ]</span>
        </div>
      </main>

      {/* Dışarıya Aktardığımız Modallar */}
      <AdminLoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} slug={slug || ''} />
      <CancelAppointmentModal isOpen={isCancelModalOpen} onClose={() => setIsCancelModalOpen(false)} />
      <BookingConfirmModal isOpen={!!selectedSlot} onClose={() => setSelectedSlot(null)} selectedSlot={selectedSlot} onSuccess={() => setRefreshKey(prev => prev + 1)} />
    </div>
  );
}