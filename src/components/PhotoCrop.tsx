import React, { useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  Image,
  Modal,
  PanResponder,
  Pressable,
  ActivityIndicator,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import { C, s, Icon, Button } from "./ui";
import {
  fullCrop,
  moveCrop,
  cropPixels,
  fitImage,
  insetCrop,
  type CropRect,
  type CropMode,
} from "../lib/crop";
export type Photo = { uri: string; width: number; height: number };
function DragArea({
  mode,
  rectRef,
  apply,
  width,
  height,
  disabled,
  style,
  children,
}: {
  mode: CropMode;
  rectRef: React.MutableRefObject<CropRect>;
  apply: (r: CropRect) => void;
  width: number;
  height: number;
  disabled: boolean;
  style: React.ComponentProps<typeof View>["style"];
  children?: React.ReactNode;
}) {
  const start = useRef(fullCrop);
  const pan = useMemo(
    () =>
      // PanResponder stores these callbacks; refs are only read during gestures.
      // eslint-disable-next-line react-hooks/refs
      PanResponder.create({
        onStartShouldSetPanResponder: () => !disabled,
        onMoveShouldSetPanResponder: () => !disabled,
        onPanResponderGrant: () => {
          start.current = { ...rectRef.current };
        },
        onPanResponderMove: (_, g) => {
          if (width > 0 && height > 0)
            apply(
              moveCrop(
                start.current,
                mode,
                g.dx / width,
                g.dy / height,
                Math.min(0.2, 40 / width),
                Math.min(0.2, 40 / height),
              ),
            );
        },
        onPanResponderTerminationRequest: () => false,
      }),
    [disabled, width, height, apply, mode, rectRef],
  );
  return (
    <View testID={`crop-${mode}`} style={style} {...pan.panHandlers}>
      {children}
    </View>
  );
}
export function PhotoCrop({
  source,
  onCancel,
  onApply,
}: {
  source: Photo;
  onCancel: () => void;
  onApply: (p: Photo) => void;
}) {
  const { height: screenHeight } = useWindowDimensions();
  const [frame, setFrame] = useState({ width: 0, height: 0 });
  const [rect, setRect] = useState<CropRect>(fullCrop);
  const rectRef = useRef(rect);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const apply = React.useCallback((r: CropRect) => {
    rectRef.current = r;
    setRect(r);
  }, []);
  const fitted = fitImage(
    source.width,
    source.height,
    frame.width,
    frame.height,
  );
  const pixels = cropPixels(rect, source.width, source.height);
  const left = rect.x * fitted.width,
    top = rect.y * fitted.height,
    rw = rect.width * fitted.width,
    rh = rect.height * fitted.height;
  const cancel = () => {
    if (!busy) onCancel();
  };
  async function save() {
    if (busy) return;
    setBusy(true);
    setError("");
    let ctx: ReturnType<typeof ImageManipulator.manipulate> | undefined;
    let image:
      | Awaited<
          ReturnType<
            ReturnType<typeof ImageManipulator.manipulate>["renderAsync"]
          >
        >
      | undefined;
    try {
      ctx = ImageManipulator.manipulate(source.uri);
      ctx.crop(pixels);
      image = await ctx.renderAsync();
      const result = await image.saveAsync({
        format: SaveFormat.JPEG,
        compress: 0.95,
      });
      onApply({ uri: result.uri, width: result.width, height: result.height });
    } catch {
      setError("裁剪暂时失败，请重试或返回重新选图。");
    } finally {
      image?.release();
      ctx?.release();
      setBusy(false);
    }
  }
  return (
    <Modal visible animationType="slide" onRequestClose={cancel}>
      <SafeAreaView
        style={{ flex: 1, backgroundColor: C.bg }}
        edges={["top", "bottom", "left", "right"]}
      >
        <View
          style={{ flex: 1, width: "100%", maxWidth: 650, alignSelf: "center" }}
        >
          <View
            style={[
              s.row,
              {
                padding: 20,
                justifyContent: "space-between",
                borderBottomWidth: 1,
                borderBottomColor: C.line,
              },
            ]}
          >
            <Pressable
              accessibilityRole="button"
              disabled={busy}
              onPress={cancel}
              style={{ padding: 10 }}
            >
              <Text style={{ fontSize: 13, color: C.muted }}>取消</Text>
            </Pressable>
            <Text style={[s.heading, { fontSize: 19 }]}>裁剪标签</Text>
            <Icon name="scan" />
          </View>
          <View style={{ padding: 22 }}>
            <Text style={[s.heading, { fontSize: 24 }]}>
              只留下，需要读的部分。
            </Text>
            <Text style={[s.body, { fontSize: 12, marginTop: 7 }]}>
              拖动选区移动，拖动四角调整大小。请保留完整配料表和营养表。
            </Text>
          </View>
          <View
            style={{
              paddingHorizontal: 30,
              flex: 1,
              minHeight: 120,
              justifyContent: "center",
            }}
          >
            <View
              testID="crop-frame"
              onLayout={(e) => setFrame(e.nativeEvent.layout)}
              style={{
                width: "100%",
                height: Math.max(100, Math.min(420, screenHeight * 0.42)),
                backgroundColor: "#E6EADD",
                borderRadius: 18,
              }}
            >
              {frame.width > 0 && (
                <View
                  style={{
                    position: "absolute",
                    left: fitted.x,
                    top: fitted.y,
                    width: fitted.width,
                    height: fitted.height,
                  }}
                >
                  <Image
                    source={{ uri: source.uri }}
                    style={{ width: "100%", height: "100%" }}
                    resizeMode="stretch"
                  />
                  <View
                    pointerEvents="none"
                    style={{
                      position: "absolute",
                      left: 0,
                      top: 0,
                      width: fitted.width,
                      height: top,
                      backgroundColor: "#20271F88",
                    }}
                  />
                  <View
                    pointerEvents="none"
                    style={{
                      position: "absolute",
                      left: 0,
                      top: top + rh,
                      width: fitted.width,
                      height: Math.max(0, fitted.height - top - rh),
                      backgroundColor: "#20271F88",
                    }}
                  />
                  <View
                    pointerEvents="none"
                    style={{
                      position: "absolute",
                      left: 0,
                      top,
                      width: left,
                      height: rh,
                      backgroundColor: "#20271F88",
                    }}
                  />
                  <View
                    pointerEvents="none"
                    style={{
                      position: "absolute",
                      left: left + rw,
                      top,
                      width: Math.max(0, fitted.width - left - rw),
                      height: rh,
                      backgroundColor: "#20271F88",
                    }}
                  />
                  <DragArea
                    mode="move"
                    rectRef={rectRef}
                    apply={apply}
                    width={fitted.width}
                    height={fitted.height}
                    disabled={busy}
                    style={{
                      position: "absolute",
                      left,
                      top,
                      width: rw,
                      height: rh,
                      borderWidth: 2,
                      borderColor: C.lime,
                    }}
                  >
                    <View
                      pointerEvents="none"
                      style={{
                        position: "absolute",
                        left: "33.33%",
                        height: "100%",
                        borderLeftWidth: 1,
                        borderColor: "#FFFFFF88",
                      }}
                    />
                    <View
                      pointerEvents="none"
                      style={{
                        position: "absolute",
                        left: "66.66%",
                        height: "100%",
                        borderLeftWidth: 1,
                        borderColor: "#FFFFFF88",
                      }}
                    />
                    <View
                      pointerEvents="none"
                      style={{
                        position: "absolute",
                        top: "33.33%",
                        width: "100%",
                        borderTopWidth: 1,
                        borderColor: "#FFFFFF88",
                      }}
                    />
                    <View
                      pointerEvents="none"
                      style={{
                        position: "absolute",
                        top: "66.66%",
                        width: "100%",
                        borderTopWidth: 1,
                        borderColor: "#FFFFFF88",
                      }}
                    />
                  </DragArea>
                  {(["tl", "tr", "bl", "br"] as const).map((mode) => (
                    <DragArea
                      key={mode}
                      mode={mode}
                      rectRef={rectRef}
                      apply={apply}
                      width={fitted.width}
                      height={fitted.height}
                      disabled={busy}
                      style={{
                        position: "absolute",
                        left: left + (mode.endsWith("r") ? rw : 0) - 22,
                        top: top + (mode.startsWith("b") ? rh : 0) - 22,
                        width: 44,
                        height: 44,
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      <View
                        style={{
                          width: 17,
                          height: 17,
                          borderRadius: 6,
                          backgroundColor: C.lime,
                          borderWidth: 2,
                          borderColor: C.ink,
                        }}
                      />
                    </DragArea>
                  ))}
                </View>
              )}
            </View>
          </View>
          <View
            style={{ paddingHorizontal: 22, paddingBottom: 20, paddingTop: 20 }}
          >
            <View
              style={[
                s.row,
                { justifyContent: "space-between", marginBottom: 17 },
              ]}
            >
              <Text
                testID="crop-dimensions"
                style={[s.small, { fontSize: 11 }]}
              >
                {pixels.width} × {pixels.height} px
              </Text>
              <View style={s.row}>
                <Pressable
                  disabled={busy}
                  accessibilityRole="button"
                  onPress={() => apply(insetCrop(rectRef.current))}
                  style={{ padding: 10 }}
                >
                  <Text style={{ fontSize: 12, color: "#688044" }}>
                    收紧选区
                  </Text>
                </Pressable>
                <Pressable
                  disabled={busy}
                  accessibilityRole="button"
                  onPress={() => apply(fullCrop)}
                  style={{ padding: 10 }}
                >
                  <Text style={{ fontSize: 12, color: C.muted }}>重置</Text>
                </Pressable>
              </View>
            </View>
            {!!error && (
              <Text
                accessibilityRole="alert"
                style={[s.small, { color: "#B86743", marginBottom: 12 }]}
              >
                {error}
              </Text>
            )}
            <Button
              disabled={busy || frame.width === 0}
              onPress={save}
              icon="check"
            >
              {busy ? "正在裁剪…" : "完成裁剪"}
            </Button>
            {busy && (
              <ActivityIndicator color={C.ink} style={{ marginTop: 10 }} />
            )}
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}
