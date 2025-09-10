import { Router } from 'express';
import { StreamChat } from 'stream-chat';
import dotenv from 'dotenv';
import { authenticateToken } from '../middleware/auth';

dotenv.config();

const router = Router();

const apiKey = process.env.STREAM_API_KEY as string;
const apiSecret = process.env.STREAM_API_SECRET as string;

const serverClient = StreamChat.getInstance(apiKey, apiSecret);

const BOT_ID = 'cbt-bot';

async function ensureBotUser(serverClient: StreamChat) {
  await serverClient.upsertUsers([
    {
      id: BOT_ID,
      name: 'CBT Assistant',
      role: 'user',
      image: 'https://cdn-icons-png.flaticon.com/512/4712/4712027.png',
    },
  ]);
}

// POST /chat/dm { members: [userIdA, userIdB] }
router.post('/dm', authenticateToken, async (req, res) => {
  try {
    const { members } = req.body as { members: string[] };
    if (!Array.isArray(members) || members.length !== 2) {
      res.status(400).json({ error: 'members must be an array of two user IDs' });
      return;
    }

    const sortedMembers = [...members].sort();
    const creatorId = req.user?.id;

    // Debug logs to verify inputs (safe for dev)
    // eslint-disable-next-line no-console
    console.log('DM create request', { creatorId, sortedMembers });

    // Ensure users exist on Stream (no-op if already present)
    await serverClient.upsertUsers(sortedMembers.map((id) => ({ id })));

    const isCBT = sortedMembers.includes(BOT_ID);
    const channel = serverClient.channel('messaging', {
      members: sortedMembers,
      is_distinct: true,
      created_by_id: creatorId || sortedMembers[0],
      // Present CBT identity in channel metadata for nicer UI
      ...(isCBT
        ? {
            name: 'CBT Assistant',
            image: 'https://cdn-icons-png.flaticon.com/512/4712/4712027.png',
          }
        : {}),
    } as any);

    let wasCreated = false;
    try {
      await channel.create();
      wasCreated = true;
    } catch {
      // If already exists due to is_distinct, just query to get id/cid
      await channel.query();
    }

    // If this is the first time creating a CBT DM, send a welcome message from the bot
    if (wasCreated && sortedMembers.includes(BOT_ID)) {
      try {
        await ensureBotUser(serverClient);
        await channel.sendMessage({
          user_id: BOT_ID,
          text:
            "Hi, I’m your CBT assistant. I’m here to help you reframe unhelpful thoughts and find small, practical steps. What’s on your mind today?",
        });
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('Failed to send CBT welcome:', e);
      }
    }

    res.json({ id: channel.id, cid: channel.cid });
    return;
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'failed to create dm' });
    return;
  }
});

export default router;

 
