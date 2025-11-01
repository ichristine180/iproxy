"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Loader2,
  Plus,
  Trash2,
  Copy,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Connection {
  id: string;
  connection_id: string;
  client_email: string | null;
  proxy_access: string | null;
  is_occupied: boolean;
  expires_at: string | null;
  created_at: string;
  order_id: string | null;
}

export default function AdminPage() {
  const router = useRouter();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newConnectionId, setNewConnectionId] = useState("");
  const [copiedField, setCopiedField] = useState<string>("");
  const [error, setError] = useState<string>("");

  const fetchConnections = async () => {
    try {
      const response = await fetch("/api/admin/connections");
      const data = await response.json();

      if (data.success) {
        setConnections(data.connections);
      } else {
        setError(data.error || "Failed to fetch connections");
      }
    } catch (error) {
      console.error("Error fetching connections:", error);
      setError("Failed to fetch connections");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConnections();
  }, []);

  const handleAddConnection = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAdding(true);
    setError("");

    try {
      const response = await fetch("/api/admin/connections", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          connectionId: newConnectionId,
        }),
      });

      const data = await response.json();

      if (data.success) {
        await fetchConnections();
        setShowAddForm(false);
        setNewConnectionId("");
      } else {
        setError(data.error || "Failed to add connection");
      }
    } catch (error) {
      console.error("Error adding connection:", error);
      setError("Failed to add connection");
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveConnection = async (proxyId: string) => {
    if (!confirm("Are you sure you want to remove this connection?")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/connections?id=${proxyId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        await fetchConnections();
      } else {
        setError(data.error || "Failed to remove connection");
      }
    } catch (error) {
      console.error("Error removing connection:", error);
      setError("Failed to remove connection");
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(""), 2000);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const getTimeRemaining = (expiresAt: string) => {
    if (!expiresAt) return "N/A";
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry.getTime() - now.getTime();

    if (diff <= 0) return "Expired";

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days} day${days > 1 ? "s" : ""} remaining`;
    if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""} remaining`;
    return "Less than 1 hour";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Connection Management</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage proxy connections. Add connections by ID and assign them to users later.
          </p>
        </div>
        <Button onClick={() => setShowAddForm(!showAddForm)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Connection
        </Button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Add Connection Form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Connection</CardTitle>
            <CardDescription>
              Enter the connection ID to add it to the system. Proxy details will be added when assigned to a user.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddConnection} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="connectionId">Connection ID</Label>
                <Input
                  id="connectionId"
                  value={newConnectionId}
                  onChange={(e) => setNewConnectionId(e.target.value)}
                  placeholder="Enter iProxy connection ID"
                  required
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={isAdding}>
                  {isAdding ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    "Add Connection"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Connections Table */}
      <Card>
        <CardHeader>
          <CardTitle>Active Connections</CardTitle>
          <CardDescription>
            {connections.length} connection{connections.length !== 1 ? "s" : ""} total
          </CardDescription>
        </CardHeader>
        <CardContent>
          {connections.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">No connections</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Add a connection to get started
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4 font-medium text-sm">Client Email</th>
                    <th className="text-left p-4 font-medium text-sm">Connection ID</th>
                    <th className="text-left p-4 font-medium text-sm">Proxy Access</th>
                    <th className="text-left p-4 font-medium text-sm">Expires At</th>
                    <th className="text-left p-4 font-medium text-sm">Status</th>
                    <th className="text-right p-4 font-medium text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {connections.map((connection) => (
                    <tr key={connection.id} className="border-b hover:bg-muted/50">
                      <td className="p-4 text-sm">{connection.client_email || 'N/A'}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <code className="text-xs bg-muted px-2 py-1 rounded">
                            {connection.connection_id.substring(0, 8)}...
                          </code>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0"
                            onClick={() =>
                              copyToClipboard(
                                connection.connection_id,
                                `conn-${connection.id}`
                              )
                            }
                          >
                            {copiedField === `conn-${connection.id}` ? (
                              <CheckCircle className="h-3 w-3 text-green-600" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <code className="text-xs bg-muted px-2 py-1 rounded max-w-[200px] truncate">
                            {connection.proxy_access || 'Not configured'}
                          </code>
                          {connection.proxy_access && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0"
                              onClick={() =>
                                copyToClipboard(
                                  connection.proxy_access!,
                                  `proxy-${connection.id}`
                                )
                              }
                            >
                              {copiedField === `proxy-${connection.id}` ? (
                                <CheckCircle className="h-3 w-3 text-green-600" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </Button>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-sm">
                        <div>
                          <div>{formatDate(connection.expires_at || '')}</div>
                          <div className="text-xs text-muted-foreground">
                            {getTimeRemaining(connection.expires_at || '')}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                            connection.is_occupied
                              ? "bg-yellow-500/10 text-yellow-600 border border-yellow-500/20"
                              : "bg-green-500/10 text-green-600 border border-green-500/20"
                          }`}
                        >
                          {connection.is_occupied ? 'Occupied' : 'Available'}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleRemoveConnection(connection.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
