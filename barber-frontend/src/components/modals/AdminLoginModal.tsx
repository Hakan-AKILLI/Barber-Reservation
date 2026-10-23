 import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminLogin } from '../../services/api';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  slug: string;
}

export default function AdminLoginModal({ isOpen, onClose, slug }: Props) {
  const navigate = useNavigate();
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState(false);

  if (!isOpen) return null;

  const handleAdminLogin = async () => {
    if (!adminUsername || !adminPassword) {
      setLoginError(true);
      return;
    }
    setIsLoggingIn(true);
    setLoginError(false);
    try {
      const response = await adminLogin({ username: adminUsername, password: adminPassword });
      const token = response.token || response;
      localStorage.setItem('adminToken', typeof token === 'string' ? token : JSON.stringify(token));
      onClose();
      navigate(`/${slug}/admin`);
    } catch (error) {
      console.error("Giriş hatası:", error);
      setLoginError(true);
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-[#F6F5EFFF] p-8 w-full max-w-md shadow-2xl relative border-2 border-[#1A1A1A]">
        <h3 className="text-2xl font-black uppercase tracking-tighter mb-2">BERBER GİRİŞİ</h3>
        <p className="text-gray-600 text-sm mb-6">Yönetim paneline erişmek için giriş yapın.</p>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold mb-1">Kullanıcı Adı</label>
            <input 
              type="text" placeholder="admin" value={adminUsername}
              onChange={(e) => { setAdminUsername(e.target.value); setLoginError(false); }}
              className={`w-full border p-3 outline-none transition-colors bg-white ${loginError ? 'border-red-600 border-2' : 'border-gray-300 focus:border-[#1A1A1A]'}`}
            />
          </div>
          <div>
            <label className="block text-sm font-bold mb-1">Şifre</label>
            <input 
              type="password" placeholder="••••••" value={adminPassword}
              onChange={(e) => { setAdminPassword(e.target.value); setLoginError(false); }}
              className={`w-full border p-3 outline-none transition-colors bg-white ${loginError ? 'border-red-600 border-2' : 'border-gray-300 focus:border-[#1A1A1A]'}`}
            />
            {loginError && <p className="text-red-600 text-xs font-bold mt-1.5 uppercase tracking-wide">Kullanıcı adı ya da şifre yanlış.</p>}
          </div>
          <div className="flex gap-4 pt-4">
            <button onClick={onClose} className="flex-1 border-2 border-[#1A1A1A] py-3 font-bold text-[#1A1A1A] hover:bg-gray-200 transition-colors cursor-pointer">İptal</button>
            <button onClick={handleAdminLogin} disabled={isLoggingIn} className="flex-1 bg-[#1A1A1A] border-2 border-[#1A1A1A] text-white py-3 font-bold hover:bg-black transition-colors disabled:opacity-50 cursor-pointer">
              {isLoggingIn ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}