import { useState } from 'react';

export default function App() {
  // Tasarımdaki gün sekmeleri
  const days = ['Bugün', 'Yarın', 'Gün 3', 'Gün 4', 'Gün 5', 'Gün 6', 'Gün 7'];
  
  // Tasarımdaki boş saatler[cite: 9]
  const times = ['09:00', '10:00', '11:30', '12:15', '14:00', '15:00', '16:30', '17:45'];

  const [selectedDay, setSelectedDay] = useState('Bugün');

  return (
    // Ana kapsayıcı: Tasarımdaki o sıcak kırık beyaz/bej arka plan rengi
    <div className="min-h-screen bg-[#F6F5EFFF] text-gray-900 font-sans flex flex-col">
      
      {/* ÜST BİLGİ (HEADER) */}
      {/* İnce alt kenarlık çizgisi[cite: 9] */}
      <header className="flex justify-between items-center px-8 py-5 border-b border-gray-300">
        <h1 className="text-3xl font-black tracking-widest uppercase">
          BERBER ADI
        </h1>
        
        {/* Sağ üstteki butonlar[cite: 9] */}
        <div className="flex gap-4">
          <button className="px-6 py-2 border border-gray-900 text-gray-900 font-bold hover:bg-gray-100 transition">
            Randevu İptal
          </button>
          <button className="px-6 py-2 bg-[#1A1A1A] text-white font-bold hover:bg-black transition">
            Berber Girişi
          </button>
        </div>
      </header>

      {/* İÇERİK ALANI (İki Kolonlu Yapı) */}
      <main className="flex flex-1 overflow-hidden">
        
        {/* SOL KOLON: Ana Randevu Ekranı */}
        <div className="flex-1 px-8 py-12 overflow-y-auto">
          <h2 className="text-6xl font-black tracking-tighter uppercase mb-2">
            RANDEVUNU SEÇ
          </h2>
          <p className="text-gray-600 mb-10 text-lg">
            Bir gün ve boş saat seç. Giriş gerekmez.
          </p>

          {/* Gün Seçici Sekmeler[cite: 9] */}
          <div className="flex flex-wrap gap-3 mb-10">
            {days.map((day) => (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`px-6 py-2 border border-gray-900 font-bold transition-colors ${
                  selectedDay === day
                    ? 'bg-[#1A1A1A] text-white' // Aktif buton stili[cite: 9]
                    : 'bg-transparent text-gray-900 hover:bg-gray-100' // Pasif buton stili[cite: 9]
                }`}
              >
                {day}
              </button>
            ))}
          </div>

          {/* Boş Saatler Kutusu[cite: 9] */}
          <div className="bg-white border border-gray-200 p-8 w-full max-w-4xl shadow-sm">
            <h3 className="text-xl font-bold uppercase tracking-wide mb-6">
              BOŞ SAATLER
            </h3>
            
            {/* Saat Izgarası (Grid)[cite: 9] */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {times.map((time) => (
                <button
                  key={time}
                  className="px-4 py-3 border border-gray-900 text-center font-bold hover:bg-[#1A1A1A] hover:text-white transition-colors"
                >
                  {time}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* SAĞ KOLON: Berber Fotoğrafı Alanı[cite: 9] */}
        {/* Geniş ekranlarda gösterilecek, kesik sol kenarlıklı, hafif koyu arka planlı alan[cite: 9] */}
        <div className="hidden lg:flex w-[35%] bg-[#EBE9E1] border-l border-dashed border-gray-400 items-center justify-center">
          <span className="text-gray-500 font-medium tracking-widest">
            [ BERBER FOTOĞRAFI ]
          </span>
        </div>

      </main>
    </div>
  );
}