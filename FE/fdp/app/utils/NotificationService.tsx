import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Request notification permissions
const requestNotificationPermission = async (): Promise<boolean> => {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
        console.log('Notification permissions denied.');
        return false;
    }

    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('face-scan-reminders', {
            name: 'Face Scan Reminders',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
        });
    }

    Notifications.setNotificationHandler({
        handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: false,
        }),
    });

    return true;
};

// Schedule a daily face scan reminder at 8:00 AM
const scheduleDailyFaceScanReminder = async () => {
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) {
        console.log('Cannot schedule notification: Permission denied');
        return;
    }

    // Cancel any existing scheduled notifications to avoid duplicates
    await Notifications.cancelAllScheduledNotificationsAsync();

    const now = new Date();
    let notificationTime = new Date(now);

    // Set the time to 8:00 AM
    notificationTime.setHours(8, 0, 0, 0);

    // If it's past 8:00 AM, schedule for tomorrow
    if (now.getHours() > 8 || (now.getHours() === 8 && now.getMinutes() > 0)) {
        notificationTime.setDate(now.getDate() + 1);
    }

    // Schedule the notification with a daily repeat
    await Notifications.scheduleNotificationAsync({
        content: {
            title: 'Face Scan Reminder',
            body: 'Don’t forget to scan your face for your daily skin health check!',
        },
        trigger: {
            hour: 8,
            minute: 0,
            repeats: true,
        },
    });

    console.log('Scheduled daily face scan reminder for 8:00 AM');
};

// Test notification (fires 10 seconds from now)
const testNotification = async () => {
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) {
        console.log('Cannot test notification: Permission denied');
        return;
    }

    const testTime = new Date(Date.now() + 10 * 1000);

    await Notifications.scheduleNotificationAsync({
        content: {
            title: 'Test Face Scan Reminder',
            body: 'This is a test notification to confirm setup!',
        },
        trigger: testTime,
    });

    console.log('Test notification scheduled for:', testTime.toString());
};

export { requestNotificationPermission, scheduleDailyFaceScanReminder, testNotification };