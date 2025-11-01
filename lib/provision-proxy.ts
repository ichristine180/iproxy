import { iproxyService } from "@/lib/iproxy-service";
import { encryptPassword } from "@/lib/encryption";
import crypto from "crypto";

interface ProvisionProxyParams {
  supabase: any;
  orderId: string;
  userId: string;
  userEmail: string;
  connectionId: string;
  expiresAt: string;
  planName?: string;
  ipChangeEnabled?: boolean;
  ipChangeIntervalMinutes?: number;
}

interface ProvisionProxyResult {
  success: boolean;
  connection_id?: string;
  proxy_id?: string;
  http_proxy_access?: string;
  socks5_proxy_access?: string;
  http_proxy_id?: string;
  socks5_proxy_id?: string;
  error?: string;
}

/**
 * Provision proxy access for an order
 * Grants both HTTP and SOCKS5 proxy access, creates action links, and saves to database
 */
export async function provisionProxyAccess(
  params: ProvisionProxyParams
): Promise<ProvisionProxyResult> {
  const {
    supabase,
    orderId,
    userId,
    userEmail,
    connectionId,
    expiresAt,
    planName = "Plan",
    ipChangeEnabled = false,
    ipChangeIntervalMinutes = 0,
  } = params;

  try {
    console.log("Provisioning proxy access for order:", orderId);
    console.log("Connection ID:", connectionId);
    console.log("User Email:", userEmail);

    // Generate shared credentials for both HTTP and SOCKS5
    const sharedUsername = `user_${userId.substring(0, 8)}`;
    const sharedPassword = generateSecurePassword();

    // Step 1: Grant HTTP proxy access
    console.log("Granting HTTP proxy access...");
    const httpProxyRequest = {
      listen_service: "http" as const,
      auth_type: "userpass" as const,
      auth: {
        login: sharedUsername,
        password: sharedPassword,
      },
      description: `HTTP Proxy for ${userEmail} - Order ${orderId}`,
      expires_at: expiresAt,
    };

    const {
      success: httpSuccess,
      proxy: httpProxyAccess,
      error: httpError,
    } = await iproxyService.grantProxyAccess(connectionId, httpProxyRequest);

    if (!httpSuccess || !httpProxyAccess) {
      throw new Error(
        `Failed to grant HTTP proxy access: ${httpError || "Unknown error"}`
      );
    }

    console.log("HTTP proxy access granted:", httpProxyAccess.id);

    // Step 2: Grant SOCKS5 proxy access
    console.log("Granting SOCKS5 proxy access...");
    const socks5ProxyRequest = {
      listen_service: "socks5" as const,
      auth_type: "userpass" as const,
      auth: {
        login: sharedUsername,
        password: sharedPassword,
      },
      description: `SOCKS5 Proxy for ${userEmail} - Order ${orderId}`,
      expires_at: expiresAt,
    };

    const {
      success: socks5Success,
      proxy: socks5ProxyAccess,
      error: socks5Error,
    } = await iproxyService.grantProxyAccess(connectionId, socks5ProxyRequest);

    if (!socks5Success || !socks5ProxyAccess) {
      // Clean up HTTP proxy if SOCKS5 fails
      await iproxyService.deleteProxyAccess(connectionId, httpProxyAccess.id);
      throw new Error(
        `Failed to grant SOCKS5 proxy access: ${socks5Error || "Unknown error"}`
      );
    }

    console.log("SOCKS5 proxy access granted:", socks5ProxyAccess.id);

    // Step 3: Get connection details for rotation info
    let proxyCountry = null;
    let rotationMode = null;
    let rotationIntervalMin = null;

    const connectionDetailsResult =
      await iproxyService.getConnection(connectionId);

    if (connectionDetailsResult.success && connectionDetailsResult.connection) {
      const connectionDetails = connectionDetailsResult.connection;

      // Check for rotation settings
      if (ipChangeEnabled && ipChangeIntervalMinutes > 0) {
        rotationMode = "scheduled";
        rotationIntervalMin = ipChangeIntervalMinutes;
        console.log("Rotation settings from order:", {
          rotationMode,
          rotationIntervalMin,
        });
      } else if (connectionDetails.basic_info?.app_data?.ip_change) {
        const ipChange = connectionDetails.basic_info.app_data.ip_change;
        if (ipChange.mode) {
          rotationMode = "scheduled";
          rotationIntervalMin = ipChangeIntervalMinutes;
          console.log("Rotation settings from connection:", {
            rotationMode,
            rotationIntervalMin,
          });
        }
      }

      // Extract geo information from basic_info.server_geo
      const serverGeo = connectionDetails.basic_info?.server_geo;
      if (serverGeo) {
        proxyCountry = serverGeo.country?.toUpperCase() || null;
        console.log("Geo information from connection:", {
          country: proxyCountry,
          city: serverGeo.city,
        });
      }
    } else {
      console.error(
        "Failed to fetch connection details (non-critical):",
        connectionDetailsResult.error
      );
    }

    // Step 4: Format proxy access as IP:PORT:LOGIN:PASSWORD for both HTTP and SOCKS5
    const httpProxyAccessString = `${httpProxyAccess.ip}:${httpProxyAccess.port}:${httpProxyAccess.auth.login}:${httpProxyAccess.auth.password}`;
    const socks5ProxyAccessString = `${socks5ProxyAccess.ip}:${socks5ProxyAccess.port}:${socks5ProxyAccess.auth.login}:${socks5ProxyAccess.auth.password}`;

    // Step 5: Store connection tracking info in database
    const { error: trackingError } = await supabase
      .from("connection_info")
      .upsert(
        {
          connection_id: connectionId,
          client_email: userEmail,
          user_id: userId,
          order_id: orderId,
          proxy_access: [httpProxyAccessString, socks5ProxyAccessString],
          is_occupied: true,
          expires_at: expiresAt,
          updated_at: new Date().toISOString(),
          proxy_id: [httpProxyAccess.id, socks5ProxyAccess.id],
        },
        { onConflict: "connection_id" }
      );

    if (trackingError) {
      console.warn(
        "Failed to update connection tracking (non-critical):",
        trackingError.message
      );
    } else {
      console.log("Connection tracking updated:", connectionId);
    }

    // Step 6: Get or create action link for IP rotation
    console.log("Getting/creating action link for IP rotation");
    let changeIpUrl: string | null = null;
    let actionLinkId: string | null = null;

    // First, check if action links already exist
    const existingLinksResult =
      await iproxyService.getActionLinks(connectionId);

    if (existingLinksResult.success && existingLinksResult.actionLinks) {
      // Find existing changeip link
      const existingChangeIpLink = existingLinksResult.actionLinks.find(
        (link) => link.action === "changeip"
      );

      if (existingChangeIpLink) {
        actionLinkId = existingChangeIpLink.id;
        changeIpUrl = existingChangeIpLink.link;
        console.log("Using existing action link:", actionLinkId);
      }
    }

    // If no existing link found, create a new one
    if (!actionLinkId) {
      const createActionLinkResult = await iproxyService.createActionLink(
        connectionId,
        "changeip",
        `IP rotation link`
      );

      if (
        createActionLinkResult.success &&
        createActionLinkResult.actionLink
      ) {
        actionLinkId = createActionLinkResult.actionLink.id;
        console.log("Action link created:", actionLinkId);

        // Get the full action link URL
        const getActionLinksResult =
          await iproxyService.getActionLinks(connectionId);

        if (
          getActionLinksResult.success &&
          getActionLinksResult.actionLinks
        ) {
          const changeIpLink = getActionLinksResult.actionLinks.find(
            (link) => link.id === actionLinkId
          );

          if (changeIpLink) {
            changeIpUrl = changeIpLink.link;
            console.log("Action link URL retrieved:", changeIpUrl);
          }
        }
      } else {
        console.error(
          "Failed to create action link (non-critical):",
          createActionLinkResult.error
        );
      }
    }

    // Step 7: Save to proxies table
    const encryptedPassword = encryptPassword(sharedPassword);

    const { data: savedHttpProxy, error: saveHttpError } = await supabase
      .from("proxies")
      .insert({
        user_id: userId,
        order_id: orderId,
        label: `${planName} - ${userEmail}`,
        host: httpProxyAccess.hostname,
        port_http: httpProxyAccess.port,
        username: sharedUsername,
        password_hash: encryptedPassword,
        status: "active",
        country: proxyCountry,
        iproxy_connection_id: connectionId,
        iproxy_change_url: changeIpUrl,
        iproxy_action_link_id: actionLinkId,
        expires_at: expiresAt,
        connection_data: connectionDetailsResult?.connection,
        last_ip: httpProxyAccess.ip,
        rotation_mode: rotationMode,
        rotation_interval_min: rotationIntervalMin,
      })
      .select()
      .single();

    if (saveHttpError) {
      console.error(
        "Failed to save HTTP proxy (non-critical):",
        saveHttpError.message
      );
    } else {
      console.log("HTTP proxy saved to proxies table:", savedHttpProxy.id);
    }

    const { data: savedSocks5Proxy, error: saveSocks5Error } = await supabase
      .from("proxies")
      .insert({
        user_id: userId,
        order_id: orderId,
        label: `${planName} - ${userEmail}`,
        host: socks5ProxyAccess.hostname,
        port_socks5: socks5ProxyAccess.port,
        username: sharedUsername,
        password_hash: encryptedPassword,
        status: "active",
        country: proxyCountry,
        iproxy_connection_id: connectionId,
        iproxy_change_url: changeIpUrl,
        iproxy_action_link_id: actionLinkId,
        expires_at: expiresAt,
        connection_data: connectionDetailsResult?.connection,
        last_ip: socks5ProxyAccess.ip,
        rotation_mode: rotationMode,
        rotation_interval_min: rotationIntervalMin,
      })
      .select()
      .single();

    if (saveSocks5Error) {
      console.error(
        "Failed to save SOCKS5 proxy (non-critical):",
        saveSocks5Error.message
      );
    } else {
      console.log("SOCKS5 proxy saved to proxies table:", savedSocks5Proxy.id);
    }

    return {
      success: true,
      connection_id: connectionId,
      proxy_id: savedHttpProxy?.id,
      http_proxy_access: httpProxyAccessString,
      socks5_proxy_access: socks5ProxyAccessString,
      http_proxy_id: httpProxyAccess.id,
      socks5_proxy_id: socks5ProxyAccess.id,
    };
  } catch (error) {
    console.error("Error provisioning proxy access:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Helper function to generate secure password
function generateSecurePassword(): string {
  const length = 16;
  const charset =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  let password = "";
  const randomBytes = crypto.randomBytes(length);

  for (let i = 0; i < length; i++) {
    const byte = randomBytes[i];
    if (byte !== undefined) {
      password += charset[byte % charset.length];
    }
  }

  return password;
}
