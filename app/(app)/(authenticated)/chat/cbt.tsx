import { useEffect, useRef, useState } from 'react';
import { View, ActivityIndicator, Alert, Text } from 'react-native';
import { useAuth, API_URL } from '@/providers/AuthProvider';
import { useChatContext, Channel, MessageList, MessageInput } from 'stream-chat-expo';

export default function CBTChatScreen() {
  const { authState } = useAuth();
  const { client } = useChatContext();
  const [channelId, setChannelId] = useState<string | null>(null);
  const [channelRef, setChannelRef] = useState<any>(null);
  const [botTyping, setBotTyping] = useState(false);
  const lastTriggeredMessageId = useRef<string | null>(null);
  const triggerTimer = useRef<any>(null);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        if (!authState?.user_id) return;

        // Use existing server route to create/get DM with cbt-bot
        const members = [authState.user_id, 'cbt-bot'].sort();

        const res = await fetch(`${API_URL}/chat/dm`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authState.jwt}`,
          },
          body: JSON.stringify({ members }),
        });
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || `HTTP ${res.status}`);
        }
        const data = await res.json();

        const channel = client.channel('messaging', data.id);
        try {
          await channel.watch();
        } catch (e) {
          // Retry once in case of transient errors
          await channel.watch();
        }
        setChannelId(data.id);
        setChannelRef(channel);

        // No-op: welcome message is sent server-side on first creation
      } catch (e: any) {
        Alert.alert('Error', e.message || 'Failed to open CBT chat');
      }
    };
    bootstrap();
  }, [authState?.user_id]);

  // Listen for messages: stop typing on bot reply; trigger backend on user send
  useEffect(() => {
    if (!channelRef) return;
    const unsubscribe = channelRef.on('message.new', (event: any) => {
      const msg = event?.message;
      if (!msg) return;
      if (msg.user?.id === 'cbt-bot') {
        setBotTyping(false);
        return;
      }
      if (msg.user?.id === authState?.user_id && msg.text?.trim()) {
        // Ignore local echo (pending/temp ids) and only trigger once per server-received message
        const isTemp = typeof msg.id === 'string' && msg.id.startsWith('temp');
        const hasServerTime = !!msg.created_at;
        if (isTemp || !hasServerTime) return;

        const dedupeKey = `${msg.text}|${new Date(msg.created_at).getTime()}`;
        if (lastTriggeredMessageId.current === dedupeKey) return;
        lastTriggeredMessageId.current = dedupeKey;
        setBotTyping(true);
        const resolvedChannelId = (channelRef && typeof channelRef.id === 'string') ? channelRef.id : channelId;
        const resolvedCid = (channelRef && typeof channelRef.cid === 'string') ? channelRef.cid : (resolvedChannelId ? `messaging:${resolvedChannelId}` : undefined);
        fetch(`${API_URL}/cbt/message`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authState?.jwt}`,
          },
          body: JSON.stringify({ channelId: resolvedChannelId, channelCid: resolvedCid, message: msg.text.trim() }),
        })
          .then(async (r) => {
            const txt = await r.text();
            console.log('CBT trigger response ←', r.status, txt);
          })
          .catch((e) => console.log('CBT trigger error', e));
      }
    });
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
      if (triggerTimer.current) clearTimeout(triggerTimer.current);
    };
  }, [channelRef]);

  const handleSend = async (text: string) => {
    try {
      if (!channelRef || !channelId) return;
      const trimmed = (text || '').trim();
      if (!trimmed) return;

      // Send the user's message to Stream so it appears immediately
      await channelRef.sendMessage({ text: trimmed });

      // Backend trigger happens in message.new listener only (no fallback to avoid duplicates)
      setBotTyping(true);
    } catch (e) {
      // Silent fail; user sees their message. Bot might retry.
    }
  };

  if (!channelRef) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <Channel channel={channelRef}>
      <MessageList />
      {botTyping && (
        <View className="px-3 py-2 ml-3 mb-1 self-start rounded-lg bg-gray-100">
          <Text className="text-gray-600">CBT Assistant is typing…</Text>
        </View>
      )}
      <MessageInput />
    </Channel>
  );
}


