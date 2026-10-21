import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { 
  getShopBySlug, 
  getAdminAppointments, 
  getAvailableSlots, 
  updateAppointmentStatus, 
  bookAppointment,
  deleteSlot,
  createSingleSlot,
  type Appointment 
} from '../../services/api';

interface TimeSlot {
  id: number;
  slotDate: string;
  startTime: string;
  endTime: string;
  booked: boolean;
  active: boolean;
}

type TimelineItem = 
  | { kind: 'APPOINTMENT'; startTime: string; data: Appointment }
  | { kind: 'EMPTY_SLOT'; startTime: string; data: TimeSlot };

export default function AdminDashboard() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const dateParam = searchParams.get('date');
  
  const [shopId, setShopId] = useState<number | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshCount, setRefreshCount] = useState(0);

  // Tarih State'i (Eğer URL'de date varsa onu al, yoksa bugünün tarihini ayarla)
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    if (dateParam) return dateParam;
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });

  // Manuel Randevu Ekleme Modal State'leri
  const [selectedSlotForBooking, setSelectedSlotForBooking] = useState<TimeSlot | null>(null);
  const [manualName, setManualName] = useState('');
  const [manualPhone, setManualPhone] = useState('');
  const [manualService, setManualService] = useState('');
  const [isManualBooking, setIsManualBooking] = useState(false);

  // Hızlı Slot Oluşturma Modal State'leri
  const [isSlotModalOpen, setIsSlotModalOpen] = useState(false);
  const [quickStart, setQuickStart] = useState('');
  const [quickEnd, setQuickEnd] = useState('');
  const [isQuickSlotLoading, setIsQuickSlotLoading] = useState(false);

  const triggerRefresh = () => {
    setRefreshCount((prev) => prev + 1);
  };

  // Tarih İlerleme / Gerileme Fonksiyonları
  const handlePrevDay = () => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() - 1);
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    setSelectedDate(`${yyyy}-${mm}-${dd}`);
  };

  const handleNextDay = () => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + 1);
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    setSelectedDate(`${yyyy}-${mm}-${dd}`);
  };

  // 1. Slug üzerinden Dükkan ID bul
  useEffect(() => {
    const fetchShop = async () => {
      if (!slug) return;
      try {
        const shop = await getShopBySlug(slug);
        setShopId(shop.id);
      } catch (error) {
        console.error('Dükkan bulunamadı:', error);
      }
    };
    fetchShop();
  }, [slug]);

  // 2. Seçilen Tarihe Göre Verileri Çekme
  useEffect(() => {
    if (!shopId) return;

    let isMounted = true;
    
    const loadDashboardData = async () => {
      setLoading(true);
      try {
        const [appointmentsData, slotsData] = await Promise.all([
          getAdminAppointments(shopId, selectedDate),
          getAvailableSlots(shopId, selectedDate)
        ]);
        if (isMounted) {
          setAppointments(appointmentsData);
          setAvailableSlots(slotsData);
        }
      } catch (error) {
        console.error('Veriler çekilemedi:', error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadDashboardData();

    return () => {
      isMounted = false;
    };
  }, [shopId, selectedDate, refreshCount]);

  // Statü Güncelleme (PATCH)
  const handleStatusChange = async (appointmentId: number, newStatus: string) => {
    if (!shopId) return;
    try {
      await updateAppointmentStatus(appointmentId, shopId, newStatus);
      
      setAppointments((prevAppointments) =>
        prevAppointments.map((app) =>
          app.id === appointmentId ? { ...app, status: newStatus as Appointment['status'] } : app
        )
      );
    } catch (error) {
      console.error('Durum güncellenemedi:', error);
      alert('Randevu durumu güncellenirken bir hata oluştu.');
    }
  };

  // Manuel Randevu Oluşturma
  const handleCreateManualBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlotForBooking) return;
    if (!manualName || !manualPhone || !manualService) {
      alert('Lütfen tüm alanları doldurun.');
      return;
    }

    setIsManualBooking(true);
    try {
      await bookAppointment({
        timeSlotId: selectedSlotForBooking.id,
        customerName: manualName,
        customerPhone: manualPhone,
        serviceType: manualService,
      });

      setSelectedSlotForBooking(null);
      setManualName('');
      setManualPhone('');
      setManualService('');

      triggerRefresh();
    } catch (error) {
      console.error('Manuel randevu oluşturulurken hata:', error);
      alert('Randevu oluşturulamadı. Lütfen tekrar deneyin.');
    } finally {
      setIsManualBooking(false);
    }
  };

  // Seçili Güne Hızlı Slot Oluşturma
  const handleQuickSlotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopId) return;
    if (!quickStart || !quickEnd) {
      alert('Lütfen başlangıç ve bitiş saatlerini seçin.');
      return;
    }

    setIsQuickSlotLoading(true);
    try {
      await createSingleSlot(shopId, {
        slotDate: selectedDate, // Seçili tarihe oluşturulacak
        startTime: `${quickStart}:00`,
        endTime: `${quickEnd}:00`
      });

      setIsSlotModalOpen(false);
      setQuickStart('');
      setQuickEnd('');
      triggerRefresh();
    } catch (error) {
      console.error('Slot oluşturulurken hata:', error);
      alert('Slot oluşturulamadı.');
    } finally {
      setIsQuickSlotLoading(false);
    }
  };

  // Boş Slot Silme İşlemi
  const handleDeleteSlot = async (slotId: number) => {
    if (!shopId) return;
    if (!window.confirm('Bu boş slotu silmek istediğinize emin misiniz?')) return;

    try {
      await deleteSlot(slotId, shopId);
      triggerRefresh();
    } catch (error) {
      console.error('Slot silinemedi:', error);
      alert('Slot silinirken bir hata oluştu.');
    }
  };

  // İstatistikler
  const totalAppointments = appointments.length;
  const pendingAppointments = appointments.filter(
    (a) => a.status?.toUpperCase() === 'CONFIRMED'
  ).length;

  // Çizelge Birleştirme ve Sıralama
  const timelineItems: TimelineItem[] = [
    ...appointments.map((app) => ({
      kind: 'APPOINTMENT' as const,
      startTime: app.timeSlot.startTime.slice(0, 5),
      data: app
    })),
    ...availableSlots.map((slot) => ({
      kind: 'EMPTY_SLOT' as const,
      startTime: slot.startTime.slice(0, 5),
      data: slot
    }))
  ].sort((a, b) => a.startTime.localeCompare(b.startTime));

  const getStatusStyle = (status: string, isSelectBox = false) => {
    const s = status?.toUpperCase();
    if (s === 'CANCELLED') return isSelectBox ? 'border-red-600 text-red-600' : 'text-red-600';
    if (s === 'COMPLETED') return isSelectBox ? 'border-green-600 text-green-600' : 'text-green-600';
    return isSelectBox ? 'border-blue-600 text-blue-600' : 'text-blue-600';
  };

  return (
    <div className="max-w-5xl mx-auto relative">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <h2 className="text-4xl md:text-5xl font-black tracking-tighter uppercase text-[#1A1A1A]">
          RANDEVULAR
        </h2>

        {/* HIZLI SLOT OLUŞTUR BUTONU */}
        <button
          onClick={() => setIsSlotModalOpen(true)}
          className="bg-[#1A1A1A] text-white px-5 py-3 font-bold uppercase tracking-wider hover:bg-black transition-colors self-start sm:self-auto flex items-center gap-2 cursor-pointer"
        >
          <span className="text-xl font-black">+</span>
          <span>Slot Oluştur</span>
        </button>
      </div>

      {/* İSTATİSTİK KUTULARI */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        <div className="bg-white border border-gray-200 p-8 shadow-sm flex flex-col justify-center">
          <p className="text-gray-500 font-bold text-sm mb-2">Seçili Günün Toplam Randevusu</p>
          <span className="text-5xl font-black tracking-widest text-[#1A1A1A]">
            [ {totalAppointments} ]
          </span>
        </div>
        <div className="bg-white border border-gray-200 p-8 shadow-sm flex flex-col justify-center">
          <p className="text-gray-500 font-bold text-sm mb-2">Bekleyen Randevular</p>
          <span className="text-5xl font-black tracking-widest text-blue-600">
            [ {pendingAppointments} ]
          </span>
        </div>
      </div>

      {/* ZAMAN ÇİZELGESİ */}
      <div className="bg-white border border-gray-200 p-8 shadow-sm">
        {/* TARİH NAVİGASYON OKLARI VE BAŞLIK */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-200 mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrevDay}
              className="w-10 h-10 border-2 border-[#1A1A1A] font-black text-xl hover:bg-[#1A1A1A] hover:text-white transition-colors flex items-center justify-center cursor-pointer"
              title="Önceki Gün"
            >
              ‹
            </button>
            <button
              onClick={handleNextDay}
              className="w-10 h-10 border-2 border-[#1A1A1A] font-black text-xl hover:bg-[#1A1A1A] hover:text-white transition-colors flex items-center justify-center cursor-pointer"
              title="Sonraki Gün"
            >
              ›
            </button>
            <h3 className="text-lg font-bold uppercase tracking-wider text-[#1A1A1A] ml-2">
              GÜNLÜK ZAMAN ÇİZELGESİ • {selectedDate}
            </h3>
          </div>
        </div>

        {loading ? (
          <p className="text-gray-500 font-bold animate-pulse py-4">Slotlar ve randevular yükleniyor...</p>
        ) : timelineItems.length === 0 ? (
          <div className="py-8 text-center text-gray-500 font-bold">
            Bu tarih ({selectedDate}) için henüz hiç slot oluşturulmamış. Sağ üstteki "+ Slot Oluştur" butonundan ekleyebilirsiniz.
          </div>
        ) : (
          <div className="flex flex-col">
            {timelineItems.map((item, index) => (
              <div 
                key={`${item.startTime}-${index}`} 
                className={`flex items-center justify-between py-5 ${
                  index !== timelineItems.length - 1 ? 'border-b border-gray-100' : ''
                }`}
              >
                <span className="font-black text-lg w-20 text-[#1A1A1A]">{item.startTime}</span>

                {item.kind === 'APPOINTMENT' ? (
                  // DOLU SLOT (RANDEVU)
                  <div className="flex-1 bg-[#F5F4EF] border border-transparent p-4 mx-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <p className="font-bold text-[#1A1A1A] text-sm mb-1 flex items-center flex-wrap gap-2">
                        <span>[{item.data.customerName}] • {item.data.customerPhone}</span>
                        <span className="text-gray-300">•</span>
                        <span className={`text-xs uppercase tracking-widest font-black ${getStatusStyle(item.data.status)}`}>
                          {item.data.status}
                        </span>
                      </p>
                      <p className="text-gray-500 text-xs">{item.data.serviceType}</p>
                    </div>
                    
                    <select
                      value={item.data.status?.toLowerCase()} 
                      onChange={(e) => handleStatusChange(item.data.id, e.target.value.toUpperCase())}
                      className={`border-2 bg-white px-4 py-2 text-sm font-bold uppercase outline-none cursor-pointer transition-colors ${getStatusStyle(item.data.status, true)}`}
                    >
                      <option value="confirmed">confirmed</option>
                      <option value="completed">completed</option>
                      <option value="cancelled">cancelled</option>
                    </select>
                  </div>
                ) : (
                  // BOŞ SLOT
                  <div className="flex-1 mx-4 text-gray-600 font-medium text-sm flex items-center justify-between bg-gray-50/50 p-4 border border-dashed border-gray-200">
                    <div className="flex items-center gap-3">
                      <span className="text-gray-400 font-bold">Boş Slot</span>
                      
                      <button
                        onClick={() => setSelectedSlotForBooking(item.data)}
                        className="bg-[#1A1A1A] text-white px-3 py-1 text-xs font-bold uppercase tracking-wider hover:bg-black transition-colors flex items-center gap-1 cursor-pointer"
                        title="Telefonla Arayan Müşteri İçin Randevu Ekle"
                      >
                        <span className="text-sm font-black">+</span>
                        <span>Randevu Ekle</span>
                      </button>

                      <button
                        onClick={() => handleDeleteSlot(item.data.id)}
                        className="border border-red-600 text-red-600 px-3 py-1 text-xs font-bold uppercase tracking-wider hover:bg-red-600 hover:text-white transition-colors cursor-pointer"
                        title="Bu Slotu Sil"
                      >
                        Slot Sil
                      </button>
                    </div>

                    <span className="text-xs text-gray-400 font-mono">
                      {item.data.startTime.slice(0, 5)} - {item.data.endTime.slice(0, 5)}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MANUEL RANDEVU EKLEME MODALI */}
      {selectedSlotForBooking && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-[#F5F4EF] p-8 w-full max-w-md shadow-2xl relative border-4 border-[#1A1A1A]">
            <h3 className="text-2xl font-black uppercase tracking-tighter mb-1 text-[#1A1A1A]">
              MANUEL RANDEVU OLUŞTUR
            </h3>
            <p className="text-gray-600 text-xs font-bold uppercase tracking-wider mb-6">
              [{selectedSlotForBooking.startTime.slice(0, 5)} - {selectedSlotForBooking.endTime.slice(0, 5)}] SAATİ İÇİN MÜŞTERİ KAYDI
            </p>

            <form onSubmit={handleCreateManualBooking} className="space-y-4">
              <div>
                <label className="block text-sm font-bold mb-1 text-[#1A1A1A]">Müşteri Adı Soyadı</label>
                <input 
                  type="text" 
                  placeholder="Örn. Ahmet Yılmaz" 
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  className="w-full border border-gray-300 p-3 outline-none focus:border-[#1A1A1A] transition-colors bg-white font-medium text-gray-800"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold mb-1 text-[#1A1A1A]">Telefon Numarası</label>
                <input 
                  type="tel" 
                  placeholder="05XX XXX XX XX" 
                  value={manualPhone}
                  onChange={(e) => setManualPhone(e.target.value)}
                  className="w-full border border-gray-300 p-3 outline-none focus:border-[#1A1A1A] transition-colors bg-white font-medium text-gray-800"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-1 text-[#1A1A1A]">Hizmet / Talep</label>
                <input 
                  type="text" 
                  placeholder="Örn. Saç + Sakal Kesimi" 
                  value={manualService}
                  onChange={(e) => setManualService(e.target.value)}
                  className="w-full border border-gray-300 p-3 outline-none focus:border-[#1A1A1A] transition-colors bg-white font-medium text-gray-800"
                  required
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => {
                    setSelectedSlotForBooking(null);
                    setManualName('');
                    setManualPhone('');
                    setManualService('');
                  }}
                  className="flex-1 border-2 border-[#1A1A1A] py-3 font-bold text-[#1A1A1A] hover:bg-gray-200 transition-colors uppercase tracking-wider cursor-pointer"
                >
                  İptal
                </button>
                <button 
                  type="submit"
                  disabled={isManualBooking}
                  className="flex-1 bg-[#1A1A1A] border-2 border-[#1A1A1A] text-white py-3 font-bold hover:bg-black transition-colors disabled:opacity-50 uppercase tracking-wider cursor-pointer"
                >
                  {isManualBooking ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TEK SLOT OLUŞTURMA MODALI */}
      {isSlotModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-[#F5F4EF] p-8 w-full max-w-md shadow-2xl relative border-4 border-[#1A1A1A]">
            <h3 className="text-2xl font-black uppercase tracking-tighter mb-6 text-[#1A1A1A]">
              TEK SLOT OLUŞTUR
            </h3>

            <form onSubmit={handleQuickSlotSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold mb-1 text-[#1A1A1A]">Gün</label>
                <input 
                  type="date" 
                  value={selectedDate}
                  disabled
                  className="w-full border border-gray-300 p-3 bg-gray-200 font-bold text-gray-700 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-1 text-[#1A1A1A]">Başlangıç Saati</label>
                <input 
                  type="time" 
                  value={quickStart}
                  onChange={(e) => setQuickStart(e.target.value)}
                  className="w-full border border-gray-300 p-3 outline-none focus:border-[#1A1A1A] transition-colors bg-white font-medium text-gray-800"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-1 text-[#1A1A1A]">Bitiş Saati</label>
                <input 
                  type="time" 
                  value={quickEnd}
                  onChange={(e) => setQuickEnd(e.target.value)}
                  className="w-full border border-gray-300 p-3 outline-none focus:border-[#1A1A1A] transition-colors bg-white font-medium text-gray-800"
                  required
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => {
                    setIsSlotModalOpen(false);
                    setQuickStart('');
                    setQuickEnd('');
                  }}
                  className="flex-1 border-2 border-[#1A1A1A] py-3 font-bold text-[#1A1A1A] hover:bg-gray-200 transition-colors uppercase tracking-wider cursor-pointer"
                >
                  İptal
                </button>
                <button 
                  type="submit"
                  disabled={isQuickSlotLoading}
                  className="flex-1 bg-[#1A1A1A] border-2 border-[#1A1A1A] text-white py-3 font-bold hover:bg-black transition-colors disabled:opacity-50 uppercase tracking-wider cursor-pointer"
                >
                  {isQuickSlotLoading ? 'Oluşturuluyor...' : 'Slot Oluştur'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}