import { Platform } from "react-native";
import Constants from "expo-constants";
import { Pet, WalkSchedule, FeedingSchedule } from "../types";

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
    const notificationIds: string[] = [];

    // Programăm o notificare separată pentru fiecare zi a săptămânii selectată
    for (const dayOfWeek of schedule.daysOfWeek) {
      // Convertim de la JavaScript (0=Duminică) la expo-notifications (1=Duminică pe iOS, 1=Luni pe Android)
      // expo-notifications folosește 1-7 unde 1=Duminică
      const weekday = dayOfWeek === 0 ? 1 : dayOfWeek + 1;

      const trigger: any = {
        type: (Notifications as any).SchedulableTriggerInputTypes.WEEKLY,
        weekday: weekday,
        hour: hours,
        minute: minutes,
      };

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: `🐾 Timpul pentru plimbare!`,
          body: `Nu uita să te plimbi cu ${pet.name}!`,
          data: { petId: pet.id, scheduleId: schedule.id },
          sound: true,
          priority: "high",
          ...(Platform.OS === "android" && { channelId: "walk-reminders" }),
        },
        trigger,
      });

      notificationIds.push(notificationId);
      console.log(
        `✅ Notificare programată pentru ${pet.name} - zi ${dayOfWeek} la ${schedule.time}`
      );
    }

    // Returnăm ID-urile separate cu virgulă pentru a le putea anula mai târziu
    return notificationIds.join(",");
  } catch (error) {
    console.error("Eroare la programarea notificării:", error);
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
    // Suport pentru mai multe ID-uri separate cu virgulă
    const ids = notificationId.split(",");
    for (const id of ids) {
      if (id.trim()) {
        await Notifications.cancelScheduledNotificationAsync(id.trim());
      }
    }
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

// Trimite o notificare imediată
export const sendImmediateNotification = async (
  title: string,
  body: string
): Promise<void> => {
  if (isExpoGo) {
    console.log(`📱 [Expo Go] Notificare: ${title} - ${body}`);
    return;
  }

  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
        priority: "high",
        ...(Platform.OS === "android" && { channelId: "walk-reminders" }),
      },
      trigger: null, // Imediat
    });
  } catch (error) {
    console.error("Error sending immediate notification:", error);
  }
};

// ============ Feeding Notifications ============

export const scheduleFeedingNotification = async (
  pet: Pet,
  schedule: FeedingSchedule
): Promise<string | null> => {
  // În Expo Go, skip notification scheduling
  if (isExpoGo) {
    return `expo-go-feeding-${pet.id}-${schedule.id}`;
  }

  try {
    const [hours, minutes] = schedule.time.split(":").map(Number);
    const notificationIds: string[] = [];

    // Creează canal pentru hrănire pe Android
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("feeding-reminders", {
        name: "Feeding Reminders",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF9500",
      });
    }

    for (const dayOfWeek of schedule.daysOfWeek) {
      const weekday = dayOfWeek === 0 ? 1 : dayOfWeek + 1;

      const trigger: any = {
        type: (Notifications as any).SchedulableTriggerInputTypes.WEEKLY,
        weekday: weekday,
        hour: hours,
        minute: minutes,
      };

      const portionText = schedule.portionSize
        ? ` (${schedule.portionSize}g)`
        : "";
      const foodText = schedule.foodType ? ` - ${schedule.foodType}` : "";

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: `🍽️ Ora mesei pentru ${pet.name}!`,
          body: `Este timpul să hrănești pe ${pet.name}${portionText}${foodText}`,
          data: { petId: pet.id, scheduleId: schedule.id, type: "feeding" },
          sound: true,
          priority: "high",
          ...(Platform.OS === "android" && { channelId: "feeding-reminders" }),
        },
        trigger,
      });

      notificationIds.push(notificationId);
      console.log(
        `✅ Notificare hrănire programată pentru ${pet.name} - zi ${dayOfWeek} la ${schedule.time}`
      );
    }

    return notificationIds.join(",");
  } catch (error) {
    console.error("Eroare la programarea notificării de hrănire:", error);
    return `expo-go-feeding-${pet.id}-${schedule.id}`;
  }
};

// Notificare stoc redus de mâncare
export const sendLowStockNotification = async (
  petName: string,
  foodName: string,
  remainingAmount: number,
  unit: string
): Promise<void> => {
  const title = `⚠️ Stoc redus de mâncare!`;
  const body = `Mai ai doar ${remainingAmount}${unit} de "${foodName}" pentru ${petName}. E timpul să cumperi mai mult!`;

  await sendImmediateNotification(title, body);
};

// Notificare mâncare terminată
export const sendOutOfStockNotification = async (
  petName: string,
  foodName: string
): Promise<void> => {
  const title = `🚨 Mâncarea s-a terminat!`;
  const body = `"${foodName}" pentru ${petName} s-a terminat. Trebuie să cumperi mâncare!`;

  await sendImmediateNotification(title, body);
};

// ============ Medical Notifications ============

// Programează notificări pentru următoarea doză de vaccin
// - O notificare cu o zi înainte
// - O notificare cu o oră înainte
export const scheduleVaccineNotifications = async (
  petName: string,
  vaccineName: string,
  nextDueDate: Date
): Promise<string | null> => {
  // În Expo Go, skip notification scheduling
  if (isExpoGo) {
    return `expo-go-vaccine-${Date.now()}`;
  }

  try {
    const notificationIds: string[] = [];

    // Creează canal pentru notificări medicale pe Android
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("medical-reminders", {
        name: "Medical Reminders",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF0000",
      });
    }

    // Notificare cu o zi înainte (24 ore)
    const oneDayBefore = new Date(nextDueDate.getTime() - 24 * 60 * 60 * 1000);
    if (oneDayBefore > new Date()) {
      const notificationId1 = await Notifications.scheduleNotificationAsync({
        content: {
          title: `💉 Vaccin programat mâine!`,
          body: `Mâine trebuie să administrezi "${vaccineName}" pentru ${petName}. Nu uita!`,
          data: { type: "vaccine", petName, vaccineName },
          sound: true,
          priority: "high",
          ...(Platform.OS === "android" && { channelId: "medical-reminders" }),
        },
        trigger: oneDayBefore,
      });
      notificationIds.push(notificationId1);
      console.log(
        `✅ Notificare vaccin programată cu o zi înainte pentru ${petName}`
      );
    }

    // Notificare cu o oră înainte
    const oneHourBefore = new Date(nextDueDate.getTime() - 60 * 60 * 1000);
    if (oneHourBefore > new Date()) {
      const notificationId2 = await Notifications.scheduleNotificationAsync({
        content: {
          title: `💉 Vaccin în 1 oră!`,
          body: `Peste o oră trebuie să administrezi "${vaccineName}" pentru ${petName}!`,
          data: { type: "vaccine", petName, vaccineName },
          sound: true,
          priority: "high",
          ...(Platform.OS === "android" && { channelId: "medical-reminders" }),
        },
        trigger: oneHourBefore,
      });
      notificationIds.push(notificationId2);
      console.log(
        `✅ Notificare vaccin programată cu o oră înainte pentru ${petName}`
      );
    }

    return notificationIds.length > 0 ? notificationIds.join(",") : null;
  } catch (error) {
    console.error("Eroare la programarea notificărilor pentru vaccin:", error);
    return `expo-go-vaccine-${Date.now()}`;
  }
};
