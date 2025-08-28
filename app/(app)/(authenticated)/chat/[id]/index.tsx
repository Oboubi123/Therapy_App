import { useAuth } from '@/providers/AuthProvider';
import { useLocalSearchParams, useRouter, Stack, Link } from 'expo-router'
import { View, Text, TouchableOpacity} from 'react-native'
import { MessageInput, useChatContext } from 'stream-chat-expo';
import { Channel, MessageList } from 'stream-chat-expo';

const Page = () => {
  const {id} =useLocalSearchParams<{id: string}>();
  const { client } = useChatContext();
  const channel = client.channel('messaging', id);
  const { isTherapist } = useAuth();
  const router = useRouter();

  if (!channel){
    <View className='flex-1 items-center justify-center'>
      <Text>Channel not found</Text>
    </View>
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
        <MessageList />
        <MessageInput />
        </Channel> 
    </View>
  )
}

export default Page