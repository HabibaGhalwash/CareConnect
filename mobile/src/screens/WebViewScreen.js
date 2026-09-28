import React, { useRef } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';

const WebViewScreen = ({ route, navigation }) => {
  const { url, title } = route.params || {};
  const isRedirecting = useRef(false);

  if (!url) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No URL provided</Text>
        </View>
      </View>
    );
  }

  React.useEffect(() => {
    if (title) {
      navigation.setOptions({ title });
    }
  }, [title, navigation]);

  const triggerHomeRedirect = () => {
    if (isRedirecting.current) return;
    isRedirecting.current = true;

    console.log('🎉 SUCCESS DETECTED: Redirecting to Home in 5s...');
    setTimeout(() => {
      // Try to navigate to HomeTab directly
      try {
        navigation.navigate('HomeTab');
      } catch (err) {
        console.log('Failed to navigate to HomeTab, trying HomeMain...');
        navigation.navigate('HomeMain');
      }
    }, 5000);
  };

  React.useEffect(() => {
    if (Platform.OS === 'web') {
      const handleMessage = (event) => {
        if (event.data?.type === 'CHECKOUT_SUCCESS' || event.data?.type === 'BOOKING_SUCCESS') {
          triggerHomeRedirect();
        }
      };
      window.addEventListener('message', handleMessage);
      return () => window.removeEventListener('message', handleMessage);
    }
  }, [navigation]);

  const handleMessage = (event) => {
    try {
      console.log('📱 WebView Message Received:', event.nativeEvent.data);
      const data = JSON.parse(event.nativeEvent.data);

      if (data.type === 'CHECKOUT_SUCCESS' || data.type === 'BOOKING_SUCCESS') {
        triggerHomeRedirect();
      }

      if (data.type === 'LOGOUT' || data.action === 'logout') {
        AsyncStorage.multiRemove(['isLoggedIn', 'parent', 'admin', 'therapist', 'shadow_teacher', 'userRole']);
        DeviceEventEmitter.emit('logout');
      }
    } catch (err) {
      console.error('❌ Error parsing WebView message:', err);
    }
  };

  const handleNavigationStateChange = (navState) => {
    const url = navState.url.toLowerCase();
    const isProfile = url.includes('/parentprofile') || url.includes('/parent-profile');
    const isBookingSuccess = url.includes('booking-success') || url.includes('success') || url.includes('confirmed');
    const isCheckoutSuccess = url.includes('checkout-success') || url.includes('payment-success');

    if (isBookingSuccess || isCheckoutSuccess || (isProfile && navState.loading === false)) {
      triggerHomeRedirect();
    }
  };

  const handleShouldStartLoadWithRequest = (request) => {
    // Allow the success page to load so the user can see it
    return true;
  };

  return (
    <View style={styles.container}>
      {Platform.OS === 'web' ? (
        <iframe
          src={url}
          style={{ flex: 1, width: '100%', height: '100%', border: 'none' }}
          title="CareConnect Checkout"
        />
      ) : (
        <WebView
          source={{ uri: url }}
          style={styles.webview}
          startInLoadingState={true}
          onNavigationStateChange={handleNavigationStateChange}
          onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
          onMessage={handleMessage}
          renderLoading={() => (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#9D64AA" />
            </View>
          )}
          scalesPageToFit={true}
          javaScriptEnabled={true}
          domStorageEnabled={true}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F2EE',
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  errorText: {
    fontSize: 16,
    color: '#e05555',
  },
});

export default WebViewScreen;
