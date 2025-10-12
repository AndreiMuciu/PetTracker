import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Modal,
  Switch,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Pet, WalkSchedule } from "../types";
import { getPets, savePet } from "../services/storage";
import {
  requestNotificationPermissions,
  scheduleWalkNotification,
  cancelNotification,
} from "../services/notifications";

const DAYS_OF_WEEK = [
  { label: "D", value: 0, full: "Duminică" },
  { label: "L", value: 1, full: "Luni" },
  { label: "M", value: 2, full: "Marți" },
  { label: "M", value: 3, full: "Miercuri" },
  { label: "J", value: 4, full: "Joi" },
  { label: "V", value: 5, full: "Vineri" },
  { label: "S", value: 6, full: "Sâmbătă" },
];

export default function ScheduleScreen() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [editingSchedule, setEditingSchedule] = useState<WalkSchedule | null>(
    null
  );

  useEffect(() => {
    loadPets();
    initNotifications();
  }, []);

  const initNotifications = async () => {
    await requestNotificationPermissions();
  };

  const loadPets = async () => {
    const loadedPets = await getPets();
    setPets(loadedPets);
  };

  const handleAddSchedule = (pet: Pet) => {
    setSelectedPet(pet);
    setEditingSchedule(null);
    setSelectedTime(new Date());
    setSelectedDays([1, 2, 3, 4, 5]); // Monday to Friday by default
    setModalVisible(true);
  };

  const handleEditSchedule = (pet: Pet, schedule: WalkSchedule) => {
    setSelectedPet(pet);
    setEditingSchedule(schedule);

    const [hours, minutes] = schedule.time.split(":").map(Number);
    const date = new Date();
    date.setHours(hours, minutes);
    setSelectedTime(date);
    setSelectedDays(schedule.daysOfWeek);
    setModalVisible(true);
  };

  const toggleDay = (day: number) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter((d) => d !== day));
    } else {
      setSelectedDays([...selectedDays, day].sort());
    }
  };

  const handleSaveSchedule = async () => {
    if (!selectedPet) return;

    if (selectedDays.length === 0) {
      Alert.alert("Eroare", "Te rog selectează cel puțin o zi");
      return;
    }

    const hours = selectedTime.getHours().toString().padStart(2, "0");
    const minutes = selectedTime.getMinutes().toString().padStart(2, "0");
    const timeString = `${hours}:${minutes}`;

    let updatedPet = { ...selectedPet };

    if (editingSchedule) {
      // Update existing schedule
      if (editingSchedule.notificationId) {
        await cancelNotification(editingSchedule.notificationId);
      }

      const notificationId = await scheduleWalkNotification(updatedPet, {
        ...editingSchedule,
        time: timeString,
        daysOfWeek: selectedDays,
      });

      updatedPet.walkSchedule = updatedPet.walkSchedule.map((s) =>
        s.id === editingSchedule.id
          ? {
              ...s,
              time: timeString,
              daysOfWeek: selectedDays,
              notificationId: notificationId || undefined,
            }
          : s
      );
    } else {
      // Create new schedule
      const newSchedule: WalkSchedule = {
        id: Date.now().toString(),
        time: timeString,
        daysOfWeek: selectedDays,
        enabled: true,
      };

      const notificationId = await scheduleWalkNotification(
        updatedPet,
        newSchedule
      );
      newSchedule.notificationId = notificationId || undefined;

      updatedPet.walkSchedule = [...updatedPet.walkSchedule, newSchedule];
    }

    await savePet(updatedPet);
    await loadPets();
    setModalVisible(false);
  };

  const toggleSchedule = async (pet: Pet, schedule: WalkSchedule) => {
    const updatedSchedule = { ...schedule, enabled: !schedule.enabled };

    if (updatedSchedule.enabled) {
      // Re-enable notification
      const notificationId = await scheduleWalkNotification(
        pet,
        updatedSchedule
      );
      updatedSchedule.notificationId = notificationId || undefined;
    } else {
      // Disable notification
      if (schedule.notificationId) {
        await cancelNotification(schedule.notificationId);
      }
      updatedSchedule.notificationId = undefined;
    }

    const updatedPet = {
      ...pet,
      walkSchedule: pet.walkSchedule.map((s) =>
        s.id === schedule.id ? updatedSchedule : s
      ),
    };

    await savePet(updatedPet);
    await loadPets();
  };

  const handleDeleteSchedule = (pet: Pet, schedule: WalkSchedule) => {
    Alert.alert(
      "Șterge Program",
      "Ești sigur că vrei să ștergi acest program?",
      [
        { text: "Anulează", style: "cancel" },
        {
          text: "Șterge",
          style: "destructive",
          onPress: async () => {
            if (schedule.notificationId) {
              await cancelNotification(schedule.notificationId);
            }

            const updatedPet = {
              ...pet,
              walkSchedule: pet.walkSchedule.filter(
                (s) => s.id !== schedule.id
              ),
            };

            await savePet(updatedPet);
            await loadPets();
          },
        },
      ]
    );
  };

  const getDaysLabel = (days: number[]) => {
    if (days.length === 7) return "Zilnic";
    if (days.length === 5 && days.every((d) => d >= 1 && d <= 5))
      return "Luni-Vineri";
    if (days.length === 2 && days.includes(0) && days.includes(6))
      return "Weekend";

    return days.map((d) => DAYS_OF_WEEK[d].label).join(", ");
  };

  const renderScheduleItem = (pet: Pet, schedule: WalkSchedule) => (
    <View key={schedule.id} style={styles.scheduleCard}>
      <View style={styles.scheduleHeader}>
        <View style={styles.scheduleInfo}>
          <Text style={styles.scheduleTime}>{schedule.time}</Text>
          <Text style={styles.scheduleDays}>
            {getDaysLabel(schedule.daysOfWeek)}
          </Text>
        </View>
        <View style={styles.scheduleActions}>
          <Switch
            value={schedule.enabled}
            onValueChange={() => toggleSchedule(pet, schedule)}
            trackColor={{ false: "#ccc", true: "#34C759" }}
            thumbColor="#fff"
          />
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => handleEditSchedule(pet, schedule)}
          >
            <Ionicons name="pencil" size={20} color="#007AFF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => handleDeleteSchedule(pet, schedule)}
          >
            <Ionicons name="trash-outline" size={20} color="#ff3b30" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderPetSection = ({ item: pet }: { item: Pet }) => (
    <View style={styles.petSection}>
      <View style={styles.petHeader}>
        <Text style={styles.petName}>
          {pet.type === "dog" ? "🐕" : pet.type === "cat" ? "🐈" : "🐾"}{" "}
          {pet.name}
        </Text>
        <TouchableOpacity
          style={styles.addScheduleButton}
          onPress={() => handleAddSchedule(pet)}
        >
          <Ionicons name="add" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {pet.walkSchedule.length === 0 ? (
        <View style={styles.emptySchedule}>
          <Text style={styles.emptyScheduleText}>
            Nu există programe de plimbare
          </Text>
        </View>
      ) : (
        pet.walkSchedule.map((schedule) => renderScheduleItem(pet, schedule))
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Programe Plimbări</Text>
      </View>

      {/* Warning pentru Expo Go */}
      <View style={styles.warningBanner}>
        <Ionicons name="information-circle" size={20} color="#FF9500" />
        <Text style={styles.warningText}>
          În Expo Go, reminder-urile apar în aplicație (nu ca notificări native)
        </Text>
      </View>

      {pets.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📅</Text>
          <Text style={styles.emptyText}>Nu ai animale adăugate</Text>
          <Text style={styles.emptySubtext}>
            Adaugă un animal mai întâi pentru a programa plimbări
          </Text>
        </View>
      ) : (
        <FlatList
          data={pets}
          renderItem={renderPetSection}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
        />
      )}

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingSchedule ? "Editează Program" : "Program Nou"}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={28} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.label}>Animal</Text>
              <Text style={styles.petNameDisplay}>{selectedPet?.name}</Text>

              <Text style={styles.label}>Oră</Text>
              <TouchableOpacity
                style={styles.timeButton}
                onPress={() => setShowTimePicker(true)}
              >
                <Ionicons name="time-outline" size={24} color="#007AFF" />
                <Text style={styles.timeButtonText}>
                  {selectedTime.toLocaleTimeString("ro-RO", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
              </TouchableOpacity>

              {showTimePicker && (
                <DateTimePicker
                  value={selectedTime}
                  mode="time"
                  is24Hour={true}
                  onChange={(_event, date) => {
                    setShowTimePicker(false);
                    if (date) setSelectedTime(date);
                  }}
                />
              )}

              <Text style={styles.label}>Zile</Text>
              <View style={styles.daysContainer}>
                {DAYS_OF_WEEK.map((day) => (
                  <TouchableOpacity
                    key={day.value}
                    style={[
                      styles.dayButton,
                      selectedDays.includes(day.value) &&
                        styles.dayButtonActive,
                    ]}
                    onPress={() => toggleDay(day.value)}
                  >
                    <Text
                      style={[
                        styles.dayButtonText,
                        selectedDays.includes(day.value) &&
                          styles.dayButtonTextActive,
                      ]}
                    >
                      {day.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.helpText}>
                📱 Vei primi notificări la ora selectată în zilele alese
              </Text>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Anulează</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSaveSchedule}
              >
                <Text style={styles.saveButtonText}>Salvează</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    padding: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
  },
  warningBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF9E6",
    padding: 12,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 8,
    gap: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#FF9500",
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: "#8B7500",
    lineHeight: 18,
  },
  listContent: {
    padding: 16,
  },
  petSection: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  petHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  petName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  addScheduleButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E3F2FD",
    justifyContent: "center",
    alignItems: "center",
  },
  scheduleCard: {
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  scheduleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  scheduleInfo: {
    flex: 1,
  },
  scheduleTime: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  scheduleDays: {
    fontSize: 14,
    color: "#666",
  },
  scheduleActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconButton: {
    padding: 8,
  },
  emptySchedule: {
    padding: 20,
    alignItems: "center",
  },
  emptyScheduleText: {
    fontSize: 14,
    color: "#999",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyIcon: {
    fontSize: 80,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  modalBody: {
    padding: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
    marginTop: 12,
  },
  petNameDisplay: {
    fontSize: 18,
    color: "#007AFF",
    padding: 12,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
  },
  timeButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    padding: 16,
    gap: 12,
  },
  timeButtonText: {
    fontSize: 24,
    fontWeight: "600",
    color: "#333",
  },
  daysContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  dayButton: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 8,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  dayButtonActive: {
    backgroundColor: "#E3F2FD",
    borderColor: "#007AFF",
  },
  dayButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
  },
  dayButtonTextActive: {
    color: "#007AFF",
  },
  helpText: {
    fontSize: 14,
    color: "#666",
    marginTop: 16,
    padding: 12,
    backgroundColor: "#FFF9E6",
    borderRadius: 8,
  },
  modalFooter: {
    flexDirection: "row",
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    padding: 16,
    marginRight: 8,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
  },
  saveButton: {
    flex: 1,
    backgroundColor: "#007AFF",
    borderRadius: 8,
    padding: 16,
    marginLeft: 8,
    alignItems: "center",
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
});
