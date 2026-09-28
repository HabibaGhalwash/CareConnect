import { Ionicons } from '@expo/vector-icons';
import React, { useState, useEffect } from 'react';
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Modal,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import { API_BASE } from '../services/api';

const LandingScreen = ({ navigation }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isServicesOpen, setIsServicesOpen] = useState(false);
  const [isPricingOpen, setIsPricingOpen] = useState(false);
  
  const [plans, setPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [fetchError, setFetchError] = useState('');

  const fetchPlans = () => {
    setLoadingPlans(true);
    setFetchError('');
    const TIER_FEATURES = [
      [
        'Unlimited school search and reviews',
        'Unlimited marketplace access',
        'Join community groups',
        '1 free booking per month',
        'Basic child communication tools',
      ],
      [
        'Unlimited school search',
        'Unlimited marketplace',
        '5 free bookings per month',
        'Basic child communication tools',
        'Priority support',
      ],
      [
        'Unlimited school search',
        'Unlimited marketplace',
        '10 free bookings per month',
        'Advanced communication tools',
        'Priority support + dedicated manager',
      ],
    ];
    const TIER_FEATURED = [false, true, false];

    axios
      .get(`${API_BASE}/modules/subscription/subscription`, { timeout: 10000 })
      .then((res) => {
        const raw = Array.isArray(res.data) ? res.data : [];
        setPlans(
          raw.map((p, i) => ({
            id: p.SID,
            name: p.Offer_Details,
            price: `EGP ${p.Price}/month`,
            priceNumber: Number(p.Price),
            featured: TIER_FEATURED[i] ?? false,
            features: TIER_FEATURES[i] ?? TIER_FEATURES[0]
          }))
        );
      })
      .catch((err) => {
        console.error('Failed to fetch subscription plans:', err.message);
        setFetchError(err.message || 'Network Error');
        setPlans([]);
      })
      .finally(() => setLoadingPlans(false));
  };

  // Fetch subscription plans when pricing opens
  useEffect(() => {
    if (isPricingOpen && plans.length === 0) {
      fetchPlans();
    }
  }, [isPricingOpen]);

  const handleMenuPress = (item) => {
    // If it's a service or "About Us", we show pricing
    if (item !== 'Home' && item !== 'SignUp' && item !== 'LogIn') {
      setIsPricingOpen(true);
      setIsMenuOpen(false);
    } else {
      setIsMenuOpen(false);
      // Navigate or handle other items
      if (item === 'SignUp') navigation.navigate('Signup');
      if (item === 'LogIn') navigation.navigate('Login');
    }
  };

  const handleSubscribe = (plan) => {
    setIsPricingOpen(false);
    navigation.navigate('Signup', { SID: plan.id }); // Taking to signup with SID
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
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

        {/* Image / Illustration Area */}
        <View style={styles.imageContainer}>
          <Image
            source={require('../../assets/images/land.png')}
            style={styles.mainImage}
            resizeMode="contain"
          />
        </View>

        {/* Text Content */}
        <View style={styles.textContent}>
          <Text style={styles.title}>Empowering Your{'\n'}Child's Journey</Text>
          <Text style={styles.subtitle}>
            Discover trusted schools, specialized{'\n'}therapy, and a supportive community
          </Text>
        </View>

        {/* Buttons */}
        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigation.navigate('Signup')}
          >
            <Text style={styles.primaryButtonText}>Let's Get Started</Text>
          </TouchableOpacity>
          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLink}>Log in</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

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
              <TouchableOpacity style={styles.menuItemRow} onPress={() => handleMenuPress('Home')}>
                <Ionicons name="home" size={24} color="#9D64AA" />
                <Text style={styles.menuItemText}>Home</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.menuItemRow} onPress={() => handleMenuPress('AboutUs')}>
                <Ionicons name="information-circle" size={24} color="#9D64AA" />
                <Text style={styles.menuItemText}>About Us</Text>
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
                    {['Schools', 'Shadow Teacher', 'Therapist', 'Donations', 'Community Center', 'Communication Tools'].map((service) => (
                      <TouchableOpacity key={service} style={styles.subMenuItem} onPress={() => handleMenuPress(service)}>
                        <Text style={styles.subMenuItemText}>{service}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            </ScrollView>

            {/* Menu Buttons Bottom */}
            <View style={styles.menuBottomButtons}>
              <TouchableOpacity style={styles.menuSignUpBtn} onPress={() => handleMenuPress('SignUp')}>
                <Text style={styles.menuSignUpText}>Sign Up</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.menuLogInBtn} onPress={() => handleMenuPress('LogIn')}>
                <Text style={styles.menuLogInText}>Log In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Pricing Popup Modal */}
      <Modal
        visible={isPricingOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsPricingOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.pricingContainer}>
            <TouchableOpacity onPress={() => setIsPricingOpen(false)} style={styles.closePricingButton}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
            
            <Text style={styles.pricingTitle}>Choose Your Plan</Text>
            <Text style={styles.pricingSubtitle}>Unlock Endless possibilities</Text>

            {loadingPlans ? (
              <ActivityIndicator size="large" color="#9D64AA" style={{marginTop: 40}} />
            ) : plans.length === 0 ? (
              <View style={{alignItems: 'center', marginTop: 40}}>
                <Text style={{color: '#e05555', marginBottom: 5}}>Could not load plans.</Text>
                <Text style={{color: '#666', fontSize: 12, marginBottom: 15, textAlign: 'center'}}>Error: {fetchError}</Text>
                <Text style={{color: '#666', fontSize: 11, marginBottom: 15, textAlign: 'center'}}>Trying to reach: {API_BASE}</Text>
                <TouchableOpacity style={{padding: 10, backgroundColor: '#9D64AA', borderRadius: 8}} onPress={fetchPlans}>
                  <Text style={{color: '#FFF', fontWeight: '600'}}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{paddingBottom: 20}}>
                {plans.map((plan) => (
                  <View key={plan.id} style={[styles.pricingCard, plan.featured && styles.pricingCardFeatured]}>
                    <Text style={styles.planName}>{plan.name}</Text>
                    <Text style={styles.planPrice}>{plan.price}</Text>
                    <View style={styles.featuresList}>
                      {plan.features.map((feature, i) => (
                        <View key={i} style={styles.featureRow}>
                          <Ionicons name="checkmark" size={16} color="#A4D4B4" style={{marginRight: 8}} />
                          <Text style={styles.featureText}>{feature}</Text>
                        </View>
                      ))}
                    </View>
                    <TouchableOpacity style={styles.subscribeBtn} onPress={() => handleSubscribe(plan)}>
                      <Text style={styles.subscribeBtnText}>Subscribe</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            )}

            <View style={styles.pricingLoginNudge}>
              <Text style={styles.nudgeText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => { setIsPricingOpen(false); navigation.navigate('Login'); }}>
                <Text style={styles.nudgeLink}>Log in</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F6F2EE', // Matching the beige background
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 30,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    marginTop: 10,
  },
  menuButton: {
    padding: 4,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoImage: {
    height: 60,
    width: 220,
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 30,
    width: '100%',
  },
  mainImage: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
    overflow: 'hidden',
  },
  textContent: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#9D64AA', // Purple color
    textAlign: 'center',
    lineHeight: 36,
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 14,
    color: '#4A4A4A',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 10,
  },
  actionContainer: {
    width: '100%',
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#A4D4B4', // Mint green color
    width: '100%',
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    marginBottom: 20,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  loginContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginText: {
    fontSize: 14,
    color: '#2d2d2d',
    fontWeight: '600',
  },
  loginLink: {
    fontSize: 14,
    color: '#9D64AA',
    fontWeight: '700',
  },
  
  // Modal Overlays
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'flex-start', // For left menu
  },

  // Side Menu Styles
  menuContainer: {
    width: '85%',
    height: '100%',
    backgroundColor: '#F6F2EE', // Match theme beige
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
  menuSignUpBtn: {
    backgroundColor: '#9D64AA',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  menuSignUpText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
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

  // Pricing Modal Styles
  pricingContainer: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: '#FFFFFF',
    alignSelf: 'center',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 20,
    elevation: 10,
  },
  closePricingButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    padding: 5,
    zIndex: 10,
  },
  pricingTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#2d2d2d',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 5,
  },
  pricingSubtitle: {
    fontSize: 14,
    color: '#9D64AA',
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 24,
  },
  pricingCard: {
    backgroundColor: '#F9F9F9',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  pricingCardFeatured: {
    borderColor: '#9D64AA',
    borderWidth: 2,
    backgroundColor: '#FFFFFF',
    shadowColor: '#9D64AA',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 3,
  },
  planName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2d2d2d',
    marginBottom: 8,
  },
  planPrice: {
    fontSize: 22,
    fontWeight: '800',
    color: '#9D64AA',
    marginBottom: 16,
  },
  featuresList: {
    marginBottom: 20,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureText: {
    fontSize: 13,
    color: '#4A4A4A',
    flex: 1,
  },
  subscribeBtn: {
    backgroundColor: '#9D64AA',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  subscribeBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  pricingLoginNudge: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
  },
  nudgeText: {
    fontSize: 13,
    color: '#666',
  },
  nudgeLink: {
    fontSize: 13,
    color: '#9D64AA',
    fontWeight: '700',
  }
});

export default LandingScreen;
