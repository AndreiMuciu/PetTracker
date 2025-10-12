export interface Pet {
  id: string;
  name: string;
  type: "dog" | "cat" | "other";
  breed?: string;
  photo?: string;
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
