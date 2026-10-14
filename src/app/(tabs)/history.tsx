import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  TextInput,
  useWindowDimensions,
} from "react-native";
import { router } from "expo-router";
import { Shell, C, s, Icon, Button, Tag } from "../../components/ui";
import { foods } from "../../lib/food";
import { useStore } from "../../lib/store";
import { FoodThumbnail } from "../../components/FoodThumbnail";
export default function History() {
  const store = useStore();
  const [tab, setTab] = useState("history");
  const [search, setSearch] = useState("");
  const { width } = useWindowDimensions();
  const mobile = width < 700;
  const allFoods = [...store.recognized, ...foods];
  const items =
    tab === "history"
      ? store.history.map((r) => ({
          ...r,
          food: allFoods.find((f) => f.id === r.foodId),
        }))
      : store.saved.map((id) => ({
          id,
          foodId: id,
          date: "",
          food: allFoods.find((f) => f.id === id),
        }));
  const filtered = items.filter((item) => item.food?.name.includes(search));
  return (
    <Shell title="我的记录">
      <Text style={s.eyebrow}>YOUR FOOD JOURNEY</Text>
      <Text style={s.pageHeading}>每一口，都有迹可循。</Text>
      <Text style={[s.body, { marginTop: 8 }]}>
        在这里重新打开分析，慢慢建立自己的食品小档案。
      </Text>
      <View
        style={[
          s.row,
          {
            marginTop: 28,
            marginBottom: 24,
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 15,
          },
        ]}
      >
        <View style={s.row}>
          {[
            { id: "history", label: `扫描记录 ${store.history.length}` },
            { id: "saved", label: `我的收藏 ${store.saved.length}` },
          ].map((t) => (
            <Pressable
              key={t.id}
              accessibilityRole="button"
              onPress={() => setTab(t.id)}
              style={{
                paddingVertical: 12,
                paddingHorizontal: 18,
                backgroundColor: tab === t.id ? C.ink : "#EDEFE6",
                borderRadius: 12,
              }}
            >
              <Text
                style={{ fontSize: 12, color: tab === t.id ? C.paper : C.ink }}
              >
                {t.label}
              </Text>
            </Pressable>
          ))}
        </View>
        <TextInput
          accessibilityLabel="搜索食品"
          placeholder="搜索食品名称…"
          placeholderTextColor={C.muted}
          value={search}
          onChangeText={setSearch}
          style={[
            s.input,
            { width: mobile ? "100%" : 245, paddingVertical: 11 },
          ]}
        />
      </View>
      {!filtered.length ? (
        <View style={[s.card, { alignItems: "center", paddingVertical: 60 }]}>
          <View
            style={{
              height: 70,
              width: 70,
              borderRadius: 25,
              backgroundColor: C.lime,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon name={tab === "saved" ? "bookmark" : "clock"} size={30} />
          </View>
          <Text style={[s.heading, { fontSize: 21, marginTop: 20 }]}>
            {search
              ? "还没有匹配的食品"
              : tab === "saved"
                ? "遇到喜欢的，留个记号。"
                : "你的第一份记录，等着开始。"}
          </Text>
          <Text
            style={[
              s.body,
              { fontSize: 12, marginTop: 8, textAlign: "center" },
            ]}
          >
            {search
              ? "换个名称，再找找。"
              : tab === "saved"
                ? "在分析页点击收藏，方便下次查看。"
                : "拍照入口里的示例，可以立即体验。"}
          </Text>
          {!search && (
            <Button
              onPress={() => router.navigate("/")}
              icon="scan"
              style={{ marginTop: 22 }}
            >
              开始体验
            </Button>
          )}
        </View>
      ) : (
        <View style={{ gap: 12 }}>
          {filtered.map((item) => {
            const f = item.food!;
            return (
              <Pressable
                key={item.id}
                accessibilityRole="button"
                onPress={() =>
                  router.push({ pathname: "/result", params: { id: f.id } })
                }
                style={({
                  hovered,
                }: {
                  pressed: boolean;
                  hovered?: boolean;
                }) => [
                  s.card,
                  s.row,
                  {
                    padding: mobile ? 14 : 19,
                    gap: 20,
                    backgroundColor: hovered ? "#F0F4E8" : C.paper,
                  },
                ]}
              >
                <FoodThumbnail food={f} uri={store.thumbnails[f.id]} />
                <View style={{ flex: 1 }}>
                  <Text style={[s.heading, { fontSize: 16 }]}>{f.name}</Text>
                  <Text style={[s.small, { fontSize: 11, marginTop: 3 }]}>
                    {item.date
                      ? new Date(item.date).toLocaleString("zh-CN")
                      : "已收藏"}{" "}
                    · {f.category}
                  </Text>
                  <View style={{ marginTop: 9 }}>
                    <Tag color="#ECF1E2">
                      {f.source === "cloud" ? "照片识别" : "示例分析"}
                    </Tag>
                  </View>
                </View>
                {!mobile && (
                  <Text style={[s.small, { fontSize: 12 }]}>
                    {f.nutrients.fat === null
                      ? "未标注"
                      : ((f.nutrients.fat * (f.serving ?? 100)) / 100).toFixed(
                          1,
                        ) +
                        "g 脂肪 / " +
                        (f.serving ? "份" : "100" + (f.unit ?? "g"))}
                  </Text>
                )}
                <Icon name="arrow" size={19} />
              </Pressable>
            );
          })}
        </View>
      )}
      <Text style={[s.small, { fontSize: 11, marginTop: 20 }]}>
        最多保存 50 条扫描记录。记录与收藏仅保存在当前设备。
      </Text>
    </Shell>
  );
}
