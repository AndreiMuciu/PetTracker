import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Pet,
  Route,
  Walk,
  FeedingSchedule,
  FoodInventory,
  FeedingLog,
} from "../types";

const PETS_KEY = "@pets";
const ROUTES_KEY = "@routes";
const WALKS_KEY = "@walks";
const FEEDING_SCHEDULES_KEY = "@feeding_schedules";
const FOOD_INVENTORY_KEY = "@food_inventory";
const FEEDING_LOGS_KEY = "@feeding_logs";

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

    // Sortă plimbările după data (cele mai recente prima)
    walks.sort((a, b) => {
      const dateA = new Date(b.startTime).getTime();
      const dateB = new Date(a.startTime).getTime();
      return dateA - dateB;
    });

    // Păstrează doar ultimele 20 de plimbări
    const limitedWalks = walks.slice(0, 20);

    await AsyncStorage.setItem(WALKS_KEY, JSON.stringify(limitedWalks));
  } catch (error) {
    console.error("Error saving walk:", error);
    throw error;
  }
};

export const deleteWalk = async (walkId: string): Promise<void> => {
  try {
    const walks = await getWalks();
    const filtered = walks.filter((w) => w.id !== walkId);
    await AsyncStorage.setItem(WALKS_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error("Error deleting walk:", error);
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

// ============ Feeding Schedule Storage ============

export const getFeedingSchedules = async (): Promise<FeedingSchedule[]> => {
  try {
    const data = await AsyncStorage.getItem(FEEDING_SCHEDULES_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Error getting feeding schedules:", error);
    return [];
  }
};

export const getFeedingSchedulesByPet = async (
  petId: string
): Promise<FeedingSchedule[]> => {
  try {
    const schedules = await getFeedingSchedules();
    return schedules.filter((s) => s.petId === petId);
  } catch (error) {
    console.error("Error getting feeding schedules by pet:", error);
    return [];
  }
};

export const saveFeedingSchedule = async (
  schedule: FeedingSchedule
): Promise<void> => {
  try {
    const schedules = await getFeedingSchedules();
    const existingIndex = schedules.findIndex((s) => s.id === schedule.id);

    if (existingIndex >= 0) {
      schedules[existingIndex] = schedule;
    } else {
      schedules.push(schedule);
    }

    await AsyncStorage.setItem(
      FEEDING_SCHEDULES_KEY,
      JSON.stringify(schedules)
    );
  } catch (error) {
    console.error("Error saving feeding schedule:", error);
    throw error;
  }
};

export const deleteFeedingSchedule = async (
  scheduleId: string
): Promise<void> => {
  try {
    const schedules = await getFeedingSchedules();
    const filtered = schedules.filter((s) => s.id !== scheduleId);
    await AsyncStorage.setItem(FEEDING_SCHEDULES_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error("Error deleting feeding schedule:", error);
    throw error;
  }
};

// ============ Food Inventory Storage ============

export const getFoodInventory = async (): Promise<FoodInventory[]> => {
  try {
    const data = await AsyncStorage.getItem(FOOD_INVENTORY_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Error getting food inventory:", error);
    return [];
  }
};

export const getFoodInventoryByPet = async (
  petId: string
): Promise<FoodInventory[]> => {
  try {
    const inventory = await getFoodInventory();
    return inventory.filter((i) => i.petId === petId);
  } catch (error) {
    console.error("Error getting food inventory by pet:", error);
    return [];
  }
};

export const saveFoodInventory = async (
  inventory: FoodInventory
): Promise<void> => {
  try {
    const allInventory = await getFoodInventory();
    const existingIndex = allInventory.findIndex((i) => i.id === inventory.id);

    if (existingIndex >= 0) {
      allInventory[existingIndex] = inventory;
    } else {
      allInventory.push(inventory);
    }

    await AsyncStorage.setItem(
      FOOD_INVENTORY_KEY,
      JSON.stringify(allInventory)
    );
  } catch (error) {
    console.error("Error saving food inventory:", error);
    throw error;
  }
};

export const deleteFoodInventory = async (
  inventoryId: string
): Promise<void> => {
  try {
    const inventory = await getFoodInventory();
    const filtered = inventory.filter((i) => i.id !== inventoryId);
    await AsyncStorage.setItem(FOOD_INVENTORY_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error("Error deleting food inventory:", error);
    throw error;
  }
};

export const recordFeeding = async (
  inventoryId: string,
  portionSize: number,
  petId: string
): Promise<{ inventory: FoodInventory; isLowStock: boolean }> => {
  try {
    const allInventory = await getFoodInventory();
    const inventoryIndex = allInventory.findIndex((i) => i.id === inventoryId);

    if (inventoryIndex < 0) {
      throw new Error("Inventory not found");
    }

    const inventory = allInventory[inventoryIndex];
    const newRemaining = Math.max(0, inventory.remainingAmount - portionSize);
    const updatedInventory: FoodInventory = {
      ...inventory,
      remainingAmount: newRemaining,
      lastFedAt: new Date(),
    };

    allInventory[inventoryIndex] = updatedInventory;
    await AsyncStorage.setItem(
      FOOD_INVENTORY_KEY,
      JSON.stringify(allInventory)
    );

    // Salvează în istoric
    const log: FeedingLog = {
      id: Date.now().toString(),
      petId,
      inventoryId,
      portionSize,
      fedAt: new Date(),
    };
    await saveFeedingLog(log);

    const isLowStock = newRemaining <= inventory.lowStockThreshold;
    return { inventory: updatedInventory, isLowStock };
  } catch (error) {
    console.error("Error recording feeding:", error);
    throw error;
  }
};

// ============ Feeding Log Storage ============

export const getFeedingLogs = async (): Promise<FeedingLog[]> => {
  try {
    const data = await AsyncStorage.getItem(FEEDING_LOGS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Error getting feeding logs:", error);
    return [];
  }
};

export const getFeedingLogsByPet = async (
  petId: string
): Promise<FeedingLog[]> => {
  try {
    const logs = await getFeedingLogs();
    return logs.filter((l) => l.petId === petId);
  } catch (error) {
    console.error("Error getting feeding logs by pet:", error);
    return [];
  }
};

export const saveFeedingLog = async (log: FeedingLog): Promise<void> => {
  try {
    const logs = await getFeedingLogs();
    logs.push(log);

    // Păstrează doar ultimele 100 de înregistrări
    logs.sort(
      (a, b) => new Date(b.fedAt).getTime() - new Date(a.fedAt).getTime()
    );
    const limitedLogs = logs.slice(0, 100);

    await AsyncStorage.setItem(FEEDING_LOGS_KEY, JSON.stringify(limitedLogs));
  } catch (error) {
    console.error("Error saving feeding log:", error);
    throw error;
  }
};

export const deleteFeedingLogsByInventory = async (
  inventoryId: string
): Promise<void> => {
  try {
    const logs = await getFeedingLogs();
    const filtered = logs.filter((l) => l.inventoryId !== inventoryId);
    await AsyncStorage.setItem(FEEDING_LOGS_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error("Error deleting feeding logs:", error);
    throw error;
  }
};
