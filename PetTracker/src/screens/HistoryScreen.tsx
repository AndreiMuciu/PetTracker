import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Walk, Pet } from "../types";
import { getWalks, getPets } from "../services/storage";
import { formatDistance } from "../services/location";

export default function HistoryScreen() {
  const [walks, setWalks] = useState<Walk[]>([]);
  const [pets, setPets] = useState<Pet[]>([]);
  const [selectedPetId, setSelectedPetId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [loadedWalks, loadedPets] = await Promise.all([
      getWalks(),
      getPets(),
    ]);
    setWalks(
      loadedWalks.sort(
        (a, b) =>
          new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
      )
    );
    setPets(loadedPets);
  };

  const getPetById = (petId: string) => {
    return pets.find((p) => p.id === petId);
  };

  const filteredWalks = selectedPetId
    ? walks.filter((w) => w.petId === selectedPetId)
    : walks;

  const getTotalStats = () => {
    const totalWalks = filteredWalks.filter((w) => w.completed).length;
    const totalDistance = filteredWalks
      .filter((w) => w.completed && w.distance)
      .reduce((sum, w) => sum + (w.distance || 0), 0);

    const totalDuration = filteredWalks
      .filter((w) => w.completed && w.startTime && w.endTime)
      .reduce((sum, w) => {
        const start = new Date(w.startTime).getTime();
        const end = new Date(w.endTime!).getTime();
        return sum + (end - start);
      }, 0);

    const avgDuration = totalWalks > 0 ? totalDuration / totalWalks / 60000 : 0; // in minutes

    return { totalWalks, totalDistance, avgDuration };
  };

  const stats = getTotalStats();

  const formatDate = (date: Date) => {
    const d = new Date(date);
    return d.toLocaleDateString("ro-RO", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatDuration = (startTime: Date, endTime?: Date) => {
    if (!endTime) return "În desfășurare";

    const start = new Date(startTime).getTime();
    const end = new Date(endTime).getTime();
    const minutes = Math.floor((end - start) / 60000);

    if (minutes < 60) return `${minutes} min`;

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}min`;
  };

  const renderWalkItem = ({ item }: { item: Walk }) => {
    const pet = getPetById(item.petId);
    if (!pet) return null;

    return (
      <View style={styles.walkCard}>
        <View style={styles.walkHeader}>
          <View style={styles.walkPetInfo}>
            <Text style={styles.walkPetIcon}>
              {pet.type === "dog" ? "🐕" : pet.type === "cat" ? "🐈" : "🐾"}
            </Text>
            <View>
              <Text style={styles.walkPetName}>{pet.name}</Text>
              <Text style={styles.walkDate}>{formatDate(item.startTime)}</Text>
            </View>
          </View>
          {item.completed ? (
            <Ionicons name="checkmark-circle" size={28} color="#34C759" />
          ) : (
            <Ionicons name="ellipse-outline" size={28} color="#FF9500" />
          )}
        </View>

        <View style={styles.walkStats}>
          {item.distance !== undefined && item.distance > 0 && (
            <View style={styles.statItem}>
              <Ionicons name="navigate" size={20} color="#007AFF" />
              <Text style={styles.statText}>
                {formatDistance(item.distance)}
              </Text>
            </View>
          )}
          <View style={styles.statItem}>
            <Ionicons name="time" size={20} color="#007AFF" />
            <Text style={styles.statText}>
              {formatDuration(item.startTime, item.endTime)}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Istoric Plimbări</Text>
      </View>

      {/* Statistics Panel */}
      <View style={styles.statsPanel}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.totalWalks}</Text>
          <Text style={styles.statLabel}>Plimbări</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>
            {stats.totalDistance > 0
              ? formatDistance(stats.totalDistance)
              : "0 m"}
          </Text>
          <Text style={styles.statLabel}>Distanță</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{Math.round(stats.avgDuration)}</Text>
          <Text style={styles.statLabel}>Min/Plimbare</Text>
        </View>
      </View>

      {/* Pet Filter */}
      {pets.length > 0 && (
        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              !selectedPetId && styles.filterButtonActive,
            ]}
            onPress={() => setSelectedPetId(null)}
          >
            <Text
              style={[
                styles.filterButtonText,
                !selectedPetId && styles.filterButtonTextActive,
              ]}
            >
              Toate
            </Text>
          </TouchableOpacity>
          {pets.map((pet) => (
            <TouchableOpacity
              key={pet.id}
              style={[
                styles.filterButton,
                selectedPetId === pet.id && styles.filterButtonActive,
              ]}
              onPress={() => setSelectedPetId(pet.id)}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  selectedPetId === pet.id && styles.filterButtonTextActive,
                ]}
              >
                {pet.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Walks List */}
      {filteredWalks.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🚶</Text>
          <Text style={styles.emptyText}>
            {selectedPetId
              ? "Nu există plimbări pentru acest animal"
              : "Nu ai plimbări încă"}
          </Text>
          <Text style={styles.emptySubtext}>
            Plimbările tale vor apărea aici
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredWalks}
          renderItem={renderWalkItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
        />
      )}
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
  statsPanel: {
    flexDirection: "row",
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#007AFF",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
  },
  filterContainer: {
    flexDirection: "row",
    padding: 16,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  filterButtonActive: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  filterButtonText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "600",
  },
  filterButtonTextActive: {
    color: "#fff",
  },
  listContent: {
    padding: 16,
  },
  walkCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  walkHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  walkPetInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  walkPetIcon: {
    fontSize: 32,
  },
  walkPetName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  walkDate: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  walkStats: {
    flexDirection: "row",
    gap: 20,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statText: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
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
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
});
