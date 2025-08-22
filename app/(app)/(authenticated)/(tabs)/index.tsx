import { View, Text, ScrollView } from 'react-native';
import { Link } from 'expo-router';

const Page = () => {
  return (
    <ScrollView className="flex-1">
      <Link href="/consultation/schedule" asChild>
        <View className="p-4">
          <Text className="text-lg font-bold mb-2">Welcome Back!</Text>
          <Text className="text-gray-500 mb-4">Here's your daily overview</Text>

          {/* Dummy items */}
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
      </Link>
    </ScrollView>
  );
};

export default Page;
