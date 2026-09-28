import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { AppState, DeviceEventEmitter } from 'react-native';

// Import screens - Individual files
import ChildInfoScreen from './src/screens/ChildInfoScreen';
import HomeScreen from './src/screens/HomeScreen';
import LandingScreen from './src/screens/LandingScreen';
import LoginScreen from './src/screens/LoginScreen';
import ParentProfileScreen from './src/screens/ParentProfileScreen';
import SchoolScreen from './src/screens/SchoolScreen';
import SignupScreen from './src/screens/SignupScreen';
import SplashScreen from './src/screens/SplashScreen';
import WebViewScreen from './src/screens/WebViewScreen';

// Import named exports from combined files
import {
    DonateItemFormScreen,
    DonationScreen,
    ShadowTeacherScreen,
    TherapistScreen,
} from './src/screens/ServiceScreens';

import {
    CommunicationToolScreen,
    CommunityCenterScreen,
} from './src/screens/CommunityAndCommunication';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Auth Stack
const AuthStack = ({ onLoginSuccess }) => {
  return (
    <Stack.Navigator
      initialRouteName="Landing"
      screenOptions={{
        headerShown: false,
        animationEnabled: true,
      }}
    >
      <Stack.Screen name="Landing" component={LandingScreen} />
      <Stack.Screen
        name="Login"
        children={(props) => <LoginScreen {...props} onLoginSuccess={onLoginSuccess} />}
      />
      <Stack.Screen name="Signup" component={SignupScreen} />
      <Stack.Screen name="ChildInfo" component={ChildInfoScreen} />
      <Stack.Screen
        name="WebView"
        component={WebViewScreen}
        options={({ route }) => ({
          title: route.params?.title || 'Details',
          headerShown: true,
          headerStyle: { backgroundColor: '#F6F2EE' },
          headerTintColor: '#2d2d2d',
        })}
      />
    </Stack.Navigator>
  );
};

// Home Stack
const HomeStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: '#F6F2EE',
          borderBottomColor: '#E0DBD4',
          borderBottomWidth: 1,
        },
        headerTintColor: '#2d2d2d',
        headerTitleStyle: {
          fontWeight: '700',
          fontSize: 18,
        },
      }}
    >
      <Stack.Screen
        name="HomeMain"
        component={HomeScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen name="School" component={SchoolScreen} />
      <Stack.Screen name="Therapist" component={TherapistScreen} />
      <Stack.Screen name="ShadowTeacher" component={ShadowTeacherScreen} />
      <Stack.Screen name="Donation" component={DonationScreen} />
      <Stack.Screen name="CommunicationTools" component={CommunicationToolScreen} />
      <Stack.Screen name="CommunityCenter" component={CommunityCenterScreen} />
      <Stack.Screen name="DonateItemForm" component={DonateItemFormScreen} />
      <Stack.Screen name="ChildInfo" component={ChildInfoScreen} />
      <Stack.Screen
        name="WebView"
        component={WebViewScreen}
        options={({ route }) => ({
          title: route.params?.title || 'Details',
        })}
      />
    </Stack.Navigator>
  );
};

// Community Stack
const CommunityStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: '#F6F2EE' },
        headerTintColor: '#2d2d2d',
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <Stack.Screen
        name="CommunityMain"
        component={CommunityCenterScreen}
        options={{ title: 'Community Center' }}
      />
    </Stack.Navigator>
  );
};

// Communication Stack
const CommunicationStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: '#F6F2EE' },
        headerTintColor: '#2d2d2d',
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <Stack.Screen
        name="CommunicationMain"
        component={CommunicationToolScreen}
        options={{ title: 'Communication Tool' }}
      />
    </Stack.Navigator>
  );
};

// Profile Stack
const ProfileStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: '#F6F2EE' },
        headerTintColor: '#2d2d2d',
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <Stack.Screen
        name="ProfileMain"
        component={ParentProfileScreen}
        options={{ title: 'My Profile' }}
      />
    </Stack.Navigator>
  );
};

// App Tabs
const AppTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'HomeTab') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'CommunityTab') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'CommunicationTab') {
            iconName = focused ? 'chatbox' : 'chatbox-outline';
          } else if (route.name === 'ProfileTab') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#9D64AA',
        tabBarInactiveTintColor: '#B0AAAA',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E0DBD4',
          borderTopWidth: 1,
          paddingBottom: 6,
          paddingTop: 8,
          height: 56,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
        },
      })}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeStack}
        options={{ title: 'Home' }}
      />
      <Tab.Screen
        name="CommunityTab"
        component={CommunityStack}
        options={{ title: 'Community' }}
      />
      <Tab.Screen
        name="CommunicationTab"
        component={CommunicationStack}
        options={{ title: 'Tools' }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStack}
        options={{ title: 'Profile' }}
      />
    </Tab.Navigator>
  );
};

// Main App
export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState(null);
  const appState = AppState.currentState;
  const [appStateVisible, setAppStateVisible] = useState(appState);

  useEffect(() => {
    bootstrapAsync();
    
    // Listen for app state changes
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    // Listen for manual logouts from anywhere in the app
    const logoutSub = DeviceEventEmitter.addListener('logout', () => {
      setUserToken(null);
    });

    // Listen for manual logins/signups
    const loginSub = DeviceEventEmitter.addListener('login', () => {
      setUserToken('true');
    });
    
    return () => {
      subscription.remove();
      logoutSub.remove();
      loginSub.remove();
    };
  }, []);

  const handleAppStateChange = async (state) => {
    setAppStateVisible(state);
    if (state === 'active') {
      // App has come to foreground - re-check login state
      await bootstrapAsync();
    }
  };

  const bootstrapAsync = async () => {
    try {
      const token = await AsyncStorage.getItem('isLoggedIn');
      setUserToken(token);
      setIsLoading(false);
    } catch (e) {
      console.error('Failed to restore token', e);
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <SplashScreen />;
  }

  const handleLoginSuccess = () => {
    setUserToken('true');
  };

  return (
    <NavigationContainer>
      {userToken ? <AppTabs /> : <AuthStack onLoginSuccess={handleLoginSuccess} />}
    </NavigationContainer>
  );
}