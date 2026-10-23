import { useState } from 'react';
import { cancelAppointment } from '../../services/api';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

type Step = 'form' | 'confirm';

export default function CancelAppointmentModal({ isOpen, onClose }: Props) {
  const [step, setStep] = useState<Step>('form');
  const [cancelPhone, setCancelPhone] = useState('');
  const [cancelCode, setCancelCode] = useState('');
  const [isCanceling, setIsCanceling] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  if (!isOpen) return null;

  // 1. Adım: Form gönderildiğinde onay ekranına geç
  const handleInitialSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelPhone || !cancelCode) {
      alert('Lütfen telefon numaranızı ve iptal kodunuzu girin.');
      return;
    }
    setStep('confirm');
  };

  // 2. Adım: Kullanıcı "Evet" derse API'ye istek at
  const handleConfirmCancel = async () => {
    setIsCanceling(true);
    setMessage(null);

    try {
      await cancelAppointment(cancelCode);
      
      setMessage({ type: 'success', text: 'Randevunuz başarıyla iptal edildi.' });
      setCancelPhone('');
      setCancelCode('');
      setStep('form'); // Başarılı mesajını göstermek için ana forma dön
      
      // Başarılı iptalden 2.5 saniye sonra modalı otomatik kapat
      setTimeout(() => {
        handleClose();
      }, 2500);

    } catch (error) {
      console.error('İptal hatası:', error);
      setMessage({ type: 'error', text: 'İptal işlemi başarısız. Girdiğiniz kodu kontrol edin.' });
      setStep('form'); // Hata mesajı ile ana forma dön
    } finally {
      setIsCanceling(false);
    }
  };

  const handleClose = () => {
    setStep('form');
    setCancelPhone('');
    setCancelCode('');
    setMessage(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-[#F6F5EFFF] p-8 w-full max-w-md shadow-2xl relative border-4 border-[#1A1A1A]">
        {/* Çarpı (Kapat) Butonu */}
        <button 
          onClick={handleClose} 
          className="absolute top-4 right-4 font-black text-xl text-[#1A1A1A] hover:text-red-600 transition-colors cursor-pointer"
        >
          ✕
        </button>

        {step === 'form' ? (
          /* 1. ADIM: İPTAL FORMU */
          <>
            <h3 className="text-2xl font-black uppercase tracking-tighter mb-2 text-[#1A1A1A]">
              RANDEVU İPTAL ET
            </h3>
            <p className="text-gray-600 text-sm mb-6 font-medium">
              Lütfen kayıtlı telefon numaranızı ve randevu oluştururken verilen iptal kodunu giriniz.
            </p>

            {/* Başarı veya Hata Mesajı Alanı */}
            {message && (
              <div className={`p-4 mb-6 font-bold text-sm border-2 uppercase tracking-wide ${
                message.type === 'success' ? 'bg-green-100 border-green-600 text-green-700' : 'bg-red-100 border-red-600 text-red-700'
              }`}>
                {message.text}
              </div>
            )}

            <form onSubmit={handleInitialSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-bold mb-1 text-[#1A1A1A] uppercase tracking-wider">Telefon</label>
                <input 
                  type="tel" 
                  placeholder="05XX XXX XX XX" 
                  value={cancelPhone}
                  onChange={(e) => setCancelPhone(e.target.value)}
                  className="w-full border-2 border-gray-300 p-3 outline-none focus:border-[#1A1A1A] transition-colors bg-white font-medium text-gray-800" 
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-1 text-[#1A1A1A] uppercase tracking-wider">İptal Kodu</label>
                <input 
                  type="text" 
                  placeholder="Kodunuz" 
                  value={cancelCode}
                  onChange={(e) => setCancelCode(e.target.value)}
                  className="w-full border-2 border-gray-300 p-3 outline-none focus:border-[#1A1A1A] transition-colors bg-white font-bold text-gray-800 tracking-widest uppercase" 
                  required
                />
              </div>

              <div className="pt-2">
                <button 
                  type="submit" 
                  className="w-full bg-[#1A1A1A] border-2 border-[#1A1A1A] text-white py-4 font-bold hover:bg-black transition-colors cursor-pointer uppercase tracking-widest text-sm"
                >
                  Randevuyu İptal Et
                </button>
              </div>
            </form>
          </>
        ) : (
          /* 2. ADIM: ONAY EKRANI (Brutalist Tasarım) */
          <div className="text-center py-4">
            <div className="bg-red-100 border-4 border-red-600 p-6 mb-6">
              <h3 className="text-3xl font-black uppercase tracking-tighter text-red-600 mb-2">
                EMİN MİSİNİZ?
              </h3>
              <p className="text-red-800 font-bold text-sm uppercase tracking-wide">
                Bu randevu kalıcı olarak silinecek ve işlem geri alınamayacaktır.
              </p>
            </div>

            <div className="flex gap-4">
              <button 
                onClick={() => setStep('form')}
                disabled={isCanceling}
                className="flex-1 border-2 border-[#1A1A1A] bg-white text-[#1A1A1A] py-4 font-black uppercase tracking-widest hover:bg-gray-100 transition-colors cursor-pointer disabled:opacity-50"
              >
                Vazgeç
              </button>
              <button 
                onClick={handleConfirmCancel}
                disabled={isCanceling}
                className="flex-1 border-2 border-red-600 bg-red-600 text-white py-4 font-black uppercase tracking-widest hover:bg-red-700 hover:border-red-700 transition-colors cursor-pointer disabled:opacity-50"
              >
                {isCanceling ? 'SİLİNİYOR...' : 'EVET, SİL'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}