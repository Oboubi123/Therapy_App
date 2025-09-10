import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { FlatList } from 'react-native-gesture-handler';
import { useChatContext } from 'stream-chat-expo';
import { API_URL, useAuth } from '@/providers/AuthProvider';

const Page = () => {
  const [channelName, setChannelName] = useState('');
  const [channelDescription, setChannelDescription] = useState('');
  const router = useRouter();
  const { client } = useChatContext();
  const { authState } = useAuth();
  const [users, setUsers] = useState<any[]>([]); // Array of user IDs to add to the channel

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        if (!client.user?.id) return;

        // Fetch therapists only for client users; otherwise fetch all except self
        const base = authState?.role === 'client' ? { role: 'therapist' } : {} as any;
        const response = await client.queryUsers(base, { last_active: -1 }, { limit: 50 });
        // Filter out self and the CBT bot from selectable list
        const list = response.users.filter((u) => u.id !== client.user!.id && u.id !== 'cbt-bot');
        setUsers(list);
        console.log('Fetched users:', list.map(u => u.id));
      } catch (e) {
        console.error('Failed to fetch users:', e);
        Alert.alert('Error', 'Failed to load users');
      }
    };
    fetchUsers();
  }, [client.user?.id]);

  const handleCreateChannel = async () => {
    if (!channelName.trim()) {
      Alert.alert('Please enter a channel name');
      return;
    }
    if (!client.user?.id) {
      Alert.alert('User not connected to chat');
      return;
    }

    const randomId = Math.random().toString(36).substring(2, 15);

    const channel = client.channel(
      'messaging',
      randomId,
      {
        name: channelName.trim(),
        image:
          'https://plus.unsplash.com/premium_photo-1683865775849-b958669dca26?q=80&w=1632&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        channelDescription: channelDescription.trim(),
        members: [client.user.id],
      } as any // avoid TS complaints on custom fields
    );

    try {
      await channel.create();
      console.log('Channel created successfully');
      router.dismiss();
    } catch (error) {
      console.error('Error creating channel:', error);
      Alert.alert('Error', 'Failed to create channel');
    }
  };

  const handleDirectConversation = async (userId: string) => {
    try {
      if (!client.user?.id) {
        Alert.alert('User not connected to chat');
        return;
      }
      if (!authState?.jwt) {
        Alert.alert('Missing auth token');
        return;
      }
      const me = client.user.id;
      const members = [me, userId].sort();

      // Ask backend (with Stream secret) to create/get distinct DM
      const res = await fetch(`${API_URL}/chat/dm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authState.jwt}`,
        },
        body: JSON.stringify({ members }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
      }
      const data = await res.json();

      // Join/watch the server-created channel
      const channel = client.channel('messaging', data.id);
      await channel.watch();

      console.log('Direct channel ready');
      router.dismiss();
    } catch (error) {
      console.error('Error creating direct channel:', error);
      Alert.alert('Error', 'Failed to create conversation');
    }
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
        multiline={true}
        numberOfLines={4}
      />
      <TouchableOpacity
        className={`rounded-lg p-4 ${
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
        keyExtractor={(item) => item.id}
      />
    </View>
  )
}

export default Page