import React, { useState, useMemo } from "react";
import { Image, View } from "react-native";
import { C, Pack } from "./ui";
import type { Food } from "../lib/food";
import { thumbnailDimensions } from "../lib/history-thumbnail";

export function FoodThumbnail({ food, uri }: { food: Food; uri?: string }) {
  const [failedUri, setFailedUri] = useState<string>();
  const size = useMemo(() => thumbnailDimensions(uri), [uri]);
  const showPhoto = !!uri && failedUri !== uri;
  const aspect = size ? size.width / size.height : 79 / 92;
  const width = Math.min(79, 92 * aspect);
  const height = Math.min(92, 79 / aspect);

  return (
    <View
      style={{
        height: 92,
        width: 79,
        backgroundColor: showPhoto ? "transparent" : food.color,
        borderRadius: 13,
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      {showPhoto ? (
        <View style={{ width, height, borderRadius: 12, overflow: "hidden" }}>
          <Image
            accessibilityLabel={food.name + "的标签缩略图"}
            source={{ uri }}
            resizeMode={size ? "cover" : "contain"}
            style={{ width: "100%", height: "100%", borderRadius: 12 }}
            onError={() => setFailedUri(uri)}
          />
        </View>
      ) : food.source === "cloud" ? (
        <Image
          accessibilityLabel="默认食品包装图"
          source={require("../../assets/icon.png")}
          style={{ width: 65, height: 65, borderRadius: 12, backgroundColor: C.lime }}
        />
      ) : (
        <Pack food={food} size={67} />
      )}
    </View>
  );
}
