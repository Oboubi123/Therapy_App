import { View, Text, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { useAppointments, ConsultationStatus } from '@/providers/AppointmentProvider';
import { useAuth, API_URL } from '@/providers/AuthProvider';
import { useRouter } from 'expo-router';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Platform } from 'react-native';
import { useChatContext } from 'stream-chat-expo';

const Page = () => {
  const { makeAppointment } = useAppointments();
  const { authState } = useAuth();
  const { client } = useChatContext();
  const [therapistId, setTherapistId] = useState('');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false); // iOS inline/modal only
  const [therapists, setTherapists] = useState<any[]>([]);
  const [showTherapistPicker, setShowTherapistPicker] = useState(false);
  const router = useRouter();

  const handleSubmit = async () => {
    try {
      if (!therapistId) {
        Alert.alert('Error', 'Please enter a therapist ID');
        return;
      }

      const appointment = await makeAppointment({
        clientId: authState?.user_id || '',
        therapistId,
        dateTime: date.toISOString(),
        status: ConsultationStatus.Pending,
        notes,
      });

      Alert.alert('Success', 'Appointment scheduled successfully');
      router.back();
    } catch (error) {
      Alert.alert('Error', 'Failed to schedule appointment');
    }
  };

  const onDateChange = (_event: any, selected?: Date) => {
    if (selected) setDate(selected);
  };

  const openAndroidPickers = () => {
    // First pick date
    DateTimePickerAndroid.open({
      value: date,
      mode: 'date',
      onChange: (ev, pickedDate) => {
        if (ev.type === 'dismissed' || !pickedDate) return;
        // Then pick time
        DateTimePickerAndroid.open({
          value: pickedDate,
          mode: 'time',
          onChange: (ev2, pickedTime) => {
            if (ev2.type === 'dismissed' || !pickedTime) return;
            const combined = new Date(pickedDate);
            combined.setHours(pickedTime.getHours(), pickedTime.getMinutes(), 0, 0);
            setDate(combined);
          },
        });
      },
    });
  };

  // Load active therapists
  useEffect(() => {
    const loadTherapists = async () => {
      try {
        // Prefer local API list (persistent store), fallback to Stream query
        const apiRes = await fetch(`${API_URL}/auth/therapists`);
        if (apiRes.ok) {
          const list = await apiRes.json();
          if (Array.isArray(list) && list.length) {
            setTherapists(list);
            if ((!therapistId || therapistId.length === 0)) setTherapistId(list[0].id);
            return;
          }
        }
        if (!client.user?.id) return;
        const res = await client.queryUsers({ role: 'therapist' }, { last_active: -1 }, { limit: 50 });
        setTherapists(res.users || []);
        if ((!therapistId || therapistId.length === 0) && res.users?.length) {
          setTherapistId(res.users[0].id);
        }
      } catch (e) {
        console.log('Failed to load therapists', e);
      }
    };
    loadTherapists();
  }, [client.user?.id]);

  return (
    <ScrollView className="flex-1 bg-white p-4">
      <View className="gap-6">
        <Text className="text-2xl font-bold text-gray-800">Please enter details</Text>

        <View className="gap-2">
          <Text className="text-gray-600 font-medium">Select Therapist</Text>
          <TouchableOpacity
            className="border border-gray-300 rounded-lg p-3 bg-gray-50"
            onPress={() => setShowTherapistPicker((s) => !s)}>
            <Text>
              {therapists.find((t) => t.id === therapistId)?.name || therapistId || 'Choose therapist'}
            </Text>
          </TouchableOpacity>

          {showTherapistPicker && (
            <View className="border border-gray-200 rounded-lg mt-2 max-h-64">
              {([...therapists].sort((a, b) => (a.id === therapistId ? -1 : b.id === therapistId ? 1 : 0))).map((item) => (
                <TouchableOpacity
                  key={item.id}
                  className={`p-3 border-b border-gray-100 ${item.id === therapistId ? 'bg-blue-50' : ''}`}
                  onPress={() => {
                    setTherapistId(item.id);
                    setShowTherapistPicker(false);
                  }}>
                  <Text className="text-gray-800">{item.name || item.id}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {therapistId?.length > 0 && (
            <View className="mt-2">
              <Text className="text-xs text-gray-500">Selected therapist</Text>
              <Text className="text-gray-800 font-medium">
                {therapists.find((t) => t.id === therapistId)?.name || therapistId}
              </Text>
            </View>
          )}
        </View>

        <View className="gap-2">
          <Text className="text-gray-600 font-medium">Date and Time</Text>
          <TouchableOpacity
            onPress={() => (Platform.OS === 'android' ? openAndroidPickers() : setShowDatePicker(true))}
            className="border border-gray-300 rounded-lg p-3 bg-gray-50">
            <Text>{date.toLocaleString()}</Text>
          </TouchableOpacity>

          {Platform.OS === 'ios' && showDatePicker && (
            <DateTimePicker
              value={date}
              mode="datetime"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={onDateChange}
            />
          )}
        </View>

        <View className="gap-2">
          <Text className="text-gray-600 font-medium">Notes (Optional)</Text>
          <TextInput
            className="border border-gray-300 rounded-lg p-3 bg-gray-50"
            value={notes}
            onChangeText={setNotes}
            placeholder="Add any notes"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <TouchableOpacity
          onPress={handleSubmit}
          className="bg-blue-500 rounded-lg p-4 items-center">
          <Text className="text-white font-medium text-lg">Schedule Appointment</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default Page;