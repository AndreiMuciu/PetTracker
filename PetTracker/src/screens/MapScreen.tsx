import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  FlatList,
} from "react-native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";
import { Route, Coordinate } from "../types";
import { getRoutes, saveRoute, deleteRoute } from "../services/storage";
import {
  getCurrentLocation,
  requestLocationPermission,
  calculateDistance,
  formatDistance,
} from "../services/location";
import { useWalk } from "../context/WalkContext";

export default function MapScreen() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [currentLocation, setCurrentLocation] = useState<Coordinate | null>(
    null
  );
  const [drawingMode, setDrawingMode] = useState(false);
  const [currentRoute, setCurrentRoute] = useState<Coordinate[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [routeName, setRouteName] = useState("");
  const [showRoutesList, setShowRoutesList] = useState(false);
  const mapRef = useRef<MapView>(null);

  // Walk tracking context
  const { activeWalk, isTracking, stopWalk, pauseWalk, resumeWalk } = useWalk();

  useEffect(() => {
    initializeLocation();
    loadRoutes();
  }, []);

  const initializeLocation = async () => {
    const hasPermission = await requestLocationPermission();
    if (hasPermission) {
      const location = await getCurrentLocation();
      if (location) {
        setCurrentLocation(location);
        // Centrează harta pe locația curentă
        if (mapRef.current) {
          mapRef.current.animateToRegion(
            {
              latitude: location.latitude,
              longitude: location.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            },
            1000
          );
        }
      }
    }
  };

  const loadRoutes = async () => {
    const loadedRoutes = await getRoutes();
    setRoutes(loadedRoutes);
  };

  const handleMapPress = (e: any) => {
    if (!drawingMode) return;

    const coordinate: Coordinate = {
      latitude: e.nativeEvent.coordinate.latitude,
      longitude: e.nativeEvent.coordinate.longitude,
    };

    setCurrentRoute([...currentRoute, coordinate]);
  };

  const handleStartDrawing = () => {
    setDrawingMode(true);
    setCurrentRoute([]);
    setSelectedRoute(null);
  };

  const handleCancelDrawing = () => {
    Alert.alert(
      "Anulează Traseu",
      "Ești sigur că vrei să anulezi traseul curent?",
      [
        { text: "Nu", style: "cancel" },
        {
          text: "Da",
          style: "destructive",
          onPress: () => {
            setDrawingMode(false);
            setCurrentRoute([]);
          },
        },
      ]
    );
  };

  const handleSaveRoute = () => {
    if (currentRoute.length < 2) {
      Alert.alert(
        "Eroare",
        "Trebuie să ai cel puțin 2 puncte pentru un traseu"
      );
      return;
    }

    setRouteName("");
    setModalVisible(true);
  };

  const confirmSaveRoute = async () => {
    if (!routeName.trim()) {
      Alert.alert("Eroare", "Te rog introdu un nume pentru traseu");
      return;
    }

    const distance = calculateDistance(currentRoute);
    const newRoute: Route = {
      id: Date.now().toString(),
      name: routeName,
      coordinates: currentRoute,
      distance,
      isFavorite: false,
      createdAt: new Date(),
    };

    await saveRoute(newRoute);
    await loadRoutes();

    setDrawingMode(false);
    setCurrentRoute([]);
    setModalVisible(false);
    Alert.alert("Success", "Traseu salvat cu succes!");
  };

  const handleSelectRoute = (route: Route) => {
    setSelectedRoute(route);
    setShowRoutesList(false);

    if (route.coordinates.length > 0 && mapRef.current) {
      mapRef.current.fitToCoordinates(route.coordinates, {
        edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
        animated: true,
      });
    }
  };

  const handleDeleteRoute = (route: Route) => {
    Alert.alert(
      "Șterge Traseu",
      `Ești sigur că vrei să ștergi traseul "${route.name}"?`,
      [
        { text: "Anulează", style: "cancel" },
        {
          text: "Șterge",
          style: "destructive",
          onPress: async () => {
            await deleteRoute(route.id);
            await loadRoutes();
            if (selectedRoute?.id === route.id) {
              setSelectedRoute(null);
            }
          },
        },
      ]
    );
  };

  const toggleFavorite = async (route: Route) => {
    const updatedRoute = { ...route, isFavorite: !route.isFavorite };
    await saveRoute(updatedRoute);
    await loadRoutes();
    if (selectedRoute?.id === route.id) {
      setSelectedRoute(updatedRoute);
    }
  };

  const renderRouteItem = ({ item }: { item: Route }) => (
    <TouchableOpacity
      style={styles.routeItem}
      onPress={() => handleSelectRoute(item)}
    >
      <View style={styles.routeInfo}>
        <View style={styles.routeHeader}>
          <Text style={styles.routeName}>{item.name}</Text>
          <TouchableOpacity onPress={() => toggleFavorite(item)}>
            <Ionicons
              name={item.isFavorite ? "star" : "star-outline"}
              size={24}
              color={item.isFavorite ? "#FFD700" : "#999"}
            />
          </TouchableOpacity>
        </View>
        <Text style={styles.routeDistance}>
          {formatDistance(item.distance)}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.deleteRouteButton}
        onPress={() => handleDeleteRoute(item)}
      >
        <Ionicons name="trash-outline" size={20} color="#ff3b30" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={
          currentLocation
            ? {
                latitude: currentLocation.latitude,
                longitude: currentLocation.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }
            : {
                latitude: 44.4268, // București default
                longitude: 26.1025,
                latitudeDelta: 0.1,
                longitudeDelta: 0.1,
              }
        }
        onPress={handleMapPress}
        showsUserLocation
        showsMyLocationButton
      >
        {/* Current drawing route */}
        {currentRoute.length > 0 && (
          <>
            <Polyline
              coordinates={currentRoute}
              strokeColor="#007AFF"
              strokeWidth={4}
            />
            {currentRoute.map((coord, index) => (
              <Marker key={`current-${index}`} coordinate={coord}>
                <View style={styles.markerDot} />
              </Marker>
            ))}
          </>
        )}

        {/* Selected saved route */}
        {selectedRoute && (
          <>
            <Polyline
              coordinates={selectedRoute.coordinates}
              strokeColor="#34C759"
              strokeWidth={4}
            />
            {selectedRoute.coordinates.map((coord, index) => (
              <Marker
                key={`selected-${index}`}
                coordinate={coord}
                pinColor="#34C759"
              />
            ))}
          </>
        )}

        {/* Active walk tracking */}
        {activeWalk && activeWalk.coordinates.length > 0 && (
          <>
            <Polyline
              coordinates={activeWalk.coordinates}
              strokeColor="#FF3B30"
              strokeWidth={5}
            />
            <Marker
              coordinate={
                activeWalk.coordinates[activeWalk.coordinates.length - 1]
              }
              title="Locația curentă"
              pinColor="#FF3B30"
            />
          </>
        )}
      </MapView>

      {/* Active Walk Tracker */}
      {activeWalk && (
        <View style={styles.walkTracker}>
          <View style={styles.walkHeader}>
            <View style={styles.walkPetInfo}>
              <Ionicons name="paw" size={24} color="#FF3B30" />
              <Text style={styles.walkPetName}>{activeWalk.pet.name}</Text>
            </View>
            <Text style={styles.walkStatus}>
              {isTracking ? "🔴 În desfășurare" : "⏸️ Pauză"}
            </Text>
          </View>

          <View style={styles.walkStats}>
            <View style={styles.walkStat}>
              <Text style={styles.walkStatLabel}>Distanță</Text>
              <Text style={styles.walkStatValue}>
                {activeWalk.distance
                  ? formatDistance(activeWalk.distance)
                  : "0 m"}
              </Text>
            </View>
            <View style={styles.walkStat}>
              <Text style={styles.walkStatLabel}>Durată</Text>
              <Text style={styles.walkStatValue}>
                {Math.round(
                  (Date.now() - activeWalk.startTime.getTime()) / 60000
                )}{" "}
                min
              </Text>
            </View>
          </View>

          <View style={styles.walkControls}>
            {isTracking ? (
              <TouchableOpacity style={styles.pauseButton} onPress={pauseWalk}>
                <Ionicons name="pause" size={20} color="#fff" />
                <Text style={styles.walkButtonText}>Pauză</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.resumeButton}
                onPress={resumeWalk}
              >
                <Ionicons name="play" size={20} color="#fff" />
                <Text style={styles.walkButtonText}>Reia</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.stopWalkButton}
              onPress={() => {
                Alert.alert(
                  "Oprește Plimbarea",
                  "Sigur vrei să oprești plimbarea? Va fi salvată în istoric.",
                  [
                    { text: "Anulează", style: "cancel" },
                    {
                      text: "Oprește",
                      style: "destructive",
                      onPress: stopWalk,
                    },
                  ]
                );
              }}
            >
              <Ionicons name="stop" size={20} color="#fff" />
              <Text style={styles.walkButtonText}>Oprește</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Control Panel */}
      <View style={styles.controlPanel}>
        {!drawingMode ? (
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleStartDrawing}
            >
              <Ionicons name="pencil" size={20} color="#fff" />
              <Text style={styles.primaryButtonText}>Desenează Traseu</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => setShowRoutesList(true)}
            >
              <Ionicons name="list" size={20} color="#007AFF" />
              <Text style={styles.secondaryButtonText}>
                Trasee ({routes.length})
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.drawingControls}>
            <Text style={styles.drawingText}>
              Apasă pe hartă pentru a adăuga puncte ({currentRoute.length}{" "}
              puncte)
            </Text>
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCancelDrawing}
              >
                <Text style={styles.cancelButtonText}>Anulează</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.saveRouteButton,
                  currentRoute.length < 2 && styles.disabledButton,
                ]}
                onPress={handleSaveRoute}
                disabled={currentRoute.length < 2}
              >
                <Text style={styles.saveRouteButtonText}>Salvează Traseu</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* Routes List Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showRoutesList}
        onRequestClose={() => setShowRoutesList(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.routesModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Traseele Mele</Text>
              <TouchableOpacity onPress={() => setShowRoutesList(false)}>
                <Ionicons name="close" size={28} color="#333" />
              </TouchableOpacity>
            </View>
            {routes.length === 0 ? (
              <View style={styles.emptyRoutes}>
                <Text style={styles.emptyIcon}>🗺️</Text>
                <Text style={styles.emptyText}>Nu ai trasee salvate</Text>
              </View>
            ) : (
              <FlatList
                data={routes}
                renderItem={renderRouteItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.routesList}
              />
            )}
          </View>
        </View>
      </Modal>

      {/* Save Route Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.saveModal}>
            <Text style={styles.modalTitle}>Salvează Traseu</Text>
            <TextInput
              style={styles.input}
              value={routeName}
              onChangeText={setRouteName}
              placeholder="Nume traseu (ex: Parcul Central)"
              placeholderTextColor="#999"
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Anulează</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSaveButton}
                onPress={confirmSaveRoute}
              >
                <Text style={styles.primaryButtonText}>Salvează</Text>
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
  },
  map: {
    flex: 1,
  },
  markerDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#007AFF",
    borderWidth: 2,
    borderColor: "#fff",
  },
  controlPanel: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: "#007AFF",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: "#E3F2FD",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  secondaryButtonText: {
    color: "#007AFF",
    fontSize: 16,
    fontWeight: "600",
  },
  drawingControls: {
    gap: 12,
  },
  drawingText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 8,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "600",
  },
  saveRouteButton: {
    flex: 1,
    backgroundColor: "#34C759",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  saveRouteButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  disabledButton: {
    opacity: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  routesModal: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "70%",
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
  routesList: {
    padding: 16,
  },
  routeItem: {
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  routeInfo: {
    flex: 1,
  },
  routeHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  routeName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  routeDistance: {
    fontSize: 14,
    color: "#007AFF",
  },
  deleteRouteButton: {
    padding: 8,
    marginLeft: 12,
  },
  emptyRoutes: {
    padding: 40,
    alignItems: "center",
  },
  emptyIcon: {
    fontSize: 60,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
  },
  saveModal: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    margin: 20,
  },
  input: {
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#333",
    marginVertical: 16,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
  },
  modalSaveButton: {
    flex: 1,
    backgroundColor: "#007AFF",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
  },
  // Walk Tracker Styles
  walkTracker: {
    position: "absolute",
    top: 20,
    left: 16,
    right: 16,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
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
    gap: 8,
  },
  walkPetName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  walkStatus: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FF3B30",
  },
  walkStats: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 12,
  },
  walkStat: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
  },
  walkStatLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  walkStatValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#007AFF",
  },
  walkControls: {
    flexDirection: "row",
    gap: 12,
  },
  pauseButton: {
    flex: 1,
    backgroundColor: "#FF9500",
    borderRadius: 8,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  resumeButton: {
    flex: 1,
    backgroundColor: "#34C759",
    borderRadius: 8,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  stopWalkButton: {
    flex: 1,
    backgroundColor: "#FF3B30",
    borderRadius: 8,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  walkButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
});
