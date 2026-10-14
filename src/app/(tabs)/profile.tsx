import React, { useState } from "react";
import { View, Text, Pressable, useWindowDimensions } from "react-native";
import { Shell, C, s, Icon, Button, SectionTitle } from "../../components/ui";
import { useStore } from "../../lib/store";
import { concerns, allergies, Profile } from "../../lib/food";
import { NutritionChoices } from "../../components/NutritionChoices";
export default function ProfileScreen() {
  const store = useStore();
  const [confirm, setConfirm] = useState(false);
  const { width } = useWindowDimensions();
  const mobile = width < 800;
  function toggle(key: keyof Profile, value: string) {
    const current = store.profile[key] ?? [];
    store.setProfile({
      ...store.profile,
      [key]: current.includes(value)
        ? current.filter((x) => x !== value)
        : [...current, value],
    });
  }
  return (
    <Shell title="我的">
      <Text style={s.eyebrow}>MADE FOR YOUR PLATE</Text>
      <Text style={s.pageHeading}>你的饮食，你来定义。</Text>
      <Text style={[s.body, { marginTop: 8 }]}>
        选好关注项，分析时就会多一份贴心提醒。
      </Text>
      <View style={[s.card, s.row, { marginTop: 22, gap: 16 }]}>
        <View
          style={[s.avatar, { width: 54, height: 54, backgroundColor: C.lime }]}
        >
          <Icon name="user" size={26} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[s.heading, { fontSize: 18 }]}>我的食刻</Text>
          <Text style={[s.small, { fontSize: 12 }]}>
            记录 {store.history.length} · 收藏 {store.saved.length}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={store.replayOnboarding}
          style={{ padding: 10 }}
        >
          <Text style={{ fontSize: 12, color: "#647C48" }}>重看引导 ↗</Text>
        </Pressable>
      </View>
      <View
        style={{
          flexDirection: mobile ? "column" : "row",
          gap: 24,
          marginTop: 29,
        }}
      >
        <View style={{ flex: mobile ? undefined : 1.5, gap: 22 }}>
          <View style={s.card}>
            <SectionTitle title="我关注的营养价值" eyebrow="MY NUTRITION" />
            <Text style={[s.body,{fontSize:12,marginBottom:16}]}>可多选，分析结果中优先显示；随时可以调整。</Text>
            <NutritionChoices selected={store.profile.nutritionInterests ?? []} onChange={values=>store.setProfile({...store.profile,nutritionInterests:values})}/>
          </View>
          <View style={s.card}>
            <SectionTitle title="最近在关注什么？" eyebrow="YOUR FOCUS" />
            <Text style={[s.body, { fontSize: 12, marginBottom: 20 }]}>
              可以多选；疾病相关项只提供标签解读提示。
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
              {concerns.map((value, i) => {
                const checked = store.profile.concerns.includes(value);
                return (
                  <Pressable
                    key={value}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked }}
                    onPress={() => toggle("concerns", value)}
                    style={[
                      s.row,
                      {
                        padding: 16,
                        borderRadius: 13,
                        borderWidth: 1,
                        borderColor: checked ? "#BEDD78" : C.line,
                        backgroundColor: checked ? C.lime : C.bg,
                        minWidth: 145,
                      },
                    ]}
                  >
                    <Icon
                      name={
                        checked
                          ? "check"
                          : ["drop", "leaf", "fire", "shield"][i]
                      }
                      size={18}
                    />
                    <Text style={{ fontSize: 13, color: C.ink }}>{value}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
          <View style={s.card}>
            <SectionTitle
              title="需要避开的过敏原"
              eyebrow="ALLERGEN REMINDERS"
            />
            <Text style={[s.body, { fontSize: 12, marginBottom: 20 }]}>
              选择你已知的过敏原，遇到相关配料时优先提醒。
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
              {allergies.map((value) => {
                const checked = store.profile.allergies.includes(value);
                return (
                  <Pressable
                    key={value}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked }}
                    onPress={() => toggle("allergies", value)}
                    style={[
                      s.row,
                      {
                        paddingVertical: 13,
                        paddingHorizontal: 20,
                        borderRadius: 11,
                        borderWidth: 1,
                        borderColor: checked ? "#E3AF90" : C.line,
                        backgroundColor: checked ? "#F8E3D3" : C.bg,
                      },
                    ]}
                  >
                    <Text style={{ fontSize: 13, color: C.ink }}>{value}</Text>
                    {checked && <Icon name="check" size={15} />}
                  </Pressable>
                );
              })}
            </View>
            <Text
              style={[s.small, { fontSize: 11, lineHeight: 19, marginTop: 20 }]}
            >
              这份列表不涵盖所有可能的过敏原。严重过敏请核对原包装与厂商信息。
            </Text>
          </View>
          <View
            style={[
              s.row,
              { backgroundColor: "#E9F1DC", padding: 16, borderRadius: 13 },
            ]}
          >
            <Icon name="check" size={17} />
            <Text style={{ fontSize: 12, color: "#627943" }}>
              选择后自动保存在这台设备。
            </Text>
          </View>
        </View>
        <View style={{ flex: mobile ? undefined : 1, gap: 20 }}>
          <View
            style={[s.card, { backgroundColor: C.dark, borderColor: C.dark }]}
          >
            <Icon name="leaf" color={C.lime} size={32} />
            <Text style={[s.heading, { color: C.paper, marginTop: 18 }]}>
              不需要完美饮食。{"\n"}只需要更懂自己。
            </Text>
            <Text
              style={{
                fontSize: 12,
                lineHeight: 23,
                color: "#C0CDB4",
                marginTop: 18,
              }}
            >
              偏好可随时调整。标签解读会帮助你留意脂肪、钠、总碳水和过敏原，食用决定也要结合你的实际需要。
            </Text>
          </View>
          <View style={s.card}>
            <Icon name="shield" size={25} />
            <Text style={[s.heading, { fontSize: 17, marginTop: 12 }]}>
              让偏好留在本地
            </Text>
            <Text style={[s.body, { fontSize: 12, marginTop: 6 }]}>
              当前不需要注册，也不会上传饮食关注项。共享设备上的其他使用者可能看到这些设置。
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => setConfirm(!confirm)}
              style={{ paddingVertical: 16 }}
            >
              <Text style={{ fontSize: 12, color: "#A66042" }}>
                清除本地数据
              </Text>
            </Pressable>
            {confirm && (
              <View
                style={{
                  borderTopWidth: 1,
                  borderTopColor: C.line,
                  paddingTop: 15,
                }}
              >
                <Text style={[s.body, { fontSize: 12, marginBottom: 12 }]}>
                  将移除偏好、收藏和所有体验记录。
                </Text>
                <Button
                  tone="light"
                  icon="close"
                  onPress={() => {
                    store.clear();
                    setConfirm(false);
                  }}
                >
                  确认清除
                </Button>
              </View>
            )}
          </View>
        </View>
      </View>
    </Shell>
  );
}
