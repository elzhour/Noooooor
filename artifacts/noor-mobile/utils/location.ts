import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";

const CACHE_KEY = "noor:location:last";

export interface LocationResult {
  latitude: number;
  longitude: number;
  city?: string;
  country?: string;
}

export const FALLBACK_LOCATION: LocationResult = {
  latitude: 30.0444,
  longitude: 31.2357,
  city: "القاهرة",
  country: "مصر",
};

export async function getCachedLocation(): Promise<LocationResult | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as LocationResult;
  } catch {
    return null;
  }
}

export async function saveLocation(loc: LocationResult): Promise<void> {
  await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(loc));
}

export async function fetchCurrentLocation(): Promise<LocationResult> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== "granted") {
    const cached = await getCachedLocation();
    return cached ?? FALLBACK_LOCATION;
  }

  try {
    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    const result: LocationResult = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    };

    try {
      const reverse = await Location.reverseGeocodeAsync({
        latitude: result.latitude,
        longitude: result.longitude,
      });
      if (reverse.length > 0) {
        result.city = reverse[0].city ?? reverse[0].region ?? undefined;
        result.country = reverse[0].country ?? undefined;
      }
    } catch {
      // ignore reverse geocode errors
    }

    await saveLocation(result);
    return result;
  } catch {
    const cached = await getCachedLocation();
    return cached ?? FALLBACK_LOCATION;
  }
}
