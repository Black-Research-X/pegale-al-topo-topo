import { useState, useEffect, useCallback } from 'react';
import type { GameMode } from '../types/game';
import {
  getNotificationPermission,
  isNotificationSupported,
  requestNotificationPermission,
  scheduleLastScoreNotification,
  restorePendingScoreNotification,
  subscribeToServiceWorkerNotifications,
  triggerAdminBroadcastNotification,
  syncWebPushSubscription,
  type NotificationPermissionState,
  type ScoreNotificationPayload,
} from '../utils/notifications';
import { subscribeToAnnouncements } from '../lib/firebase';
import { sound } from '../utils/audio';

export function useNotifications(userId?: string | null) {
  const [permission, setPermission] = useState<NotificationPermissionState>(() =>
    getNotificationPermission()
  );
  const [activeToast, setActiveToast] = useState<ScoreNotificationPayload | null>(null);
  const [scheduledInfo, setScheduledInfo] = useState<{ score: number; fireAt: number } | null>(null);

  const handleIncomingNotification = useCallback((payload: ScoreNotificationPayload) => {
    setActiveToast(payload);
    if (payload.kind !== 'ADMIN_BROADCAST') {
      setScheduledInfo(null);
    }
    sound.playComboUp(1);
  }, []);

  // Sync permission state on mount and focus
  useEffect(() => {
    const syncPermission = () => {
      const nextPerm = getNotificationPermission();
      setPermission(nextPerm);
      if (nextPerm === 'granted' && userId) {
        void syncWebPushSubscription();
      }
    };

    window.addEventListener('focus', syncPermission);
    document.addEventListener('visibilitychange', syncPermission);
    return () => {
      window.removeEventListener('focus', syncPermission);
      document.removeEventListener('visibilitychange', syncPermission);
    };
  }, [userId]);

  // Restore any pending 1-minute score notification & listen to SW messages
  useEffect(() => {
    const unsubscribe = subscribeToServiceWorkerNotifications(handleIncomingNotification);
    const pending = restorePendingScoreNotification(handleIncomingNotification);
    if (pending && typeof pending.score === 'number') {
      setScheduledInfo({ score: pending.score, fireAt: pending.fireAt });
    }
    return unsubscribe;
  }, [handleIncomingNotification]);

  // Sync Web Push VAPID subscription & listen to real-time admin broadcasts when signed in
  useEffect(() => {
    if (!userId) return;

    if (getNotificationPermission() === 'granted') {
      void syncWebPushSubscription();
    }

    const unsubscribe = subscribeToAnnouncements((announcement) => {
      void triggerAdminBroadcastNotification(announcement, handleIncomingNotification);
    });

    return () => unsubscribe();
  }, [userId, handleIncomingNotification]);

  const requestPermission = useCallback(async () => {
    const result = await requestNotificationPermission();
    setPermission(result);
    if (result === 'granted') {
      await syncWebPushSubscription();
    }
    return result;
  }, []);

  const scheduleMatchNotification = useCallback(
    (params: { score: number; mode: GameMode; playerName?: string | null }) => {
      const payload = scheduleLastScoreNotification(params, handleIncomingNotification);
      setScheduledInfo({
        score: payload.score ?? params.score,
        fireAt: payload.fireAt,
      });
    },
    [handleIncomingNotification]
  );

  const dismissToast = useCallback(() => {
    setActiveToast(null);
  }, []);

  return {
    isSupported: isNotificationSupported(),
    permission,
    requestPermission,
    scheduleMatchNotification,
    activeToast,
    dismissToast,
    scheduledInfo,
  };
}
