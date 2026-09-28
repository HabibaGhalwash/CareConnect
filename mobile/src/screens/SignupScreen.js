import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { apiService, API_BASE } from '../services/api';

const SignupScreen = ({ route, navigation }) => {
  const { SID } = route?.params || {};
  
  const [parentForm, setParentForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    location: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleParentSignup = async () => {
    setError('');

    if (!parentForm.fullName || !parentForm.email || !parentForm.password || !parentForm.phone || !parentForm.location) {
      setError('Please fill in all required fields (Name, Email, Phone, Location, Password).');
      return;
    }

    setLoading(true);

    try {
      const newParent = {
        Full_Name: parentForm.fullName,
        Email: parentForm.email,
        Location: parentForm.location,
        Password: parentForm.password,
        Phone: parentForm.phone,
        SID: SID || null, // Link the chosen subscription immediately
      };

      const res = await axios.post(`${API_BASE}/modules/parent/parent`, newParent, {
        headers: { 'Content-Type': 'application/json' },
      });

      if (res.data && res.data.Status === 'OK' && res.data.P_ID) {
        const parentData = {
          P_ID: res.data.P_ID,
          Full_Name: parentForm.fullName,
          Email: parentForm.email,
          Location: parentForm.location,
          Phone: parentForm.phone,
          SID: SID || null,
        };

        await AsyncStorage.setItem('parent', JSON.stringify(parentData));
        await AsyncStorage.setItem('isLoggedIn', 'true');
        
        navigation.navigate('ChildInfo', { SID });
      } else {
        setError(res.data?.Message || 'Signup failed.');
      }
    } catch (err) {
      setError(err.response?.data?.Message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <View style={styles.successContainer}>
        <Text style={styles.successEmoji}>✅</Text>
        <Text style={styles.successTitle}>Application Submitted!</Text>
        <Text style={styles.successMessage}>
          Your application has been submitted for review. Please wait for admin approval.
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Form */}
        <View style={styles.form}>
          <Text style={styles.formTitle}>Parent Application</Text>
          <Text style={styles.formSubtitle}>Tell us about you as a parent.</Text>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <View style={styles.field}>
            <Text style={styles.label}>FULL NAME</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your fullname"
              value={parentForm.fullName}
              onChangeText={(text) =>
                setParentForm({ ...parentForm, fullName: text })
              }
              editable={!loading}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>EMAIL ADDRESS</Text>
            <TextInput
              style={styles.input}
              placeholder="jane@example.com"
              value={parentForm.email}
              onChangeText={(text) => setParentForm({ ...parentForm, email: text })}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!loading}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>PHONE NUMBER</Text>
            <TextInput
              style={styles.input}
              placeholder="+20 100 174 5678"
              value={parentForm.phone}
              onChangeText={(text) =>
                setParentForm({ ...parentForm, phone: text })
              }
              keyboardType="phone-pad"
              editable={!loading}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>LOCATION</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Cairo, Egypt"
              value={parentForm.location}
              onChangeText={(text) =>
                setParentForm({ ...parentForm, location: text })
              }
              editable={!loading}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>PASSWORD</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••••"
              value={parentForm.password}
              onChangeText={(text) =>
                setParentForm({ ...parentForm, password: text })
              }
              secureTextEntry
              editable={!loading}
            />
          </View>

          <TouchableOpacity
            style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
            onPress={handleParentSignup}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitBtnText}>Add Child Info →</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Login Link */}
        <View style={styles.loginLink}>
          <Text style={styles.loginText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginCta}>Log In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#C4A0CC',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 24,
    justifyContent: 'center',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#f1eeea',
    borderRadius: 18,
    padding: 6,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#9D64AA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6b6b6b',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  form: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  formTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2d2d2d',
    marginBottom: 8,
  },
  formSubtitle: {
    fontSize: 13,
    color: '#6b6b6b',
    marginBottom: 16,
    lineHeight: 18,
  },
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: '#616161',
    marginBottom: 6,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: '#f2f0ed',
    borderWidth: 1,
    borderColor: '#ece8e2',
    borderRadius: 10,
    paddingVertical: 11,
    paddingHorizontal: 14,
    fontSize: 14,
    color: '#2d2d2d',
  },
  pickerContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  pickerOption: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ece8e2',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    alignItems: 'center',
    backgroundColor: '#f2f0ed',
  },
  pickerOptionActive: {
    backgroundColor: '#9D64AA',
    borderColor: '#9D64AA',
  },
  pickerOptionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b6b6b',
  },
  pickerOptionTextActive: {
    color: '#FFFFFF',
  },
  error: {
    fontSize: 12,
    color: '#e05555',
    marginBottom: 12,
    backgroundColor: '#ffe0e0',
    padding: 10,
    borderRadius: 6,
  },
  submitBtn: {
    backgroundColor: '#8f4f9d',
    borderRadius: 11,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  submitBtnDisabled: {
    opacity: 0.7,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  loginLink: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  loginText: {
    fontSize: 14,
    color: '#6b6b6b',
  },
  loginCta: {
    fontSize: 14,
    fontWeight: '700',
    color: '#9D64AA',
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 40,
  },
  successEmoji: {
    fontSize: 48,
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2d2d2d',
    marginBottom: 12,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 14,
    color: '#6b6b6b',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default SignupScreen;
