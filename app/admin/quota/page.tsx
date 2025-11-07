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
  const [availableConnections, setAvailableConnections] = useState<number>(0);
  const [originalValue, setOriginalValue] = useState<number>(0);
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
          setOriginalValue(data.quota.available_connection_number);
        } else {
          setAvailableConnections(0);
          setOriginalValue(0);
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
        setOriginalValue(availableConnections);
        setSuccessMessage(
          quota ? "Quota updated successfully" : "Quota created successfully"
        );
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-[rgb(var(--neutral-400))]" />
      </div>
    );
  }

  const hasChanges = availableConnections !== originalValue;

  return (
    <div className="margin-12">
      {/* Header */}
      <div className="py-3 mb-5">
        <h1 className="tp-headline-s text-neutral-0">Quota Management</h1>
      </div>

      <div className="flex justify-center">
        <div className="w-full max-w-2xl space-y-4">
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
          <Card className="card custom-card">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Database className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-neutral-0 tp-headline-s">
                    Available Connection Quota
                  </CardTitle>
                  <CardDescription>
                    {quota
                      ? "Manage your connection quota"
                      : "Create your first connection quota"}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveQuota} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="availableConnections">
                    Available Connection Number
                  </Label>
                  <Input
                    id="availableConnections"
                    type="number"
                    min="0"
                    value={availableConnections}
                    onChange={(e) =>
                      setAvailableConnections(parseInt(e.target.value) || 0)
                    }
                    placeholder="Enter number of available connections"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    This value represents the total number of available
                    connections in the quota pool
                  </p>
                </div>
                {hasChanges && (
                  <div className="flex gap-8">
                    <Button type="submit" disabled={isSaving}  className="btn button-primary px-15 py-3 hover:bg-brand-300 hover:text-brand-600 mt-8">
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
                
                  </div>
                )}
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
