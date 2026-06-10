export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatarColor: string;
  text: string;
  time: string;
  isIncoming: boolean;
}

export interface ConversationData {
  participants: { id: string; name: string; avatarColor: string; online: boolean }[];
}

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  type: "attendance" | "meal" | "security" | "schedule" | "system" | "message";
  time: string;
  read: boolean;
  senderName: string;
  senderAvatarColor: string;
  online: boolean;
  conversationId?: string;
  conversation?: ConversationData;
  chatHistory?: ChatMessage[];
}

export const notifications: NotificationItem[] = [
  {
    id: "notif-1",
    title: "Maria Santos",
    body: "Hey! Can you share the updated attendance list for Week 3?",
    type: "message",
    time: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
    read: false,
    senderName: "Maria Santos",
    senderAvatarColor: "#6366f1",
    online: true,
    conversationId: "conv-1",
    conversation: {
      participants: [
        { id: "user-me", name: "You", avatarColor: "#f59e0b", online: true },
        { id: "maria", name: "Maria Santos", avatarColor: "#6366f1", online: true },
      ],
    },
    chatHistory: [
      {
        id: "msg-1",
        senderId: "maria",
        senderName: "Maria Santos",
        senderAvatarColor: "#6366f1",
        text: "Hi! Quick question about the Week 3 session.",
        time: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
        isIncoming: true,
      },
      {
        id: "msg-2",
        senderId: "user-me",
        senderName: "You",
        senderAvatarColor: "#f59e0b",
        text: "Sure, what do you need?",
        time: new Date(Date.now() - 1000 * 60 * 9).toISOString(),
        isIncoming: false,
      },
      {
        id: "msg-3",
        senderId: "maria",
        senderName: "Maria Santos",
        senderAvatarColor: "#6366f1",
        text: "Can you share the updated attendance list for Week 3?",
        time: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
        isIncoming: true,
      },
    ],
  },
  {
    id: "notif-2",
    title: "James Wilson",
    body: "The schedule for the next session has been updated. Check it out!",
    type: "message",
    time: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    read: false,
    senderName: "James Wilson",
    senderAvatarColor: "#10b981",
    online: true,
    conversationId: "conv-2",
    conversation: {
      participants: [
        { id: "user-me", name: "You", avatarColor: "#f59e0b", online: true },
        { id: "james", name: "James Wilson", avatarColor: "#10b981", online: true },
      ],
    },
    chatHistory: [
      {
        id: "msg-4",
        senderId: "james",
        senderName: "James Wilson",
        senderAvatarColor: "#10b981",
        text: "Hey, the schedule for the next session has been updated.",
        time: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
        isIncoming: true,
      },
      {
        id: "msg-5",
        senderId: "user-me",
        senderName: "You",
        senderAvatarColor: "#f59e0b",
        text: "Got it, I'll take a look.",
        time: new Date(Date.now() - 1000 * 60 * 44).toISOString(),
        isIncoming: false,
      },
      {
        id: "msg-6",
        senderId: "james",
        senderName: "James Wilson",
        senderAvatarColor: "#10b981",
        text: "The schedule for the next session has been updated. Check it out!",
        time: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        isIncoming: true,
      },
    ],
  },
  {
    id: "notif-3",
    title: "System Alert",
    body: "Scheduled maintenance window tonight at 11:00 PM UTC.",
    type: "system",
    time: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    read: true,
    senderName: "System",
    senderAvatarColor: "#64748b",
    online: false,
  },
  {
    id: "notif-4",
    title: "New Menu Published",
    body: "Kitchen has published the lunch menu for tomorrow.",
    type: "meal",
    time: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    read: true,
    senderName: "Kitchen Manager",
    senderAvatarColor: "#f97316",
    online: false,
  },
  {
    id: "notif-5",
    title: "Attendance Low",
    body: "Attendance for CS101 is below 60% for the past 3 sessions.",
    type: "attendance",
    time: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    read: false,
    senderName: "Admin",
    senderAvatarColor: "#ef4444",
    online: false,
  },
];

export function getNotificationById(id: string): NotificationItem | undefined {
  return notifications.find((n) => n.id === id);
}

export function getUnreadCount(): number {
  return notifications.filter((n) => !n.read).length;
}
