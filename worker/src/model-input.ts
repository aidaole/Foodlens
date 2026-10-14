import { LABEL_PROMPT } from "./prompt.ts";

export function modelInput(image: string) {
  return {
    messages: [
      { role: "system", content: LABEL_PROMPT },
      { role: "user", content: [
        { type: "text", text: "读取这张食品标签，严格按指定 JSON 返回。" },
        { type: "image_url", image_url: { url: image } },
      ] },
    ],
    temperature: 0,
    max_completion_tokens: 3200,
    chat_template_kwargs: { enable_thinking: false },
    response_format: { type: "json_object" },
    store: false,
  };
}
