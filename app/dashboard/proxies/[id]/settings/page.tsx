"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Loader2, ArrowLeft, Shield, RefreshCw, Save, CheckCircle } from "lucide-react";

interface Proxy {
  id: string;
  label: string;
  host: string;
  port_http: number | null;
  port_socks5: number | null;
  username: string | null;
  password_hash: string | null;
  rotation_interval_min: number | null;
  iproxy_connection_id: string | null;
  status: string;
}

export default function ProxySettingsPage() {
  const router = useRouter();
  const params = useParams();
  const proxyId = params.id as string;

  const [proxy, setProxy] = useState<Proxy | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isGrantingAccess, setIsGrantingAccess] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  // Auto-rotation settings
  const [autoRotationEnabled, setAutoRotationEnabled] = useState(false);
  const [rotationInterval, setRotationInterval] = useState(5);

  useEffect(() => {
    fetchProxy();
  }, [proxyId]);

  const fetchProxy = async () => {
    try {
      const response = await fetch(`/api/proxies`);
      const data = await response.json();

      if (data.success) {
        const foundProxy = data.proxies.find((p: Proxy) => p.id === proxyId);
        if (foundProxy) {
          setProxy(foundProxy);
          if (foundProxy.rotation_interval_min) {
            setRotationInterval(foundProxy.rotation_interval_min);
          }
        } else {
          router.push("/dashboard");
        }
      }
    } catch (error) {
      console.error("Failed to fetch proxy:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGrantAccess = async () => {
    setIsGrantingAccess(true);
    try {
      const response = await fetch(`/api/proxies/${proxyId}/grant-access`, {
        method: "POST",
      });

      const data = await response.json();

      if (data.success) {
        await fetchProxy(); // Refresh proxy data
        setSaveMessage("Proxy access granted successfully!");
        setTimeout(() => setSaveMessage(""), 3000);
      } else {
        const errorMsg = data.error || "Unknown error";
        const details = data.details ? `\n\n${data.details}` : "";
        alert(`Failed to grant access: ${errorMsg}${details}`);
      }
    } catch (error) {
      console.error("Error granting access:", error);
      alert("Failed to grant access");
    } finally {
      setIsGrantingAccess(false);
    }
  };

  const handleSaveAutoRotation = async () => {
    setIsSaving(true);
    setSaveMessage("");

    try {
      const response = await fetch(`/api/proxies/${proxyId}/settings`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          auto_rotation_enabled: autoRotationEnabled,
          rotation_interval_min: autoRotationEnabled ? rotationInterval : null,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSaveMessage("Settings saved successfully!");
        await fetchProxy();
        setTimeout(() => setSaveMessage(""), 3000);
      } else {
        alert(`Failed to save settings: ${data.error}`);
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      alert("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  const hasCredentials = proxy?.username && proxy?.password_hash;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!proxy) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Proxy not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/dashboard")}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold">Proxy Settings</h1>
          <p className="text-muted-foreground mt-2">{proxy.label}</p>
        </div>

        {/* Success Message */}
        {saveMessage && (
          <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <p className="text-green-700 dark:text-green-600">{saveMessage}</p>
          </div>
        )}

        <div className="space-y-6">
          {/* Connection & Access Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                <CardTitle>Connection & Access</CardTitle>
              </div>
              <CardDescription>
                Manage proxy access and credentials
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <p className="font-medium">Proxy Access</p>
                  <p className="text-sm text-muted-foreground">
                    {hasCredentials
                      ? "Proxy credentials have been configured"
                      : "Grant access to configure proxy credentials (HTTP/SOCKS5)"}
                  </p>
                </div>
                {!hasCredentials && (
                  <Button
                    onClick={handleGrantAccess}
                    disabled={isGrantingAccess || !proxy.iproxy_connection_id}
                  >
                    {isGrantingAccess ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Granting...
                      </>
                    ) : (
                      <>
                        <Shield className="w-4 h-4 mr-2" />
                        Grant Access
                      </>
                    )}
                  </Button>
                )}
                {hasCredentials && (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="w-5 h-5" />
                    <span className="text-sm font-medium">Access Granted</span>
                  </div>
                )}
              </div>

              {!proxy.iproxy_connection_id && (
                <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                  <p className="text-sm text-yellow-700 dark:text-yellow-600">
                    No connection found. This proxy needs to be provisioned first.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Auto-Rotation Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5 text-primary" />
                <CardTitle>Auto IP Rotation</CardTitle>
              </div>
              <CardDescription>
                Configure automatic IP rotation for your proxy
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="auto-rotation">Enable Auto-Rotation</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically change IP address at regular intervals
                  </p>
                </div>
                <Switch
                  id="auto-rotation"
                  checked={autoRotationEnabled}
                  onCheckedChange={setAutoRotationEnabled}
                  disabled={!proxy.iproxy_connection_id}
                />
              </div>

              {autoRotationEnabled && (
                <div className="space-y-2 pl-0">
                  <Label htmlFor="rotation-interval">Rotation Interval (minutes)</Label>
                  <Input
                    id="rotation-interval"
                    type="number"
                    min="1"
                    max="1440"
                    value={rotationInterval}
                    onChange={(e) => setRotationInterval(parseInt(e.target.value) || 1)}
                    className="max-w-xs"
                  />
                  <p className="text-sm text-muted-foreground">
                    IP will rotate every {rotationInterval} minute{rotationInterval !== 1 ? "s" : ""}
                  </p>
                </div>
              )}

              {!proxy.iproxy_connection_id && (
                <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                  <p className="text-sm text-yellow-700 dark:text-yellow-600">
                    Auto-rotation requires an active connection
                  </p>
                </div>
              )}

              <div className="flex justify-end pt-4 border-t">
                <Button
                  onClick={handleSaveAutoRotation}
                  disabled={isSaving || !proxy.iproxy_connection_id}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Future Settings Sections */}
          <Card className="border-dashed">
            <CardHeader>
              <CardTitle className="text-muted-foreground">More Settings Coming Soon</CardTitle>
              <CardDescription>
                Additional configuration options will be available here
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </div>
  );
}
