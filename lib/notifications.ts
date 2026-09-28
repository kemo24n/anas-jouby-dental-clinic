import type { NotificationType } from '@prisma/client';
import { prisma } from './db';
import { env } from './env';

/**
 * طبقة تجريد للإشعارات. اليوم: تخزين في قاعدة البيانات.
 * لاحقاً: أضف مزوّداً (واتساب/SMS/بريد) بتطبيق الواجهة NotificationChannel وتسجيله في channels.
 */
export interface NotificationChannel {
  name: string;
  send(payload: OutgoingNotification): Promise<void>;
}

export type OutgoingNotification = {
  userId: string;
  type: NotificationType;
  title: string;
  body?: string;
  link?: string;
};

const databaseChannel: NotificationChannel = {
  name: 'database',
  async send(payload) {
    await prisma.notification.create({
      data: {
        userId: payload.userId,
        type: payload.type,
        title: payload.title,
        body: payload.body,
        link: payload.link,
      },
    });
  },
};

/** قناة صامتة تُسجّل فقط — نقطة الوصل مع مزوّد خارجي لاحقاً. */
const providerStub: NotificationChannel = {
  name: env.notificationsDriver,
  async send(payload) {
    console.info(`[notifications:${env.notificationsDriver}]`, payload.title);
  },
};

const channels: NotificationChannel[] =
  env.notificationsDriver === 'database' ? [databaseChannel] : [databaseChannel, providerStub];

export async function notify(payload: OutgoingNotification) {
  await Promise.all(channels.map((channel) => channel.send(payload).catch((e) => console.error(e))));
}

export async function notifyMany(payloads: OutgoingNotification[]) {
  await Promise.all(payloads.map(notify));
}

/** جدولة تذكيرات الموعد: قبل 24 ساعة وقبل ساعتين. */
export async function scheduleAppointmentReminders(appointmentId: string, startsAt: Date) {
  const offsets = [24 * 60, 2 * 60];
  const now = Date.now();
  const rows = offsets
    .map((minutes) => new Date(startsAt.getTime() - minutes * 60_000))
    .filter((sendAt) => sendAt.getTime() > now)
    .map((sendAt) => ({ appointmentId, sendAt, channel: env.notificationsDriver }));
  if (rows.length) await prisma.appointmentReminder.createMany({ data: rows });
}

export async function cancelAppointmentReminders(appointmentId: string) {
  await prisma.appointmentReminder.updateMany({
    where: { appointmentId, status: 'PENDING' },
    data: { status: 'CANCELLED' },
  });
}
