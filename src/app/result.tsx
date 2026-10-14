import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  Linking,
  useWindowDimensions,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import {
  Shell,
  C,
  s,
  Icon,
  Pack,
  Button,
  Tag,
  SectionTitle,
} from "../components/ui";
import { foods, fmt, warnings, assessment, SOURCE } from "../lib/food";
import { useStore } from "../lib/store";
import { nutritionInterests } from "../lib/nutrition-interests";
import { FoodThumbnail } from "../components/FoodThumbnail";
export default function Result() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const store = useStore();
  const food = [...store.recognized, ...foods].find((f) => f.id === id);
  const [basis, setBasis] = useState<"serving" | "100" | "pack">("serving");
  const { width } = useWindowDimensions();
  const mobile = width < 800;
  if (!food)
    return (
      <Shell title="分析结果">
        <Text style={s.heading}>暂时找不到这份记录</Text>
        <Button onPress={() => router.replace("/")} style={{ marginTop: 20 }}>
          重新拍照
        </Button>
      </Shell>
    );
  const grams =
    basis === "serving"
      ? (food.serving ?? 100)
      : basis === "100"
        ? 100
        : (food.pack ?? 100);
  const unit = food.unit ?? "g";
  const actualBasis =
    (basis === "serving" && food.serving === null) ||
    (basis === "pack" && food.pack === null)
      ? "100"
      : basis;
  const real = food.source === "cloud";
  const n = food.nutrients;
  const summary =
    food.source === "cloud" &&
    (food.nutrients.energy === null || food.nutrients.fat === null)
      ? {
          title: "有些字段需要再确认",
          detail: "读不清的数据已留空，请核对包装或补拍营养表。",
          flag: true,
        }
      : assessment(food, grams);
  const notes = warnings(food, store.profile, grams);
  const saved = store.saved.includes(food.id);
  const summaryCard = (
    <View
      style={[
        s.card,
        {
          backgroundColor: summary.flag ? "#FAE9DD" : C.dark,
          borderColor: summary.flag ? "#F1D8C8" : C.dark,
        },
      ]}
    >
      <View style={[s.row, { gap: 10 }]}>
        <Icon
          name={summary.flag ? "info" : "leaf"}
          color={summary.flag ? C.ink : C.lime}
        />
        <Text
          style={[
            s.heading,
            { fontSize: 19, color: summary.flag ? C.ink : "#F7F9EF" },
          ]}
        >
          {summary.title}
        </Text>
      </View>
      <Text
        style={[
          s.body,
          {
            color: summary.flag ? "#956449" : "#BDC9B3",
            marginTop: 13,
            fontSize: 13,
          },
        ]}
      >
        {summary.detail}
      </Text>
      <Text
        style={{
          fontSize: 10,
          lineHeight: 17,
          color: summary.flag ? "#956449" : "#93A289",
          marginTop: 12,
        }}
      >
        标签解读提示，不是食品健康评级。
      </Text>
    </View>
  );
  const ingredientCard = (
    <View style={s.card}>
      <SectionTitle title="配料，拆开看" eyebrow="WHAT'S INSIDE" />
      {!food.ingredients.length && (
        <Text style={s.body}>配料表未读到，请补拍配料表。</Text>
      )}
      {food.ingredients.map((item, i) => (
        <View
          key={item.name}
          style={{
            paddingVertical: 13,
            borderTopWidth: 1,
            borderTopColor: C.line,
          }}
        >
          <View style={[s.row, { justifyContent: "space-between" }]}>
            <Text style={{ fontSize: 14, fontWeight: "600", color: C.ink }}>
              <Text
                style={{ fontSize: 11, color: "#9AA48F", fontWeight: "400" }}
              >
                0{i + 1}{" "}
              </Text>
              {item.name}
            </Text>
            {item.flag && <Tag color="#F8E5D7">留意</Tag>}
          </View>
          <Text
            style={[s.body, { fontSize: 12, lineHeight: 21, marginTop: 5 }]}
          >
            {item.note}
          </Text>
        </View>
      ))}
      <Text style={[s.small, { fontSize: 10, marginTop: 8 }]}>
        {real
          ? "按识别到的配料顺序展示；请核对包装原文。"
          : "按示例标签顺序展示；不因配料名称或数量推断“有害”。"}
      </Text>
    </View>
  );
  return (
    <Shell title="分析结果">
      <View style={[s.row, { justifyContent: "flex-end", marginBottom: 24 }]}>
        <Tag color="#EBEEDF">
          {real ? "照片识别 · 请核对原包装" : "示例分析 · 非真实图片识别"}
        </Tag>
      </View>
      <View style={{ flexDirection: mobile ? "column" : "row", gap: 25 }}>
        <View style={{ flex: mobile ? undefined : 1, gap: 20 }}>
          <View style={[s.card, { backgroundColor: "#ECF2DF", padding: 25 }]}>
            <View style={[s.row, { gap: 20 }]}>
              {real ? (
                <FoodThumbnail food={food} uri={store.thumbnails[food.id]} />
              ) : (
                <Pack food={food} size={102} />
              )}
              <View style={{ flex: 1 }}>
                <Text style={s.eyebrow}>{food.english}</Text>
                <Text style={[s.heading, { fontSize: mobile ? 23 : 26 }]}>
                  {food.name}
                </Text>
                <Text style={[s.small, { marginTop: 9 }]}>
                  {food.category} ·{" "}
                  {food.pack === null
                    ? "净含量未读到"
                    : `净含量 ${food.pack}${unit}`}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => store.toggleSaved(food.id)}
                  style={[
                    s.row,
                    {
                      marginTop: 16,
                      alignSelf: "flex-start",
                      paddingVertical: 8,
                    },
                  ]}
                >
                  <Icon name={saved ? "check" : "bookmark"} size={18} />
                  <Text style={{ fontSize: 12, color: C.ink }}>
                    {saved ? "已收藏" : "收藏这份分析"}
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
          {!mobile && summaryCard}
          {!mobile && ingredientCard}
        </View>
        <View style={{ flex: mobile ? undefined : 1.35, gap: 20 }}>
          <View style={s.card}>
            <SectionTitle
              title="这一份，吃进多少？"
              eyebrow="NUTRITION AT A GLANCE"
            />
            {!!store.profile.nutritionInterests?.length && <View style={{backgroundColor:"#EEF5DE",padding:14,borderRadius:14,marginBottom:18}}>
              <Text style={{fontSize:12,fontWeight:"600",color:C.ink,marginBottom:9}}>你关注的营养 · {actualBasis === "serving" ? "每份" : actualBasis === "pack" ? "整包" : "每100"+unit}</Text>
              <View style={{flexDirection:"row",flexWrap:"wrap",gap:12}}>{nutritionInterests.filter(item=>store.profile.nutritionInterests?.includes(item.key)).map(item=><View key={item.key} style={{minWidth:"43%"}}><Text style={{fontSize:11,color:C.muted}}>{item.label}</Text><Text style={{fontSize:17,fontWeight:"700",color:C.ink,marginTop:3}}>{fmt(n[item.key],grams)}{n[item.key] === null ? "" : " "+item.unit}</Text></View>)}</View>
            </View>}
            <View
              style={[
                s.row,
                {
                  backgroundColor: "#F1F3EB",
                  padding: 5,
                  borderRadius: 12,
                  gap: 4,
                  marginBottom: 22,
                },
              ]}
            >
              {(
                [
                  { id: "serving", label: "每份" },
                  { id: "100", label: `每 100${unit}` },
                  { id: "pack", label: "整包" },
                ] as const
              ).map((b) => (
                <Pressable
                  key={b.id}
                  accessibilityRole="button"
                  accessibilityState={{
                    selected: actualBasis === b.id,
                    disabled:
                      (b.id === "serving" && food.serving === null) ||
                      (b.id === "pack" && food.pack === null),
                  }}
                  disabled={
                    (b.id === "serving" && food.serving === null) ||
                    (b.id === "pack" && food.pack === null)
                  }
                  onPress={() => setBasis(b.id)}
                  style={{
                    flex: 1,
                    paddingVertical: 12,
                    backgroundColor:
                      actualBasis === b.id ? C.paper : "transparent",
                    borderRadius: 9,
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      opacity:
                        (b.id === "serving" && food.serving === null) ||
                        (b.id === "pack" && food.pack === null)
                          ? 0.35
                          : 1,
                      color: C.ink,
                      fontWeight: actualBasis === b.id ? "700" : "400",
                    }}
                  >
                    {b.label}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Text style={[s.small, { fontSize: 11, marginBottom: 15 }]}>
              {actualBasis === "serving"
                ? "按标签一份"
                : actualBasis === "pack"
                  ? "按整包净含量"
                  : "按标准比较量"}{" "}
              {grams}
              {unit} 换算
            </Text>
            <View style={[s.row, { gap: 12, alignItems: "stretch" }]}>
              {[
                {
                  title: "热量",
                  value: fmt(n.energy, grams),
                  unit: n.energy === null ? "" : "kcal",
                  icon: "fire",
                  bg: "#F2F3EC",
                },
                {
                  title: "总脂肪",
                  value: fmt(n.fat, grams),
                  unit: n.fat === null ? "" : "g",
                  icon: "drop",
                  bg: C.lime,
                },
              ].map((card) => (
                <View
                  key={card.title}
                  style={{
                    backgroundColor: card.bg,
                    flex: 1,
                    padding: 19,
                    borderRadius: 16,
                  }}
                >
                  <View style={[s.row, { justifyContent: "space-between" }]}>
                    <Text style={{ fontSize: 12, color: "#50613D" }}>
                      {card.title}
                    </Text>
                    <Icon name={card.icon} size={19} />
                  </View>
                  <Text
                    style={{
                      fontSize: mobile ? 34 : 40,
                      fontWeight: "600",
                      letterSpacing: -1.5,
                      marginTop: 14,
                      color: C.ink,
                    }}
                  >
                    {card.value}
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: "400",
                        letterSpacing: 0,
                      }}
                    >
                      {" "}
                      {card.unit}
                    </Text>
                  </Text>
                  <Text
                    style={{ fontSize: 10, color: "#68785A", marginTop: 7 }}
                  >
                    {card.title === "总脂肪"
                      ? "再看看下方的饱和脂肪"
                      : "食用量决定实际摄入"}
                  </Text>
                </View>
              ))}
            </View>
            <View style={{ marginTop: 20 }}>
              {[
                { key: "saturated", name: "饱和脂肪", unit: "g", dv: 20 },
                { key: "carbs", name: "碳水化合物", unit: "g" },
                { key: "protein", name: "蛋白质", unit: "g" },
                { key: "fiber", name: "膳食纤维", unit: "g", dv: 28 },
                { key: "sugar", name: "总糖", unit: "g" },
                { key: "addedSugar", name: "其中添加糖", unit: "g", dv: 50 },
                { key: "sodium", name: "钠", unit: "mg", dv: 2300 },
              ].map((item) => {
                const value = n[item.key as keyof typeof n];
                const pct =
                  item.dv && value !== null
                    ? Math.round(((value * grams) / 100 / item.dv) * 100)
                    : null;
                return (
                  <View
                    key={item.key}
                    style={{
                      paddingVertical: 13,
                      borderBottomWidth: 1,
                      borderBottomColor: C.line,
                    }}
                  >
                    <View style={[s.row, { justifyContent: "space-between" }]}>
                      <Text style={{ fontSize: 13, color: C.ink }}>
                        {item.name}
                      </Text>
                      <View style={[s.row, { gap: 12 }]}>
                        {pct !== null && (
                          <Text style={{ fontSize: 10, color: C.muted }}>
                            {pct}% DV
                          </Text>
                        )}
                        <Text
                          style={{
                            fontSize: 14,
                            fontWeight: "600",
                            color: C.ink,
                            minWidth: 65,
                            textAlign: "right",
                          }}
                        >
                          {fmt(value, grams)}
                          {value !== null ? ` ${item.unit}` : ""}
                        </Text>
                      </View>
                    </View>
                    {pct !== null && (
                      <View
                        style={{
                          height: 3,
                          backgroundColor: "#F0F2E9",
                          borderRadius: 4,
                          marginTop: 9,
                        }}
                      >
                        <View
                          style={{
                            height: 3,
                            width: `${Math.min(pct, 100)}%`,
                            borderRadius: 4,
                            backgroundColor:
                              pct >= 20 && item.key !== "fiber"
                                ? "#EBA580"
                                : "#ABC977",
                          }}
                        />
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
            <Text
              style={[s.small, { fontSize: 10, lineHeight: 17, marginTop: 15 }]}
            >
              DV 为美国 FDA 成人参考日值，非个体目标或中国
              NRV。糖、蛋白质和总碳水此处仅显示含量。
              {real
                ? `识别数据按每100${unit}换算，未读到的值留空。`
                : "示例数据按每100g储存。"}
            </Text>
            <Pressable
              accessibilityRole="link"
              onPress={() => Linking.openURL(SOURCE)}
              style={{ paddingVertical: 10 }}
            >
              <Text style={{ fontSize: 11, color: "#698344" }}>
                查看营养标签解读依据 ↗
              </Text>
            </Pressable>
          </View>
          {mobile && summaryCard}
          <View style={s.card}>
            <SectionTitle
              title="给你的食用提醒"
              eyebrow="A LITTLE HEADS-UP"
              action="设置偏好"
              onPress={() => router.dismissTo("/profile")}
            />
            <View
              style={{
                backgroundColor: "#F3F0E6",
                padding: 15,
                borderRadius: 12,
                marginBottom: 12,
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: "600", color: C.ink }}>
                标签过敏原：
                {food.allergens.length ? food.allergens.join("、") : "未标注"}
              </Text>
              <Text
                style={[s.body, { fontSize: 11, lineHeight: 20, marginTop: 5 }]}
              >
                {food.mayContain.length
                  ? `可能含有：${food.mayContain.join("、")}。`
                  : "未读到交叉接触信息。"}
                未检出或未标注不等于无过敏风险。
              </Text>
            </View>
            {notes.map((note) => (
              <View
                key={note.title}
                style={{
                  padding: 15,
                  borderRadius: 12,
                  backgroundColor: note.urgent ? "#FBE9DF" : "#EFF3E8",
                  marginBottom: 10,
                }}
              >
                <View style={[s.row, { alignItems: "flex-start" }]}>
                  <Icon
                    name={note.urgent ? "info" : "shield"}
                    size={18}
                    color={note.urgent ? "#BA633F" : "#677D51"}
                  />
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{ fontSize: 13, fontWeight: "600", color: C.ink }}
                    >
                      {note.title}
                    </Text>
                    <Text
                      style={[
                        s.body,
                        { fontSize: 12, lineHeight: 21, marginTop: 6 },
                      ]}
                    >
                      {note.body}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
            <Text
              style={[s.small, { fontSize: 10, lineHeight: 18, marginTop: 5 }]}
            >
              疾病相关提示用于辅助读标签，不判断某种疾病是否“能吃”。如有确诊疾病或饮食限制，请遵循医生建议。
            </Text>
          </View>
          <Button onPress={() => router.dismissTo("/")} icon="scan" tone="lime">
            再拍一个
          </Button>
        </View>
      </View>
      {mobile && <View style={{ marginTop: 20 }}>{ingredientCard}</View>}
      {real && (
        <View style={[s.card, { marginTop: 20 }]}>
          <SectionTitle title="核对包装原文" eyebrow="YOUR ORIGINAL LABEL" />
          {(food.labelNotes ?? []).map((note) => (
            <Text
              key={note}
              style={[s.body, { color: "#956449", marginBottom: 10 }]}
            >
              {note}
            </Text>
          ))}
          <Text selectable style={[s.body, { fontSize: 12, lineHeight: 22 }]}>
            {food.sourceText}
          </Text>
          <Text style={[s.small, { marginTop: 12 }]}>
            识别可能漏字或读错数字，尤其是过敏原和小字。请以包装为准。
          </Text>
        </View>
      )}
    </Shell>
  );
}
