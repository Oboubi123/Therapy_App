import { useLocalSearchParams, useNavigation } from 'expo-router';
import { useEffect, useState } from 'react';
import { CallingState } from '@stream-io/video-client';
import { useAuth } from '@/providers/AuthProvider';
import { Call, CallContent, StreamCall, useStreamVideoClient } from '@stream-io/video-react-native-sdk';
import { View, Text, PermissionsAndroid } from 'react-native'

PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS)

const Page = () => {
  const { id } = useLocalSearchParams();
  const [call, setCall] =useState<Call | null>(null);
  const navigation = useNavigation();
  const  client  = useStreamVideoClient();
  const { isTherapist } = useAuth(); // Replace with actual logic to determine if user is a therapist

  useEffect(() => {
    navigation.setOptions({
      headerBacktitle: 'Back',
      headerTitle: `Consultation ${id}`,
    });
  }, []);

  useEffect(() => {
    const _call = client?.call('default', id as string);
    _call?.join({create: true});

    if (_call) {
      setCall(_call);
      if (isTherapist) {
        _call.startRecording();
        _call.startTranscription();
      }
    }

    return () => {
      _call?.leave();
    }

  }, [client, id]);

  useEffect(() => {
    return () => {
    if (call?.state.callingState !== CallingState.LEFT) {
      call?.leave();
    }
  };
  }, [call]);



  if (!call) {
    return(
      <View className="flex-1 items-center justify-center">
        <Text className="text-lg text-gray-700">Session has not started yet...</Text>
      </View>
    );
  }  


  return (
    <StreamCall call={call}>
      <View className="flex-1">
        <CallContent />
      </View>
    </StreamCall>
  )
}

export default Page 