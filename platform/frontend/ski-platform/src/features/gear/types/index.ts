/**
 * Gear Operations Types
 * 装备管理类型定义
 */

export interface GearItem {
  id: string;
  user_id: string;
  name: string;
  category?: string;
  brand?: string;
  purchase_date?: string;
  status: 'active' | 'retired' | 'for_sale' | 'deleted';
  role: 'personal' | 'teaching';
  sale_price?: number;
  sale_currency?: string;
  created_at: string;
  updated_at: string;
}

export interface GearItemCreate {
  name: string;
  category?: string;
  brand?: string;
  purchase_date?: string;
  role?: 'personal' | 'teaching';
}

export interface GearItemUpdate {
  name?: string;
  category?: string;
  brand?: string;
  purchase_date?: string;
  status?: 'active' | 'retired' | 'for_sale' | 'deleted';
  role?: 'personal' | 'teaching';
  sale_price?: number;
  sale_currency?: string;
}

export interface GearInspection {
  id: string;
  gear_item_id: string;
  inspector_user_id: string;
  inspection_date: string;
  checklist: Record<string, unknown>;
  overall_status: 'good' | 'needs_attention' | 'unsafe';
  notes?: string;
  next_inspection_date?: string;
  created_at: string;
}

export interface GearInspectionCreate {
  checklist: Record<string, unknown>;
  overall_status: 'good' | 'needs_attention' | 'unsafe';
  notes?: string;
}

export interface GearReminder {
  id: string;
  gear_item_id: string;
  reminder_type: 'inspection' | 'maintenance' | 'general';
  scheduled_at: string;
  sent_at?: string;
  status: 'pending' | 'sent' | 'cancelled';
  message?: string;
  created_at: string;
}
