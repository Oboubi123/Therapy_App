import { StreamChat } from 'stream-chat';
import { ChannelPreview, Chat, OverlayProvider } from 'stream-chat-expo';
import { useAuth } from '@/providers/AuthProvider';
import { PropsWithChildren, useEffect, useState, useRef } from 'react';
import { ActivityIndicator, View, Text } from 'react-native';

const chatTheme = {
  ChannelPreview: {
    container: {
      backgroundColor: "transparent"
    }
  }
};

export default function ChatProvider({ children }: PropsWithChildren) {
  const [chatClient] = useState(() => 
    StreamChat.getInstance(process.env.EXPO_PUBLIC_STREAM_ACCESS_KEY as string, {
      timeout: 10000, // 10 second timeout
    })
  );
  const { authState } = useAuth();
  const [isReady, setIsReady] = useState(false);
  const connectionAttempted = useRef(false);

  useEffect(() => {
    // Skip if user is not authenticated or connection already attempted
    if (!authState?.authenticated || connectionAttempted.current) {
      return;
    }

    const connectUser = async () => {
      try {
        connectionAttempted.current = true;
        
        console.log('Connecting to Stream Chat with user:', {
          id: authState.user_id,
          name: authState.email,
        });
        
        await chatClient.connectUser(
          {
            id: authState.user_id!,
            name: authState.email!,
          },
          authState.token!
        );
        
        console.log('Successfully connected to Stream Chat');
        setIsReady(true);
      } catch (error) {
        console.error('Failed to connect user to chat:', error);
        connectionAttempted.current = false; // Allow retry on failure
        // Optionally show error to user or implement retry logic
      }
    };

    connectUser();

    // Cleanup function - disconnect when component unmounts
    return () => {
      const disconnect = async () => {
        try {
          if (chatClient.user) {
            await chatClient.disconnectUser();
            console.log('Disconnected from Stream Chat');
          }
        } catch (error) {
          console.error('Error disconnecting from chat:', error);
        }
        setIsReady(false);
        connectionAttempted.current = false;
      };
      
      disconnect();
    };
  }, [authState?.authenticated, chatClient, authState?.user_id, authState?.email, authState?.token]);

  if (!isReady) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#0000ff" />
        <Text className="mt-2">Loading chat...</Text>
      </View>
    );
  }

  return (
    <OverlayProvider>
      <Chat client={chatClient}>{children}</Chat>
    </OverlayProvider>
  );
}