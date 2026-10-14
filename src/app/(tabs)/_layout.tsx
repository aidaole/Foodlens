import React, { type ComponentProps } from "react";
import { Tabs } from "expo-router";
import { Pressable, Text, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { C, Icon } from "../../components/ui";
type TabBarProps = Parameters<
  NonNullable<ComponentProps<typeof Tabs>["tabBar"]>
>[0];
function TabBar({ state, descriptors, navigation }: TabBarProps) {
  const { width } = useWindowDimensions();
  if (width >= 1000) return null;
  return (
    <SafeAreaView
      edges={["bottom"]}
      style={{
        backgroundColor: C.paper,
        borderTopWidth: 1,
        borderTopColor: C.line,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-around",
          paddingVertical: 9,
        }}
      >
        {state.routes.map((route, index) => {
          const selected = state.index === index;
          const label = String(descriptors[route.key].options.title);
          return (
            <Pressable
              key={route.key}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              accessibilityLabel={label}
              onPress={() => {
                const event = navigation.emit({
                  type: "tabPress",
                  target: route.key,
                  canPreventDefault: true,
                });
                if (!selected && !event.defaultPrevented)
                  navigation.navigate(route.name, route.params);
              }}
              style={{
                alignItems: "center",
                gap: 5,
                paddingVertical: 8,
                paddingHorizontal: 25,
                borderRadius: 15,
                backgroundColor: selected ? C.lime : "transparent",
                minWidth: 90,
              }}
            >
              <Icon name={["scan", "clock", "user"][index]} size={22} />
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: selected ? "700" : "400",
                  color: C.ink,
                }}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </SafeAreaView>
  );
}
export default function TabLayout() {
  return (
    <Tabs
      backBehavior="none"
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{
        headerShown: false,
        animation: "none",
        sceneStyle: { backgroundColor: C.bg },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "拍照" }} />
      <Tabs.Screen name="history" options={{ title: "记录" }} />
      <Tabs.Screen name="profile" options={{ title: "我的" }} />
    </Tabs>
  );
}
