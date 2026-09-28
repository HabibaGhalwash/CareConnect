import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState, useRef } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { API_BASE, apiService, WEB_BASE } from '../services/api';

const SchoolScreen = ({ navigation }) => {
  const [schools, setSchools] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const flatListRef = useRef(null);

  const ITEMS_PER_PAGE = 3;

  useEffect(() => {
    fetchSchools();
  }, []);

  useEffect(() => {
    if (flatListRef.current) {
      flatListRef.current.scrollToOffset({ offset: 0, animated: true });
    }
  }, [currentPage]);

  const fetchSchools = async () => {
    try {
      const res = await apiService.getSchools();
      setSchools(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Error fetching schools:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredSchools = schools.filter(
    (school) =>
      school.Name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      school.Special_Need_Prog?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredSchools.length / ITEMS_PER_PAGE);
  const startIdx = currentPage * ITEMS_PER_PAGE;
  const paginatedSchools = filteredSchools.slice(startIdx, startIdx + ITEMS_PER_PAGE);

  const renderStars = (rating) => {
    const validRating = Math.min(Math.max(parseInt(rating) || 0, 0), 5);
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Text
            key={star}
            style={[styles.star, star <= validRating ? styles.starFilled : styles.starEmpty]}
          >
            ★
          </Text>
        ))}
        <Text style={styles.ratingText}>({validRating}/5)</Text>
      </View>
    );
  };

  const renderSchoolCard = ({ item }) => (
    <View style={styles.schoolCard}>
      {item.Image && (
        <Image
          source={{ uri: `${API_BASE}/images/${item.Image}` }}
          style={styles.schoolImage}
        />
      )}
      <View style={styles.schoolInfo}>
        <Text style={styles.schoolName}>{item.Name}</Text>
        <Text style={styles.schoolDetail}>🎯 {item.Special_Need_Prog}</Text>
        <Text style={styles.schoolDetail} numberOfLines={2}>
          📍 {item.Address}
        </Text>
        {item.Website_Link && (
          <Text style={styles.schoolLink} numberOfLines={1}>
            🌐 {item.Website_Link}
          </Text>
        )}
        {renderStars(item.Rating)}
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#9D64AA" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={18} color="#9b9b9b" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search schools..."
          value={searchQuery}
          onChangeText={(text) => {
            setSearchQuery(text);
            setCurrentPage(0);
          }}
          placeholderTextColor="#9b9b9b"
        />
      </View>

      {/* Schools List */}
      {filteredSchools.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="search-outline" size={48} color="#ccc" style={styles.emptyIcon} />
          <Text style={styles.emptyText}>No schools found</Text>
          <Text style={styles.emptySubtext}>Try a different search term</Text>
        </View>
      ) : (
        <>
          <FlatList
            ref={flatListRef}
            data={paginatedSchools}
            renderItem={renderSchoolCard}
            keyExtractor={(item) => item.School_ID?.toString()}
            style={styles.list}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />

          {/* Pagination */}
          {totalPages > 1 && (
            <View style={styles.paginationContainer}>
              <TouchableOpacity
                style={[styles.paginationBtn, currentPage === 0 && styles.paginationBtnDisabled]}
                onPress={() => setCurrentPage(Math.max(0, currentPage - 1))}
                disabled={currentPage === 0}
              >
                <Ionicons name="chevron-back" size={20} color="#9D64AA" />
              </TouchableOpacity>

              <Text style={styles.paginationText}>
                {currentPage + 1} / {totalPages}
              </Text>

              <TouchableOpacity
                style={[
                  styles.paginationBtn,
                  currentPage === totalPages - 1 && styles.paginationBtnDisabled,
                ]}
                onPress={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                disabled={currentPage === totalPages - 1}
              >
                <Ionicons name="chevron-forward" size={20} color="#9D64AA" />
              </TouchableOpacity>
            </View>
          )}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F2EE',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F6F2EE',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ece8e2',
    paddingHorizontal: 12,
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
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  schoolCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  schoolImage: {
    width: '100%',
    height: 160,
    backgroundColor: '#f2f0ed',
  },
  schoolInfo: {
    padding: 14,
  },
  schoolName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2d2d2d',
    marginBottom: 8,
  },
  schoolDetail: {
    fontSize: 12,
    color: '#6b6b6b',
    marginBottom: 4,
    lineHeight: 16,
  },
  schoolLink: {
    fontSize: 11,
    color: '#9D64AA',
    marginBottom: 6,
  },
  starsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 2,
  },
  star: {
    fontSize: 14,
    lineHeight: 18,
  },
  starFilled: {
    color: '#fbbf24',
  },
  starEmpty: {
    color: '#d1d5db',
  },
  ratingText: {
    fontSize: 11,
    color: '#6b6b6b',
    marginLeft: 4,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyIcon: {
    marginBottom: 16,
    opacity: 0.3,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d2d2d',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 13,
    color: '#6b6b6b',
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    gap: 12,
    backgroundColor: '#F9F5F2',
  },
  paginationBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ece8e2',
  },
  paginationBtnDisabled: {
    opacity: 0.5,
  },
  paginationText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b6b6b',
    minWidth: 60,
    textAlign: 'center',
  },
});

export default SchoolScreen;
