import { View, Text, Pressable, TouchableOpacity } from 'react-native'
import { useAuth } from '@/providers/AuthProvider';
import { useChatContext } from 'stream-chat-expo';
import { Stack, useRouter, Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const Page = () => {
  const { isTherapist} = useAuth();
  const { client } = useChatContext();
  const router = useRouter();


  return (
    <View className="flex-1">
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
      <Text>Chats</Text>
    </View>
  )
}

export default Page