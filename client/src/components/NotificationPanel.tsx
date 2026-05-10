import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCheck, BellOff, Briefcase, ShieldCheck, Star, Wallet, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/context/AuthContext";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";

interface AppNotification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  jobId?: string | null;
  isRead: boolean;
  createdAt: string;
}

function notifIcon(type: string) {
  if (type === "new_job") return <Briefcase className="w-4 h-4 text-primary" />;
  if (type === "job_accepted") return <Briefcase className="w-4 h-4 text-green-500" />;
  if (type === "job_declined") return <Briefcase className="w-4 h-4 text-destructive" />;
  if (type.startsWith("verification")) return <ShieldCheck className="w-4 h-4 text-primary" />;
  if (type === "balance_paid" || type === "deposit_approved") return <Wallet className="w-4 h-4 text-green-500" />;
  if (type === "balance_due") return <Wallet className="w-4 h-4 text-yellow-500" />;
  if (type === "worker_on_way" || type === "fundi_arrived") return <ArrowRight className="w-4 h-4 text-primary" />;
  if (type === "job_completed") return <Star className="w-4 h-4 text-yellow-500" />;
  return <Bell className="w-4 h-4 text-muted-foreground" />;
}

function timeAgo(dateStr: string) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function showBrowserNotification(title: string, message: string) {
  if (!("Notification" in window)) return;
  if (Notification.permission === "granted") {
    new Notification(title, { body: message, icon: "/snapfix-logo.jpg" });
  }
}

export default function NotificationPanel() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [_, navigate] = useLocation();
  const knownIds = useRef<Set<string>>(new Set());

  const { data: notifications = [] } = useQuery<AppNotification[]>({
    queryKey: ["/api/notifications", user?.id],
    queryFn: () => fetch(`/api/notifications/${user?.id}`).then(r => r.json()),
    enabled: !!user?.id,
    refetchInterval: 20000,
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Request browser notification permission on mount
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  // Fire browser notifications for newly arrived items
  useEffect(() => {
    if (!notifications.length) return;
    notifications.forEach(n => {
      if (!knownIds.current.has(n.id)) {
        if (knownIds.current.size > 0 && !n.isRead) {
          showBrowserNotification(n.title, n.message);
        }
        knownIds.current.add(n.id);
      }
    });
  }, [notifications]);

  const markRead = useMutation({
    mutationFn: (id: string) => apiRequest("PATCH", `/api/notifications/${id}/read`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/notifications", user?.id] }),
  });

  const markAllRead = useMutation({
    mutationFn: () => apiRequest("PATCH", `/api/notifications/user/${user?.id}/read-all`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/notifications", user?.id] }),
  });

  const handleNotifClick = (n: AppNotification) => {
    if (!n.isRead) markRead.mutate(n.id);
    setOpen(false);
    if (n.jobId) {
      if (user?.role === "worker") navigate("/worker");
      else navigate("/requests");
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            data-testid="button-notifications"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
          </Button>
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 min-w-[8px] h-2 bg-destructive rounded-full" />
          )}
        </div>
      </SheetTrigger>

      <SheetContent side="right" className="w-full sm:w-[380px] flex flex-col p-0">
        <SheetHeader className="px-4 py-4 border-b flex-shrink-0">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <SheetTitle className="flex items-center gap-2">
              <Bell className="w-4 h-4" />
              Notifications
              {unreadCount > 0 && (
                <Badge variant="destructive" className="text-xs px-1.5 py-0">{unreadCount}</Badge>
              )}
            </SheetTitle>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => markAllRead.mutate()}
                disabled={markAllRead.isPending}
                className="text-xs gap-1"
                data-testid="button-mark-all-read"
              >
                <CheckCheck className="w-3 h-3" />
                Mark all read
              </Button>
            )}
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-6 py-16">
              <BellOff className="w-10 h-10 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No notifications yet</p>
              <p className="text-xs text-muted-foreground/70">We'll notify you about job updates, payments, and more.</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map(n => (
                <button
                  key={n.id}
                  className={`w-full text-left px-4 py-3 flex items-start gap-3 transition-colors hover-elevate ${n.isRead ? "opacity-70" : "bg-primary/5"}`}
                  onClick={() => handleNotifClick(n)}
                  data-testid={`notification-item-${n.id}`}
                >
                  <div className="mt-0.5 flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                    {notifIcon(n.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm leading-snug ${n.isRead ? "font-normal" : "font-semibold"}`}>{n.title}</p>
                      {!n.isRead && <span className="flex-shrink-0 w-2 h-2 rounded-full bg-primary mt-1" />}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{n.message}</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">{timeAgo(n.createdAt)}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
