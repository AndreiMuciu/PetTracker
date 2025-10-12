import React from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import AppNavigator from "./src/navigation/AppNavigator";
import WalkReminderModal from "./src/components/WalkReminderModal";
import { useImmersiveMode } from "./src/utils/useImmersiveMode";
import { WalkProvider } from "./src/context/WalkContext";

export default function App() {
  // Activează Immersive Mode pe Android
  // Navigation Bar-ul se ascunde și apare doar când tragi de jos în sus
  useImmersiveMode(true);

  return (
    <SafeAreaProvider>
      <WalkProvider>
        <AppNavigator />
        <WalkReminderModal />
        {/* Status bar ascuns complet - apare doar la swipe down */}
        <StatusBar style="auto" hidden />
      </WalkProvider>
    </SafeAreaProvider>
  );
}
