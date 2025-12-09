import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, AlertCircle, Send, Calendar } from "lucide-react";

type NotificationStatus = "pending" | "sending" | "delivered" | "error" | "scheduled";

interface StatusBadgeProps {
  status: NotificationStatus | string;
  className?: string;
}

const statusConfig: Record<string, { label: string; className: string; icon: typeof CheckCircle }> = {
  delivered: {
    label: "Доставлено",
    className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-800",
    icon: CheckCircle,
  },
  sending: {
    label: "Отправляется",
    className: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 border-orange-200 dark:border-orange-800",
    icon: Send,
  },
  pending: {
    label: "Ожидает",
    className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800",
    icon: Clock,
  },
  error: {
    label: "Ошибка",
    className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800",
    icon: AlertCircle,
  },
  scheduled: {
    label: "Запланировано",
    className: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700",
    icon: Calendar,
  },
};

export function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.pending;
  const Icon = config.icon;

  return (
    <Badge
      variant="outline"
      className={`gap-1.5 font-medium ${config.className} ${className}`}
      data-testid={`status-badge-${status}`}
    >
      <Icon className="w-3 h-3" />
      {config.label}
    </Badge>
  );
}

export function StatusDot({ status }: { status: NotificationStatus | string }) {
  const colorMap: Record<string, string> = {
    delivered: "bg-green-500",
    sending: "bg-orange-500",
    pending: "bg-blue-500",
    error: "bg-red-500",
    scheduled: "bg-gray-400",
  };

  return (
    <div
      className={`w-2.5 h-2.5 rounded-full ${colorMap[status] || colorMap.pending}`}
      data-testid={`status-dot-${status}`}
    />
  );
}
