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
import { WebView } from "react-native-webview";
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
  const webViewRef = useRef<WebView>(null);
  const [hasInitializedMap, setHasInitializedMap] = useState(false);

  // Walk tracking context
  const { activeWalk, isTracking, stopWalk, pauseWalk, resumeWalk } = useWalk();

  useEffect(() => {
    initializeLocation();
    loadRoutes();
  }, []);

  useEffect(() => {
    // Center map on first location, then just update
    if (currentLocation && !hasInitializedMap) {
      updateMap(true);
      setHasInitializedMap(true);
    } else {
      updateMap();
    }
  }, [currentLocation, currentRoute, selectedRoute, activeWalk]);

  const updateMap = (centerOnUser = false) => {
    if (!webViewRef.current) return;

    const data = {
      type: "updateMap",
      currentLocation,
      currentRoute,
      selectedRoute,
      activeWalk: activeWalk ? { coordinates: activeWalk.coordinates } : null,
      drawingMode,
      centerOnUser,
    };

    // For iOS, postMessage expects a string
    // The JavaScript side will parse it correctly
    webViewRef.current.injectJavaScript(`
      window.postMessage(${JSON.stringify(JSON.stringify(data))}, '*');
      true;
    `);
  };

  const centerOnUserLocation = () => {
    if (currentLocation) {
      updateMap(true);
    }
  };

  const handleMessage = (event: any) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);

      if (message.type === "mapPress" && drawingMode) {
        const coordinate: Coordinate = {
          latitude: message.latitude,
          longitude: message.longitude,
        };
        setCurrentRoute([...currentRoute, coordinate]);
      }
    } catch (error) {
      console.error("Error parsing message from WebView:", error);
    }
  };

  const initializeLocation = async () => {
    const hasPermission = await requestLocationPermission();
    if (hasPermission) {
      const location = await getCurrentLocation();
      if (location) {
        setCurrentLocation(location);
      }
    }
  };

  // Live location tracking
  useEffect(() => {
    const locationInterval = setInterval(async () => {
      const location = await getCurrentLocation();
      if (location) {
        setCurrentLocation(location);
      }
    }, 5000); // Update every 5 seconds

    return () => clearInterval(locationInterval);
  }, []);

  const loadRoutes = async () => {
    const loadedRoutes = await getRoutes();
    setRoutes(loadedRoutes);
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

    if (route.coordinates.length > 0 && webViewRef.current) {
      // Send command to fit bounds for selected route
      const bounds = route.coordinates.map((c) => [c.latitude, c.longitude]);
      webViewRef.current.postMessage(
        JSON.stringify({
          type: "fitBounds",
          bounds: bounds,
        })
      );
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

  const leafletHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
        body { margin: 0; padding: 0; }
        #map { width: 100%; height: 100vh; }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        const map = L.map('map', {
          zoomControl: true,
          attributionControl: false
        }).setView([44.4268, 26.1025], 13);

        // Voyager theme - dark but not too dark, nice balance
        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
          maxZoom: 19,
          attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
        }).addTo(map);

        let currentRouteLayer = null;
        let selectedRouteLayer = null;
        let activeWalkLayer = null;
        let userLocationMarker = null;

        // Handle map clicks
        map.on('click', function(e) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'mapPress',
            latitude: e.latlng.lat,
            longitude: e.latlng.lng
          }));
        });

        // Listen for messages from React Native
        function handleMessage(event) {
          let data;
          try {
            data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
          } catch (e) {
            console.log('Failed to parse message:', e);
            return;
          }
          
          if (data.type === 'fitBounds' && data.bounds && data.bounds.length > 0) {
            map.fitBounds(data.bounds, { padding: [50, 50] });
          }
          else if (data.type === 'updateMap') {
            // Clear existing layers
            if (currentRouteLayer) {
              map.removeLayer(currentRouteLayer);
              currentRouteLayer = null;
            }
            if (selectedRouteLayer) {
              map.removeLayer(selectedRouteLayer);
              selectedRouteLayer = null;
            }
            if (activeWalkLayer) {
              map.removeLayer(activeWalkLayer);
              activeWalkLayer = null;
            }

            // Draw current route
            if (data.currentRoute && data.currentRoute.length > 0) {
              const latlngs = data.currentRoute.map(c => [c.latitude, c.longitude]);
              currentRouteLayer = L.featureGroup();
              
              L.polyline(latlngs, {
                color: '#00D9FF',
                weight: 5,
                opacity: 0.9
              }).addTo(currentRouteLayer);
              
              latlngs.forEach(latlng => {
                L.circleMarker(latlng, {
                  radius: 7,
                  fillColor: '#00D9FF',
                  color: '#1a1a1a',
                  weight: 3,
                  fillOpacity: 1
                }).addTo(currentRouteLayer);
              });
              
              currentRouteLayer.addTo(map);
            }

            // Draw selected route
            if (data.selectedRoute && data.selectedRoute.coordinates) {
              const latlngs = data.selectedRoute.coordinates.map(c => [c.latitude, c.longitude]);
              selectedRouteLayer = L.featureGroup();
              
              L.polyline(latlngs, {
                color: '#30D158',
                weight: 5,
                opacity: 0.9
              }).addTo(selectedRouteLayer);
              
              latlngs.forEach(latlng => {
                L.circleMarker(latlng, {
                  radius: 7,
                  fillColor: '#30D158',
                  color: '#1a1a1a',
                  weight: 3,
                  fillOpacity: 1
                }).addTo(selectedRouteLayer);
              });
              
              selectedRouteLayer.addTo(map);
            }

            // Draw active walk
            if (data.activeWalk && data.activeWalk.coordinates && data.activeWalk.coordinates.length > 0) {
              const latlngs = data.activeWalk.coordinates.map(c => [c.latitude, c.longitude]);
              activeWalkLayer = L.featureGroup();
              
              L.polyline(latlngs, {
                color: '#FF453A',
                weight: 6,
                opacity: 0.95
              }).addTo(activeWalkLayer);
              
              const lastPoint = latlngs[latlngs.length - 1];
              L.marker(lastPoint, {
                icon: L.divIcon({
                  className: 'custom-marker',
                  html: '<div style="background-color: #FF453A; width: 24px; height: 24px; border-radius: 50%; border: 4px solid #1a1a1a; box-shadow: 0 0 20px rgba(255, 69, 58, 0.8);"></div>',
                  iconSize: [24, 24]
                })
              }).addTo(activeWalkLayer);
              
              activeWalkLayer.addTo(map);
            }

            // Update user location marker
            if (data.currentLocation) {
              if (userLocationMarker) {
                map.removeLayer(userLocationMarker);
              }
              userLocationMarker = L.marker([data.currentLocation.latitude, data.currentLocation.longitude], {
                icon: L.divIcon({
                  className: 'user-location',
                  html: '<div style="background-color: #00D9FF; width: 16px; height: 16px; border-radius: 50%; border: 4px solid #1a1a1a; box-shadow: 0 0 15px rgba(0, 217, 255, 0.7);"></div>',
                  iconSize: [16, 16]
                })
              }).addTo(map);
              
              // Center map on user location if requested or first time
              if (data.centerOnUser) {
                map.setView([data.currentLocation.latitude, data.currentLocation.longitude], 15);
              }
            }
          }
        }
        
        // Support both Android and iOS
        document.addEventListener('message', handleMessage);
        window.addEventListener('message', handleMessage);
      </script>
    </body>
    </html>
  `;

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        style={styles.map}
        source={{ html: leafletHTML }}
        onMessage={handleMessage}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
      />

      {/* My Location Button */}
      <TouchableOpacity
        style={styles.myLocationButton}
        onPress={centerOnUserLocation}
      >
        <Ionicons name="locate" size={24} color="#007AFF" />
      </TouchableOpacity>

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
  myLocationButton: {
    position: "absolute",
    top: 60,
    right: 16,
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
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
