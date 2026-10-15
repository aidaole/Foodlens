import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  Image,
  Platform,
  useWindowDimensions,
  ActivityIndicator,
  Modal,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as Linking from "expo-linking";
import { router } from "expo-router";
import {
  Shell,
  C,
  s,
  Icon,
  Pack,
  Button,
  Tag,
  SectionTitle,
} from "../../components/ui";
import {
  recognizePhoto,
  RecognitionError,
  cloudConfigured,
  type UploadInfo,
  recognitionBrowserURL,
} from "../../lib/recognize";
import { foods } from "../../lib/food";
import { useStore } from "../../lib/store";
import { PhotoCrop, type Photo } from "../../components/PhotoCrop";
import type { RecognitionStage } from "../../lib/recognition-network";
const stageCopy = {
  connecting: ["正在连接识别服务…", "先检查网络连接，连接成功后再发送照片。"],
  preparing: ["正在准备标签照片…", "正在压缩图片，保留清晰的配料和营养文字。"],
  recognizing: ["正在上传并读取标签…", "通常需要十几秒；服务繁忙时会稍久，照片会保留在这里。"],
} as const;
export default function Scan() {
  const [photo, setPhoto] = useState<(Photo & { original: Photo }) | null>(
    null,
  );
  const [cropSource, setCropSource] = useState<Photo | null>(null);
  const [error, setError] = useState("");
  const [errorCode, setErrorCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState<RecognitionStage>("connecting");
  const [uploadInfo, setUploadInfo] = useState<UploadInfo | null>(null);
  const [consentPhoto, setConsentPhoto] = useState<Photo | null>(null);
  const request = useRef<AbortController | null>(null);
  useEffect(() => () => request.current?.abort(), []);
  const { width } = useWindowDimensions();
  const mobile = width < 800;
  const store = useStore();
  async function pick(camera: boolean) {
    if (busy) return;
    setError("");
    setErrorCode("");
    try {
      if (camera && Platform.OS !== "web") {
        const p = await ImagePicker.requestCameraPermissionsAsync();
        if (!p.granted) {
          setError(
            "相机权限未开启。可在系统设置里允许访问，或从相册选择照片。",
          );
          return;
        }
      }
      const options: ImagePicker.ImagePickerOptions = {
        mediaTypes: ["images"],
        quality: 1,
        allowsEditing: false,
      };
      const result = camera
        ? await ImagePicker.launchCameraAsync(options)
        : await ImagePicker.launchImageLibraryAsync(options);
      if (!result.canceled && result.assets[0]) {
        const a = result.assets[0];
        setCropSource({ uri: a.uri, width: a.width, height: a.height });
      }
    } catch {
      setError("暂时无法打开相机或相册，请从相册选择，或尝试下方的示例。");
    }
  }
  async function analyze(p: Photo) {
    if (request.current) return;
    setError("");
    setErrorCode("");
    setBusy(true);
    setUploadInfo(null);
    const controller = new AbortController();
    request.current = controller;
    try {
      const { food, thumbnail } = await recognizePhoto(p, controller.signal, setStage, setUploadInfo);
      if (controller.signal.aborted) return;
      store.saveRecognition(food, thumbnail);
      router.push({ pathname: "/result", params: { id: food.id } });
    } catch (e) {
      setErrorCode(e instanceof RecognitionError ? e.code : "");
      setError(
        e instanceof RecognitionError
          ? e.message
          : "暂时没有识别完成，请重试。",
      );
    } finally {
      request.current = null;
      setBusy(false);
    }
  }
  function cropDone(cropped: Photo) {
    if (!cropSource) return;
    setPhoto({ ...cropped, original: cropSource });
    setUploadInfo(null);
    setCropSource(null);
    if (!cloudConfigured) {
      setError("云端识别正在等待账号接通，照片已裁剪好。");
      return;
    }
    if (store.cloudConsent) void analyze(cropped);
    else setConsentPhoto(cropped);
  }
  function demo(id: string) {
    if (busy || !store.ready) return;
    setBusy(true);
    store.addHistory(id);
    router.push({ pathname: "/result", params: { id } });
    setBusy(false);
  }
  return (
    <>
      <Shell title="拍照">
        <View style={{ marginBottom: 28 }}>
          <Text style={s.eyebrow}>POINT. SNAP. KNOW.</Text>
          <Text style={s.pageHeading}>给食品，拍个明白。</Text>
          <Text style={[s.body, { marginTop: 9 }]}>
            对准配料表和营养成分表，文字清晰更好读。
          </Text>
        </View>
        <View style={{ flexDirection: mobile ? "column" : "row", gap: 24 }}>
          <View
            style={[s.card, { flex: mobile ? undefined : 1.35, padding: 18 }]}
          >
            <View
              style={{
                height: mobile ? 340 : 405,
                backgroundColor: "#EAEEDF",
                borderRadius: 16,
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
              }}
            >
              {photo ? (
                <Image
                  accessibilityLabel="准备上传的标签照片"
                  source={{ uri: uploadInfo?.uri ?? photo.uri }}
                  style={{ width: "100%", height: "100%" }}
                  resizeMode="contain"
                />
              ) : (
                <>
                  <View
                    style={{
                      position: "absolute",
                      width: 280,
                      height: 280,
                      borderRadius: 150,
                      borderWidth: 1,
                      borderColor: "#CDD6BD",
                    }}
                  />
                  <Pack food={foods[0]} size={220} back />
                  <View style={{ position: "absolute", top: 17, left: 17 }}>
                    <Tag color="#FFFFFFCC">标签取景示意</Tag>
                  </View>
                </>
              )}
              {[
                { top: 35, left: 35, borderTopWidth: 3, borderLeftWidth: 3 },
                { top: 35, right: 35, borderTopWidth: 3, borderRightWidth: 3 },
                {
                  bottom: 35,
                  left: 35,
                  borderBottomWidth: 3,
                  borderLeftWidth: 3,
                },
                {
                  bottom: 35,
                  right: 35,
                  borderBottomWidth: 3,
                  borderRightWidth: 3,
                },
              ].map((pos, i) => (
                <View
                  key={i}
                  style={{
                    position: "absolute",
                    width: 28,
                    height: 28,
                    borderColor: C.ink,
                    ...pos,
                  }}
                />
              ))}
            </View>
            <View style={[s.row, { marginTop: 16, gap: 10, flexWrap: "wrap" }]}>
              <Button
                disabled={busy}
                onPress={() => pick(true)}
                icon="camera"
                showArrow={false}
                style={{ flex: 1 }}
              >
                打开相机
              </Button>
              <Button
                disabled={busy}
                onPress={() => pick(false)}
                icon="image"
                showArrow={false}
                tone="light"
                style={{ flex: 1 }}
              >
                相册上传
              </Button>
            </View>
            {!!error && (
              <Text
                accessibilityRole="alert"
                style={[s.body, { color: "#AA542D", marginTop: 14 }]}
              >
                {error}
              </Text>
            )}
            {Platform.OS !== "web" && ["CONNECTION_TIMEOUT", "NETWORK"].includes(errorCode) && (
              <View style={{marginTop:12, gap:10}}>
                <Button tone="light" showArrow={false} onPress={() => {
                  void Linking.openURL(recognitionBrowserURL).catch(() => setError("无法打开浏览器，请手动打开识别服务地址。"));
                }}>用浏览器继续识别</Button>
                <Text style={[s.body,{fontSize:12}]}>
                  浏览器能打开时，可先在那里选图识别；浏览器记录会单独保存。也请在VPN的按应用设置中选中食刻。浏览器也打不开时，需要检查网络或服务地址。
                </Text>
              </View>
            )}
            {photo && (
              <View
                style={{
                  marginTop: 17,
                  padding: 18,
                  borderRadius: 14,
                  backgroundColor: "#F6F0DC",
                }}
              >
                <Text style={{ fontWeight: "700", color: C.ink }}>
                  {busy ? stageCopy[stage][0] : "标签照片已准备好"}
                </Text>
                <Text style={[s.body, { fontSize: 12, marginTop: 7 }]}>
                  {busy
                    ? stageCopy[stage][1]
                    : cloudConfigured
                      ? "裁剪完成后，自动读取标签并显示结果。"
                      : "云端识别还在准备。可先用下方示例体验结果页。"}
                </Text>
                {busy ? (
                  <View
                    style={[
                      s.row,
                      { marginTop: 16, justifyContent: "space-between" },
                    ]}
                  >
                    <ActivityIndicator color={C.ink} />
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => request.current?.abort()}
                      style={{ padding: 10 }}
                    >
                      <Text>取消识别</Text>
                    </Pressable>
                  </View>
                ) : (
                  <Button
                    style={{ marginTop: 14 }}
                    icon="scan"
                    showArrow={false}
                    onPress={() =>
                      store.cloudConsent
                        ? void analyze(photo)
                        : cloudConfigured
                          ? setConsentPhoto(photo)
                          : void analyze(photo)
                    }
                  >
                    重新识别
                  </Button>
                )}
                {uploadInfo && (
                  <Text style={[s.body, {fontSize:12, marginTop:12}]}>
                    已准备上传图 · {uploadInfo.width} × {uploadInfo.height} px · {Math.ceil(uploadInfo.bytes / 1024)} KB
                  </Text>
                )}
                <Pressable
                  accessibilityRole="button"
                  disabled={busy}
                  onPress={() => setCropSource(photo.original)}
                  style={{ paddingTop: 12 }}
                >
                  <Text style={{ fontSize: 12, color: "#688044" }}>
                    重新裁剪 · {photo.width} × {photo.height} px
                  </Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  disabled={busy}
                  onPress={() => {
                    setPhoto(null);
                    setUploadInfo(null);
                    setError("");
                    setErrorCode("");
                  }}
                  style={{ paddingTop: 12 }}
                >
                  <Text style={{ fontSize: 12, color: "#8B6136" }}>
                    移除这张照片
                  </Text>
                </Pressable>
              </View>
            )}
          </View>
          <View style={{ flex: mobile ? undefined : 1, gap: 20 }}>
            <View
              style={[s.card, { backgroundColor: C.dark, borderColor: C.dark }]}
            >
              <Icon name="scan" size={32} color={C.lime} />
              <Text style={[s.heading, { color: "#F8FAF1", marginTop: 18 }]}>
                一张照片就够。{"\n"}记得拍到这两块。
              </Text>
              {[
                "配料表：原料与过敏原提示",
                "营养表：数值、单位与标注基准",
                "避免反光，让小字清晰可见",
              ].map((t, i) => (
                <View
                  key={t}
                  style={[s.row, { marginTop: 18, alignItems: "flex-start" }]}
                >
                  <Text style={{ color: C.lime, fontSize: 12 }}>0{i + 1}</Text>
                  <Text
                    style={{
                      color: "#C3CCB9",
                      fontSize: 12,
                      lineHeight: 20,
                      flex: 1,
                    }}
                  >
                    {t}
                  </Text>
                </View>
              ))}
            </View>
            <View style={[s.card, { backgroundColor: "#EDF1E5" }]}>
              <Icon name="shield" />
              <Text style={[s.heading, { fontSize: 17, marginTop: 10 }]}>
                只分享食品标签
              </Text>
              <Text style={[s.body, { fontSize: 12, marginTop: 6 }]}>
                {cloudConfigured
                  ? "图片将由 Cloudflare Workers AI 读取，我们的接口不保存照片。请避开人脸和个人信息。"
                  : "尽量避免拍入人脸和个人信息。云端识别正在等待账号接通。"}
              </Text>
            </View>
          </View>
        </View>
        <View style={{ marginTop: 30 }}>
          <SectionTitle title="没有包装？用示例体验" eyebrow="TRY A DEMO" />
          <View style={{ flexDirection: mobile ? "column" : "row", gap: 12 }}>
            {foods.map((f) => (
              <Pressable
                key={f.id}
                disabled={busy || !store.ready}
                accessibilityRole="button"
                onPress={() => demo(f.id)}
                style={({
                  hovered,
                }: {
                  pressed: boolean;
                  hovered?: boolean;
                }) => [
                  s.card,
                  s.row,
                  {
                    flex: 1,
                    padding: 15,
                    gap: 16,
                    backgroundColor: hovered ? "#EDF3E0" : C.paper,
                  },
                ]}
              >
                <View
                  style={{
                    height: 72,
                    width: 63,
                    overflow: "hidden",
                    backgroundColor: f.color,
                    borderRadius: 12,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Pack food={f} size={48} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{ fontSize: 14, fontWeight: "700", color: C.ink }}
                  >
                    {f.name}
                  </Text>
                  <Text style={[s.small, { fontSize: 11, marginTop: 5 }]}>
                    查看示例分析 →
                  </Text>
                </View>
                {busy ? (
                  <ActivityIndicator color={C.ink} />
                ) : (
                  <Icon name="up" size={18} />
                )}
              </Pressable>
            ))}
          </View>
        </View>
      </Shell>
      {cropSource && (
        <PhotoCrop
          key={cropSource.uri}
          source={cropSource}
          onCancel={() => setCropSource(null)}
          onApply={cropDone}
        />
      )}
      <Modal
        visible={!!consentPhoto}
        transparent
        animationType="fade"
        onRequestClose={() => setConsentPhoto(null)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "#20271FCC",
            justifyContent: "center",
            padding: 24,
          }}
        >
          <View
            style={[
              s.card,
              { maxWidth: 500, width: "100%", alignSelf: "center" },
            ]}
          >
            <Icon name="shield" size={30} />
            <Text style={[s.heading, { marginTop: 14, fontSize: 22 }]}>
              把标签交给食刻。
            </Text>
            <Text style={[s.body, { marginTop: 12 }]}>
              图片会发送至 Cloudflare Workers AI
              读取配料和营养表。我们的接口不保存照片；识别文字、结果和压缩缩略图保存在这台设备，饮食偏好不上传。请先裁掉人脸或个人信息。
            </Text>
            <Button
              style={{ marginTop: 20 }}
              onPress={() => {
                if (consentPhoto) {
                  store.allowCloud();
                  void analyze(consentPhoto);
                  setConsentPhoto(null);
                }
              }}
            >
              同意并识别
            </Button>
            <Button
              tone="light"
              style={{ marginTop: 10 }}
              onPress={() => setConsentPhoto(null)}
            >
              先不发送
            </Button>
          </View>
        </View>
      </Modal>
    </>
  );
}
