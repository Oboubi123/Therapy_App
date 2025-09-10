import { View, Text, TouchableOpacity } from 'react-native'
import { useAuth } from '@/providers/AuthProvider';
import { ChannelList, ChannelPreviewMessenger, ChannelPreviewMessengerProps, useChatContext, } from 'stream-chat-expo';
import { Stack, useRouter, Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const Page = () => {
  const { isTherapist} = useAuth();
  const { client } = useChatContext();
  const router = useRouter();

  const filter = {
    type: 'messaging',
    members: { $in: [client.user!.id] },
  }

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
            {isTherapist && (
            <Link href='/(app)/(authenticated)/(modal)/create-chat' asChild>
              <TouchableOpacity className="mr-4">
                <Ionicons name="add-circle-outline" size={24} color="black" />
              </TouchableOpacity>
            </Link>
            )}
            </>
          ),
        }}
      />
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