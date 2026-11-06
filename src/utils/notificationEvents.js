export const NOTIFICATIONS_CHANGED = "task-management:notifications-changed";

export function notifyNotificationsChanged() {
  window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED));
}
