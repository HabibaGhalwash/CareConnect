import { DeviceEventEmitter } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert,
  KeyboardAvoidingView, Modal, Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { apiService, WEB_BASE } from '../services/api';

const ParentProfileScreen = ({ navigation }) => {
  const [userData, setUserData] = useState(null);
  const [children, setChildren] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [saving, setSaving] = useState(false);
  const [subscription, setSubscription] = useState(null);
  const [allPlans, setAllPlans] = useState([]);
  const [showAllPlans, setShowAllPlans] = useState(false);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);

  useEffect(() => {
    loadUserData();
    const unsubscribe = navigation.addListener('focus', () => {
      // Add a slight delay to allow backend to finish processing checkout
      setTimeout(loadUserData, 500);
    });
    return unsubscribe;
  }, [navigation]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUserData();
    setRefreshing(false);
  };

  const loadUserData = async () => {
    try {
      const parentData = await AsyncStorage.getItem('parent');
      if (parentData) {
        const parsed = JSON.parse(parentData);
        setUserData(parsed);
        setEditFormData(parsed);
        // Fetch children from backend
        if (parsed.P_ID) {
          fetchChildren(parsed.P_ID);
          fetchSubscription(parsed.P_ID);
          fetchAllPlans();
        }
      }
    } catch (err) {
      console.error('Error loading user data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllPlans = async () => {
    try {
      const res = await apiService.getAllSubscriptions();
      setAllPlans(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Error fetching all plans:', err);
    }
  };

  const fetchSubscription = async (parentId) => {
    try {
      const res = await apiService.getParentSubscription(parentId);
      const parent = Array.isArray(res.data) ? res.data[0] : null;
      if (parent) {
        // Sync local storage with latest parent data from DB
        await AsyncStorage.setItem('parent', JSON.stringify(parent));
        setUserData(parent);
        setEditFormData(parent);

        if (parent.SID) {
          const subRes = await apiService.getSubscriptionDetails(parent.SID);
          const sub = Array.isArray(subRes.data) ? subRes.data[0] : null;
          if (sub) {
            setSubscription({
              planId: sub.SID,
              planName: sub.Offer_Details,
              price: sub.Price,
            });
          }
        } else {
          setSubscription(null);
        }
      }
    } catch (err) {
      console.error('Error fetching subscription:', err);
    }
  };

  const [sessions, setSessions] = useState(0);
  const [sessionsDetail, setSessionsDetail] = useState({}); // childId -> bookings
  const [showSessionsModal, setShowSessionsModal] = useState(false);
  const [selectedChild, setSelectedChild] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  const fetchSessions = async (parentId, childrenData = []) => {
    try {
      console.log('🔄 Fetching detailed sessions for profile via child-by-child lookup...');
      const detailsMap = {};
      
      if (childrenData.length === 0) {
        setSessions(0);
        return;
      }

      // Fetch individually for each child to ensure we get joined names from /by-child endpoint
      const childBookings = await Promise.all(
        childrenData.map(async (child) => {
          try {
            const cid = child.Child_ID || child.child_id || child.id || child.ID;
            if (!cid) return [];
            
            const res = await apiService.getBookingsByChild(cid);
            const data = Array.isArray(res.data) ? res.data : [];
            detailsMap[cid] = data;
            return data;
          } catch (e) {
            console.warn(`Error fetching sessions for child ${child.Name}:`, e.message);
            return [];
          }
        })
      );

      const bookings = childBookings.flat();
      setSessionsDetail(detailsMap);

      const activeSessions = bookings.filter(b => {
        const status = (b.Booking_status || b.booking_status || b.status || '').toLowerCase();
        return status !== 'cancelled';
      });
      
      setSessions(activeSessions.length);
      console.log('✅ Total active sessions found:', activeSessions.length);
    } catch (err) {
      console.warn('Could not fetch sessions:', err.message);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    Alert.alert(
      "Cancel Session",
      "Are you sure you want to cancel this session?",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes, Cancel",
          style: "destructive",
          onPress: async () => {
            try {
              setCancelling(true);
              await apiService.cancelBooking(bookingId);
              Alert.alert("Success", "Session has been cancelled.");
              // Refresh data
              if (userData?.P_ID) {
                await fetchSessions(userData.P_ID, children);
              }
            } catch (err) {
              Alert.alert("Error", "Failed to cancel session: " + err.message);
            } finally {
              setCancelling(false);
            }
          }
        }
      ]
    );
  };

  const fetchChildren = async (parentId) => {
    try {
      console.log('🔄 Fetching children for profile, P_ID:', parentId);
      let res = await apiService.getChildren(parentId);
      let data = Array.isArray(res.data) ? res.data : [];

      if (data.length === 0) {
        console.log('⚠️ by-parent profile returned 0, trying search fallback...');
        const fallbackRes = await apiService.get(`/modules/child/search?keyword=P_ID&keyvalue=${parentId}`);
        if (Array.isArray(fallbackRes.data) && fallbackRes.data.length > 0) {
          data = fallbackRes.data;
          console.log('✅ Fallback found children for profile:', data.length);
        }
      }

      setChildren(data);
      // Pass the actual data to fetchSessions to avoid waiting for state update
      fetchSessions(parentId, data);
    } catch (err) {
      console.warn('Could not fetch children:', err.message);
    }
  };

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        onPress: async () => {
          try {
            await AsyncStorage.multiRemove(['isLoggedIn', 'parent', 'admin', 'userRole', 'authToken']);
            DeviceEventEmitter.emit('logout');
          } catch (err) {
            Alert.alert('Error', 'Failed to logout');
          }
        },
        style: 'destructive',
      },
    ]);
  };

  const handleSaveProfile = async () => {
    if (!editFormData.Full_Name || !editFormData.Email) {
      Alert.alert('Error', 'Please fill in required fields');
      return;
    }

    setSaving(true);
    try {
      // 1. Fetch latest parent data from DB first to preserve hidden fields like Password, SID, etc.
      const res = await apiService.getParentSubscription(userData.P_ID);
      const currentParent = Array.isArray(res.data) ? res.data[0] : res.data;

      if (!currentParent) throw new Error('Could not find parent record');

      const phoneInt = parseInt(String(editFormData.Phone || '').replace(/\D/g, ''), 10) || 0;

      // 2. Prepare the full object for PUT
      const updatedProfile = {
        ...currentParent,
        Full_Name: editFormData.Full_Name,
        Email: editFormData.Email,
        Phone: phoneInt,
        Location: editFormData.Location,
      };

      await apiService.updateParentProfile(userData.P_ID, updatedProfile);

      // 3. Update local state and storage
      setUserData(updatedProfile);
      await AsyncStorage.setItem('parent', JSON.stringify(updatedProfile));
      setEditMode(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (err) {
      console.error('Update error:', err);
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const getChildAge = (dob) => {
    if (!dob) return null;
    const birth = new Date(dob);
    const now = new Date();
    const years = now.getFullYear() - birth.getFullYear();
    const monthDiff = now.getMonth() - birth.getMonth();
    return monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())
      ? years - 1
      : years;
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#9D64AA" />
      </View>
    );
  }

  if (!userData) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={styles.errorText}>No user data found</Text>
      </View>
    );
  }

  if (editMode) {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView showsVerticalScrollIndicator={false} style={styles.editForm}>
          <View style={styles.editSection}>
            <Text style={styles.sectionTitle}>Edit Profile</Text>

            <View style={styles.field}>
              <Text style={styles.label}>FULL NAME</Text>
              <TextInput
                style={styles.input}
                value={editFormData.Full_Name}
                onChangeText={(text) => setEditFormData({ ...editFormData, Full_Name: text })}
                placeholder="Enter full name"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>EMAIL</Text>
              <TextInput
                style={styles.input}
                value={editFormData.Email}
                onChangeText={(text) => setEditFormData({ ...editFormData, Email: text })}
                keyboardType="email-address"
                placeholder="Enter email"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>PHONE</Text>
              <TextInput
                style={styles.input}
                value={editFormData.Phone}
                onChangeText={(text) => setEditFormData({ ...editFormData, Phone: text })}
                keyboardType="phone-pad"
                placeholder="Enter phone"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>LOCATION</Text>
              <TextInput
                style={styles.input}
                value={editFormData.Location}
                onChangeText={(text) => setEditFormData({ ...editFormData, Location: text })}
                placeholder="Enter location"
              />
            </View>

            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setEditMode(false)}
                disabled={saving}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
                onPress={handleSaveProfile}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.saveBtnText}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  const initials = userData.Full_Name?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#9D64AA']} />
      }
    >
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <View style={styles.profileAvatar}>
          <Text style={styles.avatarInitials}>{initials}</Text>
        </View>
        <Text style={styles.profileName}>{userData.Full_Name}</Text>
        <Text style={styles.profileEmail}>{userData.Email}</Text>
      </View>

      {/* Contact Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Contact Information</Text>

        <View style={styles.profileRow}>
          <Ionicons name="call-outline" size={18} color="#9D64AA" style={styles.rowIcon} />
          <View style={styles.rowContent}>
            <Text style={styles.rowLabel}>Phone</Text>
            <Text style={styles.rowValue}>{userData.Phone || 'Not set'}</Text>
          </View>
        </View>

        <View style={styles.profileRow}>
          <Ionicons name="location-outline" size={18} color="#9D64AA" style={styles.rowIcon} />
          <View style={styles.rowContent}>
            <Text style={styles.rowLabel}>Location</Text>
            <Text style={styles.rowValue}>{userData.Location || 'Not set'}</Text>
          </View>
        </View>
      </View>

      {/* Account Stats */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account Stats</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{children.length}</Text>
            <Text style={styles.statLabel}>Children</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{sessions}</Text>
            <Text style={styles.statLabel}>Sessions</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{userData.P_ID || '—'}</Text>
            <Text style={styles.statLabel}>Parent ID</Text>
          </View>
        </View>
      </View>

      {/* Children Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>My Children</Text>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => navigation.navigate('ChildInfo', { isAddingNew: true })}
          >
            <Ionicons name="add-circle-outline" size={20} color="#9D64AA" />
            <Text style={styles.addBtnText}>Add</Text>
          </TouchableOpacity>
        </View>

        {children.length > 0 ? (
          children.map((child) => (
            <View key={child.Child_ID} style={styles.childRow}>
              <View style={styles.childAvatar}>
                <Ionicons
                  name={child.Gender?.toLowerCase() === 'female' ? 'woman-outline' : 'man-outline'}
                  size={20}
                  color="#9D64AA"
                />
              </View>
              <View style={styles.childInfo}>
                <Text style={styles.childName}>{child.Name}</Text>
                <Text style={styles.childMeta}>
                  {child.Gender} · Age {getChildAge(child.DOB) ?? '—'}
                </Text>
                {child.Extra_Details ? (
                  <Text style={styles.childDetails} numberOfLines={2}>
                    {child.Extra_Details}
                  </Text>
                ) : null}
              </View>
              <View style={styles.childActions}>
                <TouchableOpacity
                  style={styles.childActionBtn}
                  onPress={() => {
                    setSelectedChild(child);
                    setShowSessionsModal(true);
                  }}
                >
                  <Ionicons name="calendar-outline" size={16} color="#9D64AA" />
                  <Text style={styles.childActionText}>Sessions</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.childEditBtn}
                  onPress={() => navigation.navigate('ChildInfo', { editChild: child })}
                >
                  <Ionicons name="chevron-forward" size={18} color="#9D64AA" />
                </TouchableOpacity>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.noChildrenCard}>
            <Ionicons name="people-outline" size={40} color="#E0DBD4" />
            <Text style={styles.noChildrenText}>No children added yet</Text>
            <TouchableOpacity
              style={styles.addInitialBtn}
              onPress={() => navigation.navigate('ChildInfo', { isAddingNew: true })}
            >
              <Text style={styles.addInitialBtnText}>Add your first child</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Actions */}
      <View style={styles.section}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => setEditMode(true)}>
          <Ionicons name="create-outline" size={18} color="#9D64AA" />
          <Text style={styles.actionBtnText}>Edit Profile</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => {
            setIsSubscriptionModalOpen(true);
            if (userData?.P_ID) fetchSubscription(userData.P_ID);
          }}
        >
          <Ionicons name="card-outline" size={18} color="#9D64AA" />
          <Text style={styles.actionBtnText}>My Subscription</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, styles.logoutBtn]}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={18} color="#E8757D" />
          <Text style={[styles.actionBtnText, styles.logoutBtnText]}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Child Sessions Modal */}
      <Modal
        visible={showSessionsModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSessionsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.sessionsModalContainer}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>
                  {selectedChild?.Name || 'Child'}&apos;s Sessions
                </Text>
                <Text style={styles.modalSubtitle}>
                  {(sessionsDetail[selectedChild?.Child_ID] || []).length} total sessions
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowSessionsModal(false)} style={styles.closeModalBtn}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.sessionsList}>
              {(sessionsDetail[selectedChild?.Child_ID] || []).length === 0 ? (
                <View style={styles.noSessionsContainer}>
                  <Ionicons name="calendar-outline" size={50} color="#E0DBD4" />
                  <Text style={styles.noSessionsText}>No sessions booked for this child.</Text>
                </View>
              ) : (
                (sessionsDetail[selectedChild?.Child_ID] || []).map((b, i) => {
                  const status = (b.Booking_status || b.booking_status || b.status || 'Confirmed');
                  const isCancelled = status.toLowerCase() === 'cancelled';
                  const date = b.Date ? new Date(b.Date).toLocaleDateString('en-US', {
                    weekday: 'short', month: 'short', day: 'numeric'
                  }) : 'Unknown Date';
                  const time = b.Start_time ? b.Start_time.substring(0, 5) : '--:--';

                  const isTherapy = !!(b.T_ID || b.t_id);
                  const sessionType = isTherapy ? 'Therapy Session' : 'Shadow Teaching';
                  const specialistName = 
                    b.therapist_name || b.shadow_teacher_name || 
                    b.Therapist_Name || b.Shadow_Teacher_Name || 
                    b.Fullname || b.fullname || 
                    b.Name || b.name || 
                    'Specialist';

                  return (
                    <View key={b.B_ID || i} style={[styles.sessionItem, isCancelled && styles.sessionCancelled]}>
                      <View style={styles.sessionMain}>
                        <View style={[
                          styles.sessionTypeIcon,
                          { backgroundColor: isTherapy ? '#F4EBFF' : '#E6F4FF' }
                        ]}>
                          <Ionicons
                            name={isTherapy ? "medical-outline" : "school-outline"}
                            size={20}
                            color={isTherapy ? "#9D64AA" : "#3498db"}
                          />
                        </View>
                        <View style={styles.sessionInfo}>
                          <Text style={styles.sessionCategory}>{sessionType}</Text>
                          <Text style={styles.sessionProvider}>Specialist: {specialistName}</Text>
                          <Text style={styles.sessionDateTime}>{date} • {time}</Text>
                          <View style={styles.statusBadgeRow}>
                            <View style={[
                              styles.statusBadge,
                              { backgroundColor: isCancelled ? '#FFF0F0' : '#E8F5E9' }
                            ]}>
                              <Text style={[
                                styles.statusBadgeText,
                                { color: isCancelled ? '#FF4D4F' : '#2E7D32' }
                              ]}>
                                {status}
                              </Text>
                            </View>
                          </View>
                        </View>
                        {!isCancelled && (
                          <TouchableOpacity
                            style={styles.cancelSessionBtn}
                            onPress={() => handleCancelBooking(b.B_ID)}
                          >
                            <Text style={styles.cancelSessionText}>Cancel</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                      {b.Notes ? (
                        <View style={styles.sessionNotes}>
                          <Text style={styles.sessionNotesText}>📝 {b.Notes}</Text>
                        </View>
                      ) : null}
                    </View>
                  );
                })
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Subscription Modal */}
      <Modal
        visible={isSubscriptionModalOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsSubscriptionModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.subscriptionModal}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                onPress={() => showAllPlans ? setShowAllPlans(false) : setIsSubscriptionModalOpen(false)}
                style={styles.backBtn}
              >
                <Ionicons name={showAllPlans ? "arrow-back" : "close"} size={24} color="#666" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>
                {showAllPlans ? 'Available Plans' : 'Your Subscription'}
              </Text>
              <View style={{ width: 24 }} />
            </View>

            {showAllPlans ? (
              <ScrollView style={styles.plansList} showsVerticalScrollIndicator={false}>
                {allPlans.map((plan) => (
                  <TouchableOpacity
                    key={plan.SID}
                    style={[
                      styles.planCard,
                      subscription?.planId === plan.SID && styles.currentPlanCard
                    ]}
                    onPress={() => {
                      setIsSubscriptionModalOpen(false);
                      setShowAllPlans(false);
                      navigation.navigate('WebView', {
                        url: `${WEB_BASE}/subscription-checkout?planId=${plan.SID}&parentId=${userData?.P_ID}`,
                        title: 'Checkout',
                        fromProfile: true
                      });
                    }}
                  >
                    <View style={styles.planCardHeader}>
                      <Text style={styles.planCardName}>{plan.Offer_Details}</Text>
                      {subscription?.planId === plan.SID && (
                        <View style={styles.currentBadge}>
                          <Text style={styles.currentBadgeText}>CURRENT</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.planCardPrice}>EGP {plan.Price}/month</Text>
                    <View style={styles.planCardFooter}>
                      <Text style={styles.selectPlanText}>
                        {subscription?.planId === plan.SID ? 'Stay with this plan' : 'Select this plan'}
                      </Text>
                      <Ionicons name="chevron-forward" size={16} color="#9D64AA" />
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : subscription ? (
              <View style={styles.subInfoBox}>
                <View style={styles.planBadge}>
                  <Text style={styles.planBadgeText}>CURRENT PLAN</Text>
                </View>
                <Text style={styles.planName}>{subscription.planName}</Text>
                <View style={styles.priceRow}>
                  <Text style={styles.priceValue}>EGP {subscription.price}</Text>
                  <Text style={styles.pricePeriod}>/month</Text>
                </View>

                <View style={styles.subMeta}>
                  <View style={styles.metaItem}>
                    <Text style={styles.metaLabel}>Status</Text>
                    <Text style={[styles.metaValue, { color: '#2e7d32' }]}>Active</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Text style={styles.metaLabel}>Next Billing</Text>
                    <Text style={styles.metaValue}>May 1, 2026</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.changePlanBtn}
                  onPress={() => setShowAllPlans(true)}
                >
                  <Text style={styles.changePlanText}>Change Plan</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.noSubBox}>
                <Ionicons name="alert-circle-outline" size={40} color="#9D64AA" />
                <Text style={styles.noSubText}>No active subscription found</Text>
                <TouchableOpacity
                  style={styles.changePlanBtn}
                  onPress={() => setShowAllPlans(true)}
                >
                  <Text style={styles.changePlanText}>View Plans</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

      <View style={styles.spacing} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F2EE',
  },
  errorText: {
    fontSize: 14,
    color: '#e05555',
  },
  profileHeader: {
    backgroundColor: '#C4A0CC',
    paddingVertical: 28,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  profileAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarInitials: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 12,
    marginVertical: 6,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#616161',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f2ebf7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 4,
  },
  addBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9D64AA',
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f2f0ed',
    gap: 12,
  },
  rowIcon: { flexShrink: 0 },
  rowContent: { flex: 1 },
  rowLabel: {
    fontSize: 11,
    color: '#999',
    fontWeight: '500',
    marginBottom: 2,
  },
  rowValue: {
    fontSize: 14,
    color: '#2d2d2d',
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#f9f5f2',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '700',
    color: '#9D64AA',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#6b6b6b',
    fontWeight: '600',
  },
  childRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f2f0ed',
    gap: 12,
  },
  childAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f2ebf7',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  childInfo: { flex: 1 },
  childName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2d2d2d',
    marginBottom: 2,
  },
  childMeta: {
    fontSize: 12,
    color: '#9D64AA',
    fontWeight: '600',
    marginBottom: 3,
  },
  childDetails: {
    fontSize: 11,
    color: '#6b6b6b',
    lineHeight: 15,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#ece8e2',
    gap: 10,
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9D64AA',
  },
  logoutBtn: {
    borderColor: '#E8757D',
    borderWidth: 1.5,
    marginBottom: 0,
  },
  logoutBtnText: { color: '#E8757D' },
  editForm: { flex: 1 },
  editSection: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  field: { marginBottom: 14 },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: '#616161',
    marginBottom: 6,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: '#f2f0ed',
    borderWidth: 1,
    borderColor: '#ece8e2',
    borderRadius: 10,
    paddingVertical: 11,
    paddingHorizontal: 12,
    fontSize: 13,
    color: '#2d2d2d',
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ece8e2',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b6b6b',
  },
  saveBtn: {
    flex: 1,
    backgroundColor: '#9D64AA',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  saveBtnDisabled: { opacity: 0.7 },
  saveBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  spacing: { height: 24 },
  noChildrenCard: {
    backgroundColor: '#f9f5f2',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#E0DBD4',
  },
  noChildrenText: {
    fontSize: 13,
    color: '#6b6b6b',
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 16,
  },
  addInitialBtn: {
    backgroundColor: '#9D64AA',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  addInitialBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
  childActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  childActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F4EBFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    gap: 5,
  },
  childActionText: {
    color: '#9D64AA',
    fontSize: 12,
    fontWeight: '700',
  },
  childEditBtn: {
    padding: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  subscriptionModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '100%',
    maxWidth: 400,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2d2d2d',
  },
  subInfoBox: {
    alignItems: 'flex-start',
  },
  planBadge: {
    backgroundColor: '#f2ebf7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 12,
  },
  planBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#9D64AA',
    letterSpacing: 1,
  },
  planName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#2d2d2d',
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 20,
  },
  priceValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#9D64AA',
  },
  pricePeriod: {
    fontSize: 14,
    color: '#999',
    marginLeft: 4,
  },
  subMeta: {
    width: '100%',
    backgroundColor: '#f9f8fb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaLabel: {
    fontSize: 12,
    color: '#999',
    fontWeight: '500',
  },
  metaValue: {
    fontSize: 13,
    color: '#2d2d2d',
    fontWeight: '700',
  },
  changePlanBtn: {
    backgroundColor: '#9D64AA',
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  changePlanText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  plansList: {
    maxHeight: 400,
    width: '100%',
  },
  planCard: {
    backgroundColor: '#f9f8fb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: '#eee',
  },
  currentPlanCard: {
    borderColor: '#9D64AA',
    backgroundColor: '#fdfbff',
  },
  planCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  planCardName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2d2d2d',
  },
  currentBadge: {
    backgroundColor: '#9D64AA',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  currentBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  planCardPrice: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  planCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  selectPlanText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9D64AA',
  },
  noSubBox: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  noSubText: {
    fontSize: 15,
    color: '#666',
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 20,
    textAlign: 'center',
  },
  // Sessions Modal Styles
  sessionsModalContainer: {
    width: '95%',
    maxHeight: '85%',
    backgroundColor: '#FFF',
    borderRadius: 25,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 15 },
    shadowRadius: 30,
    elevation: 10,
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
    fontWeight: '500',
  },
  closeModalBtn: {
    padding: 8,
    backgroundColor: '#F5F2F8',
    borderRadius: 20,
  },
  sessionsList: {
    paddingBottom: 20,
  },
  noSessionsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  noSessionsText: {
    color: '#999',
    fontSize: 14,
    marginTop: 15,
    fontWeight: '500',
    textAlign: 'center',
  },
  sessionItem: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
    elevation: 2,
  },
  sessionCancelled: {
    opacity: 0.5,
    backgroundColor: '#F9F9F9',
    borderColor: '#EEE',
  },
  sessionMain: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  sessionTypeIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  sessionInfo: {
    flex: 1,
    paddingRight: 8,
  },
  sessionCategory: {
    fontSize: 10,
    fontWeight: '800',
    color: '#9D64AA',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 2,
  },
  sessionProvider: {
    fontSize: 15,
    fontWeight: '800',
    color: '#2d2d2d',
    marginBottom: 2,
  },
  sessionDateTime: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
    marginBottom: 8,
  },
  statusBadgeRow: {
    flexDirection: 'row',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cancelSessionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#FF4D4F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelSessionText: {
    color: '#FF4D4F',
    fontSize: 11,
    fontWeight: '800',
  },
  sessionNotes: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    flexDirection: 'row',
    alignItems: 'center',
  },
  sessionNotesText: {
    fontSize: 12,
    color: '#777',
    fontStyle: 'italic',
    lineHeight: 18,
    flex: 1,
  },
});

export default ParentProfileScreen;
