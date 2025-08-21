import { View, Text, ScrollView, StyleSheet } from 'react-native';

const Page = () => {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Welcome Back!</Text>
        <Text style={styles.subtitle}>Here's your daily overview</Text>
        
        {/* Dummy items */}
        {[...Array(9)].map((_, index) => (
          <View key={index} style={styles.item}>
            <Text style={styles.itemTitle}>Item {index + 1}</Text>
            <Text style={styles.itemText}>
              This is a sample item with some longer description text to show how content flows.
            </Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    color: '#666',
    marginBottom: 16,
  },
  item: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 1.5,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  itemText: {
    fontSize: 14,
    color: '#666',
  },
});

export default Page;