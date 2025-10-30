export interface PlanPricing {
  id: string;
  plan_id: string;
  duration: 'daily' | 'weekly' | 'monthly' | 'yearly';
  price_usd: number;
  created_at: string;
}

export interface Plan {
  id: string;
  name: string;
  channel: 'mobile' | 'residential' | 'datacenter';
  rotation_api: boolean;
  description: string | null;
  features: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
  pricing?: PlanPricing[]; // Optional array of pricing tiers
}

export interface PlanDisplay {
  name: string;
  price: string;
  priceUnit: string;
  description: string;
  features: string[];
  cta: string;
  featured: boolean;
  planId: string;
}
