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

export interface CreateConnectionRequest {
  name: string;
  description?: string;
  prolongation_enabled?: boolean;
  country?: string; // 2-letter country code
  city?: string;
  socks5_udp?: boolean;
  server_id?: string; // Only for VIP servers, mutually exclusive with city+country and socks5_udp
}

export interface CreateConnectionResponse {
  id: string;
  country: string;
  city: string;
  server_id: string;
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

  /**
   * Create a new connection
   * POST /api/console/v1/connections
   */
  async createConnection(request: CreateConnectionRequest): Promise<{
    success: boolean;
    connection?: CreateConnectionResponse;
    error?: string;
  }> {
    try {
      const response = await fetch(`${this.apiUrl}/connections`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || data.message || "Failed to create connection"
        );
      }

      return {
        success: true,
        connection: data,
      };
    } catch (error) {
      console.error("Error creating connection:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Get full connection details by ID
   * GET /api/console/v1/connections/{conn_id}
   */
  async getConnection(connectionId: string): Promise<{
    success: boolean;
    connection?: ConsoleConnection;
    error?: string;
  }> {
    try {
      const response = await fetch(
        `${this.apiUrl}/connections/${connectionId}`,
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
          data.error || data.message || "Failed to get connection"
        );
      }

      return {
        success: true,
        connection: data,
      };
    } catch (error) {
      console.error("Error getting connection:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Create a new connection and retrieve its full details
   * Combines POST /api/console/v1/connections and GET /api/console/v1/connections/{conn_id}
   */
  async createAndGetConnection(request: CreateConnectionRequest): Promise<{
    success: boolean;
    connection?: ConsoleConnection;
    error?: string;
  }> {
    try {
      // Step 1: Create the connection
      const createResult = await this.createConnection(request);

      if (!createResult.success || !createResult.connection) {
        return {
          success: false,
          error: createResult.error || "Failed to create connection",
        };
      }

      // Step 2: Get the full connection details
      const getResult = await this.getConnection(createResult.connection.id);

      if (!getResult.success || !getResult.connection) {
        return {
          success: false,
          error:
            getResult.error ||
            "Connection created but failed to retrieve details",
        };
      }

      return {
        success: true,
        connection: getResult.connection,
      };
    } catch (error) {
      console.error("Error creating and getting connection:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Update connection settings
   * POST /api/console/v1/connections/{conn_id}/update-settings
   */
  async updateConnectionSettings(
    connectionId: string,
    settings: {
      ip_change_enabled?: boolean;
      ip_change_interval_minutes?: number;
      prolongation_enabled?: boolean;
      [key: string]: any;
    }
  ): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const response = await fetch(
        `${this.apiUrl}/connections/${connectionId}/update-settings`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(settings),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || data.message || "Failed to update connection settings"
        );
      }

      return {
        success: true,
      };
    } catch (error) {
      console.error("Error updating connection settings:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Create action link for connection
   * POST /api/console/v1/connections/{conn_id}/actionlinks
   */
  async createActionLink(
    connectionId: string,
    action: "changeip" | "reboot",
    comment?: string
  ): Promise<{
    success: boolean;
    actionLink?: { id: string };
    error?: string;
  }> {
    try {
      const url = `${this.apiUrl}/connections/${connectionId}/actionlinks`;
      const payload = { action, comment };
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("Action link creation failed:", {
          url,
          payload,
          status: response.status,
          statusText: response.statusText,
          responseData: data,
          error: data.error,
          message: data.message,
        });
        throw new Error(
          data.error || data.message || `HTTP ${response.status}: Failed to create action link`
        );
      }

      return {
        success: true,
        actionLink: { id: data.id },
      };
    } catch (error) {
      console.error("Error creating action link:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Get list of action links for a connection
   * GET /api/console/v1/connections/{conn_id}/actionlinks
   */
  async getActionLinks(connectionId: string): Promise<{
    success: boolean;
    actionLinks?: Array<{
      id: string;
      link: string;
      action: string;
      connection_id: string;
      comment: string;
      created_at: string;
    }>;
    error?: string;
  }> {
    try {
      const response = await fetch(
        `${this.apiUrl}/connections/${connectionId}/actionlinks`,
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
          data.error || data.message || "Failed to get action links"
        );
      }

      return {
        success: true,
        actionLinks: data.action_links || [],
      };
    } catch (error) {
      console.error("Error getting action links:", error);
      return {
        success: false,
        actionLinks: [],
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Delete action link
   * DELETE /api/console/v1/connections/{conn_id}/actionlinks/{link_id}
   */
  async deleteActionLink(
    connectionId: string,
    actionLinkId: string
  ): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const response = await fetch(
        `${this.apiUrl}/connections/${connectionId}/actionlinks/${actionLinkId}`,
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
        throw new Error(
          data.error || data.message || "Failed to delete action link"
        );
      }

      return {
        success: true,
      };
    } catch (error) {
      console.error("Error deleting action link:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}

// Export singleton instance
export const iproxyService = new IProxyService();
