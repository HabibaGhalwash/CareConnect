import { DeviceEventEmitter } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiService } from '../services/api';

const HomeScreen = ({ navigation }) => {
  const [userData, setUserData] = useState(null);
  const [children, setChildren] = useState([]);
  const [stats, setStats] = useState({ children: 0, sessions: 0, messages: 0 });
  const [loading, setLoading] = useState(true);
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isServicesOpen, setIsServicesOpen] = useState(false);

  useEffect(() => {
    loadUserData();
    const unsubscribe = navigation.addListener('focus', loadUserData);
    return unsubscribe;
  }, [navigation]);

  const loadUserData = async () => {
    try {
      const parentData = await AsyncStorage.getItem('parent');
      if (parentData) {
        const parsed = JSON.parse(parentData);
        setUserData(parsed);

        // Fetch children from backend with fallback
        try {
          console.log('🔄 Fetching children for P_ID:', parsed.P_ID);
          let childrenRes = await apiService.getChildren(parsed.P_ID);
          let childrenData = Array.isArray(childrenRes.data) ? childrenRes.data : [];
          
          // Fallback to search if by-parent returns nothing but we suspect there should be data
          if (childrenData.length === 0) {
            console.log('⚠️ by-parent returned 0, trying search fallback...');
            const fallbackRes = await apiService.get(`/modules/child/search?keyword=P_ID&keyvalue=${parsed.P_ID}`);
            if (Array.isArray(fallbackRes.data) && fallbackRes.data.length > 0) {
              childrenData = fallbackRes.data;
              console.log('✅ Fallback found children:', childrenData.length);
            }
          }

          setChildren(childrenData);
          
          let sessionsCount = 0;
          try {
            console.log('🔄 Fetching bookings for P_ID:', parsed.P_ID);
            const bookingsRes = await apiService.getParentBookings(parsed.P_ID);
            let bookingsData = Array.isArray(bookingsRes.data) ? bookingsRes.data : [];
            
            // If parent-wide search returns 0, try fetching by each child's ID (like the web does)
            if (bookingsData.length === 0 && childrenData.length > 0) {
              console.log('⚠️ Parent-wide bookings returned 0, trying child-by-child fetch...');
              const childBookings = await Promise.all(
                childrenData.map(async (child) => {
                  try {
                    const cid = child.Child_ID || child.child_id || child.id || child.ID;
                    if (!cid) return [];
                    const res = await apiService.getBookingsByChild(cid);
                    return Array.isArray(res.data) ? res.data : [];
                  } catch (e) {
                    return [];
                  }
                })
              );
              bookingsData = childBookings.flat();
              console.log('✅ Child-by-child found bookings:', bookingsData.length);
            }

            const activeSessions = bookingsData.filter(b => {
              const status = (b.Booking_status || b.booking_status || b.status || '').toLowerCase();
              return status !== 'cancelled';
            });
            sessionsCount = activeSessions.length;
          } catch (err) {
            console.warn('Error fetching bookings:', err);
          }

          // Fetch message count
          let messageCount = 0;
          try {
            const messagesRes = await apiService.getCommunityPosts();
            if (Array.isArray(messagesRes.data)) {
              // Filter out admin warnings just like the chat screen does
              const filtered = messagesRes.data.filter(m => !String(m.Content).startsWith('ADMIN_WARNING:'));
              messageCount = filtered.length;
            }
          } catch (err) {
            console.warn('Error fetching message count:', err);
          }

          setStats((prev) => ({
            ...prev,
            children: childrenData.length,
            sessions: sessionsCount,
            messages: messageCount,
          }));
          console.log('📊 Stats updated:', { children: childrenData.length, sessions: sessionsCount, messages: messageCount });
        } catch (err) {
          console.error('Error fetching children/sessions:', err);
        }
      }
    } catch (err) {
      console.error('Error loading user data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMenuPress = (route) => {
    setIsMenuOpen(false);
    if (route === 'Home') return;
    navigation.navigate(route);
  };

  const ServiceCard = ({ icon, title, description, onPress, color }) => (
    <TouchableOpacity style={[styles.serviceCard, { borderLeftColor: color }]} onPress={onPress}>
      <View style={[styles.iconContainer, { backgroundColor: color + '15' }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardDesc}>{description}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#9D64AA" />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#9D64AA" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Custom Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.menuButton} onPress={() => setIsMenuOpen(true)}>
            <Ionicons name="menu" size={28} color="#9D64AA" />
          </TouchableOpacity>
          <View style={styles.logoContainer}>
            <Image
              source={require('../../assets/images/logo.jpeg')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
          <View style={{ width: 28 }} />
        </View>

        <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
      {/* Hero Banner */}
      <View style={styles.heroBanner}>
        <Text style={styles.heroTitle}>Welcome back!</Text>
        {userData?.Full_Name && (
          <Text style={styles.heroSubtitle}>{userData.Full_Name}</Text>
        )}
        <Text style={styles.heroDesc}>Access all services and support tools in one place</Text>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{stats.children}</Text>
          <Text style={styles.statLabel}>Children</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{stats.sessions}</Text>
          <Text style={styles.statLabel}>Sessions</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{stats.messages}</Text>
          <Text style={styles.statLabel}>Messages</Text>
        </View>
      </View>

      {/* Main Services */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Services</Text>
        
        <ServiceCard
          icon="school-outline"
          title="School Directory"
          description="Find schools specializing in special education"
          color="#9D64AA"
          onPress={() => navigation.navigate('School')}
        />
        <ServiceCard
          icon="person-outline"
          title="Shadow Teachers"
          description="Connect with qualified shadow teachers"
          color="#A4D4B4"
          onPress={() => navigation.navigate('ShadowTeacher')}
        />
        <ServiceCard
          icon="medkit-outline"
          title="Therapist Lookup"
          description="Book sessions with certified therapists"
          color="#9D64AA"
          onPress={() => navigation.navigate('Therapist')}
        />
        <ServiceCard
          icon="heart-outline"
          title="Communication Tools"
          description="Help your child express themselves"
          color="#F2A679"
          onPress={() => navigation.navigate('CommunicationTools')}
        />
        <ServiceCard
          icon="people-outline"
          title="Community Center"
          description="Join events and connect with parents"
          color="#A4D4B4"
          onPress={() => navigation.navigate('CommunityCenter')}
        />
        <ServiceCard
          icon="gift-outline"
          title="Donations"
          description="Support families in need"
          color="#F2A679"
          onPress={() => navigation.navigate('Donation')}
        />
      </View>

      <View style={styles.bottomSpacing} />
    </ScrollView>

      {/* Hamburger Menu Modal */}
      <Modal
        visible={isMenuOpen}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setIsMenuOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.menuContainer}>
            {/* Menu Header */}
            <View style={styles.menuHeader}>
              <View style={styles.menuLogoWrapper}>
                <Image
                  source={require('../../assets/images/logo.jpeg')}
                  style={styles.menuLogo}
                  resizeMode="contain"
                />
              </View>
              <TouchableOpacity onPress={() => setIsMenuOpen(false)} style={styles.closeMenuButton}>
                <Ionicons name="close" size={28} color="#666" />
              </TouchableOpacity>
            </View>

            {/* Menu Items */}
            <ScrollView style={styles.menuItemsList}>
              <TouchableOpacity style={styles.menuItemRow} onPress={() => handleMenuPress('HomeMain')}>
                <Ionicons name="home" size={24} color="#9D64AA" />
                <Text style={styles.menuItemText}>Home</Text>
              </TouchableOpacity>
              
              {/* Services Accordion */}
              <TouchableOpacity style={styles.menuItemRowExpanded} onPress={() => setIsServicesOpen(!isServicesOpen)}>
                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                  <Ionicons name="shapes" size={24} color="#9D64AA" />
                  <Text style={styles.menuItemText}>Services</Text>
                </View>
                <Ionicons name={isServicesOpen ? "chevron-up" : "chevron-down"} size={20} color="#666" />
              </TouchableOpacity>

              {isServicesOpen && (
                <View style={styles.subMenuContainer}>
                  <View style={styles.subMenuLine} />
                  <View style={styles.subMenuItems}>
                    <TouchableOpacity style={styles.subMenuItem} onPress={() => handleMenuPress('School')}>
                      <Text style={styles.subMenuItemText}>Schools</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.subMenuItem} onPress={() => handleMenuPress('ShadowTeacher')}>
                      <Text style={styles.subMenuItemText}>Shadow Teacher</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.subMenuItem} onPress={() => handleMenuPress('Therapist')}>
                      <Text style={styles.subMenuItemText}>Therapist</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.subMenuItem} onPress={() => handleMenuPress('Donation')}>
                      <Text style={styles.subMenuItemText}>Donations</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.subMenuItem} onPress={() => handleMenuPress('CommunityMain')}>
                      <Text style={styles.subMenuItemText}>Community Center</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.subMenuItem} onPress={() => handleMenuPress('CommunicationMain')}>
                      <Text style={styles.subMenuItemText}>Communication Tools</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
              
              <TouchableOpacity style={styles.menuItemRow} onPress={() => handleMenuPress('ProfileMain')}>
                <Ionicons name="person" size={24} color="#9D64AA" />
                <Text style={styles.menuItemText}>Profile</Text>
              </TouchableOpacity>
            </ScrollView>

            <View style={styles.menuBottomButtons}>
              <TouchableOpacity style={styles.menuLogInBtn} onPress={async () => {
                await AsyncStorage.multiRemove(['isLoggedIn', 'parent']);
                DeviceEventEmitter.emit('logout');
              }}>
                <Text style={styles.menuLogInText}>Log Out</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F6F2EE',
  },
  container: {
    flex: 1,
    backgroundColor: '#F6F2EE',
  },
  scrollContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 24,
    backgroundColor: '#F6F2EE',
  },
  menuButton: {
    padding: 4,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoImage: {
    height: 40,
    width: 150,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  menuContainer: {
    width: '85%',
    height: '100%',
    backgroundColor: '#F6F2EE',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 40,
    borderTopRightRadius: 30,
    borderBottomRightRadius: 30,
  },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  menuLogoWrapper: {
    flex: 1,
  },
  menuLogo: {
    width: 150,
    height: 40,
  },
  closeMenuButton: {
    padding: 5,
  },
  menuItemsList: {
    flex: 1,
  },
  menuItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  menuItemRowExpanded: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
    marginTop: 10,
    marginBottom: 5,
  },
  menuItemText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#9D64AA',
    marginLeft: 15,
  },
  subMenuContainer: {
    flexDirection: 'row',
    marginLeft: 20,
    marginBottom: 20,
  },
  subMenuLine: {
    width: 1,
    backgroundColor: '#C4A0CC',
    marginRight: 20,
    marginTop: 10,
    marginBottom: 10,
  },
  subMenuItems: {
    flex: 1,
  },
  subMenuItem: {
    paddingVertical: 12,
  },
  subMenuItemText: {
    fontSize: 15,
    color: '#4A4A4A',
    fontWeight: '500',
  },
  menuBottomButtons: {
    marginTop: 20,
  },
  menuLogInBtn: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ece8e2',
  },
  menuLogInText: {
    color: '#2d2d2d',
    fontWeight: '700',
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F6F2EE',
  },
  heroBanner: {
    backgroundColor: '#C4A0CC',
    padding: 24,
    paddingTop: 30,
    paddingBottom: 40,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  heroDesc: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginTop: -25,
    marginBottom: 20,
  },
  statBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    width: '30%',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 4,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: '#9D64AA',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2d2d2d',
    marginBottom: 16,
  },
  serviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2d2d2d',
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 13,
    color: '#666666',
    lineHeight: 18,
  },
  bottomSpacing: {
    height: 30,
  },
});

export default HomeScreen;
