/**
 * OpenAI Vision API helper for camera-based item auto-fill.
 *
 * The user provides their own API key (stored in their Firestore profile).
 * The key is only read after the user explicitly enables this feature.
 * No key is ever bundled in the app code.
 */

export interface ExtractedItem {
  name: string;
  category: string;
  size: string;
  brand: string;
  notes: string;
}

const SYSTEM_PROMPT = `あなたは子供の衣類・育児グッズ・家庭用品の専門家です。
画像を見て、以下の情報をJSONで返してください。

{
  "name": "アイテム名（日本語）",
  "category": "オムツ|トップス|ボトムス|アウター|くつ|アクセサリー|おもちゃ|その他 のいずれか",
  "size": "サイズ（例: 90cm、100、M など。不明なら空文字）",
  "brand": "ブランド名（不明なら空文字）",
  "notes": "気づいたこと（状態、色、特徴など。不要なら空文字）"
}

JSONのみを返してください。説明文は不要です。`;

export const extractItemFromImage = async (
  apiKey: string,
  imageBase64: string,
): Promise<ExtractedItem> => {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      max_tokens: 300,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: imageBase64, detail: 'low' },
            },
            { type: 'text', text: SYSTEM_PROMPT },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    const msg = (err as { error?: { message?: string } }).error?.message ?? response.statusText;
    throw new Error(`OpenAI API エラー: ${msg}`);
  }

  const json = await response.json() as {
    choices: Array<{ message: { content: string } }>;
  };
  const content = json.choices[0]?.message?.content ?? '{}';

  // Strip markdown code fences if present
  const cleaned = content.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
  return JSON.parse(cleaned) as ExtractedItem;
};
