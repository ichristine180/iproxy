"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
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
  Trash2,
  AlertCircle,
  Ban,
  Plus,
  Search,
  Copy,
  CheckCircle,
} from "lucide-react";
import { Input } from "@/components/ui/input";

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
  const [newConnectionId, setNewConnectionId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteEntryId, setDeleteEntryId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchStoplist = async () => {
    try {
      const response = await fetch("/api/admin/stoplist");
      const data = await response.json();
      if (data.success) setStoplist(data.stoplist);
      else setError(data.error || "Failed to fetch stoplist");
    } catch {
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
    if (!newConnectionId.trim()) return;

    setIsAdding(true);
    setError("");
    setSuccessMessage("");

    try {
      const response = await fetch("/api/admin/stoplist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connectionId: newConnectionId.trim() }),
      });
      const data = await response.json();
      if (data.success) {
        await fetchStoplist();
        setNewConnectionId("");
        setSuccessMessage("Connection added to stoplist");
        setTimeout(() => setSuccessMessage(""), 3000);
      } else setError(data.error || "Failed to add to stoplist");
    } catch {
      setError("Failed to add to stoplist");
    } finally {
      setIsAdding(false);
    }
  };

  const handleCopyConnectionId = async (id: string) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(id);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
      } else {
        // Fallback for non-secure contexts
        const textArea = document.createElement("textarea");
        textArea.value = id;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
          // @ts-ignore - deprecated but necessary for fallback
          document.execCommand("copy");
          setCopiedId(id);
          setTimeout(() => setCopiedId(null), 2000);
        } finally {
          textArea.remove();
        }
      }
    } catch {
      setError("Failed to copy");
      setTimeout(() => setError(""), 3000);
    }
  };

  const openDeleteDialog = (id: string) => {
    setDeleteEntryId(id);
    setDeleteDialogOpen(true);
  };

  const handleRemoveFromStoplist = async () => {
    if (!deleteEntryId) return;
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/admin/stoplist?id=${deleteEntryId}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (data.success) {
        await fetchStoplist();
        setDeleteDialogOpen(false);
        setDeleteEntryId(null);
      } else setError(data.error || "Failed to remove");
    } catch {
      setError("Failed to remove");
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredStoplist = !searchQuery.trim()
    ? stoplist
    : stoplist.filter((e) =>
        e.connection_id.toLowerCase().includes(searchQuery.toLowerCase())
      );

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    });

  if (isLoading)
    return (
      <div className="flex justify-center items-center h-[80vh]">
        <Loader2 className="h-6 w-6 animate-spin text-brand-500" />
      </div>
    );

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 space-y-8">
      {/* Header */}
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-white">
          Connection Stoplist
        </h1>
        <p className="text-neutral-400">
          Manage and block suspicious or manual-sale connections.
        </p>
      </header>

      {/* Messages */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          <AlertCircle className="h-4 w-4" /> {error}
        </div>
      )}
      {successMessage && (
        <div className="flex items-center gap-2 rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-400">
          <CheckCircle className="h-4 w-4" /> {successMessage}
        </div>
      )}

      {/* Actions */}
      <div className="bg-neutral-900/60 border border-neutral-700 rounded-xl p-6 space-y-6">
        <div className="flex flex-col md:flex-row gap-4 md:items-end">
           <div className="space-y-2 md:w-80">
            <label className="text-sm text-neutral-400">
              Search Connections
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/3 -translate-y-1/2 h-4 w-4 text-neutral-500" />
              <Input
                placeholder="Search by connection ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-neutral-800 border-neutral-700"
              />
            </div>
          </div>
          <form onSubmit={handleAddToStoplist} className="space-y-2 flex-1">
            <label className="text-sm text-neutral-400">
              Add Connection to Stoplist
            </label>
            <div className="flex gap-2">
              <Input
                placeholder="Enter connection ID..."
                value={newConnectionId}
                onChange={(e) => setNewConnectionId(e.target.value)}
                className="bg-neutral-800 border-neutral-700"
              />
              <Button disabled={isAdding || !newConnectionId.trim()}>
                {isAdding ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Adding
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" /> Block
                  </>
                )}
              </Button>
            </div>
          </form>

         
        </div>
      </div>

      {/* Table / List */}
      <section className="bg-neutral-900/60 border border-neutral-700 rounded-xl">
        {filteredStoplist.length === 0 ? (
          <div className="p-12 text-center text-neutral-400 space-y-3">
            <Ban className="mx-auto h-8 w-8 text-neutral-500" />
            <p className="text-sm">
              {stoplist.length === 0
                ? "No blocked connections yet."
                : "No results match your search."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-neutral-800/80 text-left text-neutral-300">
                  <th className="px-6 py-3 font-medium">Connection ID</th>
                  <th className="px-6 py-3 font-medium">Added Date</th>
                  <th className="px-6 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStoplist.map((entry) => (
                  <tr
                    key={entry.id}
                    className="border-t border-neutral-800 hover:bg-neutral-800/50 transition-colors"
                  >
                    <td className="px-6 py-4 text-white font-mono flex items-center gap-2">
                      {entry.connection_id}
                      <button
                        onClick={() => handleCopyConnectionId(entry.connection_id)}
                        className="p-1 hover:bg-neutral-700 rounded transition"
                      >
                        {copiedId === entry.connection_id ? (
                          <CheckCircle className="h-4 w-4 text-green-400" />
                        ) : (
                          <Copy className="h-4 w-4 text-neutral-400" />
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-neutral-300">
                      {formatDate(entry.created_at)}
                    </td>
                    <td className="px-6 py-4">
                      <Button
                        variant="destructive"
                        size="sm"
                        className="bg-red-500/10 hover:bg-red-500/20 text-red-400"
                        onClick={() => openDeleteDialog(entry.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" /> Remove
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="!fixed !top-[50%] !left-[50%] !-translate-x-1/2 !-translate-y-1/2">
          <DialogHeader>
            <DialogTitle>Remove from Stoplist?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. The connection will be unblocked.
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
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Removing...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" /> Remove
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
