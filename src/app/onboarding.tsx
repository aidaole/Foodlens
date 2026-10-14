import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  useWindowDimensions,
  BackHandler,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import { C, s, Icon, Pack, Button, Tag } from "../components/ui";
import { foods } from "../lib/food";
import { useStore } from "../lib/store";
import { SwipePager } from "../components/SwipePager";
import { NutritionChoices } from "../components/NutritionChoices";
export default function Onboarding() {
  const [page, setPage] = useState(0);
  const store = useStore();
  const [interests,setInterests] = useState(store.profile.nutritionInterests ?? []);
  const finish = () => { store.setProfile({...store.profile,nutritionInterests:interests}); store.completeOnboarding(); };
  const go = (next:number) => setPage(Math.max(0,Math.min(2,next)));
  const { height } = useWindowDimensions();
  const compact = height < 740;
  useFocusEffect(
    React.useCallback(() => {
      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        () => {
          if (page > 0) {
            setPage(page-1);
            return true;
          }
          return false;
        },
      );
      return () => subscription.remove();
    }, [page]),
  );
  return (
    <SafeAreaView
      edges={["top", "bottom", "left", "right"]}
      style={{ flex: 1, backgroundColor: C.bg }}
    >
      <View
        style={{ flex: 1, width: "100%", maxWidth: 600, alignSelf: "center" }}
      >
        <View
          style={[
            s.row,
            {
              justifyContent: "space-between",
              paddingHorizontal: 22,
              paddingVertical: compact ? 12 : 16,
            },
          ]}
        >
          <View style={[s.row, { gap: 9 }]}>
            <View style={s.logoMark}>
              <Icon name="scan" />
            </View>
            <Text style={[s.logo, { fontSize: 23 }]}>
              食刻{" "}
              <Text
                style={{ fontSize: 10, letterSpacing: 1, fontWeight: "600" }}
              >
                FOODLENS
              </Text>
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={finish}
            style={{ padding: 12 }}
          >
            <Text style={{ fontSize: 12, color: C.muted }}>跳过</Text>
          </Pressable>
        </View>
        <SwipePager page={page} onChange={go}>
          {[0,1,2].map(index=><ScrollView key={index} style={{flex:1,minHeight:0}} nestedScrollEnabled showsVerticalScrollIndicator={false} contentContainerStyle={{paddingHorizontal:22,paddingBottom:12,flexGrow:1,justifyContent:"center"}}>
            <GuideCard page={index} height={height} compact={compact} interests={interests} setInterests={setInterests}/>
          </ScrollView>)}
        </SwipePager>
        <View
          style={{ paddingHorizontal: 22, paddingBottom: 12, paddingTop: 10 }}
        >
          <Text style={{textAlign:"center",fontSize:10,color:C.muted,marginBottom:8}}>左右滑动 · {page+1} / 3</Text>
          <View
            style={[
              s.row,
              { justifyContent: "center", gap: 7, marginBottom: 12 },
            ]}
          >
            {[0, 1, 2].map((i) => (
              <Pressable accessibilityRole="button" accessibilityLabel={`引导第${i+1}页`} accessibilityState={{selected:i===page}} onPress={()=>go(i)}
                key={i}
                style={{
                  width: i === page ? 28 : 18,
                  height: 8,
                  borderRadius: 5,
                  backgroundColor: i === page ? C.ink : "#D9DED0",
                }}
              />
            ))}
          </View>
          <View style={[s.row, { gap: 12 }]}>
            {page > 0 && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="引导上一页"
                onPress={() => go(page-1)}
                style={{
                  padding: 15,
                  borderWidth: 1,
                  borderColor: C.line,
                  borderRadius: 14,
                }}
              >
                <Icon name="back" />
              </Pressable>
            )}
            <Button
              onPress={() =>
                page < 2 ? go(page+1) : finish()
              }
              icon={page < 2 ? "arrow" : "scan"}
              style={{ flex: 1 }}
            >
              {page < 2 ? "下一页" : "开始拍照"}
            </Button>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

function GuideCard({page,height,compact,interests,setInterests}:{page:number;height:number;compact:boolean;interests:string[];setInterests:(values:string[])=>void}) {
  const dark = page === 1;
  return (
          <View
            style={{
              backgroundColor: dark ? C.dark : C.lime,
              borderRadius: 28,
              padding: compact && page === 2 ? 16 : compact ? 20 : 24,
              overflow: "hidden",
            }}
          >
            <View
              style={{
                position: "absolute",
                width: 350,
                height: 350,
                borderRadius: 180,
                borderWidth: 1,
                borderColor: dark ? "#4A5B42" : "#BED979",
                right: -160,
                top: -95,
              }}
            />
            {page !== 2 && <View style={[s.row, { justifyContent: "space-between" }]}>
              <Tag color={dark ? "#40503B" : "#E9FEB3"}>
                <Text style={{ color: dark ? C.lime : C.ink }}>
                  {dark ? "一点饮食灵感" : "一张照片，一份明白"}
                </Text>
              </Tag>
              <Icon name="spark" color={dark ? C.lime : C.ink} />
            </View>
            }
            {page === 2 ? (
              <>
                <Text style={{fontSize:compact ? 24 : 28,lineHeight:34,fontWeight:"800",color:C.ink}}>营养关注，由你定。</Text>
                <Text style={{fontSize:12,lineHeight:20,color:"#53643D",marginTop:8,marginBottom:12}}>选择你关注的营养，可以多选。<Text>{"\n"}</Text>随时可在「我的」中修改。</Text>
                <NutritionChoices compact={compact} selected={interests} onChange={setInterests}/>
                <Text style={{fontSize:11,color:"#53643D",marginTop:14,lineHeight:19}}>仅保存在本机。未选择也可以继续。</Text>
              </>
            ) : dark ? (
              <>
                <Text
                  style={{
                    fontSize: 30,
                    fontWeight: "300",
                    color: C.lime,
                    letterSpacing: -1,
                    marginTop: 14,
                  }}
                >
                  01
                  <Text
                    style={{ fontSize: 11, letterSpacing: 1, color: "#9FAF94" }}
                  >
                    {" "}
                    / FOOD NOTES
                  </Text>
                </Text>
                <Text
                  style={{
                    fontSize: compact ? 28 : 32,
                    lineHeight: compact ? 38 : 43,
                    fontWeight: "700",
                    color: "#F5F8EF",
                    marginTop: 9,
                  }}
                >
                  热量之外，{"\n"}也看看脂肪。
                </Text>
                <Text
                  style={{
                    fontSize: 13,
                    lineHeight: 22,
                    color: "#BFCCB4",
                    marginTop: 15,
                  }}
                >
                  总脂肪看含量，饱和脂肪看细节。{"\n"}
                  先看份量，再做选择。
                </Text>
                <View
                  style={{
                    backgroundColor: "#344531",
                    padding: 15,
                    borderRadius: 17,
                    marginTop: 16,
                  }}
                >
                  <View style={[s.row, { justifyContent: "space-between" }]}>
                    <Text style={{ color: "#BDCAA9", fontSize: 11 }}>
                      每份 30g · 示例标签
                    </Text>
                    <Icon name="drop" size={19} color={C.lime} />
                  </View>
                  <View style={[s.row, { gap: 24, marginTop: 13 }]}>
                    <View>
                      <Text
                        style={{
                          fontSize: 30,
                          fontWeight: "700",
                          color: C.lime,
                        }}
                      >
                        5.4<Text style={{ fontSize: 12 }}> g</Text>
                      </Text>
                      <Text
                        style={{ fontSize: 11, color: "#C3CEBA", marginTop: 5 }}
                      >
                        总脂肪
                      </Text>
                    </View>
                    <View
                      style={{
                        height: 45,
                        width: 1,
                        backgroundColor: "#53654D",
                      }}
                    />
                    <View>
                      <Text
                        style={{
                          fontSize: 30,
                          fontWeight: "600",
                          color: "#F5F8EF",
                        }}
                      >
                        0.9<Text style={{ fontSize: 12 }}> g</Text>
                      </Text>
                      <Text
                        style={{ fontSize: 11, color: "#C3CEBA", marginTop: 5 }}
                      >
                        饱和脂肪
                      </Text>
                    </View>
                  </View>
                </View>
              </>
            ) : (
              <>
                <Text
                  style={{
                    fontSize: compact ? 30 : 34,
                    fontWeight: "800",
                    letterSpacing: -1.5,
                    lineHeight: compact ? 39 : 44,
                    color: C.ink,
                    marginTop: 16,
                  }}
                >
                  拍一下，{"\n"}吃个明白。
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    lineHeight: 24,
                    color: "#53643D",
                    marginTop: 12,
                  }}
                >
                  配料、热量、脂肪，一眼看清。{"\n"}
                  把复杂的标签，变成简单的选择。
                </Text>
                <View
                  style={{
                    height: Math.max(125, Math.min(175, height * 0.21)),
                    alignItems: "center",
                    justifyContent: "center",
                    marginTop: 12,
                  }}
                >
                  <View
                    style={{
                      position: "absolute",
                      width: 150,
                      height: 150,
                      borderRadius: 110,
                      backgroundColor: "#E7FAB5",
                    }}
                  />
                  <View style={{ transform: [{ rotate: "12deg" }] }}>
                    <Pack food={foods[0]} size={Math.min(135, height * 0.18)} />
                  </View>
                  <View
                    style={{
                      position: "absolute",
                      left: 0,
                      top: 15,
                      transform: [{ rotate: "-6deg" }],
                      backgroundColor: C.paper,
                      borderRadius: 12,
                      padding: 13,
                    }}
                  >
                    <View style={s.row}>
                      <Icon name="leaf" size={17} />
                      <Text
                        style={{
                          fontSize: 11,
                          fontWeight: "600",
                          color: C.ink,
                        }}
                      >
                        配料，明明白白
                      </Text>
                    </View>
                  </View>
                </View>
              </>
            )}
            {page !== 2 && <View
              style={[
                s.row,
                {
                  borderTopWidth: 1,
                  borderTopColor: dark ? "#4A5B42" : "#BED979",
                  paddingTop: 12,
                  marginTop: 14,
                  justifyContent: "space-between",
                },
              ]}
            >
              {["看懂配料", "关注脂肪", "个人提醒"].map((t, i) => (
                <View key={t} style={[s.row, { gap: 5 }]}>
                  <Icon
                    name={["leaf", "drop", "shield"][i]}
                    size={15}
                    color={dark ? C.lime : C.ink}
                  />
                  <Text
                    style={{
                      fontSize: 10,
                      color: dark ? "#C2CEB6" : "#435432",
                    }}
                  >
                    {t}
                  </Text>
                </View>
              ))}
            </View>}
          </View>
  );
}
