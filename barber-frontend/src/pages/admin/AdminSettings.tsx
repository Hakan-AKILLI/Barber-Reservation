import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getShopBySlug, updateShopDetails, updateShopStatus, updateAdminSecurity } from '../../services/api';

export default function AdminSettings() {
  const { slug } = useParams<{ slug: string }>();
  const [shopId, setShopId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  // Özel Ortalanmış Modal (Bildirim) State'i
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Form State'leri (Dükkan Bilgileri)
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [isActive, setIsActive] = useState(true);

  // Güvenlik State'leri
  const [username, setUsername] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // Modal Gösterme ve Kapatma Fonksiyonları
  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
  };

  const closeNotification = () => {
    setNotification(null);
  };

  useEffect(() => {
    const fetchShopDetails = async () => {
      if (!slug) return;
      try {
        const shopData = await getShopBySlug(slug);
        setShopId(shopData.id);
        setName(shopData.name);
        setPhone(shopData.phone);
        setAddress(shopData.address);
        setIsActive(shopData.active);
        setUsername('admin'); 
      } catch (error) {
        console.error('Dükkan bilgileri çekilemedi:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchShopDetails();
  }, [slug]);

  const handleSaveInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopId) return;
    
    try {
      await updateShopDetails(shopId, { name, phone, address });
      showNotification('Dükkan bilgileri başarıyla güncellendi.', 'success');
    } catch (error) {
      console.error(error);
      showNotification('Bilgiler güncellenirken bir hata oluştu.', 'error');
    }
  };

  const handleToggleActive = async () => {
    if (!shopId) return;
    const newState = !isActive;
    
    try {
      await updateShopStatus(shopId, newState);
      setIsActive(newState);
      showNotification(`Dükkan artık randevulara ${newState ? 'AÇIK' : 'KAPALI'} duruma getirildi.`, 'success');
    } catch (error) {
      console.error(error);
      showNotification('Durum güncellenirken bir hata oluştu.', 'error');
    }
  };

  const handleSecurityUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    const adminId = 1; 
    
    try {
      await updateAdminSecurity(adminId, { username, currentPassword, newPassword });
      showNotification('Güvenlik bilgileri başarıyla güncellendi.', 'success');
      setCurrentPassword('');
      setNewPassword('');
} catch (error) {
      console.error(error);
      const err = error as { 
        response?: { 
          data?: string | { message?: string } 
        } 
      };
      
      let errorMessage = 'Güvenlik bilgileri güncellenemedi. Lütfen tekrar deneyin.';
      
      if (err.response?.data) {
        if (typeof err.response.data === 'string') {
          errorMessage = err.response.data;
        } else if (typeof err.response.data === 'object' && err.response.data !== null && 'message' in err.response.data) {
          errorMessage = err.response.data.message || errorMessage;
        }
      }
      
      showNotification(errorMessage, 'error');
    }
  };
  if (loading) return <div className="animate-pulse font-bold text-gray-500 p-8">Ayarlar yükleniyor...</div>;

  return (
    <div className="max-w-5xl mx-auto relative min-h-screen">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-4xl md:text-5xl font-black tracking-tighter uppercase text-[#1A1A1A]">
          AYARLAR
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* SOL KOLON: Dükkan Bilgileri & Sistem Durumu */}
        <div className="space-y-8">
          {/* Sistem Durumu Kartı */}
          <div className="bg-white border border-gray-200 p-8 shadow-sm">
            <h3 className="text-xl font-black uppercase tracking-wider mb-2 text-[#1A1A1A]">Görünürlük Durumu</h3>
            <p className="text-sm text-gray-500 font-medium mb-6">Dükkanı geçici olarak randevuya kapatabilirsiniz (Tatil, tadilat vb. durumlar için).</p>
            
            <div className="flex items-center justify-between bg-[#F5F4EF] p-4 border border-gray-200">
              <div>
                <span className={`font-black text-lg uppercase tracking-widest ${isActive ? 'text-green-600' : 'text-red-600'}`}>
                  {isActive ? 'AKTİF (AÇIK)' : 'PASİF (KAPALI)'}
                </span>
              </div>
              <button 
                onClick={handleToggleActive}
                className={`px-6 py-2 font-bold uppercase tracking-wider border-2 cursor-pointer transition-colors ${
                  isActive 
                    ? 'border-red-600 text-red-600 hover:bg-red-600 hover:text-white' 
                    : 'border-green-600 text-green-600 hover:bg-green-600 hover:text-white'
                }`}
              >
                {isActive ? 'Dükkanı Kapat' : 'Dükkanı Aç'}
              </button>
            </div>
          </div>

          {/* Profil Bilgileri Kartı */}
          <div className="bg-white border border-gray-200 p-8 shadow-sm">
            <h3 className="text-xl font-black uppercase tracking-wider mb-6 text-[#1A1A1A]">Dükkan Profili</h3>
            <form onSubmit={handleSaveInfo} className="space-y-4">
              <div>
                <label className="block text-sm font-bold mb-1 uppercase tracking-wider text-[#1A1A1A]">Dükkan Adı</label>
                <input 
                  type="text" value={name} onChange={(e) => setName(e.target.value)}
                  className="w-full border border-gray-300 p-3 outline-none focus:border-[#1A1A1A] transition-colors bg-gray-50 font-medium" required
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1 uppercase tracking-wider text-[#1A1A1A]">İletişim Numarası</label>
                <input 
                  type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                  className="w-full border border-gray-300 p-3 outline-none focus:border-[#1A1A1A] transition-colors bg-gray-50 font-medium" required
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1 uppercase tracking-wider text-[#1A1A1A]">Açık Adres</label>
                <textarea 
                  value={address} onChange={(e) => setAddress(e.target.value)} rows={3}
                  className="w-full border border-gray-300 p-3 outline-none focus:border-[#1A1A1A] transition-colors bg-gray-50 resize-none font-medium" required
                />
              </div>
              <button type="submit" className="w-full bg-[#1A1A1A] text-white py-4 font-bold uppercase tracking-widest hover:bg-black transition-colors cursor-pointer mt-2">
                Bilgileri Kaydet
              </button>
            </form>
          </div>
        </div>

        {/* SAĞ KOLON: Güvenlik */}
        <div className="space-y-8">
          <div className="bg-white border border-gray-200 p-8 shadow-sm">
            <h3 className="text-xl font-black uppercase tracking-wider mb-2 text-[#1A1A1A]">Güvenlik</h3>
            <p className="text-sm text-gray-500 font-medium mb-6">Yönetici giriş bilgilerinizi buradan güncelleyebilirsiniz.</p>
            
            <form onSubmit={handleSecurityUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-bold mb-1 uppercase tracking-wider text-[#1A1A1A]">Kullanıcı Adı</label>
                <input 
                  type="text" value={username} onChange={(e) => setUsername(e.target.value)}
                  className="w-full border border-gray-300 p-3 outline-none focus:border-[#1A1A1A] transition-colors bg-gray-50 font-medium" required
                />
              </div>
              <div className="pt-2">
                <label className="block text-sm font-bold mb-1 uppercase tracking-wider text-[#1A1A1A]">Mevcut Şifre</label>
                <input 
                  type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full border border-gray-300 p-3 outline-none focus:border-[#1A1A1A] transition-colors bg-gray-50 font-medium" required
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1 uppercase tracking-wider text-[#1A1A1A]">Yeni Şifre</label>
                <input 
                  type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full border border-gray-300 p-3 outline-none focus:border-[#1A1A1A] transition-colors bg-gray-50 font-medium" required
                />
              </div>
              <button type="submit" className="w-full border-2 border-[#1A1A1A] text-[#1A1A1A] py-4 font-bold uppercase tracking-widest hover:bg-[#1A1A1A] hover:text-white transition-colors cursor-pointer mt-4">
                Güvenlik Bilgilerini Güncelle
              </button>
            </form>
          </div>
        </div>

      </div>

      {/* ORTALANMIŞ BRUTALIST MODAL BİLDİRİMİ */}
      {notification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-[#F5F4EF] w-full max-w-md p-8 shadow-2xl relative">
            
            <h3 className={`text-2xl font-black uppercase tracking-tighter mb-2 ${notification.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
              {notification.type === 'success' ? 'İŞLEM BAŞARILI' : 'BİR HATA OLUŞTU'}
            </h3>
            
            <p className="text-sm font-medium text-gray-600 mb-8">
              {notification.message}
            </p>
            
            <button 
              onClick={closeNotification} 
              className="w-full bg-[#1A1A1A] text-white py-4 font-bold uppercase tracking-widest hover:bg-black transition-colors cursor-pointer"
            >
              Tamam
            </button>
            
          </div>
        </div>
      )}

    </div>
  );
}