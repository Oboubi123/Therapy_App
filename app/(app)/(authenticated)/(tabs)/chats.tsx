import { View, Text, Pressable, TouchableOpacity } from 'react-native'
import { useAuth } from '@/providers/AuthProvider';
import { ChannelList, ChannelPreview, ChannelPreviewMessenger, useChatContext, } from 'stream-chat-expo';
import { Stack, useRouter, Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const Page = () => {
  const { isTherapist} = useAuth();
  const { client } = useChatContext();
  const router = useRouter();

  const filter ={
    members: {
      $in: [client.user!.id],
    },
  }

    const CustomListItem = (props: any) => {
      const {unread } = props;
      const backgroundColor = unread ? 'bg-blue-100' : 'bg-white';

      return(
        <View className={`${backgroundColor}`}>
          <ChannelPreviewMessenger {...props} />
        </View>
      )
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
      <ChannelList filters={filter}
      onSelect={(channel) =>{
        router.push(`/(app)/(authenticated)/chat/${channel.id}`);
      }}
      Preview={CustomListItem}
      />
    </View>
  )
}

export default Page