"use client";

import { useEffect, useState } from "react";
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
  Save,
  AlertCircle,
  Database,
  Edit,
  CheckCircle,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Quota {
  id: string;
  available_connection_number: number;
  created_at: string;
  updated_at: string;
}

export default function QuotaManagementPage() {
  const [quota, setQuota] = useState<Quota | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [availableConnections, setAvailableConnections] = useState<number>(0);
  const [error, setError] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");

  const fetchQuota = async () => {
    try {
      const response = await fetch("/api/admin/quota");
      const data = await response.json();

      if (data.success) {
        setQuota(data.quota);
        if (data.quota) {
          setAvailableConnections(data.quota.available_connection_number);
          setIsEditing(false);
        } else {
          setIsEditing(true);
        }
      } else {
        setError(data.error || "Failed to fetch quota");
      }
    } catch (error) {
      console.error("Error fetching quota:", error);
      setError("Failed to fetch quota");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQuota();
  }, []);

  const handleSaveQuota = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError("");
    setSuccessMessage("");

    try {
      const response = await fetch("/api/admin/quota", {
        method: quota ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          availableConnectionNumber: availableConnections,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setQuota(data.quota);
        setIsEditing(false);
        setSuccessMessage(quota ? "Quota updated successfully" : "Quota created successfully");
        setTimeout(() => setSuccessMessage(""), 3000);
      } else {
        setError(data.error || "Failed to save quota");
      }
    } catch (error) {
      console.error("Error saving quota:", error);
      setError("Failed to save quota");
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-[rgb(var(--neutral-400))]" />
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Quota Management</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage available connection quota (single row)
          </p>
        </div>
        {quota && !isEditing && (
          <Button onClick={() => setIsEditing(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Quota
          </Button>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Success Message */}
      {successMessage && (
        <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
          <p className="text-sm text-green-600">{successMessage}</p>
        </div>
      )}

      {/* Quota Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Database className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Available Connection Quota</CardTitle>
              <CardDescription>
                {quota ? "Current quota configuration" : "No quota configured - create one below"}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <form onSubmit={handleSaveQuota} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="availableConnections">Available Connection Number</Label>
                <Input
                  id="availableConnections"
                  type="number"
                  min="0"
                  value={availableConnections}
                  onChange={(e) => setAvailableConnections(parseInt(e.target.value) || 0)}
                  placeholder="Enter number of available connections"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  This value represents the total number of available connections in the quota pool
                </p>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      {quota ? "Update Quota" : "Create Quota"}
                    </>
                  )}
                </Button>
                {quota && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsEditing(false);
                      setAvailableConnections(quota.available_connection_number);
                      setError("");
                    }}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </form>
          ) : quota ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Available Connections</p>
                  <p className="text-3xl font-bold text-primary">
                    {quota.available_connection_number}
                  </p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Quota ID</p>
                  <code className="text-xs bg-background px-2 py-1 rounded">
                    {quota.id}
                  </code>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Created At</p>
                  <p className="text-sm font-medium">{formatDate(quota.created_at)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Last Updated</p>
                  <p className="text-sm font-medium">{formatDate(quota.updated_at)}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Database className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">No quota configured</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Create a quota to start managing available connections
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
