export default function AdminDashboard() {
  const timeSlots = [
    { time: '09:00', client: 'Müşteri Adı', phone: '05XX XXX XX XX', service: 'Saç + Sakal Kesimi', status: 'confirmed' },
    { time: '10:00', client: null },
    { time: '11:00', client: 'Müşteri Adı', phone: '05XX XXX XX XX', service: 'Saç + Sakal Kesimi', status: 'confirmed' },
    { time: '12:00', client: null },
    { time: '13:00', client: null },
    { time: '14:00', client: null },
    { time: '15:00', client: 'Müşteri Adı', phone: '05XX XXX XX XX', service: 'Saç + Sakal Kesimi', status: 'confirmed' },
    { time: '16:00', client: null },
    { time: '17:00', client: null },
    { time: '18:00', client: null },
  ];

  return (
    <div>
      <h2 className="text-5xl font-black tracking-tighter uppercase mb-8">
        BUGÜNÜN RANDEVULARI
      </h2>

      {/* İSTATİSTİK KUTULARI */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        <div className="bg-white border border-gray-200 p-6 shadow-sm">
          <p className="text-gray-500 font-bold text-sm mb-2">Bugünün Toplam Randevusu</p>
          <span className="text-4xl font-black tracking-widest">[ 3 ]</span>
        </div>
        <div className="bg-white border border-gray-200 p-6 shadow-sm">
          <p className="text-gray-500 font-bold text-sm mb-2">Bekleyen Randevular</p>
          <span className="text-4xl font-black tracking-widest">[ 0 ]</span>
        </div>
      </div>

      {/* ZAMAN ÇİZELGESİ */}
      <div className="bg-white border border-gray-200 p-8 shadow-sm">
        <h3 className="text-xl font-bold uppercase tracking-wide mb-6 pb-4 border-b border-gray-200">
          GÜNLÜK ZAMAN ÇİZELGESİ • 09:00 – 19:00
        </h3>

        <div className="space-y-4">
          {timeSlots.map((slot, index) => (
            <div key={index} className="flex items-center justify-between py-4 border-b border-gray-100 last:border-none">
              <span className="font-black text-lg w-20">{slot.time}</span>
              
              {slot.client ? (
                <div className="flex-1 bg-[#F6F5EFFF] border border-gray-200 p-4 mx-4 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-sm">
                      [{slot.client}] • {slot.phone}
                    </p>
                    <p className="text-gray-600 text-xs mt-0.5">{slot.service}</p>
                  </div>
                  <select className="border border-gray-900 bg-white px-3 py-1.5 text-sm font-bold uppercase outline-none">
                    <option value="confirmed">confirmed</option>
                    <option value="completed">completed</option>
                    <option value="cancelled">cancelled</option>
                  </select>
                </div>
              ) : (
                <div className="flex-1 mx-4 text-gray-400 font-medium text-sm">
                  Boş
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}