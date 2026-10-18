import axios from 'axios';

// Spring Boot uygulamasının varsayılan olarak 8080 portunda çalıştığını varsayıyoruz
export const api = axios.create({
  baseURL: 'http://localhost:8080/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

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
  // Backend'deki post endpointinin URL'si /appointments ise:
  const response = await api.post(`/appointments`, payload);
  return response.data; 
};