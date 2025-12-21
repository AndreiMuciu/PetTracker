export interface Pet {
  id: string;
  name: string;
  type: "dog" | "cat" | "other";
  breed?: string;
  photo?: string; // URI de la cameră, dacă există
  photoUri?: string; // Alias pentru compatibilitate
  walkSchedule: WalkSchedule[];
  createdAt: Date;
}

export interface WalkSchedule {
  id: string;
  time: string; // Format: "HH:mm"
  daysOfWeek: number[]; // 0-6 (Sunday-Saturday)
  enabled: boolean;
  notificationId?: string;
}

export interface Route {
  id: string;
  name: string;
  coordinates: Coordinate[];
  distance: number; // in meters
  duration?: number; // in minutes
  isFavorite: boolean;
  createdAt: Date;
}

export interface Coordinate {
  latitude: number;
  longitude: number;
}

export interface Walk {
  id: string;
  petId: string;
  routeId?: string;
  startTime: Date;
  endTime?: Date;
  distance?: number;
  coordinates?: Coordinate[];
  completed: boolean;
}

export interface NotificationSettings {
  enabled: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

// Feeding Schedule - Program pentru hrănire
export interface FeedingSchedule {
  id: string;
  petId: string;
  time: string; // Format: "HH:mm"
  daysOfWeek: number[]; // 0-6 (Sunday-Saturday)
  enabled: boolean;
  portionSize: number; // Grame per porție
  foodType?: string; // Tipul mâncării (ex: "uscată", "umedă")
  inventoryId?: string; // ID-ul inventarului legat (pentru scădere automată)
  notificationId?: string;
}

// Food Inventory - Inventar mâncare
export interface FoodInventory {
  id: string;
  petId: string;
  foodName: string; // Numele mâncării
  totalAmount: number; // Cantitatea totală în grame
  remainingAmount: number; // Cantitatea rămasă în grame
  portionSize: number; // Grame per porție
  lowStockThreshold: number; // Prag pentru notificare stoc redus (în grame)
  unit: "g" | "kg"; // Unitatea de măsură afișată
  createdAt: Date;
  lastFedAt?: Date; // Ultima hrănire
}

// Feeding Log - Istoric hrăniri
export interface FeedingLog {
  id: string;
  petId: string;
  inventoryId: string;
  portionSize: number;
  fedAt: Date;
  notes?: string;
}
