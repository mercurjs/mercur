import 'react-native-reanimated';
import { DarkTheme, DefaultTheme } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import * as React from 'react';
import { useColorScheme } from 'react-native';

import { Colors } from './constants/Colors';
import { RootNavigationSwitcher } from './navigation';
import { CustomerProvider } from './providers/customer';

SplashScreen.preventAutoHideAsync();

export function App() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('./assets/fonts/SpaceMono-Regular.ttf'),
  });

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  const theme =
    colorScheme === 'dark'
      ? {
          ...DarkTheme,
          colors: { ...DarkTheme.colors, primary: Colors[colorScheme ?? 'light'].tint },
        }
      : {
          ...DefaultTheme,
          colors: { ...DefaultTheme.colors, primary: Colors[colorScheme ?? 'light'].tint },
        };

  return (
    <CustomerProvider>
      <RootNavigationSwitcher
        theme={theme}
        linking={{
          enabled: 'auto',
          prefixes: ['nosh://'],
          // Support incoming links for password reset flows
          // Example: nosh://reset-password/confirm?token=...&email=...
          // and nosh://reset-password
          // and nosh://register
          config: {
            initialRouteName: 'Login',
            screens: {
              Login: 'login',
              Register: 'register',
              RequestReset: 'reset-password',
              ResetPassword: 'reset-password/confirm',
            },
          },
        }}
        onReady={() => {
          SplashScreen.hideAsync();
        }}
      />
    </CustomerProvider>
  );
}
