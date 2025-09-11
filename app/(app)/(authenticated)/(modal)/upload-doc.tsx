import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, Alert } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { Stack, useRouter } from 'expo-router';
import { API_URL, useAuth } from '@/providers/AuthProvider';

const Page = () => {
  const { authState } = useAuth();
  const router = useRouter();
  const [picked, setPicked] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [title, setTitle] = useState('');
  const [clientId, setClientId] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'private'>('private');
  const [url, setUrl] = useState('');
  const [uploading, setUploading] = useState(false);

  const chooseFile = async () => {
    const res = await DocumentPicker.getDocumentAsync({ multiple: false });
    if (res.canceled) return;
    setPicked(res.assets[0]);
  };

  const upload = async () => {
    try {
      if (!authState?.jwt) return;
      if (visibility === 'private' && !clientId) {
        Alert.alert('Client required', 'Enter a clientId for private docs');
        return;
      }
      setUploading(true);
      const form = new FormData();
      form.append('visibility', visibility);
      if (title) form.append('title', title);
      if (visibility === 'private') form.append('clientId', clientId);
      if (url) form.append('url', url);
      if (picked && picked.uri) {
        const info = await FileSystem.getInfoAsync(picked.uri);
        const file: any = {
          uri: picked.uri,
          name: picked.name || 'upload',
          type: picked.mimeType || 'application/octet-stream',
        };
        form.append('file', file);
      }

      const res = await fetch(`${API_URL}/docs/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authState.jwt}`,
        },
        body: form as any,
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t);
      }
      Alert.alert('Uploaded', 'Document uploaded');
      router.back();
    } catch (e: any) {
      Alert.alert('Upload failed', e?.message || '');
    } finally {
      setUploading(false);
    }
  };

  return (
    <View className="flex-1 bg-white p-4">
      <Stack.Screen options={{ title: 'Upload Document' }} />
      <Text className="font-semibold mb-2">Title</Text>
      <TextInput
        className="border border-gray-300 rounded-lg px-3 py-2 mb-3"
        placeholder="Optional title"
        value={title}
        onChangeText={setTitle}
      />

      <Text className="font-semibold mb-2">Visibility</Text>
      <View className="flex-row gap-3 mb-3">
        <TouchableOpacity onPress={() => setVisibility('private')} className={`px-3 py-2 rounded-lg ${visibility==='private'?'bg-blue-600':'bg-gray-200'}`}>
          <Text className={`${visibility==='private'?'text-white':'text-gray-800'}`}>Private</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setVisibility('public')} className={`px-3 py-2 rounded-lg ${visibility==='public'?'bg-blue-600':'bg-gray-200'}`}>
          <Text className={`${visibility==='public'?'text-white':'text-gray-800'}`}>Public</Text>
        </TouchableOpacity>
      </View>

      {visibility === 'private' && (
        <>
          <Text className="font-semibold mb-2">Client ID</Text>
          <TextInput
            className="border border-gray-300 rounded-lg px-3 py-2 mb-3"
            placeholder="Enter client user id"
            value={clientId}
            onChangeText={setClientId}
          />
        </>
      )}

      <Text className="font-semibold mb-2">External URL (optional)</Text>
      <TextInput
        className="border border-gray-300 rounded-lg px-3 py-2 mb-3"
        placeholder="https://..."
        value={url}
        onChangeText={setUrl}
        autoCapitalize="none"
      />

      <TouchableOpacity onPress={chooseFile} className="bg-gray-100 rounded-lg px-4 py-3 mb-3">
        <Text>{picked ? picked.name : 'Choose file'}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={upload} disabled={uploading} className="bg-blue-600 rounded-lg px-4 py-3 items-center">
        <Text className="text-white font-semibold">{uploading ? 'Uploading...' : 'Upload'}</Text>
      </TouchableOpacity>
    </View>
  );
};

export default Page;


