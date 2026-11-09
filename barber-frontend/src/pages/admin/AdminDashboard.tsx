
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import type { TimeSlot } from '../../types';
import {
  getShopBySlug,
  getAdminAppointments,
  getAvailableSlots,
  banCustomer,
  updateAppointmentStatus,
  bookAppointment,
  deleteSlot,
  createSingleSlot,
  type Appointment,
} from '../../services/api';
 
/* -------------------------------------------------------------------------- */
/*  Tipler                                                                    */
/* -------------------------------------------------------------------------- */
 
type TimelineItem =
  | { kind: 'APPOINTMENT'; startTime: string; data: Appointment }
  | { kind: 'EMPTY_SLOT'; startTime: string; data: TimeSlot };
 
type FeedbackModalState = {
  isOpen: boolean;
  type: 'success' | 'error';
  title: string;
  message: string;
};
 
/* -------------------------------------------------------------------------- */
/*  Sabitler                                                                  */
/* -------------------------------------------------------------------------- */
 
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const ACTIVE_STATUSES = ['CONFIRMED', 'PENDING'];
 
const INITIAL_FEEDBACK: FeedbackModalState = {
  isOpen: false,
  type: 'success',
  title: '',
  message: '',
};
 
/* -------------------------------------------------------------------------- */
/*  Yardımcı Fonksiyonlar                                                     */
/* -------------------------------------------------------------------------- */
 
/** Date nesnesini yerel saate göre YYYY-MM-DD formatına çevirir. */
const formatDateISO = (date: Date): string => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};
 
/** Verilen YYYY-MM-DD tarihini gün bazında kaydırır (saat dilimi güvenli). */
const shiftDate = (dateStr: string, deltaDays: number): string => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return formatDateISO(new Date(year, month - 1, day + deltaDays));
};
 
/** "HH:mm:ss" -> "HH:mm" */
const toHourMinute = (time: string): string => time.slice(0, 5);
 
/** Axios benzeri hatalardan okunabilir mesaj çıkarır. */
const getErrorMessage = (error: unknown, fallback: string): string => {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const data = (error as { response?: { data?: unknown } }).response?.data;
    if (typeof data === 'string' && data.trim()) return data;
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
};
 
const getStatusStyle = (status: string): string => {
  switch (status?.toUpperCase()) {
    case 'CANCELLED':
      return 'text-red-600';
    case 'COMPLETED':
      return 'text-green-600';
    default:
      return 'text-blue-600';
  }
};
 
/* -------------------------------------------------------------------------- */
/*  Ortak Modal Bileşenleri                                                   */
/* -------------------------------------------------------------------------- */
 
function ModalOverlay({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={label}
    >
      {children}
    </div>
  );
}
 
interface ConfirmModalProps {
  title: string;
  message: string;
  cancelLabel?: string;
  confirmLabel: string;
  variant: 'danger' | 'dark';
  onCancel: () => void;
  onConfirm: () => void;
}
 
function ConfirmModal({
  title,
  message,
  cancelLabel = 'Vazgeç',
  confirmLabel,
  variant,
  onCancel,
  onConfirm,
}: ConfirmModalProps) {
  const isDanger = variant === 'danger';
 
  return (
    <ModalOverlay label={title}>
      <div className="bg-[#F5F4EF] border-4 border-[#1A1A1A] p-8 max-w-md w-full shadow-[8px_8px_0px_0px_rgba(26,26,26,1)]">
        <div
          className={`border-2 p-4 mb-6 ${
            isDanger ? 'bg-red-100 border-red-600' : 'bg-[#1A1A1A] border-[#1A1A1A]'
          }`}
        >
          <h3
            className={`text-2xl font-black uppercase tracking-tighter mb-1 ${
              isDanger ? 'text-red-600' : 'text-white'
            }`}
          >
            {title}
          </h3>
          <p
            className={`font-bold text-xs uppercase tracking-wide ${
              isDanger ? 'text-red-800' : 'text-gray-300'
            }`}
          >
            {message}
          </p>
        </div>
 
        <div className="flex gap-4">
          <button
            onClick={onCancel}
            className="flex-1 border-2 border-[#1A1A1A] bg-white text-[#1A1A1A] py-3 font-bold uppercase tracking-wider hover:bg-gray-100 transition-colors cursor-pointer"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 border-2 text-white py-3 font-bold uppercase tracking-wider transition-colors cursor-pointer ${
              isDanger
                ? 'border-red-600 bg-red-600 hover:bg-red-700'
                : 'border-[#1A1A1A] bg-[#1A1A1A] hover:bg-black'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </ModalOverlay>
  );
}
 
/* -------------------------------------------------------------------------- */
/*  Ana Bileşen                                                               */
/* -------------------------------------------------------------------------- */
 
export default function AdminDashboard() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
 
  /* ----------------------------- Veri State'leri ---------------------------- */
  const [shopId, setShopId] = useState<number | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [refreshCount, setRefreshCount] = useState(0);
 
  /* --------------------------- Tarih (URL ile senkron) ---------------------- */
  const dateParam = searchParams.get('date');
  const selectedDate =
    dateParam && DATE_REGEX.test(dateParam) ? dateParam : formatDateISO(new Date());
 
  const changeDate = useCallback(
    (newDate: string) => {
      setSearchParams({ date: newDate }, { replace: true });
    },
    [setSearchParams]
  );
 
  const handlePrevDay = () => changeDate(shiftDate(selectedDate, -1));
  const handleNextDay = () => changeDate(shiftDate(selectedDate, 1));
 
  /* ----------------------------- Modal State'leri --------------------------- */
  // Manuel randevu
  const [selectedSlotForBooking, setSelectedSlotForBooking] = useState<TimeSlot | null>(null);
  const [manualName, setManualName] = useState('');
  const [manualPhone, setManualPhone] = useState('');
  const [manualService, setManualService] = useState('');
  const [isManualBooking, setIsManualBooking] = useState(false);
 
  // Hızlı slot oluşturma
  const [isSlotModalOpen, setIsSlotModalOpen] = useState(false);
  const [quickStart, setQuickStart] = useState('');
  const [quickEnd, setQuickEnd] = useState('');
  const [isQuickSlotLoading, setIsQuickSlotLoading] = useState(false);
 
  // Onay modalları
  const [appointmentToCancel, setAppointmentToCancel] = useState<number | null>(null);
  const [slotToDeleteId, setSlotToDeleteId] = useState<number | null>(null);
  const [customerToBanPhone, setCustomerToBanPhone] = useState<string | null>(null);
 
  // Bildirim modalı
  const [feedback, setFeedback] = useState<FeedbackModalState>(INITIAL_FEEDBACK);
 
  /* ------------------------------ Yardımcılar ------------------------------- */
  const triggerRefresh = () => setRefreshCount((prev) => prev + 1);
 
  const showFeedback = (type: FeedbackModalState['type'], title: string, message: string) =>
    setFeedback({ isOpen: true, type, title, message });
 
  const showError = (message: string, title = 'HATA') => showFeedback('error', title, message);
 
  const resetManualForm = () => {
    setSelectedSlotForBooking(null);
    setManualName('');
    setManualPhone('');
    setManualService('');
  };
 
  const resetQuickSlotForm = () => {
    setIsSlotModalOpen(false);
    setQuickStart('');
    setQuickEnd('');
  };
 
  /* ------------------------- Escape ile modal kapatma ------------------------ */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
 
      if (feedback.isOpen) {
        setFeedback((prev) => ({ ...prev, isOpen: false }));
      } else if (appointmentToCancel !== null) {
        setAppointmentToCancel(null);
      } else if (slotToDeleteId !== null) {
        setSlotToDeleteId(null);
      } else if (customerToBanPhone !== null) {
        setCustomerToBanPhone(null);
      } else if (selectedSlotForBooking) {
        setSelectedSlotForBooking(null);
        setManualName('');
        setManualPhone('');
        setManualService('');
      } else if (isSlotModalOpen) {
        setIsSlotModalOpen(false);
        setQuickStart('');
        setQuickEnd('');
      }
    };
 
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    feedback.isOpen,
    appointmentToCancel,
    slotToDeleteId,
    customerToBanPhone,
    selectedSlotForBooking,
    isSlotModalOpen,
  ]);
 
  /* ------------------------ 1. Slug -> Dükkan ID bulma ----------------------- */
  useEffect(() => {
    if (!slug) return;
 
    let isMounted = true;
 
    const fetchShop = async () => {
      try {
        const shop = await getShopBySlug(slug);
        if (isMounted) setShopId(shop.id);
      } catch (error) {
        console.error('Dükkan bulunamadı:', error);
        if (isMounted) {
          setLoadError('Dükkan bulunamadı.');
          setLoading(false);
        }
      }
    };
 
    fetchShop();
 
    return () => {
      isMounted = false;
    };
  }, [slug]);
 
  /* ------------------- 2. Seçilen tarihe göre veri çekme --------------------- */
  useEffect(() => {
    if (shopId === null) return;
 
    let isMounted = true;
 
    const loadDashboardData = async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const [appointmentsData, slotsData] = await Promise.all([
          getAdminAppointments(shopId, selectedDate),
          getAvailableSlots(shopId, selectedDate),
        ]);
        if (isMounted) {
          setAppointments(appointmentsData);
          setAvailableSlots(slotsData);
        }
      } catch (error) {
        console.error('Veriler çekilemedi:', error);
        if (isMounted) {
          setLoadError('Veriler yüklenirken bir hata oluştu. Lütfen sayfayı yenileyin.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };
 
    loadDashboardData();
 
    return () => {
      isMounted = false;
    };
  }, [shopId, selectedDate, refreshCount]);
 
  /* ------------------------------ İşlem Fonksiyonları ----------------------- */
 
  // Randevu durumu güncelleme
  const handleStatusChange = async (appointmentId: number, newStatus: string) => {
    if (shopId === null) return;
    try {
      await updateAppointmentStatus(appointmentId, shopId, newStatus);
      // Slotlar da değişebileceği için (iptal -> slot tekrar boşa çıkar) tam yenileme yapılır.
      triggerRefresh();
    } catch (error) {
      console.error('Durum güncellenemedi:', error);
      showError('Randevu durumu güncellenirken bir hata oluştu.');
    }
  };
 
  // Randevu iptal akışı
  const handleCancelClick = (id: number) => setAppointmentToCancel(id);
 
  const executeCancel = async () => {
    if (appointmentToCancel === null) return;
 
    const appointmentId = appointmentToCancel;
    setAppointmentToCancel(null);
 
    await handleStatusChange(appointmentId, 'CANCELLED');
  };
 
  // Kara listeye alma akışı
  const handleBanCustomerClick = (phone: string) => setCustomerToBanPhone(phone);
 
  const executeBanCustomer = async () => {
    if (shopId === null || !customerToBanPhone) return;
 
    const phone = customerToBanPhone;
    setCustomerToBanPhone(null);
 
    try {
      await banCustomer(shopId, phone);
      showFeedback(
        'success',
        'BANLANDI',
        `${phone} numaralı müşteri başarıyla kara listeye eklendi.`
      );
      triggerRefresh();
    } catch (error: unknown) {
      console.error('Banlama işlemi başarısız:', error);
      showError(getErrorMessage(error, 'Müşteri kara listeye eklenirken bir sorun oluştu.'));
    }
  };
 
  // Manuel randevu oluşturma
  const handleCreateManualBooking = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedSlotForBooking) return;
 
    if (!manualName.trim() || !manualPhone.trim() || !manualService.trim()) {
      showError('Lütfen ad, telefon ve hizmet alanlarını doldurun.', 'EKSİK BİLGİ');
      return;
    }
 
    setIsManualBooking(true);
    try {
      await bookAppointment({
        timeSlotId: selectedSlotForBooking.id,
        customerName: manualName.trim(),
        customerPhone: manualPhone.trim(),
        serviceType: manualService.trim(),
      });
 
      resetManualForm();
      triggerRefresh();
    } catch (error) {
      console.error('Manuel randevu oluşturulurken hata:', error);
      showError(getErrorMessage(error, 'Randevu oluşturulamadı. Lütfen tekrar deneyin.'));
    } finally {
      setIsManualBooking(false);
    }
  };
 
  // Hızlı slot oluşturma
  const handleQuickSlotSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (shopId === null) return;
 
    if (!quickStart || !quickEnd) {
      showError('Lütfen başlangıç ve bitiş saatlerini seçin.', 'EKSİK BİLGİ');
      return;
    }
 
    if (quickEnd <= quickStart) {
      showError('Bitiş saati, başlangıç saatinden sonra olmalıdır.', 'GEÇERSİZ SAAT');
      return;
    }
 
    setIsQuickSlotLoading(true);
    try {
      await createSingleSlot(shopId, {
        slotDate: selectedDate,
        startTime: `${quickStart}:00`,
        endTime: `${quickEnd}:00`,
      });
 
      resetQuickSlotForm();
      triggerRefresh();
    } catch (error) {
      console.error('Slot oluşturulurken hata:', error);
      showError(getErrorMessage(error, 'Slot oluşturulamadı.'));
    } finally {
      setIsQuickSlotLoading(false);
    }
  };
 
  // Boş slot silme
  const handleDeleteSlotClick = (slotId: number) => setSlotToDeleteId(slotId);
 
  const executeDeleteSlot = async () => {
    if (shopId === null || slotToDeleteId === null) return;
 
    const slotId = slotToDeleteId;
    setSlotToDeleteId(null);
 
    try {
      await deleteSlot(slotId, shopId);
      triggerRefresh();
    } catch (error) {
      console.error('Slot silinemedi:', error);
      showError(getErrorMessage(error, 'Slot silinirken bir hata oluştu.'));
    }
  };
 
  /* ------------------------------- Hesaplamalar ----------------------------- */
 
  const totalAppointments = useMemo(
    () => appointments.filter((a) => a.status?.toUpperCase() !== 'CANCELLED').length,
    [appointments]
  );
 
  const pendingAppointments = useMemo(
    () => appointments.filter((a) => ACTIVE_STATUSES.includes(a.status?.toUpperCase())).length,
    [appointments]
  );
 
  const timelineItems: TimelineItem[] = useMemo(
    () =>
      [
        ...appointments.map(
          (app): TimelineItem => ({
            kind: 'APPOINTMENT',
            startTime: toHourMinute(app.timeSlot.startTime),
            data: app,
          })
        ),
        ...availableSlots.map(
          (slot): TimelineItem => ({
            kind: 'EMPTY_SLOT',
            startTime: toHourMinute(slot.startTime),
            data: slot,
          })
        ),
      ].sort((a, b) => a.startTime.localeCompare(b.startTime)),
    [appointments, availableSlots]
  );
 
  /* ---------------------------------- Render -------------------------------- */
 
  return (
    <div className="max-w-7xl mx-auto relative">
      {/* BAŞLIK */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <h2 className="text-6xl md:text-5xl font-black tracking-tighter uppercase text-[#1A1A1A]">
          RANDEVULAR
        </h2>
 
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
        <div className="flex items-center justify-between pb-4 border-b border-gray-200 mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrevDay}
              className="w-10 h-10 border-2 border-[#1A1A1A] font-black text-xl hover:bg-[#1A1A1A] hover:text-white transition-colors flex items-center justify-center cursor-pointer"
              title="Önceki Gün"
              aria-label="Önceki Gün"
            >
              ‹
            </button>
            <button
              onClick={handleNextDay}
              className="w-10 h-10 border-2 border-[#1A1A1A] font-black text-xl hover:bg-[#1A1A1A] hover:text-white transition-colors flex items-center justify-center cursor-pointer"
              title="Sonraki Gün"
              aria-label="Sonraki Gün"
            >
              ›
            </button>
            <h3 className="text-lg font-bold uppercase tracking-wider text-[#1A1A1A] ml-2">
              GÜNLÜK ZAMAN ÇİZELGESİ • {selectedDate}
            </h3>
          </div>
        </div>
 
        {loading ? (
          <p className="text-gray-500 font-bold animate-pulse py-4">
            Slotlar ve randevular yükleniyor...
          </p>
        ) : loadError ? (
          <div className="py-8 text-center text-red-600 font-bold">{loadError}</div>
        ) : timelineItems.length === 0 ? (
          <div className="py-8 text-center text-gray-500 font-bold">
            Bu tarih ({selectedDate}) için henüz hiç slot oluşturulmamış. Sağ üstteki "+ Slot
            Oluştur" butonundan ekleyebilirsiniz.
          </div>
        ) : (
          <div className="flex flex-col">
            {timelineItems.map((item) => (
              <div
                key={`${item.kind}-${item.data.id}`}
                className="flex items-center justify-between py-5 border-b border-gray-100"
              >
                <span className="font-black text-lg w-20 text-[#1A1A1A]">{item.startTime}</span>
 
                {item.kind === 'APPOINTMENT' ? (
                  <AppointmentRow
                    appointment={item.data}
                    onCancel={handleCancelClick}
                    onBan={handleBanCustomerClick}
                  />
                ) : (
                  <EmptySlotRow
                    slot={item.data}
                    onAddAppointment={setSelectedSlotForBooking}
                    onDelete={handleDeleteSlotClick}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
 
      {/* MANUEL RANDEVU EKLEME MODALI */}
      {selectedSlotForBooking && (
        <ModalOverlay label="Manuel Randevu Oluştur">
          <div className="bg-[#F5F4EF] p-8 w-full max-w-md shadow-2xl relative border-4 border-[#1A1A1A]">
            <h3 className="text-2xl font-black uppercase tracking-tighter mb-1 text-[#1A1A1A]">
              MANUEL RANDEVU OLUŞTUR
            </h3>
            <p className="text-gray-600 text-xs font-bold uppercase tracking-wider mb-6">
              [{toHourMinute(selectedSlotForBooking.startTime)} -{' '}
              {toHourMinute(selectedSlotForBooking.endTime)}] SAATİ İÇİN MÜŞTERİ KAYDI
            </p>
 
            <form onSubmit={handleCreateManualBooking} className="space-y-4">
              <FormField label="Müşteri Adı Soyadı">
                <input
                  type="text"
                  placeholder="Örn. Ahmet Yılmaz"
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  className={INPUT_CLASS}
                  required
                />
              </FormField>
 
              <FormField label="Telefon Numarası">
                <input
                  type="tel"
                  placeholder="05XX XXX XX XX"
                  value={manualPhone}
                  onChange={(e) => setManualPhone(e.target.value)}
                  className={INPUT_CLASS}
                  required
                />
              </FormField>
 
              <FormField label="Hizmet / Talep">
                <input
                  type="text"
                  placeholder="Örn. Saç + Sakal Kesimi"
                  value={manualService}
                  onChange={(e) => setManualService(e.target.value)}
                  className={INPUT_CLASS}
                  required
                />
              </FormField>
 
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={resetManualForm}
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
        </ModalOverlay>
      )}
 
      {/* TEK SLOT OLUŞTURMA MODALI */}
      {isSlotModalOpen && (
        <ModalOverlay label="Tek Slot Oluştur">
          <div className="bg-[#F5F4EF] p-8 w-full max-w-md shadow-2xl relative border-4 border-[#1A1A1A]">
            <h3 className="text-2xl font-black uppercase tracking-tighter mb-6 text-[#1A1A1A]">
              TEK SLOT OLUŞTUR
            </h3>
 
            <form onSubmit={handleQuickSlotSubmit} className="space-y-4">
              <FormField label="Gün">
                <input
                  type="date"
                  value={selectedDate}
                  disabled
                  className="w-full border border-gray-300 p-3 bg-gray-200 font-bold text-gray-700 cursor-not-allowed"
                />
              </FormField>
 
              <FormField label="Başlangıç Saati">
                <input
                  type="time"
                  value={quickStart}
                  onChange={(e) => setQuickStart(e.target.value)}
                  className={INPUT_CLASS}
                  required
                />
              </FormField>
 
              <FormField label="Bitiş Saati">
                <input
                  type="time"
                  value={quickEnd}
                  onChange={(e) => setQuickEnd(e.target.value)}
                  className={INPUT_CLASS}
                  required
                />
              </FormField>
 
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={resetQuickSlotForm}
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
        </ModalOverlay>
      )}
 
      {/* RANDEVU İPTAL ONAY MODALI */}
      {appointmentToCancel !== null && (
        <ConfirmModal
          variant="danger"
          title="RANDEVUYU İPTAL ET"
          message="Bu randevuyu iptal etmek istediğinize emin misiniz?"
          confirmLabel="Evet, İptal Et"
          onCancel={() => setAppointmentToCancel(null)}
          onConfirm={executeCancel}
        />
      )}
 
      {/* SLOT SİLME ONAY MODALI */}
      {slotToDeleteId !== null && (
        <ConfirmModal
          variant="danger"
          title="SLOTU SİL"
          message="Bu boş slotu silmek istediğinize emin misiniz?"
          confirmLabel="Evet, Sil"
          onCancel={() => setSlotToDeleteId(null)}
          onConfirm={executeDeleteSlot}
        />
      )}
 
      {/* KARA LİSTE ONAY MODALI */}
      {customerToBanPhone !== null && (
        <ConfirmModal
          variant="dark"
          title="KARA LİSTEYE AL"
          message={`${customerToBanPhone} numaralı müşteriyi kalıcı olarak engellemek istediğinize emin misiniz? Bir daha randevu alamayacak.`}
          confirmLabel="Evet, Banla"
          onCancel={() => setCustomerToBanPhone(null)}
          onConfirm={executeBanCustomer}
        />
      )}
 
      {/* BİLDİRİM VE HATA MODALI */}
      {feedback.isOpen && (
        <ModalOverlay label={feedback.title}>
          <div className="bg-[#F5F4EF] border-4 border-[#1A1A1A] p-8 max-w-md w-full shadow-[8px_8px_0px_0px_rgba(26,26,26,1)]">
            <div
              className={`inline-block px-3 py-1 text-xs font-black uppercase tracking-widest text-white mb-4 ${
                feedback.type === 'success' ? 'bg-[#1A1A1A]' : 'bg-red-600'
              }`}
            >
              {feedback.type === 'success' ? 'BAŞARILI' : 'HATA'}
            </div>
            <h3 className="text-2xl font-black uppercase tracking-tighter text-[#1A1A1A] mb-2">
              {feedback.title}
            </h3>
            <p className="text-gray-700 font-bold text-sm mb-6">{feedback.message}</p>
            <button
              onClick={() => setFeedback((prev) => ({ ...prev, isOpen: false }))}
              className="w-full bg-[#1A1A1A] text-white py-3 font-black uppercase tracking-widest border-2 border-[#1A1A1A] hover:bg-black transition-colors cursor-pointer"
            >
              TAMAM
            </button>
          </div>
        </ModalOverlay>
      )}
    </div>
  );
}
 
/* -------------------------------------------------------------------------- */
/*  Yardımcı Alt Bileşenler                                                   */
/* -------------------------------------------------------------------------- */
 
const INPUT_CLASS =
  'w-full border border-gray-300 p-3 outline-none focus:border-[#1A1A1A] transition-colors bg-white font-medium text-gray-800';
 
function FormField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-bold mb-1 text-[#1A1A1A]">{label}</label>
      {children}
    </div>
  );
}
 
interface AppointmentRowProps {
  appointment: Appointment;
  onCancel: (id: number) => void;
  onBan: (phone: string) => void;
}
 
function AppointmentRow({ appointment, onCancel, onBan }: AppointmentRowProps) {
  const isCancelled = appointment.status === 'CANCELLED';
 
  const disabledClass = 'border-gray-300 text-gray-400 bg-gray-100 cursor-not-allowed opacity-60';
  const baseButtonClass =
    'border-2 font-black text-[10px] md:text-xs px-3 py-2 uppercase tracking-wider transition-colors';
 
  return (
    <div className="flex-1 bg-[#F5F4EF] border border-transparent p-4 mx-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <p className="font-bold text-[#1A1A1A] text-sm mb-1 flex items-center flex-wrap gap-2">
          <span>
            [{appointment.customerName}] • {appointment.customerPhone}
          </span>
          <span className="text-gray-300">•</span>
          <span
            className={`text-xs uppercase tracking-widest font-black ${getStatusStyle(
              appointment.status
            )}`}
          >
            {appointment.status}
          </span>
        </p>
        <p className="text-gray-500 text-xs">{appointment.serviceType}</p>
      </div>
 
      <div className="flex flex-col sm:flex-row gap-2 mt-3 md:mt-0">
        <button
          onClick={() => onCancel(appointment.id)}
          disabled={isCancelled}
          className={`${baseButtonClass} ${
            isCancelled
              ? disabledClass
              : 'border-red-600 text-red-600 bg-transparent hover:bg-red-600 hover:text-white cursor-pointer'
          }`}
          title="Randevuyu İptal Et"
        >
          İPTAL ET
        </button>
 
        <button
          onClick={() => onBan(appointment.customerPhone)}
          disabled={isCancelled}
          className={`${baseButtonClass} ${
            isCancelled
              ? disabledClass
              : 'border-[#1A1A1A] text-[#1A1A1A] bg-transparent hover:bg-[#1A1A1A] hover:text-white cursor-pointer'
          }`}
          title="Müşteriyi Kara Listeye Ekle"
        >
          KARA LİSTEYE AL
        </button>
      </div>
    </div>
  );
}
 
interface EmptySlotRowProps {
  slot: TimeSlot;
  onAddAppointment: (slot: TimeSlot) => void;
  onDelete: (slotId: number) => void;
}
 
function EmptySlotRow({ slot, onAddAppointment, onDelete }: EmptySlotRowProps) {
  return (
    <div className="flex-1 mx-4 text-gray-600 font-medium text-sm flex items-center justify-between bg-gray-50/50 p-4 border border-dashed border-gray-200">
      <div className="flex items-center gap-3">
        <span className="text-gray-400 font-bold">Boş Slot</span>
 
        <button
          onClick={() => onAddAppointment(slot)}
          className="bg-[#1A1A1A] text-white px-3 py-1 text-xs font-bold uppercase tracking-wider hover:bg-black transition-colors flex items-center gap-1 cursor-pointer"
          title="Telefonla Arayan Müşteri İçin Randevu Ekle"
        >
          <span className="text-sm font-black">+</span>
          <span>Randevu Ekle</span>
        </button>
 
        <button
          onClick={() => onDelete(slot.id)}
          className="border border-red-600 text-red-600 px-3 py-1 text-xs font-bold uppercase tracking-wider hover:bg-red-600 hover:text-white transition-colors cursor-pointer"
          title="Bu Slotu Sil"
        >
          Slot Sil
        </button>
      </div>
 
      <span className="text-xs text-gray-400 font-mono">
        {toHourMinute(slot.startTime)} - {toHourMinute(slot.endTime)}
      </span>
    </div>
  );
}