import { SupabaseClient } from "@supabase/supabase-js";

interface QuotaCheckResult {
  success: boolean;
  available: number;
  error?: string;
}

interface QuotaReservationResult {
  success: boolean;
  reservation_id?: string;
  expires_at?: string;
  expires_in_seconds?: number;
  reserved_connections?: number;
  error?: string;
  available?: number;
}

interface QuotaConfirmResult {
  success: boolean;
  reservation_id?: string;
  confirmed_at?: string;
  error?: string;
}

interface QuotaReleaseResult {
  success: boolean;
  reservation_id?: string;
  released_connections?: number;
  error?: string;
}

interface QuotaDeductResult {
  success: boolean;
  deducted_connections: number;
  remaining_quota: number;
  error?: string;
}

/**
 * Quota Manager - Centralized quota management utility
 *
 * Handles all quota operations including:
 * - Checking availability
 * - Reserving quota (with timer for pending payments)
 * - Confirming reservations (when payment succeeds)
 * - Releasing reservations (when payment fails/expires)
 * - Direct deduction (for admin actions)
 */
export class QuotaManager {
  private supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  /**
   * Check if sufficient quota is available
   */
  async checkAvailability(requiredConnections: number): Promise<QuotaCheckResult> {
    try {
      const { data: quota, error } = await this.supabase
        .from("quota")
        .select("available_connection_number")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("Error checking quota:", error);
        return {
          success: false,
          available: 0,
          error: "Failed to check quota availability",
        };
      }

      if (!quota) {
        return {
          success: false,
          available: 0,
          error: "Quota not configured",
        };
      }

      const available = quota.available_connection_number;
      const isAvailable = available >= requiredConnections;

      return {
        success: isAvailable,
        available,
        error: isAvailable
          ? undefined
          : `Insufficient quota. Only ${available} connection(s) available, but ${requiredConnections} requested.`,
      };
    } catch (error: any) {
      console.error("Error in checkAvailability:", error);
      return {
        success: false,
        available: 0,
        error: error.message || "Unknown error checking quota",
      };
    }
  }

  /**
   * Reserve quota for a pending order (with 15-minute expiry)
   * Used when customer initiates payment
   */
  async reserveQuota(
    orderId: string,
    userId: string,
    connections: number = 1,
    expiryMinutes: number = 15
  ): Promise<QuotaReservationResult> {
    try {
      const { data: result, error } = await this.supabase.rpc("reserve_quota", {
        p_order_id: orderId,
        p_user_id: userId,
        p_connections: connections,
        p_expiry_minutes: expiryMinutes,
      });

      if (error) {
        console.error("Error reserving quota:", error);
        return {
          success: false,
          error: error.message || "Failed to reserve quota",
        };
      }

      if (!result || !result.success) {
        return {
          success: false,
          error: result?.error || "Failed to reserve quota",
          available: result?.available,
        };
      }

      console.log(`✓ Quota reserved: ${connections} connection(s) for order ${orderId}`);

      return {
        success: true,
        reservation_id: result.reservation_id,
        expires_at: result.expires_at,
        expires_in_seconds: result.expires_in_seconds,
        reserved_connections: result.reserved_connections,
      };
    } catch (error: any) {
      console.error("Error in reserveQuota:", error);
      return {
        success: false,
        error: error.message || "Unknown error reserving quota",
      };
    }
  }

  /**
   * Confirm a quota reservation (convert from temporary to permanent)
   * Used when payment is successfully completed
   */
  async confirmReservation(orderId: string): Promise<QuotaConfirmResult> {
    try {
      const { data: result, error } = await this.supabase.rpc(
        "confirm_quota_reservation",
        { p_order_id: orderId }
      );

      if (error) {
        console.error("Error confirming reservation:", error);
        return {
          success: false,
          error: error.message || "Failed to confirm reservation",
        };
      }

      if (!result || !result.success) {
        return {
          success: false,
          error: result?.error || "Failed to confirm reservation",
        };
      }

      console.log(`✓ Quota reservation confirmed for order ${orderId}`);

      return {
        success: true,
        reservation_id: result.reservation_id,
        confirmed_at: result.confirmed_at,
      };
    } catch (error: any) {
      console.error("Error in confirmReservation:", error);
      return {
        success: false,
        error: error.message || "Unknown error confirming reservation",
      };
    }
  }

  /**
   * Release a quota reservation (return to pool)
   * Used when payment fails, is cancelled, or expires
   */
  async releaseReservation(orderId: string): Promise<QuotaReleaseResult> {
    try {
      const { data: result, error } = await this.supabase.rpc(
        "release_quota_reservation",
        { p_order_id: orderId }
      );

      if (error) {
        console.error("Error releasing reservation:", error);
        return {
          success: false,
          error: error.message || "Failed to release reservation",
        };
      }

      if (!result || !result.success) {
        return {
          success: false,
          error: result?.error || "Failed to release reservation",
        };
      }

      console.log(`✓ Quota reservation released for order ${orderId}`);

      return {
        success: true,
        reservation_id: result.reservation_id,
        released_connections: result.released_connections,
      };
    } catch (error: any) {
      console.error("Error in releaseReservation:", error);
      return {
        success: false,
        error: error.message || "Unknown error releasing reservation",
      };
    }
  }

  /**
   * Direct quota deduction (without reservation)
   * Used for admin manual activation or free trial orders
   */
  async deductQuota(
    orderId: string,
    userId: string,
    connections: number = 1
  ): Promise<QuotaDeductResult> {
    try {
      // For direct deduction, we use reserve + immediate confirm
      // This ensures proper tracking in quota_reservations table
      const reserveResult = await this.reserveQuota(
        orderId,
        userId,
        connections,
        1 // Short expiry since we'll confirm immediately
      );

      if (!reserveResult.success) {
        return {
          success: false,
          deducted_connections: 0,
          remaining_quota: 0,
          error: reserveResult.error,
        };
      }

      // Immediately confirm the reservation
      const confirmResult = await this.confirmReservation(orderId);

      if (!confirmResult.success) {
        // Try to release the reservation on confirm failure
        await this.releaseReservation(orderId);
        return {
          success: false,
          deducted_connections: 0,
          remaining_quota: 0,
          error: confirmResult.error,
        };
      }

      // Get current quota to return remaining
      const { data: quota } = await this.supabase
        .from("quota")
        .select("available_connection_number")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const remaining = quota?.available_connection_number || 0;

      console.log(
        `✓ Quota deducted: ${connections} connection(s) for order ${orderId}, ${remaining} remaining`
      );

      return {
        success: true,
        deducted_connections: connections,
        remaining_quota: remaining,
      };
    } catch (error: any) {
      console.error("Error in deductQuota:", error);
      return {
        success: false,
        deducted_connections: 0,
        remaining_quota: 0,
        error: error.message || "Unknown error deducting quota",
      };
    }
  }

  /**
   * Get current quota status
   */
  async getQuotaStatus() {
    try {
      const { data: quota, error } = await this.supabase
        .from("quota")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("Error getting quota status:", error);
        return null;
      }

      return quota;
    } catch (error) {
      console.error("Error in getQuotaStatus:", error);
      return null;
    }
  }

  /**
   * Get reservation status for an order
   */
  async getReservationStatus(orderId: string) {
    try {
      const { data: reservation, error } = await this.supabase
        .from("quota_reservations")
        .select("*")
        .eq("order_id", orderId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("Error getting reservation status:", error);
        return null;
      }

      return reservation;
    } catch (error) {
      console.error("Error in getReservationStatus:", error);
      return null;
    }
  }
}

/**
 * Helper function to create a QuotaManager instance
 */
export function createQuotaManager(supabase: SupabaseClient): QuotaManager {
  return new QuotaManager(supabase);
}
