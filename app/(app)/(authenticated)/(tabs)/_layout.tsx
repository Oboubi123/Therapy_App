import { HapticTab } from '@/components/HapticTab';
import BlurTabBarBackground from '@/components/TabBarBackground.ios';
import { useAuth } from '@/providers/AuthProvider';
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

export default function TabLayout() {
  const { isTherapist } = useAuth();

  return (
    <Tabs
      screenOptions={
        process.env.EXPO_OS === 'ios'
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
      }
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarLabel: 'Home',
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="chats"
        options={{
          tabBarLabel: 'Chats',
          title: 'Chats',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubbles-outline" size={size} color={color} />
          ),
        }}
      />

      {/* ✅ Only visible if therapist */}
      <Tabs.Screen
        name="recordings"
        options={{
          tabBarLabel: 'Recordings',
          title: 'Recordings',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="recording-outline" size={size} color={color} />
          ),
          href: isTherapist ? '/recordings' : null, // 👈 hides tab if not therapist
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          tabBarLabel: 'Profile',
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
