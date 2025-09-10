import { useAuth } from '@/providers/AuthProvider';
import { Image, Pressable, Text, View } from 'react-native';
import { useChatContext } from 'stream-chat-expo';
import { Ionicons } from '@expo/vector-icons';


const Page = () => {
  const { client } = useChatContext();
  const { signOut, isTherapist } = useAuth();

  const user = client.user;

  const handleSignOut = async () => {
    await signOut();
  };

  const avatar = (user as any)?.image || 'https://cdn-icons-png.flaticon.com/512/847/847969.png';

  return (
    <View className="flex-1 bg-gray-50">
      <View className="bg-white pt-10 pb-6 items-center shadow-sm">
        <Image
          source={{ uri: avatar }}
          style={{ width: 96, height: 96, borderRadius: 48, marginBottom: 8 }}
        />
        <Text className="text-xl font-bold">{user?.name || user?.id || 'User'}</Text>
        <Text className="text-gray-500">{(user as any)?.email || 'No email'}</Text>
        <View className="mt-2 px-3 py-1 rounded-full bg-blue-100">
          <Text className="text-blue-700 text-xs font-semibold">{isTherapist ? 'Therapist' : 'Client'}</Text>
        </View>
      </View>

      <View className="p-4 gap-4">
        <View className="bg-white rounded-xl p-4 shadow-sm">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-base font-semibold">Account</Text>
            <Ionicons name="person-circle-outline" size={22} color="#4b5563" />
          </View>
          <View className="flex-row justify-between py-2">
            <Text className="text-gray-500">User ID</Text>
            <Text className="text-gray-800">{user?.id}</Text>
          </View>
          <View className="flex-row justify-between py-2">
            <Text className="text-gray-500">Last Active</Text>
            <Text className="text-gray-800">
              {user?.last_active ? new Date(user.last_active).toLocaleString() : 'Unavailable'}
            </Text>
          </View>
        </View>

        <View className="bg-white rounded-xl p-4 shadow-sm">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-base font-semibold">Preferences</Text>
            <Ionicons name="settings-outline" size={20} color="#4b5563" />
          </View>
          <View className="flex-row justify-between py-2">
            <Text className="text-gray-500">Notifications</Text>
            <Text className="text-gray-800">Enabled</Text>
          </View>
          <View className="flex-row justify-between py-2">
            <Text className="text-gray-500">Theme</Text>
            <Text className="text-gray-800">System</Text>
          </View>
        </View>

        <Pressable className="bg-red-500 p-4 rounded-xl" onPress={handleSignOut}>
          <Text className="text-white text-center font-semibold">Sign Out</Text>
        </Pressable>
      </View>
    </View>
  );
};

export default Page;
