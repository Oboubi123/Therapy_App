import { Redirect, Tabs } from 'expo-router';
import { useAuth } from '@/providers/AuthProvider';
import Ionicons from '@expo/vector-icons/Ionicons';
import BlurTabBarBackground from '@/components/TabBarBackground.ios';
import { HapticTab } from '@/components/HapticTab';
import { ActivityIndicator, View } from 'react-native';

const Layout = () => {
  const { authState, initialized } = useAuth();
  
  // Wait for auth to be fully initialized
  if (!initialized) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0d6c9a" />
      </View>
    );
  }

  // Explicit role checking
  const showRecordingTab = 
    authState?.authenticated === true && 
    authState?.role === 'therapist';

  return (
    <Tabs 
      screenOptions={{
        headerTitleAlign: 'center',
        ...(process.env.EXPO_OS === 'ios'
          ? {
              tabBarActiveTintColor: '#0d6c9a',
              tabBarInactiveTintColor: '#8E8E93',
              headerShown: true,
              tabBarButton: HapticTab,
              tabBarBackground: BlurTabBarBackground,
              tabBarStyle: {
                position: 'absolute',
              },
            }
          : {
              tabBarActiveTintColor: '#0d6c9a',
              tabBarInactiveTintColor: '#8E8E93',
              headerShown: true,
            }
        )
      }}>
      <Tabs.Screen 
        name='index' 
        options={{
          title: 'Home',
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen 
        name='chats' 
        options={{
          title: 'Chats',
          tabBarLabel: 'Chats',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubbles-outline" color={color} size={size} />
          ),
        }}
      />
      
      {/* Recording tab - only for therapists */}
      {showRecordingTab && (
        <Tabs.Screen 
          name='recording' 
          options={{
            title: 'Recording',
            tabBarLabel: 'Recording',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="recording-outline" color={color} size={size} />
            ),
          }}
        />
      )}
      
      <Tabs.Screen 
        name='profile' 
        options={{
          title: 'Profile',
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
};

export default Layout;