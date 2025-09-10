import { useAuth } from '@/providers/AuthProvider';
import { selectedThreadAtom , selectedChannelAtom} from '@/utils/atoms';
import { useLocalSearchParams, useRouter, Stack, Link } from 'expo-router'
import { View, Text, TouchableOpacity} from 'react-native'
import { MessageInput, useChatContext } from 'stream-chat-expo';
import { useAtom } from 'jotai';
import { Channel, MessageList } from 'stream-chat-expo';

const Page = () => {
  const {id} =useLocalSearchParams<{id: string}>();
  const { client } = useChatContext();
  const channel = client.channel('messaging', id);
  const { isTherapist } = useAuth();
  const router = useRouter();
  const [selectedThread, setSelectedThread] = useAtom(selectedThreadAtom);
  const [selectedChannel, setSelectedChannel] = useAtom(selectedChannelAtom);

  if (!channel){
    return (
    <View className='flex-1 items-center justify-center'>
      <Text>Channel not found</Text>
    </View>
    );
  }

  // Guard: require user id and membership to access channel content
  if (!client.user?.id) {
    return (
      <View className='flex-1 items-center justify-center'>
        <Text>Loading...</Text>
      </View>
    );
  }

  const memberMap = (channel.state as any)?.members || {};
  const isMember = !!memberMap[client.user.id];
  if (!isMember) {
    return (
      <View className='flex-1 items-center justify-center'>
        <Text>You are not a member of this channel.</Text>
      </View>
    );
  }

  const handleSelectThread = (thread: any) => {
    setSelectedThread(thread);
    setSelectedChannel(channel);
    router.push(`/(app)/(authenticated)/chat/${id}/thread`);
  }

  return (
    <View className='flex-1 pb-safe bg-white'>
       <Stack.Screen
        options={{
          title: (channel.data as any)?.name || 'Chat',
          headerRight: () => (
            <>
            {isTherapist && (
            <Link href={`/chat/${id}/manage`} asChild>
              <TouchableOpacity className="mr-4">
                <Text>Manage</Text>
              </TouchableOpacity>
            </Link>
            )}
            </>
          ),
        }}
      />
      <Channel channel={channel}>
        <MessageList onThreadSelect={handleSelectThread} />
        <MessageInput />
        </Channel> 
    </View>
  )
}

export default Page