// Database Type Definitions
// This file provides TypeScript types for the database schema
// Run `supabase gen types typescript` to auto-generate from your database

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          role: 'user' | 'admin'
          tg_chat_id: string | null
          notify_email: boolean
          notify_telegram: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          role?: 'user' | 'admin'
          tg_chat_id?: string | null
          notify_email?: boolean
          notify_telegram?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          role?: 'user' | 'admin'
          tg_chat_id?: string | null
          notify_email?: boolean
          notify_telegram?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      plans: {
        Row: {
          id: string
          name: string
          channel: 'mobile' | 'residential' | 'datacenter'
          price_usd_month: number
          rotation_api: boolean
          description: string | null
          features: Json
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          channel?: 'mobile' | 'residential' | 'datacenter'
          price_usd_month: number
          rotation_api?: boolean
          description?: string | null
          features?: Json
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          channel?: 'mobile' | 'residential' | 'datacenter'
          price_usd_month?: number
          rotation_api?: boolean
          description?: string | null
          features?: Json
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      proxies: {
        Row: {
          id: string
          user_id: string
          label: string
          host: string
          port_http: number | null
          port_socks5: number | null
          username: string
          password_hash: string
          country: string | null
          status: 'active' | 'inactive' | 'error' | 'rotating'
          last_ip: string | null
          iproxy_change_url: string | null
          iproxy_action_link_id: string | null
          rotation_mode: 'manual' | 'api' | 'scheduled'
          rotation_interval_min: number | null
          last_rotated_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          label: string
          host: string
          port_http?: number | null
          port_socks5?: number | null
          username: string
          password_hash: string
          country?: string | null
          status?: 'active' | 'inactive' | 'error' | 'rotating'
          last_ip?: string | null
          iproxy_change_url?: string | null
          iproxy_action_link_id?: string | null
          rotation_mode?: 'manual' | 'api' | 'scheduled'
          rotation_interval_min?: number | null
          last_rotated_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          label?: string
          host?: string
          port_http?: number | null
          port_socks5?: number | null
          username?: string
          password_hash?: string
          country?: string | null
          status?: 'active' | 'inactive' | 'error' | 'rotating'
          last_ip?: string | null
          iproxy_change_url?: string | null
          iproxy_action_link_id?: string | null
          rotation_mode?: 'manual' | 'api' | 'scheduled'
          rotation_interval_min?: number | null
          last_rotated_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          user_id: string
          plan_id: string
          status: 'pending' | 'active' | 'expired' | 'failed' | 'cancelled'
          start_at: string | null
          end_at: string | null
          quantity: number
          total_amount: number
          currency: string
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          plan_id: string
          status?: 'pending' | 'active' | 'expired' | 'failed' | 'cancelled'
          start_at?: string | null
          end_at?: string | null
          quantity?: number
          total_amount: number
          currency?: string
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          plan_id?: string
          status?: 'pending' | 'active' | 'expired' | 'failed' | 'cancelled'
          start_at?: string | null
          end_at?: string | null
          quantity?: number
          total_amount?: number
          currency?: string
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
      }
      payments: {
        Row: {
          id: string
          user_id: string
          order_id: string | null
          provider: 'cryptomus' | 'stripe' | 'paypal' | 'manual'
          invoice_uuid: string | null
          amount: number
          currency: string
          payer_currency: string | null
          status: 'pending' | 'processing' | 'paid' | 'failed' | 'cancelled' | 'refunded'
          is_final: boolean
          txid: string | null
          invoice_url: string | null
          signature_ok: boolean | null
          raw_payload: Json | null
          metadata: Json
          paid_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          order_id?: string | null
          provider?: 'cryptomus' | 'stripe' | 'paypal' | 'manual'
          invoice_uuid?: string | null
          amount: number
          currency?: string
          payer_currency?: string | null
          status?: 'pending' | 'processing' | 'paid' | 'failed' | 'cancelled' | 'refunded'
          is_final?: boolean
          txid?: string | null
          invoice_url?: string | null
          signature_ok?: boolean | null
          raw_payload?: Json | null
          metadata?: Json
          paid_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          order_id?: string | null
          provider?: 'cryptomus' | 'stripe' | 'paypal' | 'manual'
          invoice_uuid?: string | null
          amount?: number
          currency?: string
          payer_currency?: string | null
          status?: 'pending' | 'processing' | 'paid' | 'failed' | 'cancelled' | 'refunded'
          is_final?: boolean
          txid?: string | null
          invoice_url?: string | null
          signature_ok?: boolean | null
          raw_payload?: Json | null
          metadata?: Json
          paid_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      rotations: {
        Row: {
          id: string
          proxy_id: string
          user_id: string
          source: 'dashboard' | 'api' | 'schedule'
          result: 'pending' | 'success' | 'failed'
          old_ip: string | null
          new_ip: string | null
          latency_ms: number | null
          error: string | null
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          proxy_id: string
          user_id: string
          source?: 'dashboard' | 'api' | 'schedule'
          result?: 'pending' | 'success' | 'failed'
          old_ip?: string | null
          new_ip?: string | null
          latency_ms?: number | null
          error?: string | null
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          proxy_id?: string
          user_id?: string
          source?: 'dashboard' | 'api' | 'schedule'
          result?: 'pending' | 'success' | 'failed'
          old_ip?: string | null
          new_ip?: string | null
          latency_ms?: number | null
          error?: string | null
          metadata?: Json
          created_at?: string
        }
      }
      api_keys: {
        Row: {
          id: string
          user_id: string
          name: string
          key_hash: string
          key_prefix: string
          scopes: string[]
          last_used_at: string | null
          revoked: boolean
          revoked_at: string | null
          revoked_reason: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          key_hash: string
          key_prefix: string
          scopes?: string[]
          last_used_at?: string | null
          revoked?: boolean
          revoked_at?: string | null
          revoked_reason?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          key_hash?: string
          key_prefix?: string
          scopes?: string[]
          last_used_at?: string | null
          revoked?: boolean
          revoked_at?: string | null
          revoked_reason?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      webhook_events: {
        Row: {
          id: string
          provider: 'cryptomus' | 'stripe' | 'paypal' | 'custom'
          event_type: string
          signature_ok: boolean | null
          payload: Json
          processed_at: string | null
          processing_error: string | null
          retry_count: number
          created_at: string
        }
        Insert: {
          id?: string
          provider: 'cryptomus' | 'stripe' | 'paypal' | 'custom'
          event_type: string
          signature_ok?: boolean | null
          payload: Json
          processed_at?: string | null
          processing_error?: string | null
          retry_count?: number
          created_at?: string
        }
        Update: {
          id?: string
          provider?: 'cryptomus' | 'stripe' | 'paypal' | 'custom'
          event_type?: string
          signature_ok?: boolean | null
          payload?: Json
          processed_at?: string | null
          processing_error?: string | null
          retry_count?: number
          created_at?: string
        }
      }
      audit_logs: {
        Row: {
          id: string
          user_id: string | null
          action: string
          target_type: string | null
          target_id: string | null
          meta: Json
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          action: string
          target_type?: string | null
          target_id?: string | null
          meta?: Json
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          action?: string
          target_type?: string | null
          target_id?: string | null
          meta?: Json
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      log_audit_event: {
        Args: {
          p_user_id: string
          p_action: string
          p_target_type?: string
          p_target_id?: string
          p_meta?: Json
          p_ip_address?: string
          p_user_agent?: string
        }
        Returns: string
      }
      revoke_api_key: {
        Args: {
          api_key_id: string
          reason?: string
        }
        Returns: void
      }
      validate_api_key: {
        Args: {
          key_hash_input: string
        }
        Returns: {
          is_valid: boolean
          user_id: string | null
          scopes: string[] | null
        }[]
      }
      check_expired_orders: {
        Args: Record<string, never>
        Returns: void
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}
