import { Router } from 'express';
import dotenv from 'dotenv';
import { StreamChat } from 'stream-chat';
import { authenticateToken } from '../middleware/auth';
import { generateCbtReply, ChatTurn } from '../services/cbtAI';
import rateLimit from 'express-rate-limit';
// Simple per-IP limiter for CBT messages
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
});

dotenv.config();

const router = Router();

const apiKey = process.env.STREAM_API_KEY as string;
const apiSecret = process.env.STREAM_API_SECRET as string;
const serverClient = StreamChat.getInstance(apiKey, apiSecret);

const BOT_ID = 'cbt-bot';

async function ensureBotUser() {
  await serverClient.upsertUsers([
    {
      id: BOT_ID,
      name: 'CBT Assistant',
      role: 'user',
      image: 'https://cdn-icons-png.flaticon.com/512/4712/4712027.png',
    },
  ]);
}

// POST /cbt/message { channelId: string, message: string }
router.post('/message', authenticateToken, limiter, async (req, res) => {
  try {
    const { channelId, channelCid, message } = req.body as { channelId?: string; channelCid?: string; message: string };
    // Only clients can use CBT bot
    if (req.user?.role !== 'client') {
      res.status(403).json({ error: 'CBT assistant is available to clients only' });
      return;
    }
    if ((!channelId && !channelCid) || !message) {
      res.status(400).json({ error: 'channelId or channelCid and message are required' });
      return;
    }

    await ensureBotUser();

    // Generate CBT reply (include short history)
    // eslint-disable-next-line no-console
    console.log('CBT /message', { user: req.user?.id, role: req.user?.role, channelId, channelCid, message });
    let history: ChatTurn[] = [];
    try {
      const ch = serverClient.channel('messaging', channelId);
      await ch.query({ state: true, watch: false, messages: { limit: 10 } } as any);
      const msgs = (ch.state as any)?.messages || [];
      history = msgs
        .filter((m: any) => !!m.text)
        .map((m: any) => ({
          role: m.user?.id === BOT_ID ? 'assistant' : 'user',
          content: m.text as string,
        }));
    } catch {}

    let reply: string;
    try {
      reply = await generateCbtReply(message, history);
    } catch (err: any) {
      // Surface the exact issue to client for debugging
      res.status(500).json({ error: 'openai_failed', message: err?.message || 'OpenAI error' });
      return;
    }

    let channel;
    if (channelCid) {
      const parts = String(channelCid).split(':');
      const cType = parts[0] || 'messaging';
      const cId = parts[1];
      channel = serverClient.channel(cType, cId as string);
    } else {
      channel = serverClient.channel('messaging', channelId!);
    }
    // Ensure bot is a member of the channel (in case channel was created without it)
    try {
      await channel.query();
      const members = (channel.state as any)?.members || {};
      if (!members[BOT_ID]) {
        await channel.addMembers([BOT_ID]);
      }
    } catch (e) {
      // If query fails, still attempt to add bot and continue
      try { await channel.addMembers([BOT_ID]); } catch {}
    }

    // Post as bot
    try {
      await channel.sendMessage({ text: reply, user_id: BOT_ID });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('CBT sendMessage error:', e);
      throw e;
    }

    res.json({ reply });
    return;
  } catch (e: any) {
    // eslint-disable-next-line no-console
    console.error('CBT message error:', e);
    res.status(500).json({ error: e.message || 'Failed to process CBT message' });
    return;
  }
});

export default router;


