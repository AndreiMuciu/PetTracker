import { useEffect } from "react";
import { Platform } from "react-native";
import * as NavigationBar from "expo-navigation-bar";

/**
 * Hook pentru a activa Immersive Mode pe Android
 * - Ascunde Navigation Bar-ul (butoanele de jos)
 * - Bara apare doar când tragi de jos în sus (gesture)
 * - Funcționează doar pe Android
 */
export const useImmersiveMode = (enabled: boolean = true) => {
  useEffect(() => {
    if (Platform.OS !== "android" || !enabled) {
      return;
    }

    const setupImmersiveMode = async () => {
      try {
        // Cu edge-to-edge enabled, unele metode nu funcționează
        // Doar setăm vizibilitatea (funcționează) și button style

        // Setează vizibilitatea - HIDDEN pentru immersive mode
        await NavigationBar.setVisibilityAsync("hidden");

        // Setează butoanele la culoare albă pentru contrast când apar
        await NavigationBar.setButtonStyleAsync("light");

        console.log("✅ Immersive Mode activat - Navigation Bar ascuns");
      } catch (error) {
        console.error("❌ Eroare la activarea Immersive Mode:", error);
      }
    };

    setupImmersiveMode();

    // Cleanup - restabilește Navigation Bar-ul când componenta se demontează
    return () => {
      if (Platform.OS === "android") {
        NavigationBar.setVisibilityAsync("visible").catch(console.error);
      }
    };
  }, [enabled]);
};

/**
 * Hook pentru a personaliza Navigation Bar-ul fără Immersive Mode complet
 * Útil pentru anumite ecrane unde vrei un control mai fin
 * Notă: Cu edge-to-edge enabled, doar buttonStyle și visibility funcționează
 */
export const useNavigationBarCustomization = (options: {
  buttonStyle?: "light" | "dark";
  hidden?: boolean;
}) => {
  useEffect(() => {
    if (Platform.OS !== "android") {
      return;
    }

    const customize = async () => {
      try {
        if (options.buttonStyle) {
          await NavigationBar.setButtonStyleAsync(options.buttonStyle);
        }

        if (options.hidden !== undefined) {
          await NavigationBar.setVisibilityAsync(
            options.hidden ? "hidden" : "visible"
          );
        }
      } catch (error) {
        console.error("❌ Eroare la personalizarea Navigation Bar:", error);
      }
    };

    customize();
  }, [options.buttonStyle, options.hidden]);
};

/**
 * Funcții helper pentru control manual
 */
export const NavigationBarUtils = {
  /**
   * Ascunde Navigation Bar-ul
   */
  hide: async () => {
    if (Platform.OS === "android") {
      await NavigationBar.setVisibilityAsync("hidden");
    }
  },

  /**
   * Afișează Navigation Bar-ul
   */
  show: async () => {
    if (Platform.OS === "android") {
      await NavigationBar.setVisibilityAsync("visible");
    }
  },

  /**
   * Toggle Navigation Bar
   */
  toggle: async () => {
    if (Platform.OS === "android") {
      const visibility = await NavigationBar.getVisibilityAsync();
      if (visibility === "visible") {
        await NavigationBarUtils.hide();
      } else {
        await NavigationBarUtils.show();
      }
    }
  },

  /**
   * Setează button style (funcționează cu edge-to-edge)
   */
  setButtonStyle: async (style: "light" | "dark") => {
    if (Platform.OS === "android") {
      await NavigationBar.setButtonStyleAsync(style);
    }
  },
};
