import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  ScrollView,
  Image,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { Pet, WalkSchedule } from "../types";
import { getPets, savePet, deletePet } from "../services/storage";
import {
  scheduleWalkNotification,
  cancelNotification,
} from "../services/notifications";
import { useWalk } from "../context/WalkContext";
import { useNavigation } from "@react-navigation/native";

export default function PetsScreen() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPet, setEditingPet] = useState<Pet | null>(null);
  const [name, setName] = useState("");
  const [petType, setPetType] = useState<"dog" | "cat" | "other">("dog");
  const [breed, setBreed] = useState("");
  const [photoUri, setPhotoUri] = useState<string | undefined>(undefined);
  const { startWalk, activeWalk } = useWalk();
  const navigation = useNavigation();

  useFocusEffect(
    useCallback(() => {
      loadPets();
    }, [])
  );

  const loadPets = async () => {
    const loadedPets = await getPets();
    setPets(loadedPets);
  };

  // Funcție helper pentru ștergerea fișierului fizic al pozei
  const deletePhotoFile = async (photoUri: string | undefined) => {
    if (!photoUri) return;

    try {
      // Verifică dacă e un URI local (nu un URI de rețea)
      if (photoUri.startsWith("file://")) {
        // Folosim noul API FileSystem.File pentru ștergere
        const file = new FileSystem.File(photoUri);
        await file.delete();
        console.log("✅ Poză ștearsă din memorie:", photoUri);
      }
    } catch (error) {
      console.error("⚠️ Eroare la ștergerea pozei:", error);
      // Nu aruncăm eroarea - continuăm operația chiar dacă ștergerea eșuează
    }
  };

  const handleAddPet = () => {
    setEditingPet(null);
    setName("");
    setPetType("dog");
    setBreed("");
    setPhotoUri(undefined);
    setModalVisible(true);
  };

  const handleEditPet = (pet: Pet) => {
    setEditingPet(pet);
    setName(pet.name);
    setPetType(pet.type);
    setBreed(pet.breed || "");
    setPhotoUri(pet.photo);
    setModalVisible(true);
  };

  const handleCancelModal = async () => {
    // Dacă utilizatorul a făcut o poză nouă dar nu a salvat-o, o ștergem
    if (photoUri && (!editingPet || photoUri !== editingPet.photo)) {
      await deletePhotoFile(photoUri);
    }
    setModalVisible(false);
  };

  const handleSavePet = async () => {
    if (!name.trim()) {
      Alert.alert("Eroare", "Te rog introdu un nume pentru animal");
      return;
    }

    const newPet: Pet = editingPet
      ? {
          ...editingPet,
          name,
          type: petType,
          breed: breed || undefined,
          photo: photoUri,
        }
      : {
          id: Date.now().toString(),
          name,
          type: petType,
          breed: breed || undefined,
          photo: photoUri,
          walkSchedule: [],
          createdAt: new Date(),
        };

    await savePet(newPet);
    await loadPets();
    setModalVisible(false);
  };

  const handleDeletePet = (pet: Pet) => {
    Alert.alert(
      "Șterge Animal",
      `Ești sigur că vrei să ștergi pe ${pet.name}?`,
      [
        { text: "Anulează", style: "cancel" },
        {
          text: "Șterge",
          style: "destructive",
          onPress: async () => {
            // Șterge poza animalului din memorie
            if (pet.photo) {
              await deletePhotoFile(pet.photo);
            }

            // Cancel all notifications for this pet
            for (const schedule of pet.walkSchedule) {
              if (schedule.notificationId) {
                await cancelNotification(schedule.notificationId);
              }
            }
            await deletePet(pet.id);
            await loadPets();
          },
        },
      ]
    );
  };

  const handleTakePhoto = async () => {
    try {
      // Cere permisiunea pentru cameră
      const { status } = await ImagePicker.requestCameraPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Permisiune Necesară",
          "Pentru a face poze animalelor tale, trebuie să acorzi permisiunea de a folosi camera."
        );
        return;
      }

      // Șterge poza veche înainte de a face una nouă
      if (photoUri || (editingPet && editingPet.photo)) {
        const oldPhotoUri = photoUri || editingPet?.photo;
        await deletePhotoFile(oldPhotoUri);
      }

      // Deschide camera
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && result.assets[0]) {
        setPhotoUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Eroare la fotografiere:", error);
      Alert.alert("Eroare", "Nu s-a putut face poza. Te rog încearcă din nou.");
    }
  };

  const handleDeletePhoto = () => {
    Alert.alert(
      "Șterge Poza",
      "Ești sigur că vrei să ștergi poza? Vei reveni la emoji-ul prestabilit.",
      [
        { text: "Anulează", style: "cancel" },
        {
          text: "Șterge",
          style: "destructive",
          onPress: async () => {
            // Șterge fișierul fizic din memorie
            const photoToDelete = photoUri || editingPet?.photo;
            await deletePhotoFile(photoToDelete);
            setPhotoUri(undefined);
          },
        },
      ]
    );
  };

  const getPetIcon = (type: string) => {
    switch (type) {
      case "dog":
        return "🐕";
      case "cat":
        return "🐈";
      default:
        return "🐾";
    }
  };

  const handleStartWalk = (pet: Pet) => {
    if (activeWalk) {
      Alert.alert(
        "Plimbare Activă",
        `Ai deja o plimbare în desfășurare cu ${activeWalk.pet.name}. Vrei să o oprești și să începi una nouă cu ${pet.name}?`,
        [
          { text: "Anulează", style: "cancel" },
          {
            text: "Da, începe nou",
            onPress: () => {
              startWalk(pet);
              navigation.navigate("Map" as never);
              console.log(`🐾 Plimbare începută cu ${pet.name}`);
            },
          },
        ]
      );
    } else {
      startWalk(pet);
      navigation.navigate("Map" as never);
      console.log(`🐾 Plimbare începută cu ${pet.name}`);
    }
  };

  const renderPetItem = ({ item }: { item: Pet }) => (
    <View style={styles.petCard}>
      <TouchableOpacity
        style={styles.petHeader}
        onPress={() => handleEditPet(item)}
        onLongPress={() => handleDeletePet(item)}
      >
        {item.photo ? (
          <Image source={{ uri: item.photo }} style={styles.petPhoto} />
        ) : (
          <Text style={styles.petIcon}>{getPetIcon(item.type)}</Text>
        )}
        <View style={styles.petInfo}>
          <Text style={styles.petName}>{item.name}</Text>
          {item.breed && <Text style={styles.petBreed}>{item.breed}</Text>}
          <Text style={styles.scheduleCount}>
            {item.walkSchedule.filter((s) => s.enabled).length} plimbări
            programate
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => handleDeletePet(item)}
          style={styles.deleteButton}
        >
          <Ionicons name="trash-outline" size={24} color="#ff3b30" />
        </TouchableOpacity>
      </TouchableOpacity>

      {/* Start Walk Button */}
      <TouchableOpacity
        style={[
          styles.startWalkButton,
          activeWalk?.pet.id === item.id && styles.activeWalkButton,
        ]}
        onPress={() => handleStartWalk(item)}
        disabled={activeWalk?.pet.id === item.id}
      >
        <Ionicons
          name={activeWalk?.pet.id === item.id ? "footsteps" : "play"}
          size={20}
          color="#fff"
        />
        <Text style={styles.startWalkButtonText}>
          {activeWalk?.pet.id === item.id
            ? "🔴 Plimbare activă"
            : "Începe Plimbare"}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Animalele Mele</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleAddPet}>
          <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>
      </View>

      {pets.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🐾</Text>
          <Text style={styles.emptyText}>Nu ai încă animale adăugate</Text>
          <Text style={styles.emptySubtext}>
            Apasă + pentru a adăuga primul animal
          </Text>
        </View>
      ) : (
        <FlatList
          data={pets}
          renderItem={renderPetItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
        />
      )}

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={handleCancelModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingPet ? "Editează Animal" : "Adaugă Animal"}
              </Text>
              <TouchableOpacity onPress={handleCancelModal}>
                <Ionicons name="close" size={28} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.label}>Nume *</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Ex: Rex, Miau, etc."
                placeholderTextColor="#999"
              />

              <Text style={styles.label}>Tip Animal *</Text>
              <View style={styles.typeSelector}>
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    petType === "dog" && styles.typeButtonActive,
                  ]}
                  onPress={() => setPetType("dog")}
                >
                  <Text style={styles.typeIcon}>🐕</Text>
                  <Text
                    style={[
                      styles.typeText,
                      petType === "dog" && styles.typeTextActive,
                    ]}
                  >
                    Câine
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    petType === "cat" && styles.typeButtonActive,
                  ]}
                  onPress={() => setPetType("cat")}
                >
                  <Text style={styles.typeIcon}>🐈</Text>
                  <Text
                    style={[
                      styles.typeText,
                      petType === "cat" && styles.typeTextActive,
                    ]}
                  >
                    Pisică
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    petType === "other" && styles.typeButtonActive,
                  ]}
                  onPress={() => setPetType("other")}
                >
                  <Text style={styles.typeIcon}>🐾</Text>
                  <Text
                    style={[
                      styles.typeText,
                      petType === "other" && styles.typeTextActive,
                    ]}
                  >
                    Altul
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>Rasă (opțional)</Text>
              <TextInput
                style={styles.input}
                value={breed}
                onChangeText={setBreed}
                placeholder="Ex: Labrador, Persan, etc."
                placeholderTextColor="#999"
              />

              <Text style={styles.label}>Poză Profil (opțional)</Text>
              <View style={styles.photoSection}>
                {photoUri ? (
                  <View style={styles.photoPreviewContainer}>
                    <Image
                      source={{ uri: photoUri }}
                      style={styles.photoPreview}
                    />
                    <TouchableOpacity
                      style={styles.deletePhotoButton}
                      onPress={handleDeletePhoto}
                    >
                      <Ionicons name="close-circle" size={32} color="#ff3b30" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.noPhotoContainer}>
                    <Text style={styles.noPhotoEmoji}>
                      {getPetIcon(petType)}
                    </Text>
                    <Text style={styles.noPhotoText}>Nicio poză</Text>
                  </View>
                )}
                <TouchableOpacity
                  style={styles.takePhotoButton}
                  onPress={handleTakePhoto}
                >
                  <Ionicons name="camera" size={24} color="#fff" />
                  <Text style={styles.takePhotoButtonText}>
                    {photoUri ? "Schimbă Poza" : "Fă o Poză"}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCancelModal}
              >
                <Text style={styles.cancelButtonText}>Anulează</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSavePet}
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
  addButton: {
    backgroundColor: "#007AFF",
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    padding: 16,
  },
  petCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  petHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  petIcon: {
    fontSize: 48,
    marginRight: 16,
  },
  petInfo: {
    flex: 1,
  },
  petName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  petBreed: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  scheduleCount: {
    fontSize: 12,
    color: "#007AFF",
  },
  deleteButton: {
    padding: 8,
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
  input: {
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#333",
  },
  typeSelector: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  typeButton: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    padding: 16,
    marginHorizontal: 4,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  typeButtonActive: {
    borderColor: "#007AFF",
    backgroundColor: "#E3F2FD",
  },
  typeIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  typeText: {
    fontSize: 14,
    color: "#666",
  },
  typeTextActive: {
    color: "#007AFF",
    fontWeight: "600",
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
  startWalkButton: {
    backgroundColor: "#34C759",
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  activeWalkButton: {
    backgroundColor: "#FF3B30",
    opacity: 0.8,
  },
  startWalkButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  petPhoto: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginRight: 16,
    borderWidth: 2,
    borderColor: "#007AFF",
  },
  photoSection: {
    alignItems: "center",
    marginTop: 8,
    marginBottom: 16,
  },
  photoPreviewContainer: {
    position: "relative",
    marginBottom: 16,
  },
  photoPreview: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: "#007AFF",
  },
  deletePhotoButton: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: "#fff",
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  noPhotoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 2,
    borderColor: "#e0e0e0",
    borderStyle: "dashed",
  },
  noPhotoEmoji: {
    fontSize: 48,
    marginBottom: 4,
  },
  noPhotoText: {
    fontSize: 12,
    color: "#999",
  },
  takePhotoButton: {
    backgroundColor: "#007AFF",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  takePhotoButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
