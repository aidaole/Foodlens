import { View, Text, Linking } from "react-native";
import { cloudConfigured } from "../lib/recognize";
import { Shell, s, Button, SectionTitle } from "../components/ui";
import { LegalLinks } from '../components/LegalLinks';
export default function About() {
  return (
    <Shell title="关于食刻">
      <Text style={s.eyebrow}>FOODLENS / VERSION 0.4.4</Text>
      <Text style={s.pageHeading}>让标签更好懂。</Text>
      <Text style={[s.body, { marginTop: 12 }]}>
        食刻是一个面向 iOS 与 Android 的食品标签解读 MVP。
      </Text>
      <View style={{ gap: 20, marginTop: 28 }}>
        <View style={s.card}><SectionTitle title="用户协议、隐私与支持" /><LegalLinks /></View>
        <View style={s.card}>
          <SectionTitle title="这一版可以体验什么" />
          <Text style={s.body}>
            首次启动引导、拍照与相册裁剪、三个示例食品的配料和营养分析、每份 /
            每 100g / 整包换算、过敏原与个人关注提醒、收藏和本地体验记录。
          </Text>
          <Text style={[s.body, { marginTop: 14 }]}>
            {cloudConfigured
              ? "裁剪后由云端模型读取标签，校验字段与单位后显示结果。未读到的数据留空，请核对原包装。"
              : "识别接口已准备，正在等待Cloudflare账号接通，真实识别尚未启用。"}
            所有示例包装与数据均为虚构演示。
          </Text>
        </View>
        <View style={s.card}>
          <SectionTitle title="数据与隐私" />
          <Text style={s.body}>
            不需要注册或定位。首次发送照片前会说明用途并征得同意。只有裁剪后的图片发送至Cloudflare
            Workers
            AI，饮食偏好不上传。识别接口不保存图片或识别正文，保留用于限制调用次数的假名化摘要及计数。Cloudflare 也会处理基础设施运行信息。识别文字、缩略图、收藏和记录保存在当前设备，可在我的页面清除；云端授权也可单独关闭。详情见完整隐私政策。
          </Text>
          <Text style={[s.body, { marginTop: 14 }]}>
            Cloudflare按其服务条款和隐私政策处理推理输入。请避开人脸或个人信息。外部参考链接会打开相应网站。
          </Text>
        </View>
        <View style={[s.card, { backgroundColor: "#EDF2E3" }]}>
          <SectionTitle title="云端识别：Cloudflare Workers AI" />
          <Text style={[s.body, { marginBottom: 16 }]}>
            视觉模型读取标签，后端校验字段与单位，营养换算和食用提醒由固定规则生成。小字、反光和模糊图片可能需要补拍。模型为 Google Gemma 4，由 Cloudflare 托管。
          </Text>
          <Button
            tone="light"
            onPress={() =>
              Linking.openURL(
                "https://developers.cloudflare.com/workers-ai/platform/pricing/",
              )
            }
          >
            查看服务与免费额度
          </Button>
        </View>
        <View style={s.card}>
          <SectionTitle title="使用提示与参考" />
          <Text style={s.body}>
            食刻帮助读懂标签，不提供诊断、治疗或疾病食用许可。请核对原包装；有确诊疾病、严重过敏或特定饮食限制时，遵循专业建议。
          </Text>
          <View style={{ gap: 12, marginTop: 20 }}>
            <Button
              tone="light"
              onPress={() =>
                Linking.openURL(
                  "https://www.fda.gov/food/nutrition-facts-label/how-understand-and-use-nutrition-facts-label",
                )
              }
            >
              FDA 营养标签指南
            </Button>
            <Button
              tone="light"
              onPress={() =>
                Linking.openURL(
                  "https://www.fda.gov/food/nutrition-food-labeling-and-critical-foods/food-allergies",
                )
              }
            >
              FDA 过敏原信息
            </Button>
            <Button
              tone="light"
              onPress={() =>
                Linking.openURL(
                  "https://www.niddk.nih.gov/health-information/diabetes/overview/healthy-living-with-diabetes",
                )
              }
            >
              NIDDK 血糖与饮食
            </Button>
          </View>
        </View>
      </View>
    </Shell>
  );
}
