export interface Plan {
  id: string;
  name: string;
  channel: 'mobile' | 'residential' | 'datacenter';
  price_usd_month: number;
  rotation_api: boolean;
  description: string | null;
  features: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PlanDisplay {
  name: string;
  price: string;
  description: string;
  features: string[];
  cta: string;
  featured: boolean;
  planId: string;
}
