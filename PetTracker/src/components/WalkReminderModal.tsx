import React, { useEffect } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useWalkReminder, showWalkAlert } from "../utils/useWalkReminder";
import { useWalk } from "../context/WalkContext";

/**
 * Componentă care verifică și afișează reminder-uri de plimbare
 * Funcționează în Expo Go fără notificări native
 */
export default function WalkReminderModal() {
  const { pendingReminders, clearReminders } = useWalkReminder();
  const { startWalk } = useWalk();
  const [visible, setVisible] = React.useState(false);
  const scaleAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (pendingReminders.length > 0) {
      setVisible(true);

      // Animație de apariție
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }).start();

      // Opțional: Vibrație
      // Vibration.vibrate([0, 200, 100, 200]);
    }
  }, [pendingReminders]);

  const handleClose = () => {
    Animated.spring(scaleAnim, {
      toValue: 0,
      friction: 8,
      useNativeDriver: true,
    }).start(() => {
      setVisible(false);
      clearReminders();
    });
  };

  const handleStartWalk = () => {
    // Începe tracking-ul plimbării
    const firstReminder = pendingReminders[0];
    startWalk(firstReminder.pet);

    handleClose();
    console.log("🐾 Plimbare începută cu", firstReminder.pet.name);
    console.log("💡 Mergi la tab-ul Map pentru a vedea tracking-ul live!");
  };

  if (pendingReminders.length === 0) {
    return null;
  }

  const firstReminder = pendingReminders[0];

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.modal,
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Ionicons name="notifications" size={40} color="#007AFF" />
            </View>
          </View>

          {/* Content */}
          <View style={styles.content}>
            <Text style={styles.title}>🐾 Timpul pentru plimbare!</Text>
            <Text style={styles.time}>{firstReminder.time}</Text>
            <Text style={styles.message}>
              Nu uita să te plimbi cu{" "}
              <Text style={styles.petName}>{firstReminder.pet.name}</Text>!
            </Text>
            <Text style={styles.hint}>
              Apasă butonul și mergi la tab-ul Map 🗺️
            </Text>

            {pendingReminders.length > 1 && (
              <Text style={styles.moreReminders}>
                +{pendingReminders.length - 1}{" "}
                {pendingReminders.length === 2 ? "animal" : "animale"} mai
                așteaptă
              </Text>
            )}
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.laterButton}
              onPress={handleClose}
              activeOpacity={0.7}
            >
              <Text style={styles.laterButtonText}>Mai târziu</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.goButton}
              onPress={handleStartWalk}
              activeOpacity={0.7}
            >
              <Ionicons name="footsteps" size={20} color="#fff" />
              <Text style={styles.goButtonText}>Hai să mergem!</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modal: {
    backgroundColor: "#fff",
    borderRadius: 20,
    width: "100%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    alignItems: "center",
    paddingTop: 30,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#E3F2FD",
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    padding: 24,
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
    textAlign: "center",
  },
  time: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#007AFF",
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 24,
  },
  hint: {
    fontSize: 13,
    color: "#007AFF",
    textAlign: "center",
    marginTop: 8,
    fontStyle: "italic",
  },
  petName: {
    fontWeight: "bold",
    color: "#333",
  },
  moreReminders: {
    fontSize: 14,
    color: "#999",
    marginTop: 12,
    fontStyle: "italic",
  },
  actions: {
    flexDirection: "row",
    padding: 16,
    gap: 12,
  },
  laterButton: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  laterButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
  },
  goButton: {
    flex: 2,
    backgroundColor: "#007AFF",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  goButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
});
