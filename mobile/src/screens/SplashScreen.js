import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';

const SplashScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>CareConnect</Text>
      <Text style={styles.subtitle}>Supporting Every Child's Journey</Text>
      <ActivityIndicator size="large" color="#9D64AA" style={styles.loader} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#C4A0CC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 30,
  },
  loader: {
    marginTop: 20,
  },
});

export default SplashScreen;
