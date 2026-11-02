import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getShopBySlug, createSingleSlot, generateMultipleSlots } from '../../services/api';

export default function WorkingHours() {
  const { slug } = useParams<{ slug: string }>();
  const [shopId, setShopId] = useState<number | null>(null);

  // Tek Slot State'leri
  const [singleDate, setSingleDate] = useState('');
  const [singleStart, setSingleStart] = useState('');
  const [singleEnd, setSingleEnd] = useState('');
  const [isSingleLoading, setIsSingleLoading] = useState(false);

  // Çoklu Slot State'leri
  const [multiDate, setMultiDate] = useState('');
  const [multiStart, setMultiStart] = useState('');
  const [multiEnd, setMultiEnd] = useState('');
  const [multiDuration, setMultiDuration] = useState('45');
  const [isMultiLoading, setIsMultiLoading] = useState(false);

  // Bildirim Modalı State'i (alert yerine)
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    type: 'success' | 'error';
    title: string;
    message: string;
  }>({
    isOpen: false,
    type: 'success',
    title: '',
    message: ''
  });

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

  const closeModal = () => {
    setModalConfig(prev => ({ ...prev, isOpen: false }));
  };

  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopId) return;
    setIsSingleLoading(true);
    try {
      await createSingleSlot(shopId, {
        slotDate: singleDate,
        startTime: `${singleStart}:00`,
        endTime: `${singleEnd}:00`
      });
      setModalConfig({
        isOpen: true,
        type: 'success',
        title: 'İŞLEM BAŞARILI',
        message: 'Tekli slot başarıyla oluşturuldu!'
      });
      setSingleStart('');
      setSingleEnd('');
    } catch {
      setModalConfig({
        isOpen: true,
        type: 'error',
        title: 'İŞLEM BAŞARISIZ',
        message: 'Slot oluşturulurken bir hata oluştu.'
      });
    } finally {
      setIsSingleLoading(false);
    }
  };

  const handleMultiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopId) return;
    setIsMultiLoading(true);
    try {
      await generateMultipleSlots(shopId, {
        date: multiDate,
        start: `${multiStart}:00`,
        end: `${multiEnd}:00`,
        duration: Number(multiDuration)
      });
      setModalConfig({
        isOpen: true,
        type: 'success',
        title: 'İŞLEM BAŞARILI',
        message: 'Çoklu slotlar başarıyla oluşturuldu!'
      });
      setMultiStart('');
      setMultiEnd('');
    } catch {
      setModalConfig({
        isOpen: true,
        type: 'error',
        title: 'İŞLEM BAŞARISIZ',
        message: 'Çoklu slotlar oluşturulurken bir hata oluştu.'
      });
    } finally {
      setIsMultiLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto relative">
      <h2 className="text-4xl md:text-5xl font-black tracking-tighter uppercase text-[#1A1A1A] mb-10">
        ÇALIŞMA SAATLERİ
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* TEK SLOT OLUŞTUR KARTI */}
        <div className="bg-white border border-gray-200 p-8 shadow-sm">
          <h3 className="text-xl font-black uppercase tracking-wider mb-6 text-[#1A1A1A]">
            TEK SLOT OLUŞTUR
          </h3>
          <form onSubmit={handleSingleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-bold mb-2 text-[#1A1A1A]">Gün</label>
              <input 
                type="date" 
                value={singleDate}
                onChange={(e) => setSingleDate(e.target.value)}
                className="w-full border border-gray-300 p-4 outline-none focus:border-[#1A1A1A] transition-colors bg-white font-medium text-gray-800"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold mb-2 text-[#1A1A1A]">Başlangıç Saati</label>
              <input 
                type="time" 
                value={singleStart}
                onChange={(e) => setSingleStart(e.target.value)}
                className="w-full border border-gray-300 p-4 outline-none focus:border-[#1A1A1A] transition-colors bg-white font-medium text-gray-800"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold mb-2 text-[#1A1A1A]">Bitiş Saati</label>
              <input 
                type="time" 
                value={singleEnd}
                onChange={(e) => setSingleEnd(e.target.value)}
                className="w-full border border-gray-300 p-4 outline-none focus:border-[#1A1A1A] transition-colors bg-white font-medium text-gray-800"
                required
              />
            </div>
            <div className="pt-2">
              <button 
                type="submit"
                disabled={isSingleLoading || !shopId}
                className="bg-[#1A1A1A] text-white px-8 py-4 font-bold hover:bg-black transition-colors disabled:opacity-50 uppercase tracking-wider cursor-pointer"
              >
                {isSingleLoading ? 'Oluşturuluyor...' : 'Slot Oluştur'}
              </button>
            </div>
          </form>
        </div>

        {/* ÇOKLU SLOT OLUŞTUR KARTI */}
        <div className="bg-white border border-gray-200 p-8 shadow-sm">
          <h3 className="text-xl font-black uppercase tracking-wider mb-6 text-[#1A1A1A]">
            ÇOKLU SLOT OLUŞTUR
          </h3>
          <form onSubmit={handleMultiSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-bold mb-2 text-[#1A1A1A]">Gün</label>
              <input 
                type="date" 
                value={multiDate}
                onChange={(e) => setMultiDate(e.target.value)}
                className="w-full border border-gray-300 p-4 outline-none focus:border-[#1A1A1A] transition-colors bg-white font-medium text-gray-800"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold mb-2 text-[#1A1A1A]">Başlangıç Saati</label>
              <input 
                type="time" 
                value={multiStart}
                onChange={(e) => setMultiStart(e.target.value)}
                className="w-full border border-gray-300 p-4 outline-none focus:border-[#1A1A1A] transition-colors bg-white font-medium text-gray-800"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold mb-2 text-[#1A1A1A]">Bitiş Saati</label>
              <input 
                type="time" 
                value={multiEnd}
                onChange={(e) => setMultiEnd(e.target.value)}
                className="w-full border border-gray-300 p-4 outline-none focus:border-[#1A1A1A] transition-colors bg-white font-medium text-gray-800"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold mb-2 text-[#1A1A1A]">Slot Süresi (dk)</label>
              <input 
                type="number" 
                value={multiDuration}
                onChange={(e) => setMultiDuration(e.target.value)}
                placeholder="45"
                className="w-full border border-gray-300 p-4 outline-none focus:border-[#1A1A1A] transition-colors bg-white font-medium text-gray-800"
                required
              />
            </div>
            <div className="pt-2">
              <button 
                type="submit"
                disabled={isMultiLoading || !shopId}
                className="bg-[#1A1A1A] text-[#ffffff] px-8 py-4 font-bold hover:bg-black transition-colors disabled:opacity-50 uppercase tracking-wider cursor-pointer"
              >
                {isMultiLoading ? 'Oluşturuluyor...' : 'Slotları Oluştur'}
              </button>
            </div>
          </form>
        </div>

      </div>

      {/* ÖZEL BİLDİRİM MODALI (ALERT YERİNE) */}
      {modalConfig.isOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-[#F5F4EF] border-4 border-[#1A1A1A] p-8 max-w-md w-full shadow-[8px_8px_0px_0px_rgba(26,26,26,1)] relative">
            <div className={`inline-block px-3 py-1 text-xs font-black uppercase tracking-widest text-white mb-4 ${
              modalConfig.type === 'success' ? 'bg-[#1A1A1A]' : 'bg-red-600'
            }`}>
              {modalConfig.type === 'success' ? 'BAŞARILI' : 'HATA'}
            </div>
            <h3 className="text-2xl font-black uppercase tracking-tighter text-[#1A1A1A] mb-2">
              {modalConfig.title}
            </h3>
            <p className="text-gray-700 font-bold text-sm mb-6">
              {modalConfig.message}
            </p>
            <button
              onClick={closeModal}
              className="w-full bg-[#1A1A1A] text-white py-3 font-black uppercase tracking-widest border-2 border-[#1A1A1A] hover:bg-black transition-colors cursor-pointer"
            >
              TAMAM
            </button>
          </div>
        </div>
      )}
    </div>
  );
}