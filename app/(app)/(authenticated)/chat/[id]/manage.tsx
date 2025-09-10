import { View, Text, FlatList, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useChatContext } from 'stream-chat-expo';
import { useEffect, useState } from 'react';

const Page = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { client } = useChatContext();
  const channel = client.channel('messaging', id);
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load all users and check if they are in the channel
  useEffect(() => {
    const loadUsers = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const [userQuery, channelUsers] = await Promise.all([
          client.queryUsers({ role: 'user' }),
          channel.queryMembers({})
        ]);

        const userList = userQuery.users.map((user) => {
          const isInChannel = channelUsers.members.some((member) => member.user?.id === user.id);
          return {
            ...user,
            isInChannel,
          };
        });
        setUsers(userList);
      } catch (error) {
        console.error('Error loading users:', error);
        setError('Failed to load users. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    loadUsers();
  }, []);

  // Add user to channel
  const addUserToChannel = async (userId: string) => {
    try {
      await channel.addMembers([userId], {
        text: 'Welcome to the channel!',
      });
      
      // Update local state
      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, isInChannel: true } : user
      ));
      
      Alert.alert('Success', 'User added to channel');
    } catch (error) {
      console.error('Error adding user:', error);
      Alert.alert('Error', 'Failed to add user to channel');
    }
  };

  // Remove user from channel
  const removeUserFromChannel = async (userId: string) => {
    try {
      await channel.removeMembers([userId]);
      
      // Update local state
      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, isInChannel: false } : user
      ));
      
      Alert.alert('Success', 'User removed from channel');
    } catch (error) {
      console.error('Error removing user:', error);
      Alert.alert('Error', 'Failed to remove user from channel');
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Text>Loading users...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 items-center justify-center bg-white p-4">
        <Text className="text-red-500 mb-4 text-center">{error}</Text>
        <TouchableOpacity 
          onPress={() => {
            setError(null);
            // Reload users
            const loadUsers = async () => {
              try {
                setIsLoading(true);
                const [userQuery, channelUsers] = await Promise.all([
                  client.queryUsers({ role: 'user' }),
                  channel.queryMembers({})
                ]);
                const userList = userQuery.users.map((user) => {
                  const isInChannel = channelUsers.members.some((member) => member.user?.id === user.id);
                  return { ...user, isInChannel };
                });
                setUsers(userList);
              } catch (error) {
                setError('Failed to load users. Please try again.');
              } finally {
                setIsLoading(false);
              }
            };
            loadUsers();
          }}
          className="bg-blue-500 px-4 py-2 rounded">
          <Text className="text-white">Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white dark:bg-gray-900">
      <Text className="text-lg font-semibold p-4 text-gray-800 dark:text-white">
        Manage Channel Members
      </Text>
      <FlatList
        data={users}
        renderItem={({ item }) => (
          <View className="flex-row justify-between items-center p-4 border-b border-gray-200">
            <Text className="text-lg text-gray-800 dark:text-white">{item.name || item.id}</Text>
            <View className="flex-row gap-2">
              <TouchableOpacity
                onPress={() => addUserToChannel(item.id)}
                disabled={item.isInChannel}
                className={`px-4 py-2 rounded-lg ${
                  item.isInChannel ? 'bg-gray-300' : 'bg-blue-500'
                }`}>
                <Text className="text-white">Add</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => removeUserFromChannel(item.id)}
                disabled={!item.isInChannel}
                className={`px-4 py-2 rounded-lg ${
                  item.isInChannel ? 'bg-red-500' : 'bg-gray-500'
                }`}>
                <Text className="text-white">Remove</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        keyExtractor={(item) => item.id.toString()}
      />
    </View>
  );
};

export default Page;