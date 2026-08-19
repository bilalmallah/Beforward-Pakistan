import Notification, { NotificationType } from './Notification.model';
import { emitToUser } from '../../realtime/socket';

interface NotifyInput {
  userId: string;
  type: NotificationType;
  title: string;
  body?: string;
  entityType?: string;
  entityId?: string;
}

/**
 * Creates a notification and pushes it in real time (spec section 42:
 * in-app notifications; section 26: notification:new event). Browser and
 * email notifications are listed in the spec as additional channels —
 * this build wires the in-app + real-time path, which is what the
 * frontend's notification bell renders; browser push and email would
 * need their own delivery integrations (service worker + push
 * subscription, and an email provider) layered on top of the same
 * notify() call, not a redesign of it.
 */
export async function notify(input: NotifyInput): Promise<Notification> {
  const notification = await Notification.create({
    userId: input.userId,
    type: input.type,
    title: input.title,
    body: input.body ?? null,
    entityType: input.entityType ?? null,
    entityId: input.entityId ?? null,
  });

  emitToUser(input.userId, 'notification:new', notification);

  return notification;
}
