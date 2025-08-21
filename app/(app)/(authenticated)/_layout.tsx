import { Redirect, Slot, Stack} from 'expo-router';
import { useAuth } from '@/providers/AuthProvider';

const Layout = () => {
  const { authState } = useAuth();

  if (!authState.authenticated) {
    return <Redirect href="/login" />;
  }
  return (
  <Stack>
    <Stack.Screen name="(tabs)"
    options={{headerShown: false}}/>
  </Stack>
  );
};

export default Layout;