import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import FloatingAgent from "../../src/Components/FloatingAgent";

export default function TabLayout() {
  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,

          tabBarStyle: {
            height: 64,
            paddingTop: 6,
            paddingBottom: 6,
          },

          tabBarItemStyle: {
            flex: 1,
          },

          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: "600",
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="home-outline" color={color} size={size} />
            ),
          }}
        />

        <Tabs.Screen
          name="camera"
          options={{
            title: "Scan",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="scan-outline" color={color} size={size} />
            ),
          }}
        />

        <Tabs.Screen
          name="label"
          options={{
            title: "Label",
            tabBarIcon: ({ color, size }) => (
              <Ionicons
                name="document-text-outline"
                color={color}
                size={size}
              />
            ),
          }}
        />

        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="person-outline" color={color} size={size} />
            ),
          }}
        />

        <Tabs.Screen
          name="history"
          options={{
            title: "History",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="time-outline" color={color} size={size} />
            ),
          }}
        />

        <Tabs.Screen
          name="result"
          options={{
            title: "Result",
            href: null,
          }}
        />

        <Tabs.Screen
          name="barcode"
          options={{
            title: "Barcode",
            href: null,
          }}
        />

        <Tabs.Screen
          name="explore"
          options={{
            title: "Explore",
            href: null,
          }}
        />

        <Tabs.Screen
          name="label_result"
          options={{
            title: "Label Result",
            href: null,
          }}
        />
      </Tabs>

      <FloatingAgent />
    </>
  );
}
