import { useState, useEffect, useCallback } from 'react';
import type { GameMode } from '../types/game';
import {
  getNotificationPermission,
  isNotificationSupported,
  requestNotificationPermission,
  scheduleLastScoreNotification,
  restorePendingScoreNotification,
  subscribeToServiceWorkerNotifications,
  type NotificationPermissionState,
  type ScoreNotificationPayload,
} from '../utils/notifications';
import { sound } from '../utils/audio';

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermissionState>(() =>
    getNotificationPermission()
  );
  const [activeToast, setActiveToast] = useState<ScoreNotificationPayload | null>(null);
  const [scheduledInfo, setScheduledInfo] = useState<{ score: number; fireAt: number } | null>(null);

  const handleIncomingNotification = useCallback((payload: ScoreNotificationPayload) => {
    setActiveToast(payload);
    setScheduledInfo(null);
    sound.playComboUp(1);
  }, []);

  // Sync permission state on mount and focus
  useEffect(() => {
    const syncPermission = () => {
      setPermission(getNotificationPermission());
    };

    window.addEventListener('focus', syncPermission);
    document.addEventListener('visibilitychange', syncPermission);
    return () => {
      window.removeEventListener('focus', syncPermission);
      document.removeEventListener('visibilitychange', syncPermission);
    };
  }, []);

  // Restore any pending 1-minute score notification & listen to SW messages
  useEffect(() => {
    const unsubscribe = subscribeToServiceWorkerNotifications(handleIncomingNotification);
    const pending = restorePendingScoreNotification(handleIncomingNotification);
    if (pending) {
      setScheduledInfo({ score: pending.score, fireAt: pending.fireAt });
    }
    return unsubscribe;
  }, [handleIncomingNotification]);

  const requestPermission = useCallback(async () => {
    const result = await requestNotificationPermission();
    setPermission(result);
    return result;
  }, []);

  const scheduleMatchNotification = useCallback(
    (params: { score: number; mode: GameMode; playerName?: string | null }) => {
      const payload = scheduleLastScoreNotification(params, handleIncomingNotification);
      setScheduledInfo({ score: payload.score, fireAt: payload.fireAt });
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
