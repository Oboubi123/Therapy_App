import { Link } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';

const Page = () => {
  return (
    <ScrollView className="flex-1 p-4">
      <View className="p-4">
        <Link href="/consultation/schedule">
          <View className='bg-gray-100 rounded-lg p-4 dark:bg-gray-800'>
            <Text className="text-lg font-bold text-gray-900 dark:text-white">
              Schedule Consultation
            </Text>
          </View>
        </Link>

        <Link href="/(app)/(authenticated)/(modal)/create-chat">
          <View className='bg-gray-100 rounded-lg p-4 dark:bg-gray-800'>
            <Text className="text-lg font-bold text-gray-900 dark:text-white">
              Create Chat
            </Text>
          </View>
        </Link>
          <View className="bg-gray-100 rounded-lg p-4 dark:bg-gray-800">
            <Text className="text-lg font-bold text-gray-900 dark:text-white">Welcome Back!</Text>
            <Text className="text-gray-600 dark:text-white">Here's your daily overview</Text>
          </View>
          {[...Array(10)].map((_, index) => (
            <View
              key={index}
              className="bg-white rounded-lg p-4 mb-3 border border-gray-200 shadow-sm"
            >
              <Text className="text-base font-semibold mb-1">
                Item {index + 1}
              </Text>
              <Text className="text-sm text-gray-500">
                This is a sample item with some longer description text to show
                how content flows.
              </Text>
            </View>
          ))}
        </View>
    </ScrollView>
  );
};

export default Page; 
