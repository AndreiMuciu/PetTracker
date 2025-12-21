import React, { useState, useCallback } from "react";
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
  TextInput,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Pet, FeedingSchedule, FoodInventory } from "../types";
import { getPets } from "../services/storage";
import {
  getFeedingSchedulesByPet,
  saveFeedingSchedule,
  deleteFeedingSchedule,
  getFoodInventoryByPet,
  saveFoodInventory,
  deleteFoodInventory,
  recordFeeding,
} from "../services/storage";
import {
  scheduleFeedingNotification,
  cancelNotification,
  sendLowStockNotification,
  sendOutOfStockNotification,
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

type TabType = "schedules" | "inventory";

export default function FeedingScreen() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>("schedules");

  // Schedule state
  const [feedingSchedules, setFeedingSchedules] = useState<
    Map<string, FeedingSchedule[]>
  >(new Map());
  const [scheduleModalVisible, setScheduleModalVisible] = useState(false);
  const [selectedPetForSchedule, setSelectedPetForSchedule] =
    useState<Pet | null>(null);
  const [editingSchedule, setEditingSchedule] =
    useState<FeedingSchedule | null>(null);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [portionSize, setPortionSize] = useState("100");
  const [foodType, setFoodType] = useState("");
  const [selectedInventoryId, setSelectedInventoryId] = useState<string | null>(
    null
  );

  // Inventory state
  const [foodInventories, setFoodInventories] = useState<
    Map<string, FoodInventory[]>
  >(new Map());
  const [inventoryModalVisible, setInventoryModalVisible] = useState(false);
  const [selectedPetForInventory, setSelectedPetForInventory] =
    useState<Pet | null>(null);
  const [editingInventory, setEditingInventory] =
    useState<FoodInventory | null>(null);
  const [foodName, setFoodName] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [inventoryPortionSize, setInventoryPortionSize] = useState("100");
  const [lowStockThreshold, setLowStockThreshold] = useState("500");
  const [selectedUnit, setSelectedUnit] = useState<"g" | "kg">("g");

  // Helper: pentru câini și pisici, inventarul e comun per tip; pentru other, e per animal
  const getInventoryKey = (pet: Pet): string => {
    if (pet.type === "dog") return "__dogs__";
    if (pet.type === "cat") return "__cats__";
    return pet.id; // pentru "other", rămâne per animal
  };

  const getInventoryKeyLabel = (pet: Pet): string => {
    if (pet.type === "dog") return "Toți câinii";
    if (pet.type === "cat") return "Toate pisicile";
    return pet.name;
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    const loadedPets = await getPets();
    setPets(loadedPets);

    // Load schedules and inventory for each pet
    const schedulesMap = new Map<string, FeedingSchedule[]>();
    const inventoryMap = new Map<string, FoodInventory[]>();

    for (const pet of loadedPets) {
      const schedules = await getFeedingSchedulesByPet(pet.id);
      schedulesMap.set(pet.id, schedules);

      // Pentru inventar, folosim cheia bazată pe tip
      const inventoryKey = getInventoryKey(pet);
      if (!inventoryMap.has(inventoryKey)) {
        const inventory = await getFoodInventoryByPet(inventoryKey);
        inventoryMap.set(inventoryKey, inventory);
      }
    }

    setFeedingSchedules(schedulesMap);
    setFoodInventories(inventoryMap);
  };

  // Helper pentru a obține inventarul pentru un animal (bazat pe tipul lui)
  const getInventoryForPet = (pet: Pet): FoodInventory[] => {
    const inventoryKey = getInventoryKey(pet);
    return foodInventories.get(inventoryKey) || [];
  };

  // Creez grupuri pentru inventar (câini, pisici, animale individuale)
  const getInventoryGroups = () => {
    const groups: {
      key: string;
      label: string;
      emoji: string;
      inventories: FoodInventory[];
      representativePet: Pet | null;
    }[] = [];

    const hasDogs = pets.some((p) => p.type === "dog");
    const hasCats = pets.some((p) => p.type === "cat");
    const otherPets = pets.filter((p) => p.type === "other");

    if (hasDogs) {
      const dogPet = pets.find((p) => p.type === "dog")!;
      groups.push({
        key: "__dogs__",
        label: "Toți câinii",
        emoji: "🐕",
        inventories: foodInventories.get("__dogs__") || [],
        representativePet: dogPet,
      });
    }

    if (hasCats) {
      const catPet = pets.find((p) => p.type === "cat")!;
      groups.push({
        key: "__cats__",
        label: "Toate pisicile",
        emoji: "🐈",
        inventories: foodInventories.get("__cats__") || [],
        representativePet: catPet,
      });
    }

    for (const pet of otherPets) {
      groups.push({
        key: pet.id,
        label: pet.name,
        emoji: "🐾",
        inventories: foodInventories.get(pet.id) || [],
        representativePet: pet,
      });
    }

    return groups;
  };

  // ============ Schedule Functions ============

  const handleAddSchedule = (pet: Pet) => {
    setSelectedPetForSchedule(pet);
    setEditingSchedule(null);
    setSelectedTime(new Date());
    setSelectedDays([1, 2, 3, 4, 5, 6, 0]); // All days by default
    setPortionSize("100");
    setFoodType("");
    setSelectedInventoryId(null);
    setScheduleModalVisible(true);
  };

  const handleEditSchedule = (pet: Pet, schedule: FeedingSchedule) => {
    setSelectedPetForSchedule(pet);
    setEditingSchedule(schedule);

    const [hours, minutes] = schedule.time.split(":").map(Number);
    const date = new Date();
    date.setHours(hours, minutes);
    setSelectedTime(date);
    setSelectedDays(schedule.daysOfWeek);
    setPortionSize(schedule.portionSize.toString());
    setFoodType(schedule.foodType || "");
    setSelectedInventoryId(schedule.inventoryId || null);
    setScheduleModalVisible(true);
  };

  const toggleDay = (day: number) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter((d) => d !== day));
    } else {
      setSelectedDays([...selectedDays, day].sort());
    }
  };

  const handleSaveSchedule = async () => {
    if (!selectedPetForSchedule) return;

    if (selectedDays.length === 0) {
      Alert.alert("Eroare", "Te rog selectează cel puțin o zi");
      return;
    }

    const parsedPortion = parseInt(portionSize) || 100;

    const hours = selectedTime.getHours().toString().padStart(2, "0");
    const minutes = selectedTime.getMinutes().toString().padStart(2, "0");
    const timeString = `${hours}:${minutes}`;

    if (editingSchedule) {
      if (editingSchedule.notificationId) {
        await cancelNotification(editingSchedule.notificationId);
      }

      const updatedSchedule: FeedingSchedule = {
        ...editingSchedule,
        time: timeString,
        daysOfWeek: selectedDays,
        portionSize: parsedPortion,
        foodType: foodType || undefined,
        inventoryId: selectedInventoryId || undefined,
      };

      const notificationId = await scheduleFeedingNotification(
        selectedPetForSchedule,
        updatedSchedule
      );
      updatedSchedule.notificationId = notificationId || undefined;

      await saveFeedingSchedule(updatedSchedule);
    } else {
      const newSchedule: FeedingSchedule = {
        id: Date.now().toString(),
        petId: selectedPetForSchedule.id,
        time: timeString,
        daysOfWeek: selectedDays,
        enabled: true,
        portionSize: parsedPortion,
        foodType: foodType || undefined,
        inventoryId: selectedInventoryId || undefined,
      };

      const notificationId = await scheduleFeedingNotification(
        selectedPetForSchedule,
        newSchedule
      );
      newSchedule.notificationId = notificationId || undefined;

      await saveFeedingSchedule(newSchedule);
    }

    await loadData();
    setScheduleModalVisible(false);
  };

  const toggleSchedule = async (pet: Pet, schedule: FeedingSchedule) => {
    const updatedSchedule = { ...schedule, enabled: !schedule.enabled };

    if (updatedSchedule.enabled) {
      const notificationId = await scheduleFeedingNotification(
        pet,
        updatedSchedule
      );
      updatedSchedule.notificationId = notificationId || undefined;
    } else {
      if (schedule.notificationId) {
        await cancelNotification(schedule.notificationId);
      }
      updatedSchedule.notificationId = undefined;
    }

    await saveFeedingSchedule(updatedSchedule);
    await loadData();
  };

  const handleDeleteSchedule = (schedule: FeedingSchedule) => {
    Alert.alert(
      "Șterge Program Hrănire",
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
            await deleteFeedingSchedule(schedule.id);
            await loadData();
          },
        },
      ]
    );
  };

  // ============ Inventory Functions ============

  const handleAddInventory = (pet: Pet) => {
    setSelectedPetForInventory(pet);
    setEditingInventory(null);
    setFoodName("");
    setTotalAmount("");
    setInventoryPortionSize("100");
    setLowStockThreshold("500");
    setSelectedUnit("g");
    setInventoryModalVisible(true);
  };

  const handleEditInventory = (pet: Pet, inventory: FoodInventory) => {
    setSelectedPetForInventory(pet);
    setEditingInventory(inventory);
    setFoodName(inventory.foodName);
    setTotalAmount(inventory.totalAmount.toString());
    setInventoryPortionSize(inventory.portionSize.toString());
    setLowStockThreshold(inventory.lowStockThreshold.toString());
    setSelectedUnit(inventory.unit);
    setInventoryModalVisible(true);
  };

  const handleSaveInventory = async () => {
    if (!selectedPetForInventory) return;

    if (!foodName.trim()) {
      Alert.alert("Eroare", "Te rog introdu numele mâncării");
      return;
    }

    const parsedTotal = parseFloat(totalAmount) || 0;
    const parsedPortion = parseFloat(inventoryPortionSize) || 100;
    const parsedThreshold = parseFloat(lowStockThreshold) || 500;

    // Convert to grams if kg
    const totalInGrams =
      selectedUnit === "kg" ? parsedTotal * 1000 : parsedTotal;
    const thresholdInGrams =
      selectedUnit === "kg" ? parsedThreshold * 1000 : parsedThreshold;

    if (editingInventory) {
      const updatedInventory: FoodInventory = {
        ...editingInventory,
        foodName: foodName.trim(),
        totalAmount: totalInGrams,
        portionSize: parsedPortion,
        lowStockThreshold: thresholdInGrams,
        unit: selectedUnit,
      };

      await saveFoodInventory(updatedInventory);
    } else {
      const inventoryKey = getInventoryKey(selectedPetForInventory);
      const newInventory: FoodInventory = {
        id: Date.now().toString(),
        petId: inventoryKey, // folosim cheia inventarului, nu petId
        foodName: foodName.trim(),
        totalAmount: totalInGrams,
        remainingAmount: totalInGrams,
        portionSize: parsedPortion,
        lowStockThreshold: thresholdInGrams,
        unit: selectedUnit,
        createdAt: new Date(),
      };

      await saveFoodInventory(newInventory);
    }

    await loadData();
    setInventoryModalVisible(false);
  };

  const handleDeleteInventory = (inventory: FoodInventory) => {
    Alert.alert(
      "Șterge Mâncare",
      `Ești sigur că vrei să ștergi "${inventory.foodName}"?`,
      [
        { text: "Anulează", style: "cancel" },
        {
          text: "Șterge",
          style: "destructive",
          onPress: async () => {
            await deleteFoodInventory(inventory.id);
            await loadData();
          },
        },
      ]
    );
  };

  const handleFeedPet = async (pet: Pet, inventory: FoodInventory) => {
    Alert.alert(
      "Confirmă Hrănirea",
      `Ai servit o porție de ${inventory.portionSize}g din "${inventory.foodName}" pentru ${pet.name}?`,
      [
        { text: "Anulează", style: "cancel" },
        {
          text: "Da, confirm",
          onPress: async () => {
            try {
              const { inventory: updatedInventory, isLowStock } =
                await recordFeeding(
                  inventory.id,
                  inventory.portionSize,
                  pet.id
                );

              await loadData();

              if (updatedInventory.remainingAmount <= 0) {
                await sendOutOfStockNotification(pet.name, inventory.foodName);
                Alert.alert(
                  "🚨 Mâncarea s-a terminat!",
                  `"${inventory.foodName}" pentru ${pet.name} s-a terminat. Trebuie să cumperi mâncare!`
                );
              } else if (isLowStock) {
                const displayAmount =
                  inventory.unit === "kg"
                    ? (updatedInventory.remainingAmount / 1000).toFixed(1)
                    : updatedInventory.remainingAmount.toString();
                await sendLowStockNotification(
                  pet.name,
                  inventory.foodName,
                  parseFloat(displayAmount),
                  inventory.unit
                );
                Alert.alert(
                  "⚠️ Stoc redus!",
                  `Mai ai doar ${displayAmount}${inventory.unit} de "${inventory.foodName}" pentru ${pet.name}. E timpul să cumperi mai mult!`
                );
              } else {
                Alert.alert(
                  "✅ Hrănit!",
                  `${pet.name} a fost hrănit cu succes.`
                );
              }
            } catch (error) {
              Alert.alert("Eroare", "Nu s-a putut înregistra hrănirea");
            }
          },
        },
      ]
    );
  };

  const handleRefillInventory = (pet: Pet, inventory: FoodInventory) => {
    Alert.alert(
      "Reumple Stocul",
      `Vrei să reumpli stocul de "${inventory.foodName}"?`,
      [
        { text: "Anulează", style: "cancel" },
        {
          text: "Reumple complet",
          onPress: async () => {
            const updatedInventory: FoodInventory = {
              ...inventory,
              remainingAmount: inventory.totalAmount,
            };
            await saveFoodInventory(updatedInventory);
            await loadData();
            Alert.alert(
              "✅ Stoc reumplut!",
              `"${inventory.foodName}" a fost reumplut la ${
                inventory.totalAmount
              }${inventory.unit === "kg" ? "kg" : "g"}.`
            );
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

  const getStockPercentage = (inventory: FoodInventory) => {
    return Math.round(
      (inventory.remainingAmount / inventory.totalAmount) * 100
    );
  };

  const getStockColor = (inventory: FoodInventory) => {
    const percentage = getStockPercentage(inventory);
    if (percentage <= 10) return "#ff3b30";
    if (percentage <= 25) return "#FF9500";
    if (percentage <= 50) return "#FFCC00";
    return "#34C759";
  };

  const formatAmount = (amount: number, unit: "g" | "kg") => {
    if (unit === "kg") {
      return `${(amount / 1000).toFixed(1)}kg`;
    }
    return `${amount}g`;
  };

  const getPortionsRemaining = (inventory: FoodInventory) => {
    return Math.floor(inventory.remainingAmount / inventory.portionSize);
  };

  const getLinkedInventory = (
    schedule: FeedingSchedule,
    pet: Pet
  ): FoodInventory | undefined => {
    if (!schedule.inventoryId) return undefined;
    const inventoryKey = getInventoryKey(pet);
    const petInventories = foodInventories.get(inventoryKey) || [];
    return petInventories.find((inv) => inv.id === schedule.inventoryId);
  };

  // ============ Render Functions ============

  const renderScheduleItem = (pet: Pet, schedule: FeedingSchedule) => {
    const linkedInventory = getLinkedInventory(schedule, pet);

    return (
      <View key={schedule.id} style={styles.scheduleCard}>
        <View style={styles.scheduleHeader}>
          <View style={styles.scheduleInfo}>
            <Text style={styles.scheduleTime}>{schedule.time}</Text>
            <Text style={styles.scheduleDays}>
              {getDaysLabel(schedule.daysOfWeek)}
            </Text>
            <Text style={styles.portionText}>
              🍽️ {schedule.portionSize}g{" "}
              {schedule.foodType && `- ${schedule.foodType}`}
            </Text>
            {linkedInventory && (
              <Text style={styles.linkedInventoryText}>
                📦 {linkedInventory.foodName} (
                {getPortionsRemaining(linkedInventory)} porții)
              </Text>
            )}
          </View>
          <View style={styles.scheduleActions}>
            <Switch
              value={schedule.enabled}
              onValueChange={() => toggleSchedule(pet, schedule)}
              trackColor={{ false: "#ccc", true: "#FF9500" }}
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
              onPress={() => handleDeleteSchedule(schedule)}
            >
              <Ionicons name="trash-outline" size={20} color="#ff3b30" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const renderInventoryItem = (pet: Pet, inventory: FoodInventory) => {
    const percentage = getStockPercentage(inventory);
    const stockColor = getStockColor(inventory);
    const portionsLeft = getPortionsRemaining(inventory);

    return (
      <View key={inventory.id} style={styles.inventoryCard}>
        <View style={styles.inventoryHeader}>
          <View style={styles.inventoryInfo}>
            <Text style={styles.inventoryName}>{inventory.foodName}</Text>
            <Text style={styles.inventoryDetails}>
              Porție: {inventory.portionSize}g | {portionsLeft} porții rămase
            </Text>
          </View>
          <View style={styles.inventoryActions}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => handleEditInventory(pet, inventory)}
            >
              <Ionicons name="pencil" size={20} color="#007AFF" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => handleDeleteInventory(inventory)}
            >
              <Ionicons name="trash-outline" size={20} color="#ff3b30" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${percentage}%`, backgroundColor: stockColor },
              ]}
            />
          </View>
          <Text style={[styles.progressText, { color: stockColor }]}>
            {formatAmount(inventory.remainingAmount, inventory.unit)} /{" "}
            {formatAmount(inventory.totalAmount, inventory.unit)}
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.inventoryButtonsRow}>
          <TouchableOpacity
            style={[
              styles.feedButton,
              inventory.remainingAmount <= 0 && styles.feedButtonDisabled,
            ]}
            onPress={() => handleFeedPet(pet, inventory)}
            disabled={inventory.remainingAmount <= 0}
          >
            <Ionicons name="restaurant" size={18} color="#fff" />
            <Text style={styles.feedButtonText}>
              Hrănește ({inventory.portionSize}g)
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.refillButton}
            onPress={() => handleRefillInventory(pet, inventory)}
          >
            <Ionicons name="refresh" size={18} color="#007AFF" />
            <Text style={styles.refillButtonText}>Reumple</Text>
          </TouchableOpacity>
        </View>

        {percentage <= 25 && (
          <View
            style={[
              styles.warningBanner,
              percentage <= 10 && styles.criticalBanner,
            ]}
          >
            <Ionicons
              name="warning"
              size={16}
              color={percentage <= 10 ? "#ff3b30" : "#FF9500"}
            />
            <Text
              style={[
                styles.warningText,
                percentage <= 10 && styles.criticalText,
              ]}
            >
              {percentage <= 10
                ? "Stoc critic! Cumpără mâncare urgent!"
                : "Stoc redus! Planifică să cumperi mâncare."}
            </Text>
          </View>
        )}
      </View>
    );
  };

  // Render pentru secțiunea unui animal individual (pentru schedules)
  const renderPetScheduleSection = ({ item: pet }: { item: Pet }) => {
    const schedules = feedingSchedules.get(pet.id) || [];

    return (
      <View style={styles.petSection}>
        <View style={styles.petHeader}>
          <View style={styles.petNameContainer}>
            {pet.photo ? (
              <Image source={{ uri: pet.photo }} style={styles.petPhoto} />
            ) : (
              <Text style={styles.petEmoji}>
                {pet.type === "dog" ? "🐕" : pet.type === "cat" ? "🐈" : "🐾"}
              </Text>
            )}
            <Text style={styles.petName}>{pet.name}</Text>
          </View>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => handleAddSchedule(pet)}
          >
            <Ionicons name="add" size={24} color="#FF9500" />
          </TouchableOpacity>
        </View>

        {schedules.length === 0 ? (
          <View style={styles.emptySection}>
            <Text style={styles.emptyText}>Nu există programe de hrănire</Text>
          </View>
        ) : (
          schedules.map((schedule) => renderScheduleItem(pet, schedule))
        )}
      </View>
    );
  };

  // Render pentru secțiunea de inventar grupat
  const renderInventoryGroupSection = (group: {
    key: string;
    label: string;
    emoji: string;
    inventories: FoodInventory[];
    representativePet: Pet | null;
  }) => {
    if (!group.representativePet) return null;

    return (
      <View key={group.key} style={styles.petSection}>
        <View style={styles.petHeader}>
          <View style={styles.petNameContainer}>
            <Text style={styles.petEmoji}>{group.emoji}</Text>
            <Text style={styles.petName}>{group.label}</Text>
          </View>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => handleAddInventory(group.representativePet!)}
          >
            <Ionicons name="add" size={24} color="#FF9500" />
          </TouchableOpacity>
        </View>

        {group.inventories.length === 0 ? (
          <View style={styles.emptySection}>
            <Text style={styles.emptyText}>
              Nu ai adăugat mâncare în inventar
            </Text>
          </View>
        ) : (
          group.inventories.map((inventory) =>
            renderInventoryItem(group.representativePet!, inventory)
          )
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Hrănire</Text>
      </View>

      {/* Tab Selector */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "schedules" && styles.activeTab]}
          onPress={() => setActiveTab("schedules")}
        >
          <Ionicons
            name="time-outline"
            size={20}
            color={activeTab === "schedules" ? "#FF9500" : "#666"}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === "schedules" && styles.activeTabText,
            ]}
          >
            Ore Masă
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "inventory" && styles.activeTab]}
          onPress={() => setActiveTab("inventory")}
        >
          <Ionicons
            name="cube-outline"
            size={20}
            color={activeTab === "inventory" ? "#FF9500" : "#666"}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === "inventory" && styles.activeTabText,
            ]}
          >
            Inventar Mâncare
          </Text>
        </TouchableOpacity>
      </View>

      {pets.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🍽️</Text>
          <Text style={styles.emptyStateText}>Nu ai animale adăugate</Text>
          <Text style={styles.emptySubtext}>
            Adaugă un animal mai întâi pentru a programa hrănirea
          </Text>
        </View>
      ) : activeTab === "schedules" ? (
        <FlatList
          data={pets}
          renderItem={renderPetScheduleSection}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <ScrollView contentContainerStyle={styles.listContent}>
          {getInventoryGroups().map((group) =>
            renderInventoryGroupSection(group)
          )}
        </ScrollView>
      )}

      {/* Schedule Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={scheduleModalVisible}
        onRequestClose={() => setScheduleModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingSchedule ? "Editează Ora Mesei" : "Ora Mesei Nouă"}
              </Text>
              <TouchableOpacity onPress={() => setScheduleModalVisible(false)}>
                <Ionicons name="close" size={28} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.label}>Animal</Text>
              <Text style={styles.petNameDisplay}>
                {selectedPetForSchedule?.name}
              </Text>

              <Text style={styles.label}>Oră</Text>
              <TouchableOpacity
                style={styles.timeButton}
                onPress={() => setShowTimePicker(true)}
              >
                <Ionicons name="time-outline" size={24} color="#FF9500" />
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

              <Text style={styles.label}>Leagă de inventar (opțional)</Text>
              <View style={styles.inventorySelector}>
                <TouchableOpacity
                  style={[
                    styles.inventorySelectorItem,
                    selectedInventoryId === null &&
                      styles.inventorySelectorItemActive,
                  ]}
                  onPress={() => {
                    setSelectedInventoryId(null);
                  }}
                >
                  <Ionicons
                    name={
                      selectedInventoryId === null
                        ? "radio-button-on"
                        : "radio-button-off"
                    }
                    size={20}
                    color={selectedInventoryId === null ? "#FF9500" : "#999"}
                  />
                  <Text
                    style={[
                      styles.inventorySelectorText,
                      selectedInventoryId === null &&
                        styles.inventorySelectorTextActive,
                    ]}
                  >
                    Fără legătură
                  </Text>
                </TouchableOpacity>
                {selectedPetForSchedule &&
                  getInventoryForPet(selectedPetForSchedule).map((inv) => (
                    <TouchableOpacity
                      key={inv.id}
                      style={[
                        styles.inventorySelectorItem,
                        selectedInventoryId === inv.id &&
                          styles.inventorySelectorItemActive,
                      ]}
                      onPress={() => {
                        setSelectedInventoryId(inv.id);
                        setPortionSize(inv.portionSize.toString());
                        setFoodType(inv.foodName);
                      }}
                    >
                      <Ionicons
                        name={
                          selectedInventoryId === inv.id
                            ? "radio-button-on"
                            : "radio-button-off"
                        }
                        size={20}
                        color={
                          selectedInventoryId === inv.id ? "#FF9500" : "#999"
                        }
                      />
                      <View style={styles.inventorySelectorInfo}>
                        <Text
                          style={[
                            styles.inventorySelectorText,
                            selectedInventoryId === inv.id &&
                              styles.inventorySelectorTextActive,
                          ]}
                        >
                          {inv.foodName}
                        </Text>
                        <Text style={styles.inventorySelectorSubtext}>
                          {inv.portionSize}g/porție •{" "}
                          {formatAmount(inv.remainingAmount, inv.unit)} rămase
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
              </View>
              {selectedPetForSchedule &&
                getInventoryForPet(selectedPetForSchedule).length === 0 && (
                  <Text style={styles.hintText}>
                    💡 Adaugă mâncare în Inventar pentru a lega automat și a
                    scădea stocul
                  </Text>
                )}

              <Text style={styles.label}>Mărime Porție (grame)</Text>
              <TextInput
                style={[
                  styles.input,
                  selectedInventoryId && styles.inputDisabled,
                ]}
                value={portionSize}
                onChangeText={setPortionSize}
                keyboardType="numeric"
                placeholder="100"
                editable={!selectedInventoryId}
              />
              {selectedInventoryId && (
                <Text style={styles.hintText}>
                  Porția este preluată din inventar
                </Text>
              )}

              <Text style={styles.label}>Tip Mâncare (opțional)</Text>
              <TextInput
                style={[
                  styles.input,
                  selectedInventoryId && styles.inputDisabled,
                ]}
                value={foodType}
                onChangeText={setFoodType}
                placeholder="Ex: uscată, umedă, conservă"
                editable={!selectedInventoryId}
              />

              <Text style={styles.helpText}>
                🔔 Vei primi notificări la ora selectată în zilele alese
                {selectedInventoryId &&
                  "\n📦 Mâncarea va fi scăzută automat din inventar"}
              </Text>

              <View style={styles.modalBottomSpacer} />
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setScheduleModalVisible(false)}
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

      {/* Inventory Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={inventoryModalVisible}
        onRequestClose={() => setInventoryModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingInventory ? "Editează Mâncare" : "Adaugă Mâncare"}
              </Text>
              <TouchableOpacity onPress={() => setInventoryModalVisible(false)}>
                <Ionicons name="close" size={28} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.label}>Pentru</Text>
              <Text style={styles.petNameDisplay}>
                {selectedPetForInventory &&
                  getInventoryKeyLabel(selectedPetForInventory)}
              </Text>
              {selectedPetForInventory &&
                selectedPetForInventory.type !== "other" && (
                  <Text style={styles.hintText}>
                    📋 Inventarul este comun pentru toți{" "}
                    {selectedPetForInventory.type === "dog"
                      ? "câinii"
                      : "pisicile"}
                  </Text>
                )}

              <Text style={styles.label}>Numele Mâncării</Text>
              <TextInput
                style={styles.input}
                value={foodName}
                onChangeText={setFoodName}
                placeholder="Ex: Royal Canin, Pedigree"
              />

              <Text style={styles.label}>Unitate de măsură</Text>
              <View style={styles.unitSelector}>
                <TouchableOpacity
                  style={[
                    styles.unitButton,
                    selectedUnit === "g" && styles.unitButtonActive,
                  ]}
                  onPress={() => setSelectedUnit("g")}
                >
                  <Text
                    style={[
                      styles.unitButtonText,
                      selectedUnit === "g" && styles.unitButtonTextActive,
                    ]}
                  >
                    Grame (g)
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.unitButton,
                    selectedUnit === "kg" && styles.unitButtonActive,
                  ]}
                  onPress={() => setSelectedUnit("kg")}
                >
                  <Text
                    style={[
                      styles.unitButtonText,
                      selectedUnit === "kg" && styles.unitButtonTextActive,
                    ]}
                  >
                    Kilograme (kg)
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>
                Cantitate Totală ({selectedUnit})
              </Text>
              <TextInput
                style={styles.input}
                value={totalAmount}
                onChangeText={setTotalAmount}
                keyboardType="decimal-pad"
                placeholder={selectedUnit === "kg" ? "Ex: 10" : "Ex: 5000"}
              />

              <Text style={styles.label}>Mărime Porție (grame)</Text>
              <TextInput
                style={styles.input}
                value={inventoryPortionSize}
                onChangeText={setInventoryPortionSize}
                keyboardType="numeric"
                placeholder="100"
              />

              <Text style={styles.label}>Prag Stoc Redus ({selectedUnit})</Text>
              <TextInput
                style={styles.input}
                value={lowStockThreshold}
                onChangeText={setLowStockThreshold}
                keyboardType="decimal-pad"
                placeholder={selectedUnit === "kg" ? "Ex: 1" : "Ex: 500"}
              />
              <Text style={styles.hintText}>
                Vei primi o notificare când mâncarea scade sub acest prag
              </Text>

              <Text style={styles.helpText}>
                📦 Confirmă hrănirea pentru a scădea automat din inventar
              </Text>

              <View style={styles.modalBottomSpacer} />
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setInventoryModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Anulează</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSaveInventory}
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
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    gap: 8,
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: "#FFF3E6",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  activeTabText: {
    color: "#FF9500",
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
  petNameContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  petPhoto: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#FF9500",
  },
  petEmoji: {
    fontSize: 32,
  },
  petName: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFF3E6",
    justifyContent: "center",
    alignItems: "center",
  },
  emptySection: {
    padding: 20,
    alignItems: "center",
  },
  emptyText: {
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
  emptyStateText: {
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
    marginBottom: 2,
  },
  portionText: {
    fontSize: 13,
    color: "#FF9500",
    fontWeight: "500",
  },
  linkedInventoryText: {
    fontSize: 12,
    color: "#007AFF",
    marginTop: 4,
    fontStyle: "italic",
  },
  scheduleActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconButton: {
    padding: 8,
  },
  inventoryCard: {
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  inventoryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  inventoryInfo: {
    flex: 1,
  },
  inventoryName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  inventoryDetails: {
    fontSize: 13,
    color: "#666",
  },
  inventoryActions: {
    flexDirection: "row",
    gap: 4,
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressBar: {
    height: 8,
    backgroundColor: "#e0e0e0",
    borderRadius: 4,
    marginBottom: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    fontWeight: "600",
    textAlign: "right",
  },
  inventoryButtonsRow: {
    flexDirection: "row",
    gap: 8,
  },
  feedButton: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FF9500",
    borderRadius: 8,
    paddingVertical: 10,
    gap: 6,
  },
  feedButtonDisabled: {
    backgroundColor: "#ccc",
  },
  feedButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  refillButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E3F2FD",
    borderRadius: 8,
    paddingVertical: 10,
    gap: 6,
  },
  refillButtonText: {
    color: "#007AFF",
    fontWeight: "600",
    fontSize: 14,
  },
  warningBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF9E6",
    padding: 10,
    marginTop: 10,
    borderRadius: 6,
    gap: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#FF9500",
  },
  criticalBanner: {
    backgroundColor: "#FFEBEE",
    borderLeftColor: "#ff3b30",
  },
  warningText: {
    flex: 1,
    fontSize: 12,
    color: "#8B7500",
  },
  criticalText: {
    color: "#C62828",
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
    maxHeight: "85%",
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
    color: "#FF9500",
    padding: 12,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
  },
  input: {
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    color: "#333",
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
    backgroundColor: "#FFF3E6",
    borderColor: "#FF9500",
  },
  dayButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
  },
  dayButtonTextActive: {
    color: "#FF9500",
  },
  unitSelector: {
    flexDirection: "row",
    gap: 12,
  },
  unitButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#f5f5f5",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  unitButtonActive: {
    backgroundColor: "#FFF3E6",
    borderColor: "#FF9500",
  },
  unitButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  unitButtonTextActive: {
    color: "#FF9500",
  },
  helpText: {
    fontSize: 14,
    color: "#666",
    marginTop: 16,
    padding: 12,
    backgroundColor: "#FFF9E6",
    borderRadius: 8,
  },
  hintText: {
    fontSize: 12,
    color: "#999",
    marginTop: 4,
    fontStyle: "italic",
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
    backgroundColor: "#FF9500",
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
  modalBottomSpacer: {
    height: 30,
  },
  inventorySelector: {
    gap: 8,
  },
  inventorySelectorItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    gap: 12,
    borderWidth: 2,
    borderColor: "transparent",
  },
  inventorySelectorItemActive: {
    backgroundColor: "#FFF3E6",
    borderColor: "#FF9500",
  },
  inventorySelectorInfo: {
    flex: 1,
  },
  inventorySelectorText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#666",
  },
  inventorySelectorTextActive: {
    color: "#FF9500",
  },
  inventorySelectorSubtext: {
    fontSize: 12,
    color: "#999",
    marginTop: 2,
  },
  inputDisabled: {
    backgroundColor: "#e8e8e8",
    color: "#999",
  },
});
