import OpenAI from 'openai';

let openAIClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OpenAI API key is not configured');
  }
  if (!openAIClient) {
    openAIClient = new OpenAI({ apiKey });
  }
  return openAIClient;
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
    const client = getOpenAIClient();
    const models = ['gpt-4o-mini', 'gpt-4o', 'gpt-3.5-turbo'];
    let lastError: any = null;
    for (const model of models) {
      try {
        const response = await client.chat.completions.create({
          model,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            ...history.slice(-10).map((t) => ({ role: t.role, content: t.content })),
            { role: 'user', content: input },
          ],
          temperature: 0.5,
          max_tokens: 180,
        });
        const text = response.choices?.[0]?.message?.content?.trim();
        if (text) return text;
      } catch (err: any) {
        lastError = err;
        // Try next model
      }
    }
    if (lastError) {
      throw new Error(lastError.message || 'OpenAI request failed');
    }
    throw new Error('OpenAI returned no content');
  } catch (error: any) {
    // eslint-disable-next-line no-console
    console.error('OpenAI error:', error?.message || error);
    throw error;
  }
}


