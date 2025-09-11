import { HfInference } from '@huggingface/inference';

let hfClient: HfInference | null = null;

function getHFClient(): HfInference {
  const apiKey = process.env.HUGGINGFACE_API_KEY;
  if (!apiKey) {
    throw new Error('Hugging Face API key is not configured');
  }
  if (!hfClient) {
    hfClient = new HfInference(apiKey);
  }
  return hfClient;
}

const SYSTEM_PROMPT = `You are a CBT (Cognitive Behavioral Therapy) assistant.
Your job is to respond briefly, empathetically, and with concrete CBT guidance.

Keep responses within ~120 words. Avoid clinical diagnoses or medical advice.
Prefer everyday language. Never reveal your chain-of-thought.

ALWAYS use this format (exact labels):
1) Validation: <one short sentence showing empathy>
2) Thought pattern: <name a likely cognitive distortion (e.g., catastrophizing, all-or-nothing, mind-reading, fortune-telling, should-ing, personalization). If unclear, say "unclear"> 
3) Reframe: <one concise reframe of the original thought>
4) Coping: <two bullet points with simple strategies suited to the situation>
5) Tiny step: <one small, realistic action they can do in the next hour>

Safety handoff: If the user expresses self-harm or crisis intent, replace the above with a brief safety message encouraging them to contact local emergency services or a trusted person immediately, and to reach out to general crisis resources in their region (do not list specific phone numbers).`;

export interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

export async function generateCbtReply(userText: string, history: ChatTurn[] = []): Promise<string> {
  const input = (userText || '').trim();
  if (!input) {
    return 'I hear you. Could you share a bit more about what you’re thinking or feeling right now?';
  }

  try {
    // Hugging Face only
    const apiKey = process.env.HUGGINGFACE_API_KEY as string;
    const endpoint = (process.env.HF_ENDPOINT_URL || '').trim();
    const envModel = (process.env.HF_CBT_MODEL || '').trim();

    // Build a single prompt (text-generation friendly). Endpoints typically expect this shape.
    const prompt = [
      SYSTEM_PROMPT,
      ...history.slice(-10).map((t) => `${t.role.toUpperCase()}: ${t.content}`),
      `USER: ${input}`,
      'ASSISTANT:',
    ].join('\n');

    // 1) Prefer custom Inference Endpoint if provided (most reliable/provider-agnostic)
    if (endpoint) {
      // eslint-disable-next-line no-console
      console.log('HF using endpoint:', endpoint);
      const resp = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: { max_new_tokens: 220, temperature: 0.5, return_full_text: false },
        }),
      });
      const data: any = await resp.json();
      const text = (Array.isArray(data) ? data[0]?.generated_text : data?.generated_text)?.trim()
        || data?.choices?.[0]?.message?.content?.trim();
      if (text) return text;
      throw new Error(`HF endpoint returned no content: ${JSON.stringify(data)}`);
    }

    // 2) Hosted Inference API via @huggingface/inference
    const hf = getHFClient();
    const models = envModel ? [envModel] : ['HuggingFaceH4/zephyr-7b-beta', 'google/gemma-2-2b-it', 'TinyLlama/TinyLlama-1.1B-Chat-v1.0'];
    let lastErr: any = null;
    for (const model of models) {
      try {
        // Try chatCompletion first (works for conversational models like Zephyr/Gemma)
        // eslint-disable-next-line no-console
        console.log('HF using model (chat):', model);
        const chat = await hf.chatCompletion({
          model,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            ...history.slice(-10).map((t) => ({ role: t.role, content: t.content })),
            { role: 'user', content: input },
          ] as any,
          max_tokens: 220,
          temperature: 0.5,
        } as any);
        const chatText = (chat as any)?.choices?.[0]?.message?.content?.trim();
        if (chatText) return chatText;
      } catch (eChat: any) {
        lastErr = eChat;
        try {
          // Fallback to plain text-generation prompt format
          // eslint-disable-next-line no-console
          console.log('HF using model (text-generation):', model);
          const out = await hf.textGeneration({
            model,
            inputs: prompt,
            parameters: { max_new_tokens: 220, temperature: 0.5, return_full_text: false },
          } as any);
          const genText = (out as any)?.generated_text?.trim();
          if (genText) return genText;
        } catch (eGen: any) {
          lastErr = eGen;
          continue;
        }
      }
    }
    if (lastErr) throw lastErr;
    throw new Error('HF returned no content');
  } catch (error: any) {
    // eslint-disable-next-line no-console
    console.error('HF fatal error:', error?.message || error);
    throw error;
  }
}


