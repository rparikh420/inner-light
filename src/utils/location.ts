import * as Location from 'expo-location';

/**
 * Resolves a short, human-readable place label ("City, Region") for the
 * device's current position, for stamping onto saved journal entries.
 * Returns null if permission is denied or location can't be resolved —
 * callers should treat the location stamp as optional.
 */
export async function getCurrentLocationLabel(): Promise<string | null> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return null;

    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    const [address] = await Location.reverseGeocodeAsync({
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    });
    if (!address) return null;

    const place = address.city || address.subregion || address.district;
    const region = address.region;

    if (place && region && place !== region) return `${place}, ${region}`;
    return place || region || null;
  } catch {
    return null;
  }
}
