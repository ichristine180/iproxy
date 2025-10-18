/**
 * iProxy.online API Integration Service
 *
 * API Documentation: https://iproxy.online/docs-api-connection
 * Base URL: https://iproxy.online/api/cn/v1/
 * Authentication: Bearer token in Authorization header
 *
 * Required Environment Variables:
 * - IPROXY_API_KEY: Your iProxy.online API key
 */

// Types based on iProxy.online API
export interface IProxyConnection {
  id: string;
  name: string;
  status: string;
  [key: string]: any; // Additional fields from API
}

export interface IProxyConfig {
  label?: string;
  port_http?: number;
  port_socks5?: number;
  username?: string;
  password?: string;
  rotation_enabled?: boolean;
}

export interface IProxyDetails {
  id: string;
  connection_id: string;
  host: string;
  port_http: number;
  port_socks5?: number;
  username: string;
  password: string;
  change_url?: string; // URL to rotate IP
  status: string;
  [key: string]: any;
}

export interface IProxyRotateResponse {
  success: boolean;
  old_ip?: string;
  new_ip?: string;
  message?: string;
  error?: string;
}

export class IProxyService {
  private apiUrl: string;
  private apiKey: string;

  constructor() {
    this.apiUrl = 'https://iproxy.online/api/cn/v1';
    this.apiKey = process.env.IPROXY_API_KEY || '';

    if (!this.apiKey) {
      console.warn('IPROXY_API_KEY not set in environment variables');
    }
  }

  /**
   * Get list of connections (devices/sources)
   * GET /connections
   */
  async getConnections(): Promise<{ success: boolean; connections: IProxyConnection[]; error?: string }> {
    try {
      const response = await fetch(`${this.apiUrl}/connections`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Failed to fetch connections');
      }

      return {
        success: true,
        connections: data.connections || data.data || data,
      };
    } catch (error) {
      console.error('Error fetching iProxy connections:', error);
      return {
        success: false,
        connections: [],
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Create a new proxy under a connection
   * POST /connections/{ID}/proxies
   */
  async createProxy(
    connectionId: string,
    config?: IProxyConfig
  ): Promise<{ success: boolean; proxy?: IProxyDetails; error?: string }> {
    try {
      const response = await fetch(`${this.apiUrl}/connections/${connectionId}/proxies`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config || {}),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Failed to create proxy');
      }

      return {
        success: true,
        proxy: data.proxy || data.data || data,
      };
    } catch (error) {
      console.error('Error creating iProxy proxy:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get list of proxies under a connection
   * GET /connections/{ID}/proxies
   */
  async getProxies(
    connectionId: string
  ): Promise<{ success: boolean; proxies: IProxyDetails[]; error?: string }> {
    try {
      const response = await fetch(`${this.apiUrl}/connections/${connectionId}/proxies`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Failed to fetch proxies');
      }

      return {
        success: true,
        proxies: data.proxies || data.data || data,
      };
    } catch (error) {
      console.error('Error fetching iProxy proxies:', error);
      return {
        success: false,
        proxies: [],
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Delete a proxy
   * DELETE /connections/{ID}/proxies/{proxyID}
   */
  async deleteProxy(
    connectionId: string,
    proxyId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.apiUrl}/connections/${connectionId}/proxies/${proxyId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || data.message || 'Failed to delete proxy');
      }

      return {
        success: true,
      };
    } catch (error) {
      console.error('Error deleting iProxy proxy:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Rotate IP address by calling the change URL
   * The change_url is obtained when creating/fetching a proxy
   */
  async rotateIP(changeUrl: string): Promise<IProxyRotateResponse> {
    try {
      // The change_url can be called directly (may or may not require auth)
      // Try with auth first
      const response = await fetch(changeUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Failed to rotate IP');
      }

      return {
        success: true,
        old_ip: data.old_ip,
        new_ip: data.new_ip,
        message: data.message,
      };
    } catch (error) {
      console.error('Error rotating IP:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get current IP for a proxy by checking through the proxy
   * This requires making a request through the proxy to a service like ipify
   */
  async getCurrentIP(
    proxyHost: string,
    proxyPort: number,
    proxyUsername: string,
    proxyPassword: string
  ): Promise<{ success: boolean; ip?: string; error?: string }> {
    try {
      // Note: This would require a proxy-capable HTTP client
      // For now, return a placeholder
      // In production, you'd use node-fetch with proxy-agent or similar

      return {
        success: false,
        error: 'getCurrentIP requires proxy-capable HTTP client implementation',
      };
    } catch (error) {
      console.error('Error getting current IP:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

// Export singleton instance
export const iproxyService = new IProxyService();
