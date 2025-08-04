import { View, Text } from 'react-native';
import { Thread, Channel } from 'stream-chat-expo';
import { selectedThreadAtom, selectedChannelAtom } from '@/utils/atoms';
import { useAtom } from 'jotai';
import { Stack } from 'expo-router';

const Page = () => {
  const [selectedThread, setSelectedThread] = useAtom(selectedThreadAtom);
  const [selectedChannel, setSelectedChannel] = useAtom(selectedChannelAtom);

  return (
    <View className="flex-1 pb-safe bg-white">
      <Stack.Screen options={{ title: 'Thread' }} />
      {selectedChannel ? (
        <Channel channel={selectedChannel}>
          <Thread thread={selectedThread} />
        </Channel>
      ) : (
        <View className="flex-1 justify-center items-center">
          <Text>No channel available</Text>
        </View>
      )}
    </View>
  );
};

export default Page;