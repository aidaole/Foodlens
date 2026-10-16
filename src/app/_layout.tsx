import { Stack } from "expo-router";
import Head from "expo-router/head";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, View } from "react-native";
import { StoreProvider, useStore } from "../lib/store";
import { hasLegalAcknowledgment, legalContent } from '../lib/legal';
export const unstable_settings = { initialRouteName: "(tabs)" };
function Navigator() {
  const { ready, onboarded, legalAcceptance } = useStore();
  const acknowledged = hasLegalAcknowledgment(legalAcceptance, legalContent.revision);
  if (!ready)
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#F7F8F2",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator color="#253127" />
      </View>
    );
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "fade",
        contentStyle: { backgroundColor: "#F7F8F2" },
      }}
    >
      <Stack.Protected guard={onboarded && acknowledged}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="result" />
        <Stack.Screen name="guide" />
        <Stack.Screen name="about" />
        <Stack.Screen name="membership" />
      </Stack.Protected>
      <Stack.Protected guard={!onboarded}>
        <Stack.Screen name="onboarding" />
      </Stack.Protected>
      <Stack.Protected guard={onboarded && !acknowledged}>
        <Stack.Screen name="agreement" />
      </Stack.Protected>
      <Stack.Screen name="legal" />
    </Stack>
  );
}
export default function Layout() {
  return (
    <SafeAreaProvider>
      <StoreProvider>
        <Head>
          <title>食刻 FoodLens · 拍一下，吃个明白</title>
          <meta
            name="description"
            content="看懂食品配料、热量和脂肪的食品标签工具。"
          />
        </Head>
        <StatusBar style="dark" />
        <Navigator />
      </StoreProvider>
    </SafeAreaProvider>
  );
}
