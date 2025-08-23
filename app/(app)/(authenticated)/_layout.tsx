import { useAuth } from '@/providers/AuthProvider';
import { Ionicons } from '@expo/vector-icons';
import { Redirect, Stack, useRouter } from 'expo-router';
import { TouchableOpacity } from 'react-native';


const Layout = () => {
  const { authState } = useAuth();
  const router = useRouter();

  if (!authState.authenticated) {
    return <Redirect href="/login" />;
  }
  return (
  <Stack>
    <Stack.Screen 
      name="(tabs)"
    options={{
      headerShown: false,
      }}
    />
    <Stack.Screen 
      name="(modal)/create-chat"
      options={{
      presentation: 'modal',
      title: 'Create Chat',
      headerLeft: () => (
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={24} color="black" />
        </TouchableOpacity>
      ),
      }}
    />
    <Stack.Screen 
      name="consultation/schedule"
      options={{
      headerBackTitle: 'Back',
      title: 'Schedule Consultation',
      }}
    />
    <Stack.Screen 
      name="chat/[id]/index"
      options={{
      headerBackTitle: 'Chats',
      title: 'Manage Chat',
      }}
    />
  </Stack>
  );
};

export default Layout;