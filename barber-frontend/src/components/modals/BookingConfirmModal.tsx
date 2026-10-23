import { useState } from 'react';
import { bookAppointment } from '../../services/api';
import type { TimeSlot } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  selectedSlot: TimeSlot | null;
  onSuccess: () => void;
}

export default function BookingConfirmModal({ isOpen, onClose, selectedSlot, onSuccess }: Props) {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [serviceType, setServiceType] = useState(''); 
  const [pnrCode, setPnrCode] = useState<string | null>(null); 
  const [isBooking, setIsBooking] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  if (!isOpen || !selectedSlot) return null;

  const handleBook = async () => {
    if (!customerName || !customerPhone || !serviceType) {
      alert("Lütfen ad, telefon ve talep alanlarını doldurun.");
      return;
    }
    setIsBooking(true);
    try {
      const result = await bookAppointment({
        timeSlotId: selectedSlot.id, customerName, customerPhone, serviceType
      });
      setPnrCode(result.cancellationCode || result.pnrCode || "KOD-ALINAMADI");
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
      setTimeout(() => setIsCopied(false), 2000); 
    }
  };

  const handleResetAndClose = () => {
    setCustomerName(''); setCustomerPhone(''); setServiceType(''); setPnrCode(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-[#F6F5EFFF] flex flex-col md:flex-row gap-8 p-8 w-full max-w-4xl shadow-2xl relative">
        <div className="flex-1">
          <h3 className="text-3xl font-black uppercase tracking-tighter mb-6">RANDEVU ONAYI</h3>
          <div className="bg-[#1A1A1A] text-white p-4 mb-6 font-bold text-lg">
            [{selectedSlot.slotDate}] • [{selectedSlot.startTime.slice(0, 5)}]
          </div>
          {!pnrCode && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold mb-1">Ad Soyad</label>
                <input type="text" placeholder="Adınız" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="w-full border border-gray-300 p-3 outline-none focus:border-[#1A1A1A] bg-white"/>
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">Telefon</label>
                <input type="tel" placeholder="05XX XXX XX XX" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} className="w-full border border-gray-300 p-3 outline-none focus:border-[#1A1A1A] bg-white"/>
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">Talep</label>
                <input type="text" placeholder="Örn. Saç + Sakal" value={serviceType} onChange={(e) => setServiceType(e.target.value)} className="w-full border border-gray-300 p-3 outline-none focus:border-[#1A1A1A] bg-white"/>
              </div>
              <div className="flex gap-4 pt-4">
                <button onClick={handleResetAndClose} className="flex-1 border-2 border-[#1A1A1A] py-3 font-bold text-[#1A1A1A] hover:bg-gray-200 cursor-pointer">İptal</button>
                <button onClick={handleBook} disabled={isBooking} className="flex-1 bg-[#1A1A1A] border-2 border-[#1A1A1A] text-white py-3 font-bold hover:bg-black disabled:opacity-50 cursor-pointer">
                  {isBooking ? 'Onaylanıyor...' : 'Randevuyu Onayla'}
                </button>
              </div>
            </div>
          )}
        </div>
        {pnrCode && (
          <div className="flex-1 border-2 border-[#1A1A1A] p-8 flex flex-col justify-center bg-white">
            <h4 className="text-xl font-black uppercase tracking-wide mb-2">RANDEVUNUZ OLUŞTURULDU</h4>
            <p className="text-gray-600 font-medium mb-6">İptal etmek isterseniz kodunuz:</p>
            <div className="border-2 border-dashed border-[#1A1A1A] py-6 flex flex-col items-center justify-center">
              <span className="text-4xl font-black tracking-widest mb-4">[ {pnrCode} ]</span>
              <button onClick={handleCopy} className={`text-sm font-bold border-2 px-4 py-1 cursor-pointer ${isCopied ? 'border-green-600 bg-green-600 text-white' : 'border-[#1A1A1A] text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white'}`}>
                {isCopied ? 'KOPYALANDI ✓' : 'KOPYALA'}
              </button>
            </div>
            <button onClick={() => { handleResetAndClose(); onSuccess(); }} className="mt-8 bg-[#1A1A1A] text-white py-3 px-6 font-bold hover:bg-black w-full cursor-pointer">
              ANA SAYFAYA DÖN
            </button>
          </div>
        )}
      </div>
    </div>
  );
}