import type { StampUser } from '../lib/supabase';

// Mock data fallback when Supabase not configured
export const MOCK_USERS: StampUser[] = [
  { id: '1', name: "Woo-bin Lee", phone_full: "01012345678", phone_last4: "5678", stamps: 2, free_burger_available: false, created_at: '', updated_at: '' },
  { id: '2', name: "Sora Kim", phone_full: "01098765678", phone_last4: "5678", stamps: 7, free_burger_available: false, created_at: '', updated_at: '' },
  { id: '3', name: "Min-su Park", phone_full: "01011111234", phone_last4: "1234", stamps: 4, free_burger_available: false, created_at: '', updated_at: '' }
];
