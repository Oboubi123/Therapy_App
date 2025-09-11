import { View, Text, TouchableOpacity } from 'react-native'
import { useEffect, useState } from 'react'
import { useAuth } from '@/providers/AuthProvider';
import { ChannelList, ChannelPreviewMessenger, ChannelPreviewMessengerProps, useChatContext, } from 'stream-chat-expo';
import { Stack, useRouter, Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { API_URL } from '@/providers/AuthProvider';

const Page = () => {
  const { isTherapist, authState } = useAuth();
  const { client } = useChatContext();
  const router = useRouter();
  const [therapists, setTherapists] = useState<any[]>([]);

  const filter = isTherapist
    ? {
        type: 'messaging',
        members: { $in: [client.user!.id] },
        // Exclude CBT channels by strict member set when therapist is current user
        // (Assumes CBT channels always include 'cbt-bot')
        member_count: { $gt: 1 },
        'member.user.id': { $nin: ['cbt-bot'] } as any,
      }
    : {
        type: 'messaging',
        members: { $in: [client.user!.id] },
      } as any;

  const options = {
    state: true,
    watch: true,
    presence: true,
  }

  const CustomListItem = (props: ChannelPreviewMessengerProps) => {
  const { unread } = props;
  const backgroundColor = unread ? { backgroundColor: '#DBEAFE' } : { backgroundColor: '#FFF' };

  return (
    <View style={backgroundColor}>
      <ChannelPreviewMessenger {...props} />
    </View>
  );
};
  useEffect(() => {
    const loadTherapists = async () => {
      try {
        if (isTherapist || !client.user?.id) return;
        const res = await client.queryUsers({ role: 'therapist' }, { last_active: -1 }, { limit: 30 });
        const list = res.users.filter((u) => u.id !== 'cbt-bot');
        setTherapists(list);
      } catch (e) {
        // ignore
      }
    };
    loadTherapists();
  }, [client.user?.id, isTherapist]);

  const startDMWithTherapist = async (therapistId: string) => {
    try {
      if (!authState?.jwt || !client.user?.id) return;
      const members = [client.user.id, therapistId].sort();
      const res = await fetch(`${API_URL}/chat/dm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authState.jwt}`,
        },
        body: JSON.stringify({ members }),
      });
      if (!res.ok) {
        return;
      }
      const data = await res.json();
      router.push(`/(app)/(authenticated)/chat/${data.id}`);
    } catch {}
  }
    if (!client.user?.id) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-400">
        <Text>Loading user...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-400">
      <Stack.Screen
        options={{
          headerRight: () => (
            <>
            {!isTherapist && (
              <>
                <Link href='/(app)/(authenticated)/chat/cbt' asChild>
                  <TouchableOpacity className="mr-4">
                    <Ionicons name="chatbubble-ellipses-outline" size={24} color="black" />
                  </TouchableOpacity>
                </Link>
                <Link href='/(app)/(authenticated)/(modal)/create-chat' asChild>
                  <TouchableOpacity className="mr-4">
                    <Ionicons name="add-circle-outline" size={24} color="black" />
                  </TouchableOpacity>
                </Link>
              </>
            )}
            {isTherapist && (
              <>
                <Link href='/(app)/(authenticated)/(modal)/upload-doc' asChild>
                  <TouchableOpacity className="mr-4">
                    <Ionicons name="cloud-upload-outline" size={24} color="black" />
                  </TouchableOpacity>
                </Link>
                <Link href='/(app)/(authenticated)/(modal)/create-chat' asChild>
                  <TouchableOpacity className="mr-4">
                    <Ionicons name="add-circle-outline" size={24} color="black" />
                  </TouchableOpacity>
                </Link>
              </>
            )}
            </>
          ),
        }}
      />
      {!isTherapist && therapists.length > 0 && (
        <View className="bg-white px-3 py-2">
          <Text className="font-semibold mb-2">Therapists</Text>
          {therapists.map((t) => (
            <View key={t.id} className="flex-row items-center justify-between py-2">
              <Text>{t.name || t.id}</Text>
              <TouchableOpacity onPress={() => startDMWithTherapist(t.id)}>
                <Text className="text-blue-600">Message</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
      <ChannelList
      filters={filter}
      options={options}
      onSelect={(channel) =>{
        router.push(`/(app)/(authenticated)/chat/${channel.id}`);
      }}
      Preview={CustomListItem}
      />
    </View>
  )
}

export default Page