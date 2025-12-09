import React, { createContext, useContext, useState, useEffect } from "react";
import * as Location from "expo-location";
import { Pet, Walk, Coordinate } from "../types";
import { getWalks, saveWalk } from "../services/storage";
import { calculateDistance } from "../services/location";

interface ActiveWalk {
  pet: Pet;
  startTime: Date;
  coordinates: Coordinate[];
  distance: number;
}

interface WalkContextType {
  activeWalk: ActiveWalk | null;
  isTracking: boolean;
  startWalk: (pet: Pet) => void;
  stopWalk: () => Promise<void>;
  pauseWalk: () => void;
  resumeWalk: () => void;
}

const WalkContext = createContext<WalkContextType | undefined>(undefined);

export const WalkProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [activeWalk, setActiveWalk] = useState<ActiveWalk | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [locationSubscription, setLocationSubscription] =
    useState<Location.LocationSubscription | null>(null);

  // Cleanup la unmount
  useEffect(() => {
    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, [locationSubscription]);

  const startWalk = async (pet: Pet) => {
    try {
      // Verifică permisiuni
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.error("Permisiuni locație refuzate");
        return;
      }

      // Obține locația inițială
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const initialCoordinate: Coordinate = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      // Creează walk-ul activ
      const newWalk: ActiveWalk = {
        pet,
        startTime: new Date(),
        coordinates: [initialCoordinate],
        distance: 0,
      };

      setActiveWalk(newWalk);
      setIsTracking(true);

      // Începe tracking-ul locației
      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000, // Update la fiecare 5 secunde
          distanceInterval: 10, // Sau la fiecare 10 metri
        },
        (newLocation) => {
          const newCoordinate: Coordinate = {
            latitude: newLocation.coords.latitude,
            longitude: newLocation.coords.longitude,
          };

          setActiveWalk((prev) => {
            if (!prev) return null;

            // Verifică dacă coordonata nouă este diferită de ultima
            const lastCoord = prev.coordinates[prev.coordinates.length - 1];

            // Calculează distanța față de ultimul punct
            const distanceFromLast = getDistanceBetweenPoints(
              lastCoord,
              newCoordinate
            );

            // Adaugă doar dacă s-a mișcat mai mult de 5 metri (pentru a evita noise GPS)
            if (distanceFromLast < 5) {
              return prev; // Nu adăuga coordonata, returnează starea anterioară
            }

            const updatedCoordinates = [...prev.coordinates, newCoordinate];
            const updatedDistance = calculateDistance(updatedCoordinates);

            return {
              ...prev,
              coordinates: updatedCoordinates,
              distance: updatedDistance,
            };
          });
        }
      );

      setLocationSubscription(subscription);
      console.log(`🐾 Plimbare începută cu ${pet.name}`);
    } catch (error) {
      console.error("Eroare la începerea plimbării:", error);
    }
  };

  const stopWalk = async () => {
    if (!activeWalk) return;

    try {
      // Oprește tracking-ul
      if (locationSubscription) {
        locationSubscription.remove();
        setLocationSubscription(null);
      }

      // Calculează durata
      const endTime = new Date();
      const durationMs = endTime.getTime() - activeWalk.startTime.getTime();
      const durationMinutes = Math.round(durationMs / 60000);

      // Salvează walk-ul în istoric
      const walk: Walk = {
        id: Date.now().toString(),
        petId: activeWalk.pet.id,
        startTime: activeWalk.startTime,
        endTime: endTime,
        distance: activeWalk.distance,
        coordinates: activeWalk.coordinates,
        completed: true,
      };

      await saveWalk(walk);

      console.log(
        `✅ Plimbare salvată: ${durationMinutes} min, ${activeWalk.distance.toFixed(
          2
        )} km`
      );

      // Resetează starea
      setActiveWalk(null);
      setIsTracking(false);
    } catch (error) {
      console.error("Eroare la salvarea plimbării:", error);
    }
  };

  const pauseWalk = () => {
    if (locationSubscription) {
      locationSubscription.remove();
      setLocationSubscription(null);
    }
    setIsTracking(false);
    console.log("⏸️ Plimbare pusă pe pauză");
  };

  const resumeWalk = async () => {
    if (!activeWalk) return;

    try {
      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000,
          distanceInterval: 10,
        },
        (newLocation) => {
          const newCoordinate: Coordinate = {
            latitude: newLocation.coords.latitude,
            longitude: newLocation.coords.longitude,
          };

          setActiveWalk((prev) => {
            if (!prev) return null;

            // Verifică dacă coordonata nouă este diferită de ultima
            const lastCoord = prev.coordinates[prev.coordinates.length - 1];

            // Calculează distanța față de ultimul punct
            const distanceFromLast = getDistanceBetweenPoints(
              lastCoord,
              newCoordinate
            );

            // Adaugă doar dacă s-a mișcat mai mult de 5 metri (pentru a evita noise GPS)
            if (distanceFromLast < 5) {
              return prev; // Nu adăuga coordonata, returnează starea anterioară
            }

            const updatedCoordinates = [...prev.coordinates, newCoordinate];
            const updatedDistance = calculateDistance(updatedCoordinates);

            return {
              ...prev,
              coordinates: updatedCoordinates,
              distance: updatedDistance,
            };
          });
        }
      );

      setLocationSubscription(subscription);
      setIsTracking(true);
      console.log("▶️ Plimbare reluată");
    } catch (error) {
      console.error("Eroare la reluarea plimbării:", error);
    }
  };

  // Helper function pentru distanță între 2 puncte
  const getDistanceBetweenPoints = (
    from: Coordinate,
    to: Coordinate
  ): number => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (from.latitude * Math.PI) / 180;
    const φ2 = (to.latitude * Math.PI) / 180;
    const Δφ = ((to.latitude - from.latitude) * Math.PI) / 180;
    const Δλ = ((to.longitude - from.longitude) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  return (
    <WalkContext.Provider
      value={{
        activeWalk,
        isTracking,
        startWalk,
        stopWalk,
        pauseWalk,
        resumeWalk,
      }}
    >
      {children}
    </WalkContext.Provider>
  );
};

export const useWalk = () => {
  const context = useContext(WalkContext);
  if (!context) {
    throw new Error("useWalk trebuie folosit în interiorul WalkProvider");
  }
  return context;
};
