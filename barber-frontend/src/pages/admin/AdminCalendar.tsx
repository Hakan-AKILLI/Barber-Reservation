import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  getShopBySlug, 
  getAdminAppointments, 
  getAvailableSlots, 
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

export default function AdminCalendar() {
  const { slug } = useParams<{ slug: string }>();
  const [shopId, setShopId] = useState<number | null>(null);

  // Tarih ve Takvim Navigasyon State'leri
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);
  
  // Veri State'leri (Aktif Ay İçin)
  const [monthAppointments, setMonthAppointments] = useState<Appointment[]>([]);
  const [closedDays, setClosedDays] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Seçili Gün Detay Paneli (Drawer)
  const [selectedDayAppointments, setSelectedDayAppointments] = useState<Appointment[]>([]);
  const [selectedDaySlots, setSelectedDaySlots] = useState<TimeSlot[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Hızlı Slot Ekleme Form State'leri
  const [quickStart, setQuickStart] = useState('');
  const [quickEnd, setQuickEnd] = useState('');

  // 1. Dükkan ID bul
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

  // Ay Bilgileri Hesaplama
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-11
  const monthName = currentDate.toLocaleString('tr-TR', { month: 'long', year: 'numeric' });

  // Ayın günlerini oluşturma
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const startingOffset = (firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1);

  // 2. Seçili ayın verilerini yükle
  useEffect(() => {
    if (!shopId) return;

    let isMounted = true;
    const fetchMonthData = async () => {
      setLoading(true);
      try {
        const startDateStr = `${year}-${String(month + 1).padStart(2, '0')}-01`;
        const appData = await getAdminAppointments(shopId, startDateStr);

        if (isMounted) {
          setMonthAppointments(appData);
        }
      } catch (error) {
        console.error('Ay verileri çekilemedi:', error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchMonthData();
    return () => { isMounted = false; };
  }, [shopId, year, month]);

  // Ay değiştirme fonksiyonları
  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Güne Tıklama (Detay Çekmecesini Açma)
  const handleDayClick = async (dayNumber: number) => {
    const formattedDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`;
    setSelectedDateStr(formattedDate);
    setIsDrawerOpen(true);

    if (!shopId) return;
    try {
      const [appData, slotData] = await Promise.all([
        getAdminAppointments(shopId, formattedDate),
        getAvailableSlots(shopId, formattedDate)
      ]);
      setSelectedDayAppointments(appData);
      setSelectedDaySlots(slotData);
    } catch (error) {
      console.error('Gün detayları çekilemedi:', error);
    }
  };

  // Günü Kapat / Aç Toggle
  const toggleCloseDay = (dateStr: string) => {
    if (closedDays.includes(dateStr)) {
      setClosedDays(closedDays.filter(d => d !== dateStr));
    } else {
      setClosedDays([...closedDays, dateStr]);
    }
  };

  // Seçili Güne Hızlı Slot Oluşturma
  const handleQuickSlotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopId || !selectedDateStr || !quickStart || !quickEnd) return;

    try {
      await createSingleSlot(shopId, {
        slotDate: selectedDateStr,
        startTime: `${quickStart}:00`,
        endTime: `${quickEnd}:00`
      });
      setQuickStart('');
      setQuickEnd('');

      const [appData, slotData] = await Promise.all([
        getAdminAppointments(shopId, selectedDateStr),
        getAvailableSlots(shopId, selectedDateStr)
      ]);
      setSelectedDayAppointments(appData);
      setSelectedDaySlots(slotData);
    } catch (error) {
      console.error('Slot oluşturulamadı:', error);
    }
  };

  return (
    <div className="max-w-6xl mx-auto relative">
      <h2 className="text-4xl md:text-5xl font-black tracking-tighter uppercase mb-8 text-[#1A1A1A]">
        TAKVİM
      </h2>

      {/* KONTROL PANELI */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8 bg-white border border-gray-200 p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <button 
            onClick={handlePrevMonth}
            className="w-10 h-10 border-2 border-[#1A1A1A] font-black text-xl hover:bg-[#1A1A1A] hover:text-white transition-colors flex items-center justify-center cursor-pointer"
          >
            ‹
          </button>
          <button 
            onClick={handleNextMonth}
            className="w-10 h-10 border-2 border-[#1A1A1A] font-black text-xl hover:bg-[#1A1A1A] hover:text-white transition-colors flex items-center justify-center cursor-pointer"
          >
            ›
          </button>
          <span className="text-xl font-black uppercase tracking-wider ml-4 text-[#1A1A1A]">
            {monthName}
          </span>
        </div>

        <div className="flex items-center border border-[#1A1A1A]">
          <button className="px-5 py-2 font-bold text-sm bg-gray-100 text-[#1A1A1A] border-r border-[#1A1A1A]">
            Haftalık
          </button>
          <button className="px-5 py-2 font-bold text-sm bg-[#1A1A1A] text-white">
            Aylık
          </button>
        </div>
      </div>

      {/* TAKVİM IZGARASI */}
      <div className="bg-white border border-gray-200 shadow-sm overflow-hidden">
        <div className="grid grid-cols-7 border-b border-gray-200 bg-[#F5F4EF] text-center font-black text-sm uppercase py-3 text-[#1A1A1A]">
          <div>Pzt</div>
          <div>Sal</div>
          <div>Çar</div>
          <div>Per</div>
          <div>Cum</div>
          <div>Cmt</div>
          <div>Paz</div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-500 font-bold animate-pulse">
            Takvim verileri yükleniyor...
          </div>
        ) : (
          <div className="grid grid-cols-7 auto-rows-fr border-collapse">
            {Array.from({ length: startingOffset }).map((_, i) => (
              <div key={`empty-${i}`} className="min-h-[110px] border-b border-r border-gray-100 bg-gray-50/50" />
            ))}

            {Array.from({ length: daysInMonth }).map((_, index) => {
              const dayNum = index + 1;
              const formattedDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
              const isClosed = closedDays.includes(formattedDate);

              const dayApps = monthAppointments.filter(
                (app) => app.timeSlot?.slotDate === formattedDate
              );

              const confirmedCount = dayApps.filter(a => a.status?.toUpperCase() === 'CONFIRMED').length;
              const completedCount = dayApps.filter(a => a.status?.toUpperCase() === 'COMPLETED').length;
              const cancelledCount = dayApps.filter(a => a.status?.toUpperCase() === 'CANCELLED').length;

              return (
                <div
                  key={dayNum}
                  onClick={() => handleDayClick(dayNum)}
                  className={`min-h-[110px] p-2 border-b border-r border-gray-200 cursor-pointer transition-all hover:bg-[#F5F4EF] relative group flex flex-col justify-between ${
                    isClosed ? 'bg-gray-200/80' : 'bg-white'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <span className={`font-black text-lg ${isClosed ? 'text-gray-400 line-through' : 'text-[#1A1A1A]'}`}>
                      {dayNum}
                    </span>

                    {isClosed && (
                      <span className="text-[10px] font-black bg-[#1A1A1A] text-white px-1.5 py-0.5 uppercase tracking-wider">
                        KAPALI
                      </span>
                    )}
                  </div>

                  {!isClosed && (
                    <div className="mt-2 space-y-1">
                      {dayApps.length > 0 && (
                        <div className="text-[11px] font-bold bg-[#1A1A1A] text-white px-1.5 py-0.5 inline-block">
                          [ {dayApps.length} Randevu ]
                        </div>
                      )}

                      <div className="flex items-center gap-1.5 pt-1">
                        {confirmedCount > 0 && (
                          <span className="w-2.5 h-2.5 rounded-full bg-blue-600" title={`${confirmedCount} Bekleyen`} />
                        )}
                        {completedCount > 0 && (
                          <span className="w-2.5 h-2.5 rounded-full bg-green-600" title={`${completedCount} Tamamlanan`} />
                        )}
                        {cancelledCount > 0 && (
                          <span className="w-2.5 h-2.5 rounded-full bg-red-600" title={`${cancelledCount} İptal`} />
                        )}
                      </div>
                    </div>
                  )}

                  <div className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-bold text-gray-500 uppercase tracking-widest text-right">
                    Detay →
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SAĞDAN AÇILAN DETAY ÇEKMECESİ */}
      {isDrawerOpen && selectedDateStr && (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-end backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg h-full p-8 shadow-2xl overflow-y-auto border-l-4 border-[#1A1A1A] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-6 border-b border-gray-200 mb-6">
                <div>
                  <h3 className="text-2xl font-black uppercase tracking-tighter text-[#1A1A1A]">
                    {selectedDateStr}
                  </h3>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mt-1">
                    GÜNLÜK DETAY VE SLOT YÖNETİMİ
                  </p>
                </div>

                <button 
                  onClick={() => setIsDrawerOpen(false)}
                  className="w-10 h-10 border-2 border-[#1A1A1A] font-black text-xl hover:bg-black hover:text-white transition-colors flex items-center justify-center cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="mb-6">
                <button
                  onClick={() => toggleCloseDay(selectedDateStr)}
                  className={`w-full py-3 font-bold uppercase tracking-wider border-2 transition-colors cursor-pointer ${
                    closedDays.includes(selectedDateStr)
                      ? 'border-green-600 text-green-600 hover:bg-green-600 hover:text-white'
                      : 'border-red-600 text-red-600 hover:bg-red-600 hover:text-white'
                  }`}
                >
                  {closedDays.includes(selectedDateStr) ? 'Günü Tekrar Aç' : 'Günü Kapat (İzinli / Tatil)'}
                </button>
              </div>

              <div className="bg-[#F5F4EF] p-4 border border-gray-200 mb-6">
                <h4 className="font-black text-sm uppercase tracking-wider mb-3 text-[#1A1A1A]">
                  Bu Güne Slot Ekle
                </h4>
                <form onSubmit={handleQuickSlotSubmit} className="flex gap-2">
                  <input 
                    type="time" 
                    value={quickStart}
                    onChange={(e) => setQuickStart(e.target.value)}
                    className="border border-gray-300 p-2 text-sm bg-white font-medium flex-1 text-gray-800"
                    required
                  />
                  <input 
                    type="time" 
                    value={quickEnd}
                    onChange={(e) => setQuickEnd(e.target.value)}
                    className="border border-gray-300 p-2 text-sm bg-white font-medium flex-1 text-gray-800"
                    required
                  />
                  <button 
                    type="submit"
                    className="bg-[#1A1A1A] text-white px-4 text-xs font-bold uppercase hover:bg-black cursor-pointer"
                  >
                    Ekle
                  </button>
                </form>
              </div>

              <div className="space-y-3">
                <h4 className="font-black text-sm uppercase tracking-wider text-[#1A1A1A]">
                  O Günün Çizelgesi
                </h4>

                {selectedDayAppointments.length === 0 && selectedDaySlots.length === 0 ? (
                  <p className="text-gray-400 font-medium text-sm py-4">Bu gün için herhangi bir slot veya randevu bulunmuyor.</p>
                ) : (
                  <div className="space-y-2">
                    {selectedDayAppointments.map((app) => (
                      <div key={app.id} className="bg-[#F5F4EF] p-3 border-l-4 border-blue-600 flex justify-between items-center">
                        <div>
                          <p className="font-bold text-sm text-[#1A1A1A]">[{app.customerName}] • {app.timeSlot?.startTime.slice(0, 5)}</p>
                          <p className="text-xs text-gray-500">{app.serviceType}</p>
                        </div>
                        <span className="text-xs font-black uppercase text-blue-600">{app.status}</span>
                      </div>
                    ))}

                    {selectedDaySlots.map((slot) => (
                      <div key={slot.id} className="bg-gray-50 p-3 border border-dashed border-gray-300 flex justify-between items-center">
                        <span className="text-xs font-bold text-gray-400">Boş Slot • {slot.startTime.slice(0, 5)} - {slot.endTime.slice(0, 5)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <button 
              onClick={() => setIsDrawerOpen(false)}
              className="w-full bg-[#1A1A1A] text-white py-3 font-bold uppercase tracking-widest hover:bg-black mt-8 cursor-pointer"
            >
              Kapat
            </button>
          </div>
        </div>
      )}
    </div>
  );
}