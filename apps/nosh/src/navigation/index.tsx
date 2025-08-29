import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStaticNavigation, StaticParamList } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useCustomer } from '@/providers/customer';

import { Explore } from './screens/Explore';
import { Home } from './screens/Home';
import { NotFound } from './screens/NotFound';
import { Login } from './screens/Login';
import { Register } from './screens/Register';
import { RequestReset } from './screens/RequestReset';
import { ResetPassword } from './screens/ResetPassword';

import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';

const HomeTabs = createBottomTabNavigator({
  screens: {
    Home: {
      screen: Home,
      options: {
        headerShown: false,
        tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
      },
    },
    Explore: {
      screen: Explore,
      options: {
        headerShown: false,
        tabBarIcon: ({ color }) => <IconSymbol size={28} name="paperplane.fill" color={color} />,
      },
    },
  },
  screenOptions: {
    headerShown: false,
    tabBarButton: HapticTab,
    tabBarBackground: TabBarBackground,
  },
});

const RootStack = createNativeStackNavigator({
  screens: {
    HomeTabs: {
      screen: HomeTabs,
      options: {
        headerShown: false,
      },
    },
    NotFound: {
      screen: NotFound,
      options: {
        title: '404',
      },
      linking: {
        path: '*',
      },
    },
  },
});

export const Navigation = createStaticNavigation(RootStack);

const AuthStack = createNativeStackNavigator({
  screens: {
    Login: {
      screen: Login,
      options: {
        title: 'Sign in',
      },
    },
    Register: {
      screen: Register,
      options: {
        title: 'Create account',
      },
      linking: { path: 'register' },
    },
    RequestReset: {
      screen: RequestReset,
      options: {
        title: 'Reset password',
      },
      linking: { path: 'reset-password' },
    },
    ResetPassword: {
      screen: ResetPassword,
      options: {
        title: 'Set new password',
      },
      linking: { path: 'reset-password/confirm' },
    },
  },
});

export function RootNavigationSwitcher({ theme, linking, onReady }: any) {
  const { isLoggedIn, isLoading } = useCustomer();
  const Navigator = isLoggedIn ? createStaticNavigation(RootStack) : createStaticNavigation(AuthStack);
  if (isLoading) return null;
  return <Navigator theme={theme} linking={linking} onReady={onReady} />;
}

type RootStackParamList = StaticParamList<typeof RootStack>;

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
