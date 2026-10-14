import { View, Text, Linking } from "react-native";
import { router } from "expo-router";
import { Shell, s, C, Icon, Button, SectionTitle } from "../components/ui";
import { SOURCE } from "../lib/food";
export default function Guide() {
  return (
    <Shell title="标签小课堂">
      <Text style={s.eyebrow}>30 SECONDS OF FOOD WISDOM</Text>
      <Text style={s.pageHeading}>看懂标签，不用背公式。</Text>
      <View style={{ gap: 17, marginTop: 25 }}>
        {[
          {
            title: "先找基准，再看数值",
            body: "“每 100g”不是“一包”。如果一包 60g，营养表标每 100g 脂肪 34g，那么吃完整包是 20.4g 脂肪。",
            icon: "scan",
          },
          {
            title: "总脂肪之后，再看饱和脂肪",
            body: "总脂肪包含不同类型的脂肪。选择时可留意饱和脂肪；比较同类食品时用相同份量。",
            icon: "drop",
          },
          {
            title: "无添加糖，不等于零碳水",
            body: "管理血糖时也要看总碳水化合物和实际食用量。总糖与添加糖不是同一个数值。",
            icon: "fire",
          },
          {
            title: "没看到过敏原，不代表没有",
            body: "配料表、过敏原声明与“可能含有”都需要核对。识别遗漏不能作为过敏安全依据。",
            icon: "shield",
          },
        ].map((tip, i) => (
          <View
            key={tip.title}
            style={[s.card, s.row, { alignItems: "flex-start", gap: 20 }]}
          >
            <View
              style={{
                backgroundColor: i % 2 === 0 ? C.lime : "#EBE6F5",
                padding: 14,
                borderRadius: 15,
              }}
            >
              <Icon name={tip.icon} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.heading, { fontSize: 18 }]}>{tip.title}</Text>
              <Text style={[s.body, { fontSize: 13, marginTop: 8 }]}>
                {tip.body}
              </Text>
            </View>
          </View>
        ))}
      </View>
      <View style={[s.card, { marginTop: 22 }]}>
        <SectionTitle title="参考依据" />
        <Text style={[s.body, { fontSize: 12, marginBottom: 15 }]}>
          本版使用 FDA
          营养标签教育资料作为参考。日值是一般成人的比较基准，不是个人饮食处方，也不是中国标签
          NRV。
        </Text>
        <Button tone="light" onPress={() => Linking.openURL(SOURCE)}>
          阅读 FDA 标签指南
        </Button>
      </View>
      <Button
        onPress={() => router.navigate("/")}
        style={{ marginTop: 20 }}
        icon="scan"
      >
        试着读一张标签
      </Button>
    </Shell>
  );
}
