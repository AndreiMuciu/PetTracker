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

// Medical - Secțiune Medicală

// Vaccine - Vaccinuri
export interface Vaccine {
  id: string;
  petId: string;
  name: string; // Ex: "Rabies", "DHPP", "Antirabic"
  administeredDate: Date;
  nextDueDate?: Date; // Data următoarei doze
  veterinarian?: string; // Numele veterinarului
  clinic?: string; // Clinica veterinară
  batchNumber?: string; // Numărul lotului
  notes?: string;
  completed: boolean; // Dacă este complet sau necesită rapel
  notificationId?: string; // ID-urile notificărilor programate
}

// Treatment - Tratamente
export interface Treatment {
  id: string;
  petId: string;
  name: string; // Ex: "Antibiotic", "Antiparazitar"
  type: "medication" | "supplement" | "therapy" | "other";
  startDate: Date;
  endDate?: Date;
  frequency?: string; // Ex: "2x pe zi", "o dată pe săptămână"
  dosage?: string; // Ex: "5mg", "1 tabletă"
  prescribedBy?: string; // Veterinarul care a prescris
  notes?: string;
  completed: boolean;
  remindersEnabled: boolean;
}

// Vet Visit - Vizite la veterinar
export interface VetVisit {
  id: string;
  petId: string;
  date: Date;
  reason: string; // Motivul vizitei
  diagnosis?: string;
  treatment?: string;
  veterinarian?: string;
  clinic?: string;
  cost?: number;
  nextVisitDate?: Date;
  notes?: string;
  documents?: string[]; // URIs pentru documentele scanate
}

// Health Recommendation - Recomandări de sănătate
export interface HealthRecommendation {
  id: string;
  title: string;
  description: string;
  category:
    | "vaccination"
    | "deworming"
    | "dental"
    | "grooming"
    | "nutrition"
    | "exercise"
    | "general";
  petType?: "dog" | "cat" | "all"; // Pentru ce tip de animal este recomandarea
  frequency?: string; // Ex: "La fiecare 6 luni"
  priority: "high" | "medium" | "low";
}
