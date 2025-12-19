import { Redirect, useLocalSearchParams } from 'expo-router';

export default function EditAccountScreen() {
  const params = useLocalSearchParams();
  // Redirect to add screen with id parameter preserved
  return <Redirect href={`/accounts/add?id=${params.id}`} />;
}
