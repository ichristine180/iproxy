// Types based on iProxy.online API
export interface IProxyConnection {
  id: string;
  name: string;
  status: string;
  [key: string]: any;
}

// Console API Types
export interface ConsoleConnection {
  id: string;
  basic_info: {
    name: string;
    description: string;
    created_at: string;
    updated_at: string;
    is_onboarding: boolean;
    user_id: string;
    server_id: string;
    server_geo: {
      city: string;
      country: string;
    };
    c_fqdn: string;
    api_key_exists: boolean;
    busy_by?: string;
  };
  app_data: any;
  plan_info: any;
  settings: any;
  shared_users: any[];
}

export interface ConsoleProxyAccessRequest {
  listen_service: "http" | "socks5";
  auth_type: "userpass" | "noauth";
  auth?: {
    login: string;
    password: string;
  };
  description?: string;
  acl_inbound_policy?: "deny_except";
  acl_inbound_ips?: string[];
  expires_at?: string; 
}

export interface ConsoleProxyAccessResponse {
  id: string;
  connection_id: string;
  description: string;
  listen_service: "http" | "socks5";
  auth_type: "userpass" | "noauth";
  auth: {
    login: string;
    password: string;
  };
  ip: string;
  port: number;
  hostname: string;
  password_updated_at: string;
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
    this.apiUrl = "https://iproxy.online/api/console/v1";
    this.apiKey = process.env.IPROXY_API_KEY || "";
    

    if (!this.apiKey) {
      console.warn("IPROXY_API_KEY not set in environment variables");
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
      const response = await fetch(
        `${this.apiUrl}/connections/${connectionId}/proxies`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(config || {}),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || "Failed to create proxy");
      }

      return {
        success: true,
        proxy: data.proxy || data.data || data,
      };
    } catch (error) {
      console.error("Error creating iProxy proxy:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
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
      const response = await fetch(
        `${this.apiUrl}/connections/${connectionId}/proxies`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || data.message || "Failed to fetch proxies"
        );
      }

      return {
        success: true,
        proxies: data.proxies || data.data || data,
      };
    } catch (error) {
      console.error("Error fetching iProxy proxies:", error);
      return {
        success: false,
        proxies: [],
        error: error instanceof Error ? error.message : "Unknown error",
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
      const response = await fetch(
        `${this.apiUrl}/connections/${connectionId}/proxies/${proxyId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || data.message || "Failed to delete proxy");
      }

      return {
        success: true,
      };
    } catch (error) {
      console.error("Error deleting iProxy proxy:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
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
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || data.message || "Failed to rotate IP");
      }

      return {
        success: true,
        old_ip: data.old_ip,
        new_ip: data.new_ip,
        message: data.message,
      };
    } catch (error) {
      console.error("Error rotating IP:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }




  /**
   * Get list of connections from Console API
   * GET /api/console/v1/connections
   */
  async getConsoleConnections(): Promise<{
    success: boolean;
    connections: ConsoleConnection[];
    error?: string;
  }> {
    try {
      const response = await fetch(`${this.apiUrl}/connections`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || data.message || "Failed to fetch console connections"
        );
      }

      return {
        success: true,
        connections: data.connections || [],
      };
    } catch (error) {
      console.error("Error fetching console connections:", error);
      return {
        success: false,
        connections: [],
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Grant proxy access to a connection
   * POST /api/console/v1/connections/{conn_id}/proxy-access
   */
  async grantProxyAccess(
    connectionId: string,
    request: ConsoleProxyAccessRequest
  ): Promise<{
    success: boolean;
    proxy?: ConsoleProxyAccessResponse;
    error?: string;
  }> {
    try {
      const response = await fetch(
        `${this.apiUrl}/connections/${connectionId}/proxy-access`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(request),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || data.message || "Failed to grant proxy access"
        );
      }

      return {
        success: true,
        proxy: data,
      };
    } catch (error) {
      console.error("Error granting proxy access:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}

// Export singleton instance
export const iproxyService = new IProxyService();
