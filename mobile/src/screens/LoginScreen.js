import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
  View
} from 'react-native';
import { apiService } from '../services/api';

const LoginScreen = ({ navigation, onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);

    try {
      // Try Parent login
      const parentRes = await apiService.loginParent(email, password);

      if (parentRes.data?.Status === 'OK' && parentRes.data?.P_ID) {
        const parentData = {
          P_ID: parentRes.data.P_ID,
          Full_Name: parentRes.data.Full_Name,
          Email: parentRes.data.Email,
          Location: parentRes.data.Location,
          Phone: parentRes.data.Phone,
        };

        await AsyncStorage.setItem('parent', JSON.stringify(parentData));
        await AsyncStorage.setItem('isLoggedIn', 'true');
        await AsyncStorage.setItem('userRole', 'parent');

        onLoginSuccess && onLoginSuccess();
        return;
      }

      setError('Invalid email or password.');
    } catch (err) {
      console.error('Login error full:', JSON.stringify({
        code: err.code,
        message: err.message,
        url: err.config?.url,
        baseURL: err.config?.baseURL,
        status: err.response?.status,
      }));
      if (err.code === 'ECONNABORTED') {
        setError(`Timeout reaching ${err.config?.baseURL}`);
      } else if (err.code === 'ERR_NETWORK' || err.message?.includes('Network')) {
        setError(`Cannot reach server at ${err.config?.baseURL}\nCode: ${err.code}`);
      } else if (err.response) {
        setError(`Server error ${err.response.status}: ${JSON.stringify(err.response.data).slice(0,80)}`);
      } else {
        setError(`Error: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Log In</Text>
          <Text style={styles.subtitle}>Welcome back to your supportive community.</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Email Field */}
          <View style={styles.field}>
            <Text style={styles.label}>EMAIL ADDRESS</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={18} color="#9b9b9b" style={styles.icon} />
              <TextInput
                style={styles.input}
                placeholder="name@example.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!loading}
              />
            </View>
          </View>

          {/* Password Field */}
          <View style={styles.field}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>PASSWORD</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
                <Text style={styles.forgotLink}>Forgot Password?</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={18} color="#9b9b9b" style={styles.icon} />
              <TextInput
                style={[styles.input, styles.passwordInput]}
                placeholder="••••••••••"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPass}
                editable={!loading}
              />
              <TouchableOpacity
                onPress={() => setShowPass(!showPass)}
                style={styles.eyeButton}
              >
                <Ionicons
                  name={showPass ? 'eye-outline' : 'eye-off-outline'}
                  size={18}
                  color="#9b9b9b"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Error Message */}
          {error ? <Text style={styles.error}>{error}</Text> : null}

          {/* Login Button */}
          <TouchableOpacity
            style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitBtnText}>Log In</Text>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Google Login */}
          <TouchableOpacity style={styles.googleBtn} disabled={loading}>
            <Text style={styles.googleBtnText}>Continue with Google</Text>
          </TouchableOpacity>
        </View>

        {/* Sign Up Link */}
        <View style={styles.signupLink}>
          <Text style={styles.signupText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
            <Text style={styles.signupCta}>Sign Up</Text>
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
  header: {
    marginBottom: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#2d2d2d',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b6b6b',
    textAlign: 'center',
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
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: '#616161',
    marginBottom: 6,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  forgotLink: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9D64AA',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f2f0ed',
    borderWidth: 1,
    borderColor: '#ece8e2',
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  icon: {
    marginRight: 10,
    marginLeft: 4,
  },
  input: {
    flex: 1,
    paddingVertical: 13,
    paddingHorizontal: 8,
    fontSize: 14,
    color: '#2d2d2d',
  },
  passwordInput: {
    paddingRight: 40,
  },
  eyeButton: {
    position: 'absolute',
    right: 12,
    padding: 4,
  },
  error: {
    fontSize: 12,
    color: '#e05555',
    marginBottom: 12,
  },
  submitBtn: {
    backgroundColor: '#8f4f9d',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 8,
  },
  submitBtnDisabled: {
    opacity: 0.7,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e0dbd4',
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 11,
    fontWeight: '700',
    color: '#8a8580',
    letterSpacing: 1,
  },
  googleBtn: {
    borderWidth: 1,
    borderColor: '#e0dbd4',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  googleBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2d2d2d',
  },
  signupLink: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  signupText: {
    fontSize: 14,
    color: '#6b6b6b',
  },
  signupCta: {
    fontSize: 14,
    fontWeight: '700',
    color: '#9D64AA',
  },
});

export default LoginScreen;
