import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  getShopBySlug, 
  getAdminAppointments, 
  getAvailableSlots, 
  createSingleSlot,
  closeDaySlots,
  type Appointment,
} from '../../services/api';
import type { TimeSlot } from '../../types';

export default function AdminCalendar() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [shopId, setShopId] = useState<number | null>(null);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);
  
  const [monthAppointments, setMonthAppointments] = useState<Appointment[]>([]);
  const [monthSlots, setMonthSlots] = useState<TimeSlot[]>([]); 
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0); 

  const [selectedDayAppointments, setSelectedDayAppointments] = useState<Appointment[]>([]);
  const [selectedDaySlots, setSelectedDaySlots] = useState<TimeSlot[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const [quickStart, setQuickStart] = useState('');
  const [quickEnd, setQuickEnd] = useState('');

  // YENİ: Bildirim ve Onay State'leri
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    type: 'success' | 'error';
    title: string;
    message: string;
  }>({ isOpen: false, type: 'success', title: '', message: '' });

  const [isConfirmCloseDayOpen, setIsConfirmCloseDayOpen] = useState(false);
  const [isClosingDay, setIsClosingDay] = useState(false);

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

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthName = currentDate.toLocaleString('tr-TR', { month: 'long', year: 'numeric' });

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const startingOffset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

  useEffect(() => {
    if (!shopId) return;
    let isMounted = true;
    const fetchMonthData = async () => {
      setLoading(true);
      try {
        const startDateStr = `${year}-${String(month + 1).padStart(2, '0')}-01`;
        const [appData, slotData] = await Promise.all([
          getAdminAppointments(shopId, startDateStr),
          getAvailableSlots(shopId, startDateStr) 
        ]);
        if (isMounted) {
          setMonthAppointments(appData);
          setMonthSlots(slotData);
        }
      } catch (error) {
        console.error('Ay verileri çekilemedi:', error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchMonthData();
    return () => { isMounted = false; };
  }, [shopId, year, month, refreshKey]); 

  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

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

  const handleNavigateToDashboard = () => {
    if (selectedDateStr) navigate(`/${slug}/admin?date=${selectedDateStr}`);
  };

  // YENİ: Modal ile günü kapatma akışı
  const executeCloseDay = async () => {
    if (!shopId || !selectedDateStr) return;
    setIsClosingDay(true);
    try {
      await closeDaySlots(shopId, selectedDateStr);
      
      const [appData, slotData] = await Promise.all([
        getAdminAppointments(shopId, selectedDateStr),
        getAvailableSlots(shopId, selectedDateStr)
      ]);
      setSelectedDayAppointments(appData);
      setSelectedDaySlots(slotData);
      setRefreshKey(prev => prev + 1);
      
      setIsConfirmCloseDayOpen(false);
      setModalConfig({
        isOpen: true,
        type: 'success',
        title: 'GÜN KAPATILDI',
        message: 'Seçilen tarihteki boş slotlar başarıyla temizlendi.'
      });
    } catch (error) {
      console.error('Gün kapatılamadı:', error);
      setIsConfirmCloseDayOpen(false);
      setModalConfig({
        isOpen: true,
        type: 'error',
        title: 'HATA OLUŞTU',
        message: 'Boş slotlar silinirken bir sorunla karşılaşıldı.'
      });
    } finally {
      setIsClosingDay(false);
    }
  };

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
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Slot oluşturulamadı:', error);
    }
  };

  return (
    <div className="max-w-6xl mx-auto relative">
      <h2 className="text-4xl md:text-5xl font-black tracking-tighter uppercase mb-8 text-[#1A1A1A]">
        TAKVİM
      </h2>

      <div className="flex flex-wrap items-center justify-between gap-4 mb-8 bg-white border border-gray-200 p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <button onClick={handlePrevMonth} className="w-10 h-10 border-2 border-[#1A1A1A] font-black text-xl hover:bg-[#1A1A1A] hover:text-white transition-colors cursor-pointer">‹</button>
          <button onClick={handleNextMonth} className="w-10 h-10 border-2 border-[#1A1A1A] font-black text-xl hover:bg-[#1A1A1A] hover:text-white transition-colors cursor-pointer">›</button>
          <span className="text-xl font-black uppercase tracking-wider ml-4 text-[#1A1A1A]">
            {monthName}
          </span>
        </div>
      </div>

      <div className="bg-white border border-gray-200 shadow-sm overflow-hidden">
        <div className="grid grid-cols-7 border-b border-gray-200 bg-[#F5F4EF] text-center font-black text-sm uppercase py-3 text-[#1A1A1A]">
          <div>Pzt</div><div>Sal</div><div>Çar</div><div>Per</div><div>Cum</div><div>Cmt</div><div>Paz</div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-500 font-bold animate-pulse">Takvim verileri yükleniyor...</div>
        ) : (
          <div className="grid grid-cols-7 auto-rows-fr border-collapse">
            {Array.from({ length: startingOffset }).map((_, i) => (
              <div key={`empty-${i}`} className="min-h-[110px] border-b border-r border-gray-100 bg-gray-50/50" />
            ))}

            {Array.from({ length: daysInMonth }).map((_, index) => {
              const dayNum = index + 1;
              const formattedDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;

              const dayApps = monthAppointments.filter(app => app.timeSlot?.slotDate === formattedDate);
              const emptyDaySlots = monthSlots.filter(slot => slot.slotDate === formattedDate && !slot.booked);

              const confirmedCount = dayApps.filter(a => a.status?.toUpperCase() === 'CONFIRMED').length;
              const completedCount = dayApps.filter(a => a.status?.toUpperCase() === 'COMPLETED').length;
              const cancelledCount = dayApps.filter(a => a.status?.toUpperCase() === 'CANCELLED').length;

              return (
                <div
                  key={dayNum}
                  onClick={() => handleDayClick(dayNum)}
                  className={`min-h-[110px] p-2 border-b border-r border-gray-200 cursor-pointer transition-all hover:bg-[#F5F4EF] relative group flex flex-col justify-between bg-white`}
                >
                  <div className="flex justify-between items-start">
                    <span className="font-black text-lg text-[#1A1A1A]">{dayNum}</span>
                  </div>

                  <div className="mt-2 flex flex-col items-start gap-1">
                    {dayApps.length > 0 && (
                      <div className="text-[11px] font-bold bg-[#1A1A1A] text-white px-1.5 py-0.5 inline-block">
                        [ {dayApps.length} Randevu ]
                      </div>
                    )}
                    {emptyDaySlots.length > 0 && (
                      <div className="text-[11px] font-bold border border-dashed border-[#1A1A1A] text-[#1A1A1A] px-1.5 py-0.5 inline-block">
                        [ {emptyDaySlots.length} Boş Slot ]
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 pt-1">
                      {confirmedCount > 0 && <span className="w-2.5 h-2.5 rounded-full bg-blue-600" title={`${confirmedCount} Bekleyen`} />}
                      {completedCount > 0 && <span className="w-2.5 h-2.5 rounded-full bg-green-600" title={`${completedCount} Tamamlanan`} />}
                      {cancelledCount > 0 && <span className="w-2.5 h-2.5 rounded-full bg-red-600" title={`${cancelledCount} İptal`} />}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {isDrawerOpen && selectedDateStr && (
        <div className="fixed inset-0 bg-black/50 z-40 flex justify-end backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg h-full p-8 shadow-2xl overflow-y-auto border-l-4 border-[#1A1A1A] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-6 border-b border-gray-200 mb-6">
                <div>
                  <h3 className="text-2xl font-black uppercase tracking-tighter text-[#1A1A1A]">{selectedDateStr}</h3>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mt-1">GÜNLÜK DETAY VE SLOT YÖNETİMİ</p>
                </div>
                <button onClick={() => setIsDrawerOpen(false)} className="w-10 h-10 border-2 border-[#1A1A1A] font-black text-xl hover:bg-black hover:text-white cursor-pointer">✕</button>
              </div>

              <div className="mb-6">
                <button onClick={handleNavigateToDashboard} className="w-full bg-blue-600 text-white py-3 font-black uppercase tracking-wider hover:bg-blue-700 cursor-pointer">
                  Bu Günün Çizelgesine Git →
                </button>
              </div>

              <div className="mb-6">
                <button 
                  onClick={() => setIsConfirmCloseDayOpen(true)} 
                  className="w-full py-3 font-bold uppercase tracking-wider border-2 border-red-600 text-red-600 hover:bg-red-600 hover:text-white cursor-pointer transition-colors"
                >
                  GÜNÜ KAPAT (BOŞ SLOTLARI SİL)
                </button>
              </div>

              <div className="bg-[#F5F4EF] p-4 border border-gray-200 mb-6">
                <h4 className="font-black text-sm uppercase tracking-wider mb-3 text-[#1A1A1A]">Bu Güne Slot Ekle</h4>
                <form onSubmit={handleQuickSlotSubmit} className="flex gap-2">
                  <input type="time" value={quickStart} onChange={(e) => setQuickStart(e.target.value)} className="border border-gray-300 p-2 text-sm bg-white font-medium flex-1" required />
                  <input type="time" value={quickEnd} onChange={(e) => setQuickEnd(e.target.value)} className="border border-gray-300 p-2 text-sm bg-white font-medium flex-1" required />
                  <button type="submit" className="bg-[#1A1A1A] text-white px-4 text-xs font-bold uppercase hover:bg-black cursor-pointer">Ekle</button>
                </form>
              </div>

              <div className="space-y-3">
                <h4 className="font-black text-sm uppercase tracking-wider text-[#1A1A1A]">O Günün Çizelgesi</h4>
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
            <button onClick={() => setIsDrawerOpen(false)} className="w-full bg-[#1A1A1A] text-white py-3 font-bold uppercase tracking-widest hover:bg-black mt-8 cursor-pointer">Kapat</button>
          </div>
        </div>
      )}

      {/* YENİ: Günü Kapat Onay Modalı */}
      {isConfirmCloseDayOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-[#F5F4EF] border-4 border-[#1A1A1A] p-8 max-w-md w-full shadow-[8px_8px_0px_0px_rgba(26,26,26,1)]">
            <div className="bg-red-100 border-2 border-red-600 p-5 mb-6 text-center">
              <h3 className="text-2xl font-black uppercase tracking-tighter text-red-600 mb-2">GÜNÜ KAPAT</h3>
              <p className="text-red-800 font-bold text-sm uppercase tracking-wide">
                <span className="block mb-2">{selectedDateStr} tarihindeki tüm BOŞ SAATLER kalıcı olarak silinecektir.</span>
                <span className="block text-xs">(Dolu randevular silinmez)</span>
              </p>
            </div>
            <div className="flex gap-4">
              <button onClick={() => setIsConfirmCloseDayOpen(false)} disabled={isClosingDay} className="flex-1 border-2 border-[#1A1A1A] bg-white py-3 font-bold uppercase hover:bg-gray-100 cursor-pointer disabled:opacity-50">
                VAZGEÇ
              </button>
              <button onClick={executeCloseDay} disabled={isClosingDay} className="flex-1 border-2 border-red-600 bg-red-600 text-white py-3 font-bold uppercase hover:bg-red-700 cursor-pointer disabled:opacity-50">
                {isClosingDay ? 'SİLİNİYOR...' : 'EVET, SİL'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* YENİ: Başarı/Hata Bildirim Modalı */}
      {modalConfig.isOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-[#F5F4EF] border-4 border-[#1A1A1A] p-8 max-w-md w-full shadow-[8px_8px_0px_0px_rgba(26,26,26,1)]">
            <div className={`inline-block px-3 py-1 text-xs font-black uppercase tracking-widest text-white mb-4 ${
              modalConfig.type === 'success' ? 'bg-[#1A1A1A]' : 'bg-red-600'
            }`}>
              {modalConfig.type === 'success' ? 'BAŞARILI' : 'HATA'}
            </div>
            <h3 className="text-2xl font-black uppercase tracking-tighter text-[#1A1A1A] mb-2">{modalConfig.title}</h3>
            <p className="text-gray-700 font-bold text-sm mb-6">{modalConfig.message}</p>
            <button onClick={() => setModalConfig({ ...modalConfig, isOpen: false })} className="w-full bg-[#1A1A1A] text-white py-3 font-black uppercase tracking-widest hover:bg-black cursor-pointer">
              TAMAM
            </button>
          </div>
        </div>
      )}
    </div>
  );
}