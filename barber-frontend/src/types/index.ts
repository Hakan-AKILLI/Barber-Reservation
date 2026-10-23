export interface Shop {
  id: number;
  name: string;
  slug: string;
  phone: string;
  address: string;
  active: boolean;
}

export interface TimeSlot {
  id: number;
  slotDate: string;
  startTime: string;
  endTime: string;
  booked: boolean;
  active: boolean;
  shop: Shop;
}