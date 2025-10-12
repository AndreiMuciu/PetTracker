import { Platform } from "react-native";
import Constants from "expo-constants";
import { Pet, WalkSchedule } from "../types";

// Verifică dacă rulează în Expo Go
const isExpoGo = Constants.appOwnership === "expo";

// Import condiționat pentru a evita warning-urile în Expo Go
let Notifications: any = null;

if (!isExpoGo) {
  // Doar în production build importăm expo-notifications
  Notifications = require("expo-notifications");

  // Configure notification handler doar dacă NU e în Expo Go
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export const requestNotificationPermissions = async (): Promise<boolean> => {
  // În Expo Go, skip permission request pentru a evita warning-uri
  if (isExpoGo) {
    console.log("📱 Expo Go detectat - Notificări native dezactivate");
    console.log("✅ WalkReminderModal va funcționa în schimb");
    return false;
  }

  try {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.log("Notification permissions not granted");
      return false;
    }

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("walk-reminders", {
        name: "Walk Reminders",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F7C",
      });
    }

    return true;
  } catch (error) {
    console.error("Error requesting notification permissions:", error);
    return false;
  }
};

export const scheduleWalkNotification = async (
  pet: Pet,
  schedule: WalkSchedule
): Promise<string | null> => {
  // În Expo Go, skip notification scheduling
  if (isExpoGo) {
    // Returnăm un ID fake pentru a nu afecta flow-ul app-ului
    return `expo-go-${pet.id}-${schedule.id}`;
  }

  try {
    const [hours, minutes] = schedule.time.split(":").map(Number);

    const trigger: any = {
      type: (Notifications as any).SchedulableTriggerInputTypes.CALENDAR,
      hour: hours,
      minute: minutes,
      repeats: true,
    };

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: `🐾 Timpul pentru plimbare!`,
        body: `Nu uita să te plimbi cu ${pet.name}!`,
        data: { petId: pet.id, scheduleId: schedule.id },
        sound: true,
      },
      trigger,
    });

    console.log(
      `✅ Notificare programată pentru ${pet.name} la ${schedule.time}`
    );
    return notificationId;
  } catch (error) {
    // Fallback pentru erori
    return `expo-go-${pet.id}-${schedule.id}`;
  }
};

export const cancelNotification = async (
  notificationId: string
): Promise<void> => {
  if (isExpoGo || notificationId.startsWith("expo-go-")) {
    // Skip în Expo Go
    return;
  }

  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch (error) {
    console.error("Error canceling notification:", error);
  }
};

export const cancelAllNotifications = async (): Promise<void> => {
  if (isExpoGo) {
    return;
  }

  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    console.error("Error canceling all notifications:", error);
  }
};

export const getAllScheduledNotifications = async () => {
  if (isExpoGo) {
    return [];
  }

  try {
    return await Notifications.getAllScheduledNotificationsAsync();
  } catch (error) {
    console.error("Error getting scheduled notifications:", error);
    return [];
  }
};
