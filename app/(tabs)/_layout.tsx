import { Tabs } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#FFFFFF",
        tabBarInactiveTintColor: "#333333",
        tabBarStyle: {
          backgroundColor: "#000000",
          borderTopWidth: 0,
          height: 80,
          paddingBottom: 24,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "400",
          letterSpacing: 2,
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen name="index" options={{ title: "home", tabBarIcon: ({ color }) => <Ionicons name="remove-outline" size={14} color={color} /> }} />
      <Tabs.Screen name="tarot" options={{ title: "guidance", tabBarIcon: ({ color }) => <Ionicons name="remove-outline" size={14} color={color} /> }} />
      <Tabs.Screen name="affirmations" options={{ title: "affirm", tabBarIcon: ({ color }) => <Ionicons name="remove-outline" size={14} color={color} /> }} />
      <Tabs.Screen name="journal" options={{ title: "journal", tabBarIcon: ({ color }) => <Ionicons name="remove-outline" size={14} color={color} /> }} />
    </Tabs>
  );
}
