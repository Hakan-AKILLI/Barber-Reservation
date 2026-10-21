import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getShopBySlug, createSingleSlot, generateMultipleSlots } from '../../services/api';

export default function AdminWorkingHours() {
  const { slug } = useParams<{ slug: string }>();
  const [shopId, setShopId] = useState<number | null>(null);

  // Modal State
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    message: '',
    isError: false
  });

  // Tekli Slot Form State
  const [singleDate, setSingleDate] = useState('');
  const [singleStart, setSingleStart] = useState('');
  const [singleEnd, setSingleEnd] = useState('');
  const [isSingleLoading, setIsSingleLoading] = useState(false);

  // Çoklu Slot Form State
  const [multiDate, setMultiDate] = useState('');
  const [multiStart, setMultiStart] = useState('');
  const [multiEnd, setMultiEnd] = useState('');
  const [multiDuration, setMultiDuration] = useState('45');
  const [isMultiLoading, setIsMultiLoading] = useState(false);

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

  const showModal = (message: string, isError = false) => {
    setModalConfig({ isOpen: true, message, isError });
  };

  const closeModal = () => {
    setModalConfig({ ...modalConfig, isOpen: false });
  };

  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopId) return showModal('Dükkan bilgisi yüklenemedi.', true);
    if (!singleDate || !singleStart || !singleEnd) return showModal('Lütfen tüm alanları doldurun.', true);

    setIsSingleLoading(true);
    try {
      await createSingleSlot(shopId, {
        slotDate: singleDate,
        startTime: `${singleStart}:00`,
        endTime: `${singleEnd}:00`
      });
      showModal('Tekli slot başarıyla oluşturuldu!');
      setSingleStart('');
      setSingleEnd('');
    } catch (error) {
      console.error('Hata:', error);
      showModal('Slot oluşturulurken bir hata meydana geldi.', true);
    } finally {
      setIsSingleLoading(false);
    }
  };

  const handleMultiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopId) return showModal('Dükkan bilgisi yüklenemedi.', true);
    if (!multiDate || !multiStart || !multiEnd || !multiDuration) return showModal('Lütfen tüm alanları doldurun.', true);

    setIsMultiLoading(true);
    try {
      await generateMultipleSlots(shopId, {
        date: multiDate,
        start: multiStart,
        end: multiEnd,
        duration: parseInt(multiDuration, 10)
      });
      showModal('Çoklu slotlar başarıyla oluşturuldu!');
      setMultiStart('');
      setMultiEnd('');
    } catch (error) {
      console.error('Hata:', error);
      showModal('Slotlar oluşturulurken bir hata meydana geldi.', true);
    } finally {
      setIsMultiLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto relative">
      <h2 className="text-4xl md:text-5xl font-black tracking-tighter uppercase mb-10 text-[#1A1A1A]">
        ÇALIŞMA SAATLERİ
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* TEKLİ SLOT OLUŞTURMA KART */}
        <div className="bg-white border border-gray-200 p-8 shadow-sm">
          <h3 className="text-xl font-black uppercase tracking-widest mb-6 text-[#1A1A1A]">
            TEK SLOT OLUŞTUR
          </h3>
          
          <form onSubmit={handleSingleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-bold mb-2 text-[#1A1A1A]">Gün</label>
              <input 
                type="date" 
                value={singleDate}
                onChange={(e) => setSingleDate(e.target.value)}
                className="w-full border border-gray-300 p-3 outline-none focus:border-[#1A1A1A] transition-colors bg-white font-medium text-gray-700"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-bold mb-2 text-[#1A1A1A]">Başlangıç Saati</label>
              <input 
                type="time" 
                value={singleStart}
                onChange={(e) => setSingleStart(e.target.value)}
                className="w-full border border-gray-300 p-3 outline-none focus:border-[#1A1A1A] transition-colors bg-white font-medium text-gray-700"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-bold mb-2 text-[#1A1A1A]">Bitiş Saati</label>
              <input 
                type="time" 
                value={singleEnd}
                onChange={(e) => setSingleEnd(e.target.value)}
                className="w-full border border-gray-300 p-3 outline-none focus:border-[#1A1A1A] transition-colors bg-white font-medium text-gray-700"
                required
              />
            </div>

            <button 
              type="submit"
              disabled={isSingleLoading}
              className="bg-[#1A1A1A] text-white py-3 px-8 font-bold hover:bg-black transition-colors disabled:opacity-50 mt-4"
            >
              {isSingleLoading ? 'Oluşturuluyor...' : 'Slot Oluştur'}
            </button>
          </form>
        </div>

        {/* ÇOKLU SLOT OLUŞTURMA KARTI */}
        <div className="bg-white border border-gray-200 p-8 shadow-sm">
          <h3 className="text-xl font-black uppercase tracking-widest mb-6 text-[#1A1A1A]">
            ÇOKLU SLOT OLUŞTUR
          </h3>
          
          <form onSubmit={handleMultiSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-bold mb-2 text-[#1A1A1A]">Gün</label>
              <input 
                type="date" 
                value={multiDate}
                onChange={(e) => setMultiDate(e.target.value)}
                className="w-full border border-gray-300 p-3 outline-none focus:border-[#1A1A1A] transition-colors bg-white font-medium text-gray-700"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-bold mb-2 text-[#1A1A1A]">Başlangıç Saati</label>
              <input 
                type="time" 
                value={multiStart}
                onChange={(e) => setMultiStart(e.target.value)}
                className="w-full border border-gray-300 p-3 outline-none focus:border-[#1A1A1A] transition-colors bg-white font-medium text-gray-700"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-bold mb-2 text-[#1A1A1A]">Bitiş Saati</label>
              <input 
                type="time" 
                value={multiEnd}
                onChange={(e) => setMultiEnd(e.target.value)}
                className="w-full border border-gray-300 p-3 outline-none focus:border-[#1A1A1A] transition-colors bg-white font-medium text-gray-700"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-bold mb-2 text-[#1A1A1A]">Slot Süresi (dk)</label>
              <input 
                type="number" 
                min="5"
                step="5"
                value={multiDuration}
                onChange={(e) => setMultiDuration(e.target.value)}
                className="w-full border border-gray-300 p-3 outline-none focus:border-[#1A1A1A] transition-colors bg-white font-medium text-gray-700"
                required
              />
            </div>

            <button 
              type="submit"
              disabled={isMultiLoading}
              className="bg-[#1A1A1A] text-white py-3 px-8 font-bold hover:bg-black transition-colors disabled:opacity-50 mt-4"
            >
              {isMultiLoading ? 'Oluşturuluyor...' : 'Slotları Oluştur'}
            </button>
          </form>
        </div>
      </div>

      {/* ÖZEL TASARIM BİLDİRİM MODALI */}
      {modalConfig.isOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-[#F5F4EF] p-8 w-full max-w-sm shadow-2xl relative border-4 border-[#1A1A1A]">
            <h3 className={`text-2xl font-black uppercase tracking-tighter mb-4 ${modalConfig.isError ? 'text-red-600' : 'text-[#1A1A1A]'}`}>
              {modalConfig.isError ? 'HATA' : 'BİLGİ'}
            </h3>
            
            <p className="text-gray-800 font-medium mb-8 text-lg">
              {modalConfig.message}
            </p>

            <button 
              onClick={closeModal}
              className="w-full bg-[#1A1A1A] text-white py-3 font-bold hover:bg-black transition-colors uppercase tracking-widest"
            >
              Tamam
            </button>
          </div>
        </div>
      )}
    </div>
  );
}