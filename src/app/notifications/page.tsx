import { Metadata } from "next";
import { NotificationDashboard } from "@/components/notifications/Dashboard";

export const metadata: Metadata = {
  title: "Notifications - SmartCampus Attend",
  description: "Notification and message center",
};

export default function NotificationsPage() {
  return <NotificationDashboard />;
}
