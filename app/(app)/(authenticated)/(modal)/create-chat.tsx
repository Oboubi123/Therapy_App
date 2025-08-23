import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { FlatList } from 'react-native-gesture-handler';
import { useChatContext } from 'stream-chat-expo';

const Page = () => {
  const [channelName, setChannelName] = useState('');
  const [channelDescription, setChannelDescription] = useState('');
  const router = useRouter();
  const { client } = useChatContext();
  const [users, setUsers] = useState<any[]>([]); // Array of user IDs to add to the channel


  useEffect(() => {
    const fetchUsers = async () => {
      const response = await client.queryUsers({ role: 'user' });
      setUsers(response.users);
      console.log('Fetched users:', response);
    };
    fetchUsers();
  }, []);

  const handleCreateChannel = async () => {
    if (!channelName.trim()) {
      Alert.alert('Please enter a channel name');
      return;
    }

    const randomId = Math.random().toString(36).substring(2, 15);

    const channel = client.channel('messaging', randomId, {
      name: channelName.trim(),
      channelDescription: channelDescription.trim(),
      members: [client.user?.id ?? ""],
    } as any);

    await channel.create();

    router.dismiss();
  };

  
  const handleDirectConversation = async (userId: string) => {
    const channel = client.channel(
      'messaging',
      `${client.user!.id}-${userId}`,
      {
        members: [
          { user_id: client.user!.id, channel_role: 'admin' },
          { user_id: userId, channel_role: 'member' },
        ],
        name: `${client.user!.name ?? client.user!.id} - ${
          users.find((user) => user.id === userId)?.name || userId
        }`,
      } as any // 👈 this removes the red underline
    );

    await channel.create();
    router.dismiss();
  };

 

  return (
    <View className='flex-1 bg-white p-4'>
      <Text className='text-gray-700 mb-2'>Channel Name</Text>
      <TextInput
        className='border border-gray-300 p-3 rounded mb-6'
        value={channelName}
        onChangeText={setChannelName}
        placeholder='Enter channel name'
      />
      <Text className='text-gray-700 mb-2'>Description</Text>
      <TextInput
        className='border border-gray-300 p-3 rounded mb-6'
        value={channelDescription}
        onChangeText={setChannelDescription}
        placeholder='Enter channel description'
        multiline = {true}
        numberOfLines={4}
      />
      <TouchableOpacity
        className= {`rounded-lg p-4 ${
          channelName.trim() ? 'bg-blue-500' : 'bg-gray-300'
        }`}
        onPress={handleCreateChannel}
        disabled={!channelName.trim() || !channelDescription.trim()}>
        <Text className='text-white text-center text-lg'>Create Channel</Text>
      </TouchableOpacity>

      <View className="my-8 flex-row items-center justify-between">
        <View className="flex-1 h-[1px] bg-gray-300" />
        <Text className="mx-4 text-gray-500">OR</Text>
        <View className="flex-1 h-[1px] bg-gray-300" />
      </View>

      <Text className='text-gray-700 text-lg mb-4'>Start Direct Conversation</Text>
      
      <FlatList
        data={users}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => handleDirectConversation(item.id)}
            className='flex-row items-center p-4 border-b border-gray-200'>
            <Text className='text-gray-800 text-lg'>{item.name || item.id}</Text>
          </TouchableOpacity>
        )}
        keyExtractor={(item) => item.id.toString()}
      />  

    </View>
  )
}

export default Page