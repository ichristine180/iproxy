import { iproxyService } from "@/lib/iproxy-service";

interface GetAvailableConnectionResult {
  success: boolean;
  connection?: any;
  error?: string;
}

/**
 * Get an available connection based on priority order
 * Priority 1: Connections with app_data and plan_info but no proxies
 * Priority 2: Connections with plan but not configured on device
 * Priority 3: Connections with plan, app_data and proxies (not on stopList and not active in our connection_info table)
 * Priority 4: Connections with app_data but no plan - add plan
 * Priority 5: Create new connection and add plan
 */
export async function getAvailableConnection(
  supabase: any
): Promise<GetAvailableConnectionResult> {
  try {
    console.log("Getting available connection with priority system");

    // Get all connections from iProxy
    const { success, connections, error } =
      await iproxyService.getConsoleConnections();

    if (!success || !connections) {
      throw new Error(`Failed to get connections from iProxy: ${error}`);
    }

    console.log(`Found ${connections.length} connections from iProxy`);

    // Get stopList from database (connections to skip)
    const { data: stopListData } = await supabase
      .from("connection_stoplist")
      .select("connection_id");

    const stopList = new Set(
      stopListData?.map((item: any) => item.connection_id) || []
    );
    console.log(`StopList has ${stopList.size} connections`);

    // Priority 1: Connections with app_data and plan_info but no proxies
    console.log(
      "Checking Priority 1: Connections with app_data and plan_info but no proxies"
    );
    for (const conn of connections) {
      if (conn.app_data && conn.plan_info) {
        // Check if connection has proxies
        const proxiesResult = await iproxyService.getProxiesByConnection(
          conn.id
        );

        if (proxiesResult.success && proxiesResult.proxies.length === 0) {
          console.log(`Priority 1 match found: ${conn.id}`);
          return { success: true, connection: { ...conn, isActive: true } };
        }
      }
    }

    // Priority 2: Connections with plan, app_data and proxies (not on stopList and not active in our connection_info table)
    console.log(
      "Checking Priority 2: Connections with plan, app_data and proxies"
    );
    for (const conn of connections) {
      // if (conn.plan_info && !stopList.has(conn.id)) {
      if (conn.app_data && conn.plan_info && !stopList.has(conn.id)) {
        // Check if connection has proxies
        const proxiesResult = await iproxyService.getProxiesByConnection(
          conn.id
        );

        if (proxiesResult.success && proxiesResult.proxies.length > 0) {
          console.log(
            `Priority 3 match found: ${conn.id} with ${proxiesResult.proxies.length} existing proxies`
          );

          // Check if this connection exists in our connection_info table
          const { data: connectionInfo } = await supabase
            .from("proxies")
            .select("*")
            .eq("iproxy_connection_id", conn.id)
            .maybeSingle();

          if (connectionInfo) {
            console.log(`Connection ${conn.id} found in connection_info table`);

            // Check if it's expired
            const now = new Date();
            const expiresAt = connectionInfo.expires_at
              ? new Date(connectionInfo.expires_at)
              : null;

            if (expiresAt && expiresAt > now) {
              // Not expired, skip this connection
              console.log(
                `Connection ${conn.id} is not expired (expires: ${expiresAt.toISOString()}), skipping...`
              );
              continue;
            } else {
              console.log(
                `Connection ${conn.id} is expired or has no expiry date, proceeding with deletion`
              );
            }
          } else {
            console.log(
              `Connection ${conn.id} not found in connection_info table, proceeding with deletion`
            );
          }

          // Delete all old proxies before reusing the connection
          console.log("Deleting old proxies...");
          let deletedCount = 0;
          let failedCount = 0;

          for (const proxy of proxiesResult.proxies) {
            const deleteResult = await iproxyService.deleteProxyAccess(
              conn.id,
              proxy.id
            );
            if (deleteResult.success) {
              deletedCount++;
              console.log(`Deleted proxy: ${proxy.id}`);
            } else {
              failedCount++;
              console.error(
                `Failed to delete proxy ${proxy.id}:`,
                deleteResult.error
              );
            }
          }

          console.log(`Deleted ${deletedCount} proxies, ${failedCount} failed`);

          return { success: true, connection: { ...conn, isActive: true } };
        }
      }
    }
    // Priority 3: connections with plan but not configured on device
    console.log(
      "Checking Priority 3: Connections with plan but not configured on device"
    );
    for (const conn of connections) {
      if (conn.plan_info && !conn.app_data) {
        // Check if connection has proxies - only proceed if no proxies
        const proxiesResult = await iproxyService.getProxiesByConnection(
          conn.id
        );

        if (proxiesResult.success && proxiesResult.proxies.length === 0) {
          console.log(
            `Priority 3 match found: ${conn.id} with plan but not configured and no proxies`
          );
          return {
            success: true,
            connection: { ...conn, isActive: true, notConfigured: true },
          };
        } else {
          console.log(
            `Skipping connection ${conn.id}: has ${proxiesResult.proxies?.length || 0} proxies`
          );
        }
      }
    }
    // Priority 4: Connections with app_data but no plan - add plan
    console.log("Checking Priority 4: Connections with app_data but no plan");
    for (const conn of connections) {
      if (conn.app_data && !conn.plan_info) {
        console.log(`Priority 4 match found: ${conn.id} - adding plan`);

        return { success: true, connection: { ...conn, isActive: false } };
      }
    }

    // Priority 5: Create new connection
    console.log("Priority 5: Creating new connection");

    // Create new connection
    const createResult = await iproxyService.createConnection({
      name: `Auto-provisioned ${new Date().toISOString()}`,
      description: "Automatically provisioned connection",
      city: "nyc",
      country: "us",
    });

    if (!createResult.success || !createResult.connection) {
      throw new Error(`Failed to create connection: ${createResult.error}`);
    }

    console.log(`New connection created: ${createResult.connection.id}`);

    return {
      success: true,
      connection: { ...createResult.connection, isActive: false },
    };
  } catch (error) {
    console.error("Error getting available connection:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
