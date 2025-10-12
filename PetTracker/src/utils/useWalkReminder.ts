import { useEffect, useState } from "react";
import { Alert, Platform } from "react-native";
import { Pet } from "../types";
import { getPets } from "../services/storage";

/**
 * Hook pentru verificarea programelor de plimbare
 * Funcționează în Expo Go fără notificări native
 * Verifică în-app dacă e timpul pentru o plimbare
 */
export const useWalkReminder = () => {
  const [pendingReminders, setPendingReminders] = useState<
    Array<{ pet: Pet; time: string }>
  >([]);

  useEffect(() => {
    // Verifică la fiecare minut dacă e timpul pentru o plimbare
    const checkReminders = async () => {
      const pets = await getPets();
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, "0")}:${now
        .getMinutes()
        .toString()
        .padStart(2, "0")}`;
      const currentDay = now.getDay();

      const reminders: Array<{ pet: Pet; time: string }> = [];

      pets.forEach((pet) => {
        pet.walkSchedule.forEach((schedule) => {
          if (
            schedule.enabled &&
            schedule.time === currentTime &&
            schedule.daysOfWeek.includes(currentDay)
          ) {
            reminders.push({ pet, time: schedule.time });
          }
        });
      });

      if (reminders.length > 0) {
        setPendingReminders(reminders);
      }
    };

    // Verifică imediat
    checkReminders();

    // Apoi verifică la fiecare 30 secunde
    const interval = setInterval(checkReminders, 30000);

    return () => clearInterval(interval);
  }, []);

  return { pendingReminders, clearReminders: () => setPendingReminders([]) };
};

/**
 * Hook pentru afișarea badge-urilor cu numărul de plimbări programate
 */
export const useScheduledWalksCount = () => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const checkScheduledWalks = async () => {
      const pets = await getPets();
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, "0")}:${now
        .getMinutes()
        .toString()
        .padStart(2, "0")}`;
      const currentDay = now.getDay();

      let scheduledCount = 0;

      pets.forEach((pet) => {
        pet.walkSchedule.forEach((schedule) => {
          if (
            schedule.enabled &&
            schedule.daysOfWeek.includes(currentDay) &&
            schedule.time >= currentTime // Plimbări viitoare azi
          ) {
            scheduledCount++;
          }
        });
      });

      setCount(scheduledCount);
    };

    checkScheduledWalks();

    // Recheck la fiecare minut
    const interval = setInterval(checkScheduledWalks, 60000);

    return () => clearInterval(interval);
  }, []);

  return count;
};

/**
 * Afișează alertă în-app pentru reminder de plimbare
 * Funcționează în Expo Go
 */
export const showWalkAlert = (petName: string, time: string) => {
  Alert.alert(
    "🐾 Timpul pentru plimbare!",
    `Este ${time} - Nu uita să te plimbi cu ${petName}!`,
    [
      {
        text: "Amintește-mă mai târziu",
        style: "cancel",
      },
      {
        text: "OK, merg acum! 🚶",
        onPress: () => {
          // Aici poți adăuga logica pentru a marca plimbarea ca începută
          console.log(`Începe plimbarea cu ${petName}`);
        },
      },
    ]
  );
};
