import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { apiService, WEB_BASE } from '../services/api';

const ChildInfoScreen = ({ route, navigation }) => {
  const { SID, editChild } = route?.params || {};
  const isEditing = !!editChild;

  const [childName, setChildName] = useState(editChild?.Name || '');
  const [dob, setDob] = useState(editChild?.DOB?.split('T')[0] || '');
  const [gender, setGender] = useState(editChild?.Gender?.toLowerCase() || 'female');
  const [specialNeeds, setSpecialNeeds] = useState([]);
  const [extraDetails, setExtraDetails] = useState(editChild?.Extra_Details || '');
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [specialNeedsOptions, setSpecialNeedsOptions] = useState([]);

  useEffect(() => {
    fetchSpecialNeeds();
    if (isEditing && editChild.Child_ID) {
      fetchChildSpecialNeeds(editChild.Child_ID);
    }
  }, []);

  const onDateChange = (event, selectedDate) => {
    if (event.type === 'set') {
      const currentDate = selectedDate || new Date();
      setShowDatePicker(Platform.OS === 'ios');
      setDob(currentDate.toISOString().split('T')[0]);
    } else {
      setShowDatePicker(false);
    }
  };

  const fetchSpecialNeeds = async () => {
    try {
      const res = await apiService.get('/modules/special_need_type/special_need_type');
      setSpecialNeedsOptions(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Error fetching special needs:', err);
    }
  };

  const fetchChildSpecialNeeds = async (childId) => {
    try {
      const res = await apiService.get(`/modules/child_sn/child_sn?id=${childId}`);
      if (Array.isArray(res.data)) {
        setSpecialNeeds(res.data.map(sn => sn.SNT_ID));
      }
    } catch (err) {
      console.warn('Error fetching child special needs:', err);
    }
  };

  const handleToggleSpecialNeed = (sntId) => {
    setSpecialNeeds(
      specialNeeds.includes(sntId)
        ? specialNeeds.filter((id) => id !== sntId)
        : [...specialNeeds, sntId]
    );
  };

  const finishChildInfo = () => {
    if (route.params?.isAddingNew || route.params?.editChild) {
      navigation.goBack();
      return;
    }

    if (SID) {
      navigation.navigate('WebView', {
        url: `${WEB_BASE}/subscription-checkout?planId=${SID}`,
        title: 'Checkout'
      });
    } else {
      import('react-native').then(({ DeviceEventEmitter }) => {
        DeviceEventEmitter.emit('login');
      });
    }
  };

  const handleAddChild = async () => {
    if (!childName.trim() || !dob) {
      Alert.alert('Error', 'Please fill in required fields');
      return;
    }

    setLoading(true);
    try {
      if (isEditing) {
        // Update child
        const updateRes = await apiService.updateChild(editChild.Child_ID, {
          Full_Name: childName,
          DOB: dob,
          Gender: gender.charAt(0).toUpperCase() + gender.slice(1).toLowerCase(), // Ensure "Female" or "Male"
          Extra_Details: extraDetails,
          P_ID: editChild.P_ID
        });

        if (updateRes.data?.Status === 'OK') {
          // Update special needs - first remove all then add new
          // NOTE: Usually there's a specific endpoint for this, but if not we proceed
          try {
            // This is a simplification; a more robust backend would handle this in the updateChild call
            await apiService.post('/modules/child_sn/child_sn', {
              Child_ID: editChild.Child_ID,
              specialNeeds: specialNeeds,
            });
          } catch (err) {
            console.warn('Special needs update failed');
          }

          Alert.alert('Success', 'Child profile updated successfully!');
          finishChildInfo();
        } else {
          throw new Error('Update failed');
        }
      } else {
        const parentData = await AsyncStorage.getItem('parent');
        if (!parentData) {
          Alert.alert('Error', 'Parent data not found');
          return;
        }

        const parent = JSON.parse(parentData);

        // Create child
        const childRes = await apiService.addChild({
          Full_Name: childName,
          DOB: dob,
          Gender: gender,
          Extra_Details: extraDetails,
          P_ID: parent.P_ID,
        });

        if (childRes.data?.Status === 'OK' && childRes.data?.Child_ID) {
          // Link special needs if any
          if (specialNeeds.length > 0) {
            try {
              await apiService.post('/modules/child_sn/child_sn', {
                Child_ID: childRes.data.Child_ID,
                specialNeeds: specialNeeds,
              });
            } catch (err) {
              console.warn('Special needs linking failed (child still saved)');
            }
          }

          Alert.alert('Success', 'Child added successfully!');
          finishChildInfo();
        }
      }
    } catch (err) {
      console.error('Error saving child:', err);
      Alert.alert('Error', isEditing ? 'Failed to update child' : 'Failed to add child');
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
        <View style={styles.header}>
          <Text style={styles.title}>
            {isEditing ? `Edit ${editChild.Name}'s Info` : 'Tell Us About Your Child'}
          </Text>
          <Text style={styles.subtitle}>
            {isEditing
              ? 'Update your child\'s details below'
              : 'This helps us personalize support for your family'}
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={styles.label}>CHILD'S NAME *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter name"
              value={childName}
              onChangeText={setChildName}
              editable={!loading}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>DATE OF BIRTH *</Text>
            {Platform.OS === 'web' ? (
              <input
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                style={{
                  backgroundColor: '#f2f0ed',
                  border: '1px solid #ece8e2',
                  borderRadius: '10px',
                  padding: '11px 14px',
                  fontSize: '14px',
                  color: '#2d2d2d',
                  width: '100%',
                  outline: 'none',
                  fontFamily: 'inherit',
                  boxSizing: 'border-box'
                }}
              />
            ) : (
              <>
                <TouchableOpacity
                  style={styles.input}
                  onPress={() => setShowDatePicker(true)}
                  activeOpacity={0.7}
                >
                  <Text style={{ color: dob ? '#2d2d2d' : '#999', fontSize: 14 }}>
                    {dob || 'Select date'}
                  </Text>
                </TouchableOpacity>
                {showDatePicker && (
                  <DateTimePicker
                    value={dob ? new Date(dob) : new Date()}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={onDateChange}
                    maximumDate={new Date()}
                    textColor="#2d2d2d"
                    accentColor="#9D64AA"
                  />
                )}
              </>
            )}
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>GENDER</Text>
            <View style={styles.radioGroup}>
              <TouchableOpacity
                style={styles.radioOption}
                onPress={() => setGender('female')}
              >
                <View style={[styles.radioButton, gender === 'female' && styles.radioButtonActive]} />
                <Text style={styles.radioLabel}>Female</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.radioOption}
                onPress={() => setGender('male')}
              >
                <View style={[styles.radioButton, gender === 'male' && styles.radioButtonActive]} />
                <Text style={styles.radioLabel}>Male</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>SPECIAL NEEDS</Text>
            <View style={styles.checkboxGroup}>
              {specialNeedsOptions.map((sn) => (
                <TouchableOpacity
                  key={sn.SNT_ID}
                  style={styles.checkboxOption}
                  onPress={() => handleToggleSpecialNeed(sn.SNT_ID)}
                >
                  <View
                    style={[
                      styles.checkbox,
                      specialNeeds.includes(sn.SNT_ID) && styles.checkboxActive,
                    ]}
                  >
                    {specialNeeds.includes(sn.SNT_ID) && (
                      <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                    )}
                  </View>
                  <Text style={styles.checkboxLabel}>{sn.Special_Need_Types}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>EXTRA DETAILS</Text>
            <TextInput
              style={[styles.input, styles.textarea]}
              placeholder="Any additional information..."
              value={extraDetails}
              onChangeText={setExtraDetails}
              multiline
              numberOfLines={3}
              editable={!loading}
            />
          </View>

          <TouchableOpacity
            style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
            onPress={handleAddChild}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.submitBtnText}>
                {isEditing ? 'Save Changes' : 'Continue'}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={finishChildInfo}
            disabled={loading}
          >
            <Text style={styles.skipText}>Skip for now</Text>
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
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2d2d2d',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 13,
    color: '#6b6b6b',
    lineHeight: 18,
  },
  form: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
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
  textarea: {
    height: 80,
    textAlignVertical: 'top',
  },
  radioGroup: {
    flexDirection: 'row',
    gap: 16,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ece8e2',
  },
  radioButtonActive: {
    borderColor: '#9D64AA',
    backgroundColor: '#9D64AA',
  },
  radioLabel: {
    fontSize: 13,
    color: '#2d2d2d',
    fontWeight: '500',
  },
  checkboxGroup: {
    flexDirection: 'column',
    gap: 10,
  },
  checkboxOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#ece8e2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxActive: {
    borderColor: '#9D64AA',
    backgroundColor: '#9D64AA',
  },
  checkboxLabel: {
    fontSize: 13,
    color: '#2d2d2d',
    fontWeight: '500',
  },
  submitBtn: {
    backgroundColor: '#8f4f9d',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 16,
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
  skipText: {
    fontSize: 13,
    color: '#9D64AA',
    textAlign: 'center',
    marginTop: 16,
    fontWeight: '600',
  },
});

export default ChildInfoScreen;
