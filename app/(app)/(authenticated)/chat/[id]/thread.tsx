import { View, Text } from 'react-native';
import { useAtom } from 'jotai';
import { Channel, Thread} from 'stream-chat-expo';
import { Stack } from 'expo-router';
import { useChatContext } from 'stream-chat-expo'; 
import { selectedThreadAtom, selectedChannelAtom } from '@/utils/atoms';


const Page = () => {
  const [selectedThread, setSelectedThread] = useAtom(selectedThreadAtom);
  const [selectedChannel, setSelectedChannel] = useAtom(selectedChannelAtom);

  return (
    <View className='flex-1 pb-safe bg-white'>
      <Stack.Screen options={{ title: 'Thread' }} />
      <Channel channel={selectedChannel} thread={selectedThread} threadList>
        <Thread />
      </Channel>
    </View>
  )
}

export default Page