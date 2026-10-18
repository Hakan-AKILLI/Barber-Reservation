import { useState, useEffect } from 'react';
import { getAvailableSlots, bookAppointment } from './services/api';

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

export default function App() {
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
  
  // Modal ve Form State'leri
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [serviceType, setServiceType] = useState(''); // backend'in beklediği alan adı
  const [pnrCode, setPnrCode] = useState<string | null>(null); // İşlem başarılıysa kod buraya gelecek
  const [isBooking, setIsBooking] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const shopId = 1; 

  useEffect(() => {
    const fetchSlots = async () => {
      setLoading(true);
      try {
        const data = await getAvailableSlots(shopId, selectedDate);
        setSlots(data);
      } catch (error) {
        console.error("Saatler çekilemedi:", error);
        setSlots([]); 
      } finally {
        setLoading(false);
      }
    };

    fetchSlots();
  }, [selectedDate, refreshKey]);

  // Randevu oluşturma fonksiyonu
  const handleBook = async () => {
    if (!selectedSlot || !customerName || !customerPhone || !serviceType) {
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
      
      // Backend başarılı yanıtta { cancellationCode: 'XYZ123' } dönüyorsa (backend'in dönüşüne göre burayı güncelleyebiliriz):
      setPnrCode(result.cancellationCode || "KOD-ALINAMADI");
      
    } catch (error) {
      console.error("Randevu oluşturulurken hata:", error);
      alert("Randevu oluşturulamadı. Lütfen tekrar deneyin.");
    } finally {
      setIsBooking(false);
    }
  };
  const handleCopy = async () => {
    if (pnrCode) {
      await navigator.clipboard.writeText(pnrCode);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000); // 2 saniye sonra yazıyı eski haline döndür
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
    closeModal(); // Modalı ve form verilerini sıfırla
    setRefreshKey(prev => prev + 1); // refreshKey'i değiştirerek useEffect'i tetikle
  };

  return (
    <div className="min-h-screen bg-[#F6F5EFFF] text-gray-900 font-sans flex flex-col relative">
      <header className="flex justify-between items-center px-8 py-5 border-b border-gray-300">
        <h1 className="text-3xl font-black tracking-widest uppercase">
          BERBER ADI
        </h1>
        <div className="flex gap-4">
          <button className="px-6 py-2 border border-gray-900 text-gray-900 font-bold hover:bg-gray-100 transition">
            Randevu İptal
          </button>
          <button className="px-6 py-2 bg-[#1A1A1A] text-white font-bold hover:bg-black transition">
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
          <span className="text-gray-500 font-medium tracking-widest">
            [ BERBER FOTOĞRAFI ]
          </span>
        </div>
      </main>

      {/* KARARTILMIŞ ARKA PLAN VE MODAL */}
      {selectedSlot && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#F6F5EFFF] flex flex-col md:flex-row gap-8 p-8 w-full max-w-4xl shadow-2xl relative">
            
            {/* SOL TARAF: FORM ALANI */}
            <div className="flex-1">
              <h3 className="text-3xl font-black uppercase tracking-tighter mb-6">
                RANDEVU ONAYI
              </h3>
              
              <div className="bg-[#1A1A1A] text-white p-4 mb-6 font-bold text-lg">
                [{selectedSlot.slotDate}] • [{selectedSlot.startTime.slice(0, 5)}]
              </div>

              {/* Eğer PNR kodu alındıysa formu gizle, sadece sağ tarafı göster */}
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
                  
                  {/* reCAPTCHA Placeholder */}
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

{/* SAĞ TARAF: BAŞARI VE PNR KODU ALANI */}
            {pnrCode && (
              <div className="flex-1 border-2 border-[#1A1A1A] p-8 flex flex-col justify-center bg-white relative">
                <h4 className="text-xl font-black uppercase tracking-wide mb-2">
                  RANDEVUNUZ OLUŞTURULDU
                </h4>
                <p className="text-gray-600 font-medium mb-6">
                  İptal etmek isterseniz kodunuz:
                </p>
                
                {/* Güncellenmiş Kesik Çizgili Kutu ve Kopyala Butonu */}
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
                 onClick={handleReturnHome} // closeModal yerine handleReturnHome geldi
                 className="mt-8 bg-[#1A1A1A] text-white py-3 px-6 font-bold hover:bg-black w-full"
                  >
                  ANA SAYFAYA DÖN
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}