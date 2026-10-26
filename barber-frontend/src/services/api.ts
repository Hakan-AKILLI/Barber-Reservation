import axios from 'axios';

// Spring Boot uygulamamızın base URL'i
export const api = axios.create({
  baseURL: 'http://localhost:8080/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Admin isteklerinde Authorization Header'ına JWT Token ekleyen interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken');
  if (token) {
    // Eğer token tırnak işaretleriyle saklandıysa temizle
    const cleanToken = token.replace(/^"(.*)"$/, '$1');
    config.headers.Authorization = `Bearer ${cleanToken}`;
  }
  return config;
});

// --- MÜŞTERİ METODLARI ---

// Müşterinin seçtiği tarih ve dükkana göre müsait saatleri getiren fonksiyon
export const getAvailableSlots = async (shopId: number, date: string) => {
  const response = await api.get(`/slots/available`, {
    params: { shopId, date }
  });
  return response.data;
};

export interface BookingPayload {
  timeSlotId: number;
  customerName: string;
  customerPhone: string;
  serviceType: string;
}

export const bookAppointment = async (payload: BookingPayload) => {
  const response = await api.post(`/appointments`, payload);
  return response.data; 
};

// Slug değerine göre dükkan bilgilerini getiren fonksiyon
export const getShopBySlug = async (slug: string) => {
  const response = await api.get(`/shops/slug/${slug}`); 
  return response.data;
};

// --- AUTH METODLARI ---

export interface LoginPayload {
  username: string;
  password: string;
}

export const adminLogin = async (payload: LoginPayload) => {
  const response = await api.post('/auth/login', payload);
  return response.data; // JWT Token döndürür
};

// --- ADMIN RANDEVU METODLARI ---

export interface Appointment {
  id: number;
  customerName: string;
  customerPhone: string;
  serviceType: string;
  status: 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
  cancellationCode?: string;
  timeSlot: {
    id: number;
    slotDate: string;
    startTime: string;
    endTime: string;
  };
}

// 1. Dükkan ID ve Tarihe göre randevuları çek
export const getAdminAppointments = async (shopId: number, date: string): Promise<Appointment[]> => {
  const response = await api.get('/admin/appointments', {
    params: { shopId, date },
  });
  return response.data;
};

// 2. Randevu durumunu güncelle (PATCH)
export const updateAppointmentStatus = async (
  appointmentId: number,
  shopId: number,
  status: string
) => {
  const response = await api.patch(`/admin/appointments/${appointmentId}/status`, null, {
    params: { shopId, status },
  });
  return response.data;
};

// --- ÇALIŞMA SAATLERİ (SLOT) METODLARI ---

export interface SingleSlotPayload {
  slotDate: string;
  startTime: string;
  endTime: string;
}

// 1. Tek Slot Oluştur (POST /api/v1/admin/slots)
export const createSingleSlot = async (shopId: number, payload: SingleSlotPayload) => {
  const response = await api.post(`/admin/slots`, payload, {
    params: { shopId },
  });
  return response.data;
};

export interface MultiSlotParams {
  date: string;
  start: string;
  end: string;
  duration: number;
}

// 2. Çoklu Slot Oluştur (POST /api/v1/admin/generate)
export const generateMultipleSlots = async (shopId: number, params: MultiSlotParams) => {
  const response = await api.post(`/admin/generate`, null, {
    params: {
      shopId,
      date: params.date,
      start: params.start,
      end: params.end,
      duration: params.duration
    },
  });
  return response.data;
};
// 3. Slot Silme Metodu (DELETE /api/v1/admin/slots/{id})
export const deleteSlot = async (slotId: number, shopId: number) => {
  await api.delete(`/admin/slots/${slotId}`, {
    params: { shopId },
  });
};
// 4.Randevu İptal (DELETE /api/v1/appointments/cancel/{cancellationCode})
export const cancelAppointment = async (cancellationCode: string) => {
  const response = await api.delete(`/appointments/cancel/${cancellationCode}`);
  return response.data;
};
// --- AYARLAR VE GÜNCELLEME İÇİN YENİ TİPLER ---
export interface ShopUpdateRequest {
  name: string;
  phone: string;
  address: string;
}

export interface AdminSecurityUpdateRequest {
  username: string;
  currentPassword: string;
  newPassword: string;
}

// --- YENİ API FONKSİYONLARI ---

// 1. Dükkan Bilgilerini Güncelleme
export const updateShopDetails = async (shopId: number, data: ShopUpdateRequest) => {
  const response = await api.put(`/shops/${shopId}`, data);
  return response.data;
};

// 2. Dükkanı Açma / Kapatma (Status)
export const updateShopStatus = async (shopId: number, active: boolean) => {
  const response = await api.patch(`/shops/${shopId}/status`, { active });
  return response.data;
};

// 3. Yönetici Güvenlik Bilgilerini Güncelleme
export const updateAdminSecurity = async (adminId: number, data: AdminSecurityUpdateRequest) => {
  const response = await api.put(`/admins/${adminId}/security`, data);
  return response.data;
};