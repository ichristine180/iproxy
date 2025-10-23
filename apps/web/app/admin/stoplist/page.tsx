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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Loader2,
  Plus,
  Trash2,
  AlertCircle,
  Ban,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface StoplistEntry {
  id: string;
  connection_id: string;
  created_at: string;
  updated_at: string;
}

export default function StoplistManagementPage() {
  const [stoplist, setStoplist] = useState<StoplistEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newConnectionId, setNewConnectionId] = useState("");
  const [error, setError] = useState<string>("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteEntryId, setDeleteEntryId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchStoplist = async () => {
    try {
      const response = await fetch("/api/admin/stoplist");
      const data = await response.json();

      if (data.success) {
        setStoplist(data.stoplist);
      } else {
        setError(data.error || "Failed to fetch stoplist");
      }
    } catch (error) {
      console.error("Error fetching stoplist:", error);
      setError("Failed to fetch stoplist");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStoplist();
  }, []);

  const handleAddToStoplist = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAdding(true);
    setError("");

    try {
      const response = await fetch("/api/admin/stoplist", {
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
        await fetchStoplist();
        setShowAddForm(false);
        setNewConnectionId("");
      } else {
        setError(data.error || "Failed to add to stoplist");
      }
    } catch (error) {
      console.error("Error adding to stoplist:", error);
      setError("Failed to add to stoplist");
    } finally {
      setIsAdding(false);
    }
  };

  const openDeleteDialog = (id: string) => {
    setDeleteEntryId(id);
    setDeleteDialogOpen(true);
  };

  const handleRemoveFromStoplist = async () => {
    if (!deleteEntryId) return;

    setIsDeleting(true);
    setError("");

    try {
      const response = await fetch(`/api/admin/stoplist?id=${deleteEntryId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        await fetchStoplist();
        setDeleteDialogOpen(false);
        setDeleteEntryId(null);
      } else {
        setError(data.error || "Failed to remove from stoplist");
      }
    } catch (error) {
      console.error("Error removing from stoplist:", error);
      setError("Failed to remove from stoplist");
    } finally {
      setIsDeleting(false);
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
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Connection Stoplist</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Block connections by adding them to the stoplist
          </p>
        </div>
        <Button onClick={() => setShowAddForm(!showAddForm)}>
          <Plus className="h-4 w-4 mr-2" />
          Add to Stoplist
        </Button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Add to Stoplist Form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add Connection to Stoplist</CardTitle>
            <CardDescription>
              Enter the connection ID to block it from being used
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddToStoplist} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="connectionId">Connection ID</Label>
                <Input
                  id="connectionId"
                  value={newConnectionId}
                  onChange={(e) => setNewConnectionId(e.target.value)}
                  placeholder="Enter connection ID"
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
                    "Add to Stoplist"
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

      {/* Stoplist Table */}
      <Card>
        <CardHeader>
          <CardTitle>Blocked Connections</CardTitle>
          <CardDescription>
            {stoplist.length} connection{stoplist.length !== 1 ? "s" : ""} in stoplist
          </CardDescription>
        </CardHeader>
        <CardContent>
          {stoplist.length === 0 ? (
            <div className="text-center py-12">
              <Ban className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">No blocked connections</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Add a connection to the stoplist to block it
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4 font-medium text-sm">Connection ID</th>
                    <th className="text-left p-4 font-medium text-sm">Added At</th>
                    <th className="text-left p-4 font-medium text-sm">Last Updated</th>
                    <th className="text-right p-4 font-medium text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {stoplist.map((entry) => (
                    <tr key={entry.id} className="border-b hover:bg-muted/50">
                      <td className="p-1">
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {entry.connection_id}
                        </code>
                      </td>
                      <td className="p-1 text-sm">{formatDate(entry.created_at)}</td>
                      <td className="p-1 text-sm">{formatDate(entry.updated_at)}</td>
                      <td className="p-1 text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => openDeleteDialog(entry.id)}
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove this connection from the stoplist? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRemoveFromStoplist}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
