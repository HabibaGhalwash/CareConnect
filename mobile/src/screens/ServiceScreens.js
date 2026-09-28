// TherapistScreen.js
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { API_BASE, WEB_BASE } from '../services/api';

export const TherapistScreen = ({ navigation }) => {
  const [therapists, setTherapists] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [showAllTherapists, setShowAllTherapists] = useState(false);

  useEffect(() => {
    fetchTherapists();
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const saved = await AsyncStorage.getItem('parent');
      if (saved) setUserData(JSON.parse(saved));
    } catch (e) {
      console.error('Error loading user:', e);
    }
  };

  const fetchTherapists = async () => {
    try {
      const res = await axios.get(`${API_BASE}/modules/therapist/therapist`);
      const filtered = Array.isArray(res.data) ? res.data.filter(t => t.Status !== 'Rejected') : [];
      setTherapists(filtered);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredTherapists = therapists.filter(t =>
    t.Fullname?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.Specialization?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#9D64AA" />
      </View>
    );
  }

  const handleProfilePress = (item) => {
    navigation.navigate('WebView', {
      url: `${WEB_BASE}/therapist/${item.T_ID}?parentId=${userData?.P_ID}`,
      title: item.Fullname,
    });
  };

  return (
    <ScrollView style={styles.premiumContainer} showsVerticalScrollIndicator={false}>
      {!showAllTherapists && (
        <>
          {/* Hero Section */}
          <View style={styles.premiumHero}>
            <Text style={styles.heroMainTitle}>
              Find the perfect {'\n'}
              <Text style={styles.heroHighlight}>Therapist</Text> for you
            </Text>

            <View style={styles.premiumSearchBox}>
              <TextInput
                style={styles.premiumSearchInput}
                placeholder="Search by name or specialty"
                placeholderTextColor="#9b9b9b"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              <TouchableOpacity style={styles.searchCircleBtn}>
                <Ionicons name="search" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        </>
      )}

      {/* Specialists Carousel */}
      <View style={styles.premiumSection}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.premiumSectionTitle}>
            {showAllTherapists ? 'All Specialists' : 'Our Specialists'}
          </Text>
          <TouchableOpacity onPress={() => setShowAllTherapists(!showAllTherapists)}>
            <Text style={styles.viewAllPremium}>{showAllTherapists ? 'Show Less' : 'View all'}</Text>
          </TouchableOpacity>
        </View>

        {showAllTherapists ? (
          <View style={styles.verticalTeacherList}>
            {filteredTherapists.map((item) => (
              <TouchableOpacity
                key={item.T_ID}
                style={[styles.teacherCarouselCard, styles.teacherVerticalCard]}
                onPress={() => handleProfilePress(item)}
              >
                <Image
                  source={{
                    uri: item.Imagepath
                      ? `${API_BASE}${item.Imagepath}`
                      : `https://i.pravatar.cc/300?u=${item.T_ID}`
                  }}
                  style={styles.teacherCarouselImg}
                />
                <View style={styles.teacherCarouselInfo}>
                  <Text style={styles.teacherCarouselName}>{item.Fullname}</Text>
                  <Text style={styles.teacherCarouselTitle}>{item.Specialization?.toUpperCase()}</Text>
                  <Text style={styles.teacherCarouselExp}>{item.Experience} years experience</Text>
                  <View style={styles.ratingRow}>
                    {[1, 2, 3, 4, 5].map(s => <Ionicons key={s} name="star" size={12} color="#FFD700" />)}
                  </View>
                  <View style={styles.carouselBookBtn}>
                    <Text style={styles.carouselBookBtnText}>Book now</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.specialistCarousel}>
            {filteredTherapists.map((item) => (
              <TouchableOpacity
                key={item.T_ID}
                style={styles.specialistCard}
                onPress={() => handleProfilePress(item)}
              >
                <Image
                  source={{
                    uri: item.Imagepath
                      ? `${API_BASE}${item.Imagepath}`
                      : `https://i.pravatar.cc/300?u=${item.T_ID}`
                  }}
                  style={styles.specialistImg}
                />
                <View style={styles.specialistOverlay}>
                  <Text style={styles.specialistNamePremium}>{item.Fullname}</Text>
                  <Text style={styles.specialistSpecPremium}>{item.Specialization}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      {!showAllTherapists && (
        <>
          {/* Testimonials Section */}
          <View style={styles.premiumSection}>
            <Text style={styles.premiumSectionTitle}>Real Experiences, Real Impact</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.testimonialCarousel}>
              <View style={[styles.testimonialCard, { backgroundColor: '#E3F2FD' }]}>
                <Text style={styles.testimonialText}>"Dr. Mohamed is very patient with the kids and is very intelligent."</Text>
                <Ionicons name="person-circle" size={32} color="#2d2d2d" style={styles.testimonialIcon} />
              </View>
              <View style={[styles.testimonialCard, { backgroundColor: '#F3E5F5' }]}>
                <Text style={styles.testimonialText}>"I would highly appreciate the help Yasmine gave my child today."</Text>
                <Ionicons name="person-circle" size={32} color="#2d2d2d" style={styles.testimonialIcon} />
              </View>
            </ScrollView>
            <View style={styles.paginationDots}>
              <View style={[styles.dot, styles.dotActive]} />
              <View style={styles.dot} />
              <View style={styles.dot} />
              <View style={styles.dot} />
            </View>
          </View>

          {/* How it Works Section */}
          <View style={styles.premiumSection}>
            <Text style={styles.premiumSectionTitle}>How Online Sessions Work</Text>

            <View style={styles.timelineContainer}>
              <View style={styles.timelineItem}>
                <View style={styles.timelineIconBox}>
                  <Ionicons name="log-in-outline" size={24} color="#9D64AA" />
                </View>
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineTitle}>Login</Text>
                  <Text style={styles.timelineSub}>Enter your account and explore the dashboard.</Text>
                </View>
                <View style={styles.timelineConnector} />
              </View>

              <View style={styles.timelineItem}>
                <View style={styles.timelineIconBox}>
                  <Ionicons name="link-outline" size={24} color="#9D64AA" />
                </View>
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineTitle}>Meeting Link</Text>
                  <Text style={styles.timelineSub}>Press on the meeting link provided by your therapist.</Text>
                </View>
                <View style={styles.timelineConnector} />
              </View>

              <View style={styles.timelineItem}>
                <View style={styles.timelineIconBox}>
                  <Ionicons name="videocam-outline" size={24} color="#9D64AA" />
                </View>
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineTitle}>Participate</Text>
                  <Text style={styles.timelineSub}>Engage with the therapist in a secure video session.</Text>
                </View>
              </View>
            </View>
          </View>
        </>
      )}

      {/* Footer Image */}
      <Image
        source={require('../../assets/images/vid.png')}
        style={styles.premiumFooterImg}
        resizeMode="cover"
      />

      <View style={{ height: 100 }} />
    </ScrollView>
  );
};

// ShadowTeacherScreen.js
export const ShadowTeacherScreen = ({ navigation }) => {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAllTeachers, setShowAllTeachers] = useState(false);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    fetchTeachers();
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const saved = await AsyncStorage.getItem('parent');
      if (saved) setUserData(JSON.parse(saved));
    } catch (e) {
      console.error('Error loading user:', e);
    }
  };

  const fetchTeachers = async () => {
    try {
      const res = await axios.get(`${API_BASE}/modules/shadow_teacher/shadow_teacher`);
      const filtered = Array.isArray(res.data) ? res.data.filter(t => t.Status !== 'Rejected') : [];
      setTeachers(filtered);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#9D64AA" />
      </View>
    );
  }

  const handleProfilePress = (item) => {
    const parentId = userData?.P_ID || '';
    navigation.navigate('WebView', {
      url: `${WEB_BASE}/st-profile/${item.ST_ID}?parentId=${parentId}`,
      title: item.Fullname,
    });
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {!showAllTeachers && (
        <>
          {/* Hero Illustration */}
          <View style={styles.heroSection}>
            <Image
              source={require('../../assets/images/bigpic.png')}
              style={styles.heroIllustration}
              resizeMode="contain"
            />
          </View>


          {/* Action Cards */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.actionCardsScroll}>
            <TouchableOpacity style={styles.actionCard}>
              <View style={[styles.cardIconBox, { backgroundColor: '#f3e5f5' }]}>
                <Ionicons name="school-outline" size={20} color="#9D64AA" />
              </View>
              <Text style={styles.cardTitle}>Specializations</Text>
              <Text style={styles.cardSub}>Find qualified teachers</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.actionCard, styles.actionCardActive]}>
              <View style={[styles.cardIconBox, { backgroundColor: '#f3e5f5' }]}>
                <Ionicons name="hand-right-outline" size={20} color="#9D64AA" />
              </View>
              <Text style={[styles.cardTitle, { color: '#9D64AA' }]}>Book Now</Text>
              <Text style={styles.cardSub}>Skills that support every child</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCard}>
              <View style={[styles.cardIconBox, { backgroundColor: '#f3e5f5' }]}>
                <Ionicons name="clipboard-outline" size={20} color="#9D64AA" />
              </View>
              <Text style={styles.cardTitle}>Support</Text>
              <Text style={styles.cardSub}>Customized for every child</Text>
            </TouchableOpacity>
          </ScrollView>
        </>
      )}

      {/* Teachers Section */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitleMain}>
          {showAllTeachers ? 'All Shadow Teachers' : `Personalized support,\nexceptional progress`}
        </Text>
        <TouchableOpacity onPress={() => setShowAllTeachers(!showAllTeachers)}>
          <Text style={styles.seeAllText}>{showAllTeachers ? 'Show Less' : 'See all'}</Text>
        </TouchableOpacity>
      </View>

      {showAllTeachers ? (
        <View style={styles.verticalTeacherList}>
          {teachers.map((item) => (
            <TouchableOpacity
              key={item.ST_ID}
              style={[styles.teacherCarouselCard, styles.teacherVerticalCard]}
              onPress={() => handleProfilePress(item)}
            >
              <Image
                source={{
                  uri: item.Imagepath
                    ? `${API_BASE}${item.Imagepath}`
                    : `https://i.pravatar.cc/150?u=${item.ST_ID}`
                }}
                style={styles.teacherCarouselImg}
              />
              <View style={styles.teacherCarouselInfo}>
                <Text style={styles.teacherCarouselName}>{item.Fullname}</Text>
                <Text style={styles.teacherCarouselTitle}>CERTIFIED SHADOW TEACHER</Text>
                <Text style={styles.teacherCarouselExp}>{item.Experience} years experience</Text>
                <View style={styles.ratingRow}>
                  {[1, 2, 3, 4, 5].map(s => <Ionicons key={s} name="star" size={12} color="#FFD700" />)}
                </View>
                <View style={styles.carouselBookBtn}>
                  <Text style={styles.carouselBookBtnText}>Book now</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.teacherCarousel}>
          {teachers.map((item) => (
            <TouchableOpacity
              key={item.ST_ID}
              style={styles.teacherCarouselCard}
              onPress={() => handleProfilePress(item)}
            >
              <Image
                source={{
                  uri: item.Imagepath
                    ? `${API_BASE}${item.Imagepath}`
                    : `https://i.pravatar.cc/150?u=${item.ST_ID}`
                }}
                style={styles.teacherCarouselImg}
              />
              <View style={styles.teacherCarouselInfo}>
                <Text style={styles.teacherCarouselName}>{item.Fullname}</Text>
                <Text style={styles.teacherCarouselTitle}>CERTIFIED SHADOW TEACHER</Text>
                <Text style={styles.teacherCarouselExp}>{item.Experience} years experience</Text>
                <View style={styles.ratingRow}>
                  {[1, 2, 3, 4, 5].map(s => <Ionicons key={s} name="star" size={12} color="#FFD700" />)}
                </View>
                <View style={styles.carouselBookBtn}>
                  <Text style={styles.carouselBookBtnText}>Book now</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {!showAllTeachers && (
        <>
          {/* Benefits Section */}
          <View style={styles.benefitsSection}>
            <Text style={styles.benefitsTitle}>Benefits of having a shadow teacher</Text>

            <Image
              source={require('../../assets/images/bottom.png')}
              style={styles.benefitsImage}
              resizeMode="cover"
            />

            <View style={styles.benefitsList}>
              {[
                'Helps the child focus',
                'Improves behavior and social skills',
                'Boosts confidence',
                'Encourages full participation',
                'Supports communication with teachers'
              ].map((benefit, index) => (
                <View key={index} style={styles.benefitItem}>
                  <View style={styles.checkCircle}>
                    <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                  </View>
                  <Text style={styles.benefitText}>{benefit}</Text>
                </View>
              ))}
            </View>
          </View>
        </>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

// DonationScreen.js
export const DonationScreen = ({ navigation }) => {
  const [items, setItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    fetchItems();
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const saved = await AsyncStorage.getItem('parent');
      if (saved) setUserData(JSON.parse(saved));
    } catch (e) {
      console.error('Error loading user:', e);
    }
  };

  const fetchItems = async () => {
    try {
      const res = await axios.get(`${API_BASE}/modules/market_place/market_place`);
      const active = Array.isArray(res.data) ? res.data.filter(i => i.Status === 'Active') : [];
      setItems(active);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = items.filter(item =>
    item.Item_Name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderItemCard = ({ item }) => (
    <TouchableOpacity
      style={styles.donationCard}
      onPress={() => navigation.navigate('WebView', {
        url: `${WEB_BASE}/donateditem?id=${item.M_ID}`,
        title: item.Item_Name,
      })}
    >
      {item.Image && (
        <Image
          source={{ uri: `${API_BASE}/images/${item.Image}` }}
          style={styles.donationImage}
        />
      )}
      <View style={styles.donationInfo}>
        <Text style={styles.donationName} numberOfLines={2}>{item.Item_Name}</Text>
        <Text style={styles.donationCond}>Condition: {item.Conditions}</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
      <ActivityIndicator size="large" color="#9D64AA" />
    </View>;
  }

  const handleDonatePress = () => {
    const parentData = userData ? encodeURIComponent(JSON.stringify(userData)) : '';
    navigation.navigate('WebView', {
      url: `${WEB_BASE}/donate-item-form?parentData=${parentData}`,
      title: 'Donate an Item'
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.donationHeader}>
        <Text style={styles.donationTitle}>Donation Marketplace</Text>
        <TouchableOpacity
          style={styles.donateBtn}
          onPress={handleDonatePress}
        >
          <Ionicons name="add-outline" size={18} color="#FFFFFF" />
          <Text style={styles.donateBtnText}>Donate</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={18} color="#9b9b9b" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search items..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#9b9b9b"
        />
      </View>

      <FlatList
        data={filteredItems}
        renderItem={renderItemCard}
        keyExtractor={item => item.M_ID?.toString()}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        scrollEnabled={true}
        style={styles.list}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

// DonateItemFormScreen.js
export const DonateItemFormScreen = ({ navigation }) => {
  const [itemName, setItemName] = useState('');
  const [condition, setCondition] = useState('');
  const [phone, setPhone] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!itemName || !condition || !phone) {
      alert('Please fill all required fields');
      return;
    }

    setLoading(true);
    try {
      const parentData = await AsyncStorage.getItem('parent');
      if (parentData) {
        const parent = JSON.parse(parentData);
        const M_ID = Math.floor(Date.now() / 1000);
        await axios.post(`${API_BASE}/modules/market_place/market_place`, {
          M_ID,
          Item_Name: itemName,
          Description: description,
          Conditions: condition,
          Phone: parseInt(phone.replace(/\D/g, '')),
          Status: 'Pending',
          P_ID: parent.P_ID,
        });
        alert('Donation submitted for review!');
        navigation.goBack();
      }
    } catch (err) {
      alert('Error submitting donation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.formSection}>
        <Text style={styles.formTitle}>Donate an Item</Text>

        <View style={styles.field}>
          <Text style={styles.label}>ITEM NAME *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Wheelchair"
            value={itemName}
            onChangeText={setItemName}
            editable={!loading}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>CONDITION *</Text>
          <View style={styles.conditionOptions}>
            {['Still New', 'Like New', 'Good', 'Fair', 'Needs Repair'].map(c => (
              <TouchableOpacity
                key={c}
                style={[styles.conditionBtn, condition === c && styles.conditionBtnActive]}
                onPress={() => setCondition(c)}
              >
                <Text style={[styles.conditionText, condition === c && styles.conditionTextActive]}>
                  {c}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>PHONE NUMBER *</Text>
          <TextInput
            style={styles.input}
            placeholder="+20 100 000 0000"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            editable={!loading}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>DESCRIPTION</Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            placeholder="Describe the item..."
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            editable={!loading}
          />
        </View>

        <TouchableOpacity
          style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitBtnText}>Submit Donation</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

// SHARED STYLES
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F2EE',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 12,
    marginVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ece8e2',
    paddingHorizontal: 10,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 13,
    color: '#2d2d2d',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  therapistCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 8,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  therapistHeader: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  therapistAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#9D64AA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  therapistDetails: {
    flex: 1,
  },
  therapistName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2d2d2d',
    marginBottom: 2,
  },
  therapistSpec: {
    fontSize: 11,
    color: '#9D64AA',
    fontWeight: '500',
    marginBottom: 2,
  },
  therapistExp: {
    fontSize: 11,
    color: '#6b6b6b',
  },
  bookBtn: {
    backgroundColor: '#9D64AA',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  bookBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  teacherCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginHorizontal: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 1,
  },
  teacherInfo: {
    flex: 1,
  },
  teacherName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2d2d2d',
    marginBottom: 3,
  },
  teacherExp: {
    fontSize: 11,
    color: '#6b6b6b',
    marginBottom: 2,
  },
  teacherStatus: {
    fontSize: 10,
    color: '#9D64AA',
    fontWeight: '500',
  },
  donationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  donationTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2d2d2d',
  },
  donateBtn: {
    backgroundColor: '#9D64AA',
    borderRadius: 8,
    paddingVertical: 7,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  donateBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  donationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    flex: 0.48,
    marginHorizontal: 3,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  donationImage: {
    width: '100%',
    height: 100,
    backgroundColor: '#f2f0ed',
  },
  donationInfo: {
    padding: 8,
  },
  donationName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2d2d2d',
    marginBottom: 3,
  },
  donationCond: {
    fontSize: 10,
    color: '#6b6b6b',
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: 0,
  },
  formSection: {
    padding: 16,
  },
  formTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2d2d2d',
    marginBottom: 16,
  },
  field: {
    marginBottom: 14,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    color: '#616161',
    marginBottom: 5,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: '#f2f0ed',
    borderWidth: 1,
    borderColor: '#ece8e2',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 13,
    color: '#2d2d2d',
  },
  textarea: {
    height: 80,
    textAlignVertical: 'top',
  },
  conditionOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  conditionBtn: {
    backgroundColor: '#f2f0ed',
    borderWidth: 1,
    borderColor: '#ece8e2',
    borderRadius: 8,
    paddingVertical: 7,
    paddingHorizontal: 10,
    flex: 0.45,
    alignItems: 'center',
  },
  conditionBtnActive: {
    backgroundColor: '#9D64AA',
    borderColor: '#9D64AA',
  },
  conditionText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6b6b6b',
  },
  conditionTextActive: {
    color: '#FFFFFF',
  },
  submitBtn: {
    backgroundColor: '#8f4f9d',
    borderRadius: 11,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 14,
  },
  submitBtnDisabled: {
    opacity: 0.7,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  // NEW SHADOW TEACHER STYLES
  heroSection: {
    height: 220,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 20,
  },
  heroIllustration: {
    width: '90%',
    height: '100%',
  },
  actionCardsScroll: {
    paddingLeft: 16,
    marginVertical: 20,
  },
  actionCard: {
    width: 130,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  actionCardActive: {
    borderColor: '#9D64AA',
    borderWidth: 2,
  },
  cardIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2d2d2d',
    marginBottom: 4,
  },
  cardSub: {
    fontSize: 10,
    color: '#9b9b9b',
    lineHeight: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitleMain: {
    fontSize: 20,
    fontWeight: '800',
    color: '#2d2d2d',
    lineHeight: 26,
  },
  seeAllText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9D64AA',
    marginBottom: 4,
  },
  teacherCarousel: {
    paddingLeft: 16,
    marginBottom: 30,
  },
  teacherCarouselCard: {
    flexDirection: 'row',
    backgroundColor: '#e0f2f1',
    borderRadius: 20,
    padding: 12,
    marginRight: 12,
    width: 280,
    alignItems: 'center',
  },
  teacherCarouselImg: {
    width: 90,
    height: 110,
    borderRadius: 15,
    marginRight: 12,
  },
  teacherCarouselInfo: {
    flex: 1,
  },
  teacherCarouselName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2d2d2d',
    marginBottom: 2,
  },
  teacherCarouselTitle: {
    fontSize: 9,
    fontWeight: '700',
    color: '#666',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  teacherCarouselExp: {
    fontSize: 11,
    color: '#666',
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    marginBottom: 8,
    gap: 2,
  },
  carouselBookBtn: {
    backgroundColor: '#cfd8dc',
    borderRadius: 15,
    paddingVertical: 6,
    paddingHorizontal: 16,
    alignSelf: 'flex-start',
  },
  carouselBookBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2d2d2d',
  },
  benefitsSection: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  benefitsTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2d2d2d',
    marginBottom: 16,
  },
  benefitsImage: {
    width: '100%',
    height: 180,
    borderRadius: 20,
    marginBottom: 20,
  },
  benefitsList: {
    gap: 12,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#9D64AA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  benefitText: {
    fontSize: 13,
    color: '#444',
    fontWeight: '500',
  },
  verticalTeacherList: {
    paddingHorizontal: 16,
    gap: 16,
    marginBottom: 30,
  },
  teacherVerticalCard: {
    width: '100%',
    marginRight: 0,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#eee',
    elevation: 3,
    shadowOpacity: 0.1,
  },
  premiumContainer: {
    flex: 1,
    backgroundColor: '#FAF8F6',
  },
  premiumHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
    backgroundColor: '#FFFFFF',
  },
  headerLogo: {
    width: 100,
    height: 40,
  },
  premiumHero: {
    paddingHorizontal: 20,
    paddingVertical: 30,
  },
  heroMainTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#2d2d2d',
    lineHeight: 36,
    marginBottom: 25,
  },
  heroHighlight: {
    color: '#9D64AA',
  },
  premiumSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    paddingLeft: 20,
    paddingRight: 5,
    height: 55,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#eee',
  },
  premiumSearchInput: {
    flex: 1,
    fontSize: 14,
    color: '#2d2d2d',
  },
  searchCircleBtn: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: '#9D64AA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  premiumSection: {
    marginBottom: 35,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  premiumSectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2d2d2d',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  viewAllPremium: {
    fontSize: 13,
    color: '#9D64AA',
    fontWeight: '600',
  },
  specialistCarousel: {
    paddingLeft: 20,
  },
  specialistCard: {
    width: 160,
    height: 220,
    borderRadius: 25,
    marginRight: 15,
    overflow: 'hidden',
    backgroundColor: '#eee',
  },
  specialistImg: {
    width: '100%',
    height: '100%',
  },
  specialistOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 15,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  specialistNamePremium: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  specialistSpecPremium: {
    color: '#FFFFFF',
    fontSize: 10,
    opacity: 0.9,
  },
  testimonialCarousel: {
    paddingLeft: 20,
  },
  testimonialCard: {
    width: 280,
    borderRadius: 25,
    padding: 25,
    marginRight: 15,
    minHeight: 140,
    justifyContent: 'space-between',
  },
  testimonialText: {
    fontSize: 15,
    color: '#2d2d2d',
    lineHeight: 22,
    fontWeight: '500',
  },
  testimonialIcon: {
    alignSelf: 'flex-start',
    marginTop: 15,
  },
  paginationDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E0E0E0',
  },
  dotActive: {
    backgroundColor: '#9D64AA',
    width: 20,
  },
  timelineContainer: {
    paddingHorizontal: 30,
    marginTop: 10,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 30,
  },
  timelineIconBox: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 3,
    zIndex: 2,
  },
  timelineContent: {
    flex: 1,
    marginLeft: 20,
    paddingTop: 5,
  },
  timelineTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2d2d2d',
    marginBottom: 5,
  },
  timelineSub: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  timelineConnector: {
    position: 'absolute',
    left: 24,
    top: 50,
    bottom: -30,
    width: 1,
    backgroundColor: '#E0E0E0',
    zIndex: 1,
    borderStyle: 'dashed',
  },
  premiumFooterImg: {
    width: '90%',
    height: 200,
    borderRadius: 30,
    alignSelf: 'center',
    marginTop: 20,
  },
});
