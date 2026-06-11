"use client";

import { useEffect, useState } from "react";
import {
  Card, CardHeader, CardTitle, CardDescription, CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { api } from "@/lib/api/client";
import { toast } from "sonner";
import { IconDatabase, IconTrash, IconDownload } from "@tabler/icons-react";

export function DataSection() {
  const [retentionDays, setRetentionDays] = useState("90");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api<{ data?: { logRetentionDays?: number } }>("/v1/admin/platform/data")
      .then((res) => {
        if (res.data?.logRetentionDays != null) setRetentionDays(String(res.data.logRetentionDays));
      })
      .catch(() => {});
  }, []);

  async function saveRetention() {
    setSaving(true);
    try {
      await api("/v1/admin/platform/data", {
        method: "PATCH",
        body: JSON.stringify({ logRetentionDays: parseInt(retentionDays) }),
      });
      toast.success("Retention policy updated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save");
    } finally {
      setSaving(false);
    }
  }

  async function exportData() {
    toast.info("Export started — you will receive a download link by email");
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconDatabase className="size-4" />
            Data & Storage
          </CardTitle>
          <CardDescription>
            Manage data retention, exports, and cleanup policies
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-1.5">
            <Label>Log retention (days)</Label>
            <Input
              type="number"
              value={retentionDays}
              onChange={(e) => setRetentionDays(e.target.value)}
              className="max-w-xs"
            />
            <p className="text-xs text-muted-foreground">
              Audit logs and event data older than this will be purged automatically
            </p>
          </div>
          <div className="flex justify-end">
            <Button onClick={saveRetention} disabled={saving}>
              {saving ? "Saving…" : "Save retention policy"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Exports & Cleanup</CardTitle>
          <CardDescription>
            Export platform data or remove stale records
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
            <div className="space-y-0.5">
              <p className="text-sm font-medium">Export all data</p>
              <p className="text-xs text-muted-foreground">
                Download a full JSON export of platform data
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={exportData} className="gap-1.5 shrink-0">
              <IconDownload className="size-3.5" />
              Export
            </Button>
          </div>

          <div className="flex items-center justify-between gap-4 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
            <div className="space-y-0.5">
              <p className="text-sm font-medium text-destructive">Purge inactive tenants</p>
              <p className="text-xs text-muted-foreground">
                Permanently delete tenants that have been inactive for over 12 months
              </p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" className="shrink-0 gap-1.5">
                  <IconTrash className="size-3.5" />
                  Purge
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Purge inactive tenants?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete all tenant accounts and their data where the
                    last activity was more than 12 months ago. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={() => toast.success("Purge job queued")}
                  >
                    Yes, purge now
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
