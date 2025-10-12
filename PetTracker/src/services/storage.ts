import AsyncStorage from "@react-native-async-storage/async-storage";
import { Pet, Route, Walk } from "../types";

const PETS_KEY = "@pets";
const ROUTES_KEY = "@routes";
const WALKS_KEY = "@walks";

// Pet Storage
export const getPets = async (): Promise<Pet[]> => {
  try {
    const data = await AsyncStorage.getItem(PETS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Error getting pets:", error);
    return [];
  }
};

export const savePet = async (pet: Pet): Promise<void> => {
  try {
    const pets = await getPets();
    const existingIndex = pets.findIndex((p) => p.id === pet.id);

    if (existingIndex >= 0) {
      pets[existingIndex] = pet;
    } else {
      pets.push(pet);
    }

    await AsyncStorage.setItem(PETS_KEY, JSON.stringify(pets));
  } catch (error) {
    console.error("Error saving pet:", error);
    throw error;
  }
};

export const deletePet = async (petId: string): Promise<void> => {
  try {
    const pets = await getPets();
    const filtered = pets.filter((p) => p.id !== petId);
    await AsyncStorage.setItem(PETS_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error("Error deleting pet:", error);
    throw error;
  }
};

// Route Storage
export const getRoutes = async (): Promise<Route[]> => {
  try {
    const data = await AsyncStorage.getItem(ROUTES_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Error getting routes:", error);
    return [];
  }
};

export const saveRoute = async (route: Route): Promise<void> => {
  try {
    const routes = await getRoutes();
    const existingIndex = routes.findIndex((r) => r.id === route.id);

    if (existingIndex >= 0) {
      routes[existingIndex] = route;
    } else {
      routes.push(route);
    }

    await AsyncStorage.setItem(ROUTES_KEY, JSON.stringify(routes));
  } catch (error) {
    console.error("Error saving route:", error);
    throw error;
  }
};

export const deleteRoute = async (routeId: string): Promise<void> => {
  try {
    const routes = await getRoutes();
    const filtered = routes.filter((r) => r.id !== routeId);
    await AsyncStorage.setItem(ROUTES_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error("Error deleting route:", error);
    throw error;
  }
};

// Walk History Storage
export const getWalks = async (): Promise<Walk[]> => {
  try {
    const data = await AsyncStorage.getItem(WALKS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Error getting walks:", error);
    return [];
  }
};

export const saveWalk = async (walk: Walk): Promise<void> => {
  try {
    const walks = await getWalks();
    const existingIndex = walks.findIndex((w) => w.id === walk.id);

    if (existingIndex >= 0) {
      walks[existingIndex] = walk;
    } else {
      walks.push(walk);
    }

    await AsyncStorage.setItem(WALKS_KEY, JSON.stringify(walks));
  } catch (error) {
    console.error("Error saving walk:", error);
    throw error;
  }
};

export const getWalksByPet = async (petId: string): Promise<Walk[]> => {
  try {
    const walks = await getWalks();
    return walks.filter((w) => w.petId === petId);
  } catch (error) {
    console.error("Error getting walks by pet:", error);
    return [];
  }
};
