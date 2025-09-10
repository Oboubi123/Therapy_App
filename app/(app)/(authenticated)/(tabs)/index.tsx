import { Consultation, ConsultationStatus, useAppointments } from '@/providers/AppointmentProvider';
import { useAuth } from '@/providers/AuthProvider';
import { FontAwesome5, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Link, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { FlatList, Pressable, Text, TouchableOpacity, View } from 'react-native';

const Page = () => {
  const { getAppointments, updateAppointment } = useAppointments();
  const [appointments, setAppointments] = useState<Consultation[]>([]);
  const { isTherapist } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const pendingCount = appointments.filter((a) => a.status === ConsultationStatus.Pending).length;
  const confirmedCount = appointments.filter((a) => a.status === ConsultationStatus.Confirmed).length;
  const completedCount = appointments.filter((a) => a.status === ConsultationStatus.Completed).length;

  useFocusEffect(
    useCallback(() => {
      loadAppointmenets();
    }, [])
  );

  const loadAppointmenets = async () => {
    setRefreshing(true);
    const appointments = await getAppointments();
    setAppointments(appointments);
    setRefreshing(false);
  };

  const callTherapist = () => {
    console.log('call therapist');
  };

  const confirmSession = async (id: string) => {
    try {
      const updatedAppointment = await updateAppointment(id, {
        status: ConsultationStatus.Confirmed,
      });
      setAppointments((prev) =>
        prev.map((appointment) =>
          appointment.id === id ? { ...appointment, status: updatedAppointment.status } : appointment
        )
      );
    } catch (e) {
      // Fallback: refresh list if local state got out of sync
      loadAppointmenets();
    }
  };

  const cancelSession = async (id: string) => {
    try {
      const updatedAppointment = await updateAppointment(id, {
        status: ConsultationStatus.Cancelled,
      });
      setAppointments((prev) =>
        prev.map((appointment) =>
          appointment.id === id ? { ...appointment, status: updatedAppointment.status } : appointment
        )
      );
    } catch (e) {
      loadAppointmenets();
    }
  };

  return (
    <View className="flex-1 bg-gray-50 px-4 pt-4">
      {!isTherapist && (
        <FlatList
          keyExtractor={(item) => item.id}
          data={appointments}
          onRefresh={loadAppointmenets}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          contentContainerStyle={{ rowGap: 12}}
          ListHeaderComponent={() => (
            <View className="flex-row gap-4 mb-6">
              {/* Action Cards */}
              <Link href="/consultation/schedule" asChild>
                <TouchableOpacity className="flex-1 bg-blue-600 rounded-2xl p-4 items-start">
                  <MaterialIcons name="calendar-today" size={32} color="white" />
                  <Text className="text-white text-lg font-bold mt-2">Book Consultation</Text>
                  <Text className="text-white/80 text-sm mt-1">Schedule your next session</Text>
                </TouchableOpacity>
              </Link>

              <Link href="/chats" asChild>
                <TouchableOpacity className="flex-1 bg-purple-600 rounded-2xl p-4 items-start">
                  <MaterialIcons name="chat" size={32} color="white" />
                  <Text className="text-white text-lg font-bold mt-2">Join Chats</Text>
                  <Text className="text-white/80 text-sm mt-1">Connect with support groups</Text>
                </TouchableOpacity>
              </Link>
            </View>
          )}
          renderItem={({ item }) => (
            <Link href={`/consultation/${item.id}`} asChild>
              <TouchableOpacity
                className={`border-l-4 pl-3 py-2 ${
                  item.status === ConsultationStatus.Confirmed
                    ? 'border-green-500'
                    : item.status === ConsultationStatus.Pending
                    ? 'border-yellow-500'
                    : item.status === ConsultationStatus.Cancelled
                    ? 'border-red-500'
                    : 'border-gray-500'
                }`}>
                <Text className="font-semibold">
                  {item.status === ConsultationStatus.Confirmed
                    ? 'Confirmed Session'
                    : item.status === ConsultationStatus.Pending
                    ? 'Pending Session'
                    : item.status === ConsultationStatus.Cancelled
                    ? 'Cancelled Session'
                    : 'Completed Session'}
                </Text>
                <Text className="text-gray-600">{new Date(item.dateTime).toLocaleString()}</Text>
                <Text className="text-gray-600">Dr. Simon</Text>
              </TouchableOpacity>
            </Link>
          )}
          ListEmptyComponent={() => (
            <View className="border-l-4 border-sky-500 pl-3 py-2">
              <Text className="font-semibold">No appointments</Text>
            </View>
          )}
          ListFooterComponent={() => (
            <View className="bg-orange-50 rounded-2xl p-4 mb-6 mt-4">
              <View className="flex-row items-center mb-3">
                <FontAwesome5 name="phone-alt" size={20} color="#f97316" />
                <Text className="text-lg font-bold ml-2 text-orange-500">Call Your Therapist</Text>
              </View>
              <Text className="text-gray-700">
                Need immediate support? Your therapist is just a call away during business hours.
              </Text>
              <Pressable
                className="bg-orange-500 rounded-lg py-2 px-4 mt-3 self-start"
                onPress={callTherapist}>
                <Text className="text-white font-semibold">Call Now</Text>
              </Pressable>
            </View>
          )}
        />
      )}

      {isTherapist && (
        <FlatList
          data={appointments}
          showsVerticalScrollIndicator={false}
          keyExtractor={(item) => item.id}
          onRefresh={loadAppointmenets}
          refreshing={refreshing}
          contentContainerStyle={{ rowGap: 12, paddingBottom: 16 }}
          ListHeaderComponent={() => (
            <View className="mb-3">
              <Text className="text-2xl font-extrabold">Therapist Dashboard</Text>
              <Text className="text-gray-600 mb-4">Manage your schedule and sessions</Text>

              {/* Stats */}
              <View className="flex-row gap-3 mb-4">
                <View className="flex-1 bg-blue-50 rounded-xl p-3">
                  <Text className="text-blue-700 text-xs">Pending</Text>
                  <Text className="text-blue-900 text-xl font-bold">{pendingCount}</Text>
                </View>
                <View className="flex-1 bg-emerald-50 rounded-xl p-3">
                  <Text className="text-emerald-700 text-xs">Confirmed</Text>
                  <Text className="text-emerald-900 text-xl font-bold">{confirmedCount}</Text>
                </View>
                <View className="flex-1 bg-gray-100 rounded-xl p-3">
                  <Text className="text-gray-600 text-xs">Completed</Text>
                  <Text className="text-gray-900 text-xl font-bold">{completedCount}</Text>
                </View>
              </View>

              {/* Quick actions */}
              <View className="flex-row gap-3">
                <Link href="/chats" asChild>
                  <TouchableOpacity className="flex-1 bg-blue-600 rounded-xl p-3 items-center">
                    <Text className="text-white font-semibold">Open Chats</Text>
                  </TouchableOpacity>
                </Link>
                <Link href="/consultation/schedule" asChild>
                  <TouchableOpacity className="flex-1 bg-indigo-600 rounded-xl p-3 items-center">
                    <Text className="text-white font-semibold">Schedule</Text>
                  </TouchableOpacity>
                </Link>
              </View>
            </View>
          )}
          renderItem={({ item }) => (
            <TouchableOpacity className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <View className="flex-row items-center justify-between">
                <View className="flex-1 pr-3">
                  <View className="flex-row items-center mb-1">
                    {item.status === ConsultationStatus.Pending && (
                      <Ionicons name="time-outline" size={20} color="#6B7280" />
                    )}
                    {item.status === ConsultationStatus.Confirmed && (
                      <Ionicons name="checkmark-circle-outline" size={20} color="#059669" />
                    )}
                    {item.status === ConsultationStatus.Cancelled && (
                      <Ionicons name="close-circle-outline" size={20} color="#DC2626" />
                    )}
                    {item.status === ConsultationStatus.Completed && (
                      <Ionicons name="checkmark-done-circle-outline" size={20} color="#1D4ED8" />
                    )}
                    <Text className="font-semibold text-base ml-2">{item.status}</Text>
                  </View>
                  <Text className="text-gray-800">{item.clientEmail}</Text>
                  <Text className="text-gray-500 text-sm">{new Date(item.dateTime).toLocaleString()}</Text>
                </View>

                {item.status === ConsultationStatus.Pending && (
                  <View className="gap-2">
                    <TouchableOpacity
                      className="bg-blue-600 px-4 py-2 rounded-xl"
                      onPress={() => confirmSession(item.id)}>
                      <Text className="text-white font-medium">Confirm</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      className="bg-red-600 px-4 py-2 rounded-xl"
                      onPress={() => cancelSession(item.id)}>
                      <Text className="text-white font-medium">Cancel</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {item.status === ConsultationStatus.Confirmed && (
                  <Link href={`/consultation/${item.id}`} asChild>
                    <TouchableOpacity className="bg-blue-600 px-4 py-2 rounded-xl">
                      <Text className="text-white font-medium">Enter Session</Text>
                    </TouchableOpacity>
                  </Link>
                )}
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={() => (
            <View className="bg-gray-50 rounded-lg p-6 items-center">
              <Text className="font-semibold text-lg text-center">No upcoming appointments</Text>
              <Text className="text-gray-600 text-center mt-1">Your schedule is clear for now</Text>
            </View>
          )}
        />
      )}
      {/* Floating CBT button for clients only */}
      {!isTherapist && (
        <Link href="/(app)/(authenticated)/chat/cbt" asChild>
          <TouchableOpacity
            className="absolute bottom-6 right-6 bg-blue-600 rounded-full w-14 h-14 items-center justify-center shadow-lg"
            activeOpacity={0.8}
          >
            <Ionicons name="chatbubble-ellipses-outline" size={26} color="#fff" />
          </TouchableOpacity>
        </Link>
      )}
    </View>
  );
};

export default Page;