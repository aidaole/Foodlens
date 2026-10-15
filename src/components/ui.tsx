import React from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
  StyleProp,
  ViewStyle,
} from "react-native";
import Svg, {
  Path,
  Circle,
  Line,
  G,
  Ellipse,
  Text as SText,
} from "react-native-svg";
import { router, usePathname, Href } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useStore } from "../lib/store";
import { Food } from "../lib/food";
export const C = {
  bg: "#F7F8F2",
  paper: "#FFFFFF",
  ink: "#20271F",
  muted: "#7B8276",
  line: "#E6E8DE",
  lime: "#D6F87C",
  dark: "#253127",
  orange: "#EF966C",
};
const icons: Record<string, string[]> = {
  scan: [
    "M8 3H5a2 2 0 0 0-2 2v3",
    "M16 3h3a2 2 0 0 1 2 2v3",
    "M21 16v3a2 2 0 0 1-2 2h-3",
    "M8 21H5a2 2 0 0 1-2-2v-3",
    "M7 12h10",
  ],
  home: ["m3 10 9-7 9 7", "M5 9v12h14V9", "M9 21v-8h6v8"],
  clock: ["M12 7v5l3 2"],
  bookmark: ["M6 3h12v18l-6-4-6 4z"],
  user: ["M4 21v-2a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v2"],
  arrow: ["M4 12h16", "m14 6 6 6-6 6"],
  up: ["M6 18 18 6", "M6 6h12v12"],
  back: ["M20 12H4", "m10 6-6 6 6 6"],
  camera: ["M3 7h4l2-3h6l2 3h4v14H3z"],
  image: ["M3 3h18v18H3z", "m3 17 6-6 4 4 4-6 4 6"],
  leaf: ["M20 3c-8 0-15 1-15 9a7 7 0 0 0 7 7c8 0 8-8 8-16Z", "M4 21 15 10"],
  shield: ["m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6z", "m8 12 3 3 5-6"],
  check: ["m5 12 4 4 10-10"],
  close: ["m6 6 12 12", "M6 18 18 6"],
  info: ["M12 11v6", "M12 7h.01"],
  fire: ["M12 3s2 6 5 8c5 6 0 11-5 11S2 17 6 11c0 4 2 5 3 4 2-2-1-6 3-12Z"],
  drop: ["M12 3S4 12 4 16a8 8 0 0 0 16 0c0-4-8-13-8-13Z"],
  spark: ["m12 2 2.7 7.3L22 12l-7.3 2.7L12 22l-2.7-7.3L2 12l7.3-2.7z"],
  plus: ["M12 4v16", "M4 12h16"],
  settings: [
    "M4 6h16",
    "M4 12h16",
    "M4 18h16",
    "M8 3v6",
    "M16 9v6",
    "M10 15v6",
  ],
};
export function Icon({
  name,
  size = 22,
  color = C.ink,
}: {
  name: string;
  size?: number;
  color?: string;
}) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {["clock", "info"].includes(name) && <Circle cx="12" cy="12" r="9" />}
      {name === "user" && <Circle cx="12" cy="6" r="3" />}
      {name === "camera" && <Circle cx="12" cy="13" r="4" />}
      {name === "image" && <Circle cx="8" cy="7" r="1" />}
      {(icons[name] || icons.spark).map((d, i) => (
        <Path key={i} d={d} />
      ))}
    </Svg>
  );
}
export function Button({
  children,
  onPress,
  icon = "arrow",
  tone = "dark",
  style,
  disabled = false,
  showArrow = true,
}: {
  children: React.ReactNode;
  onPress: () => void;
  icon?: string;
  tone?: "dark" | "lime" | "light";
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  showArrow?: boolean;
}) {
  const dark = tone === "dark";
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({
        pressed,
        hovered,
      }: {
        pressed: boolean;
        hovered?: boolean;
      }) => [
        s.button,
        {
          backgroundColor: dark ? C.ink : tone === "lime" ? C.lime : C.paper,
          borderWidth: tone === "light" ? 1 : 0,
          borderColor: C.line,
          opacity: disabled ? 0.45 : pressed ? 0.8 : 1,
          transform: [{ translateY: hovered ? -2 : 0 }],
        },
        style,
      ]}
    >
      <Icon name={icon} color={dark ? C.lime : C.ink} />
      <Text style={[s.buttonText, { color: dark ? C.paper : C.ink }]}>
        {children}
      </Text>
      {showArrow && icon !== "arrow" && (
        <Icon name="arrow" size={18} color={dark ? C.paper : C.ink} />
      )}
    </Pressable>
  );
}
export function Tag({
  children,
  color = C.lime,
}: {
  children: React.ReactNode;
  color?: string;
}) {
  return (
    <View style={[s.tag, { backgroundColor: color }]}>
      <Text style={s.tagText}>{children}</Text>
    </View>
  );
}
export function SectionTitle({
  title,
  eyebrow,
  action,
  onPress,
}: {
  title: string;
  eyebrow?: string;
  action?: string;
  onPress?: () => void;
}) {
  return (
    <View
      style={[s.row, { justifyContent: "space-between", marginBottom: 18 }]}
    >
      <View>
        {eyebrow && <Text style={s.eyebrow}>{eyebrow}</Text>}
        <Text style={s.sectionTitle}>{title}</Text>
      </View>
      {action && (
        <Pressable accessibilityRole="button" onPress={onPress} style={s.row}>
          <Text style={s.small}>{action}</Text>
          <Icon name="arrow" size={16} />
        </Pressable>
      )}
    </View>
  );
}
export function Pack({
  food,
  size = 180,
  back = false,
}: {
  food: Food;
  size?: number;
  back?: boolean;
}) {
  const purple = food.kind === "yogurt";
  return (
    <Svg
      width={size}
      height={size * 1.33}
      viewBox="0 0 210 280"
      accessibilityLabel={`${food.name}示例包装插画`}
    >
      <Ellipse cx="107" cy="263" rx="73" ry="9" fill="#20271F" opacity=".12" />
      <G transform="rotate(-7 105 140)">
        <Path
          d={
            purple
              ? "M25 68h160l-18 184H43z"
              : "M27 14h151l-7 28 13 205-12 15H33l-9-15L34 42z"
          }
          fill={food.color}
          stroke="#263022"
          strokeWidth="1.5"
        />
        <Path
          d={purple ? "M20 61h170v15H20z" : "M27 14h151v15H27z"}
          fill="#263022"
        />
        {!purple &&
          Array.from({ length: 25 }, (_, i) => (
            <Line
              key={i}
              x1={30 + i * 6}
              y1="15"
              x2={30 + i * 6}
              y2="28"
              stroke={food.color}
              opacity=".6"
            />
          ))}
        {back ? (
          <G>
            <SText x="50" y="63" fontSize="14" fontWeight="bold" fill="#20271F">
              NUTRITION FACTS
            </SText>
            <Line
              x1="48"
              y1="70"
              x2="163"
              y2="70"
              stroke="#20271F"
              strokeWidth="4"
            />
            {[
              "Energy  450 kcal",
              "Fat         18 g",
              "Protein   10 g",
              "Carbs      60 g",
              "Fiber        8 g",
              "Sodium 180 mg",
            ].map((str, i) => (
              <G key={str}>
                <SText x="49" y={93 + i * 21} fontSize="11" fill="#20271F">
                  {str}
                </SText>
                <Line
                  x1="48"
                  y1={99 + i * 21}
                  x2="164"
                  y2={99 + i * 21}
                  stroke="#20271F"
                  strokeWidth=".5"
                />
              </G>
            ))}
            <SText x="50" y="241" fontSize="9" fill="#20271F">
              ILLUSTRATION · DEMO
            </SText>
          </G>
        ) : (
          <G>
            <SText
              x="105"
              y={purple ? 99 : 57}
              fontSize="12"
              textAnchor="middle"
              fontWeight="bold"
              letterSpacing="4"
              fill="#263022"
            >
              GOOD STUFF
            </SText>
            <SText
              x="105"
              y={purple ? 127 : 90}
              fontSize={purple ? 26 : 35}
              textAnchor="middle"
              fontWeight="900"
              fill="#263022"
            >
              {food.kind === "oat"
                ? "OAT"
                : food.kind === "chips"
                  ? "CHIPS"
                  : "GREEK"}
            </SText>
            <SText
              x="105"
              y={purple ? 151 : 116}
              fontSize="20"
              textAnchor="middle"
              fontWeight="800"
              fill="#263022"
            >
              {food.kind === "oat"
                ? "YEAH!"
                : food.kind === "chips"
                  ? "& CHILL"
                  : "YOGURT"}
            </SText>
            {purple ? (
              <G>
                <Ellipse cx="102" cy="196" rx="50" ry="24" fill="#F8F7F0" />
                <Path
                  d="M62 192c25-25 55 4 77-7"
                  stroke="#C6B5EE"
                  strokeWidth="9"
                  fill="none"
                />
              </G>
            ) : (
              <G>
                {Array.from({ length: 8 }, (_, i) => (
                  <Ellipse
                    key={i}
                    cx={62 + (i % 3) * 29}
                    cy={158 + Math.floor(i / 3) * 23}
                    rx={food.kind === "chips" ? 26 : 16}
                    ry={food.kind === "chips" ? 12 : 8}
                    transform={`rotate(${i * 38} ${62 + (i % 3) * 29} ${158 + Math.floor(i / 3) * 23})`}
                    fill={food.kind === "chips" ? "#EAC075" : "#B28C52"}
                    stroke="#725833"
                    strokeWidth="1"
                  />
                ))}
                <Path
                  d="M125 220c20-50 31-60 30-71"
                  stroke="#52663B"
                  strokeWidth="2"
                  fill="none"
                />
                <Ellipse
                  cx="145"
                  cy="171"
                  rx="6"
                  ry="14"
                  transform="rotate(30 145 171)"
                  fill="#69834C"
                />
                <Ellipse
                  cx="150"
                  cy="194"
                  rx="6"
                  ry="14"
                  transform="rotate(50 150 194)"
                  fill="#69834C"
                />
              </G>
            )}
            <SText
              x="105"
              y="242"
              textAnchor="middle"
              fontSize="9"
              letterSpacing="1.3"
              fill="#263022"
            >
              {food.pack}g · DEMO PACKAGING
            </SText>
          </G>
        )}
      </G>
    </Svg>
  );
}
const nav = [
  { path: "/", label: "拍照", icon: "scan" },
  { path: "/history", label: "记录", icon: "clock" },
  { path: "/profile", label: "我的", icon: "user" },
];
export function Shell({
  children,
  title = "拍照",
  subtitle = "每一口，都心中有数。",
}: {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}) {
  const { width } = useWindowDimensions();
  const desktop = width >= 1000;
  const path = usePathname();
  const store = useStore();
  const isTab = nav.some((n) => n.path === path);
  const showHeader = path !== "/history" && path !== "/profile";
  const go = (href: string) => {
    if (path !== href) {
      if (nav.some((n) => n.path === href) && !isTab)
        router.dismissTo(href as Href);
      else router.navigate(href as Href);
    }
  };
  const back = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/");
  };
  return (
    <SafeAreaView style={s.root} edges={["top", "left", "right"]}>
      <View style={[s.row, { flex: 1, alignItems: "stretch" }]}>
        {desktop && (
          <View style={s.sidebar}>
            <Pressable
              accessibilityRole="button"
              onPress={() => go("/")}
              style={[s.row, { gap: 10, marginBottom: 60 }]}
            >
              <View style={s.logoMark}>
                <Icon name="scan" size={26} />
              </View>
              <View>
                <Text style={s.logo}>
                  食刻<Text style={{ color: "#9EA895" }}> /</Text>
                </Text>
                <Text style={s.logoEnglish}>FOODLENS</Text>
              </View>
            </Pressable>
            <Text style={[s.eyebrow, { marginLeft: 18, marginBottom: 20 }]}>
              YOUR FOOD COMPANION
            </Text>
            {nav.map((n) => (
              <Pressable
                key={n.path}
                accessibilityRole="tab"
                accessibilityState={{ selected: path === n.path }}
                onPress={() => go(n.path)}
                style={({ pressed }) => [
                  s.navItem,
                  {
                    backgroundColor:
                      path === n.path
                        ? C.lime
                        : pressed
                          ? "#F1F3EA"
                          : "transparent",
                  },
                ]}
              >
                <Icon name={n.icon} />
                <Text
                  style={[s.navText, path === n.path && { fontWeight: "700" }]}
                >
                  {n.label}
                </Text>
                {path === n.path && <View style={s.navDot} />}
              </Pressable>
            ))}
            <View style={{ flex: 1 }} />
            <View style={s.sidebarCard}>
              <Icon name="leaf" size={30} />
              <Text style={[s.heading, { fontSize: 17, marginTop: 14 }]}>
                吃得明白，{"\n"}生活轻一点。
              </Text>
              <Text style={[s.small, { marginTop: 10, lineHeight: 21 }]}>
                从读懂一张食品标签开始。
              </Text>
            </View>
            <View style={[s.row, { marginTop: 28, gap: 10 }]}>
              <View style={s.avatar}>
                <Text style={{ fontWeight: "700" }}>F</Text>
              </View>
              <View>
                <Text style={{ fontWeight: "600", fontSize: 13, color: C.ink }}>
                  我的食刻
                </Text>
                <Text style={[s.small, { fontSize: 11, marginTop: 3 }]}>
                  体验版 0.4.1
                </Text>
              </View>
            </View>
          </View>
        )}
        <ScrollView
          testID="screen-scroll"
          style={{ flex: 1, minWidth: 0 }}
          contentContainerStyle={{ paddingBottom: 36 }}
          keyboardShouldPersistTaps="handled"
        >
          {showHeader && (
            <View
              testID="scrolling-header"
              style={[s.topbar, { paddingHorizontal: desktop ? 42 : 22 }]}
            >
              <View style={s.row}>
                {!isTab && (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="返回上一页"
                    onPress={back}
                    style={{ padding: 8 }}
                  >
                    <Icon name="back" size={20} />
                  </Pressable>
                )}
                {desktop || !isTab ? (
                  <Text style={[s.heading, { fontSize: 18 }]}>{title}</Text>
                ) : (
                  <View style={[s.row, { gap: 8 }]}>
                    <Icon name="scan" />
                    <Text style={[s.logo, { fontSize: 21 }]}>
                      食刻{" "}
                      <Text style={{ fontWeight: "400", fontSize: 12 }}>
                        FOODLENS
                      </Text>
                    </Text>
                  </View>
                )}
              </View>
              <View style={[s.row, { gap: 14 }]}>
                {desktop && <Text style={s.small}>{subtitle}</Text>}
                <Tag color="#ECF1E3">体验版</Tag>
                {isTab && path !== "/profile" && (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="打开我的"
                    onPress={() => go("/profile")}
                    style={s.avatar}
                  >
                    <Icon name="user" size={19} />
                  </Pressable>
                )}
              </View>
            </View>
          )}
          <View
            style={{
              padding: desktop ? 42 : 20,
              paddingTop: desktop ? 32 : 24,
              width: "100%",
              maxWidth: 1274,
              alignSelf: "center",
            }}
          >
            {!!store.storageError && (
              <Text style={[s.small, { color: "#AE542D", marginBottom: 15 }]}>
                {store.storageError}
              </Text>
            )}
            {children}
            <View
              style={[
                s.row,
                {
                  justifyContent: "space-between",
                  marginTop: 40,
                  paddingTop: 20,
                  borderTopWidth: 1,
                  borderTopColor: C.line,
                  flexWrap: "wrap",
                  gap: 8,
                },
              ]}
            >
              <Text style={[s.small, { fontSize: 11 }]}>
                FOODLENS · 让每一口更有底气
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => go("/about")}
              >
                <Text style={[s.small, { fontSize: 11 }]}>
                  关于食刻 / 数据与隐私 ↗
                </Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
export const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  sidebar: {
    width: 226,
    backgroundColor: "#FDFEF9",
    borderRightWidth: 1,
    borderRightColor: C.line,
    padding: 26,
    paddingTop: 35,
  },
  logoMark: {
    backgroundColor: C.lime,
    width: 42,
    height: 42,
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
  },
  logo: { fontSize: 26, fontWeight: "800", letterSpacing: -1, color: C.ink },
  logoEnglish: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 2.7,
    marginTop: 3,
    color: C.ink,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 1.5,
    color: C.muted,
    marginBottom: 9,
  },
  navItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    borderRadius: 12,
    paddingHorizontal: 17,
    paddingVertical: 17,
    marginBottom: 8,
  },
  navText: { fontSize: 14, color: C.ink, flex: 1 },
  navDot: { height: 5, width: 5, borderRadius: 3, backgroundColor: C.ink },
  sidebarCard: { backgroundColor: "#EDF0E5", borderRadius: 17, padding: 18 },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#EAEDE2",
    alignItems: "center",
    justifyContent: "center",
  },
  topbar: {
    minHeight: 89,
    backgroundColor: C.bg,
    borderBottomWidth: 1,
    borderBottomColor: C.line,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  heading: { color: C.ink, fontWeight: "700", fontSize: 24, lineHeight: 32 },
  small: { color: C.muted, fontSize: 13, lineHeight: 19 },
  body: { color: "#626B5D", fontSize: 14, lineHeight: 24 },
  sectionTitle: {
    color: C.ink,
    fontSize: 21,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  button: {
    minHeight: 54,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 23,
    gap: 12,
  },
  buttonText: { fontSize: 14, fontWeight: "600" },
  tag: {
    paddingVertical: 6,
    paddingHorizontal: 11,
    borderRadius: 7,
    alignSelf: "flex-start",
  },
  tagText: {
    fontSize: 10,
    color: C.ink,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  card: {
    backgroundColor: C.paper,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 22,
    padding: 24,
  },
  input: {
    borderWidth: 1,
    borderColor: C.line,
    padding: 14,
    borderRadius: 12,
    fontSize: 14,
    color: C.ink,
    backgroundColor: C.paper,
  },
  pageHeading: {
    color: C.ink,
    fontSize: 32,
    fontWeight: "700",
    letterSpacing: -1,
    lineHeight: 42,
  },
});
