import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API_BASE } from '../../services/api';
import Navbar from '../../components/Navbar/Navbar';
import Footer from '../../components/Footer/Footer';
import PricingPopup from '../../components/PricingPopup/PricingPopup';
import { usePlatformSettings } from '../../context/PlatformSettingsContext';
import "./parentprofile.css";
import "../../components/ChildInfoForm/ChildInfoForm.css";

/* ── Subscription data (replace with API) ─────────── */
const CURRENT_SUBSCRIPTION = {
  planId: 'premium',
  planName: 'Premium Plan',
  priceNumber: 599,
  activeSince: 'January 2025',
  sessionsUsed: 4,
  sessionsTotal: 10,
  nextBilling: 'May 1, 2026',
};

/* ── Plan feature map (for checkout) ─────────────── */
const PLAN_FEATURES = {
  starter: [
    'Unlimited school search and reviews',
    'Unlimited marketplace access',
    'Join community groups',
    '1 free booking per month (therapist OR shadow teacher)',
    'Basic child communication tools',
  ],
  support: [
    'Unlimited school search',
    'Unlimited marketplace',
    '5 free bookings per month (therapists or shadow teachers)',
    'Basic child communication tools',
  ],
  premium: [
    'Unlimited school search',
    'Unlimited marketplace',
    '10 free bookings per month (therapists or shadow teachers)',
    'Basic child communication tools',
  ],
};

const PLAN_PRICES = { starter: 99, support: 299, premium: 599 };
const PLAN_NAMES = { starter: 'Starter Plan', support: 'Support Plan', premium: 'Premium Plan' };

// Helper function to calculate age from DOB
const calculateAge = (dob) => {
  if (!dob) return "";
  const today = new Date();
  const birthDate = new Date(dob);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age > 0 ? `${age} years old` : "Less than 1 year";
};

// Helper function to format date
const formatDate = (dob) => {
  if (!dob) return "";
  const date = new Date(dob);
  return `Born ${date.getFullYear()}`;
};

function ParentProfile() {
  const navigate = useNavigate();

  /* ── Modal states ────────────────────────────── */
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isEditChildModalOpen, setIsEditChildModalOpen] = useState(false);
  const [isAddChildModalOpen, setIsAddChildModalOpen] = useState(false);
  const [editingChildId, setEditingChildId] = useState(null);
  const [showPricingPopup, setShowPricingPopup] = useState(false);
  const [loading, setLoading] = useState(true);
  const [specialNeedsOptions, setSpecialNeedsOptions] = useState([]);

  /* ── Profile data - Load from localStorage or use defaults ────── */
  const getStoredParent = () => {
    try {
      const params = new URLSearchParams(window.location.search);
      const urlPId = params.get('parentId');
      const stored = localStorage.getItem('parent');

      if (urlPId) {
        // If we have a P_ID in URL, we prioritize it (Mobile Bridge)
        if (stored) {
          const p = JSON.parse(stored);
          if (String(p.P_ID) === String(urlPId)) return {
            P_ID: p.P_ID,
            name: p.Full_Name || p.name || "User",
            email: p.Email || p.email || "",
            phone: p.Phone || p.phone || "",
            location: p.Location || p.location || "",
            password: "",
            confirmPassword: ""
          };
        }
        // Fallback to just ID if full data isn't in storage yet (Navbar will fetch it)
        return { P_ID: urlPId, name: "Loading...", email: "", phone: "", location: "", password: "", confirmPassword: "" };
      }

      if (stored) {
        const parent = JSON.parse(stored);
        return {
          P_ID: parent.P_ID,
          name: parent.Full_Name || parent.name || "User",
          email: parent.Email || parent.email || "",
          phone: parent.Phone || parent.phone || "",
          location: parent.Location || parent.location || "",
          password: "",
          confirmPassword: ""
        };
      }
    } catch (e) {
      console.error('Error parsing parent data:', e);
    }
    return {
      P_ID: null,
      name: "User",
      email: "",
      phone: "",
      location: "",
      password: "",
      confirmPassword: ""
    };
  };

  const [profileData, setProfileData] = useState(() => getStoredParent());
  const [editFormData, setEditFormData] = useState(() => getStoredParent());

  /* ── Children - Load from database ────────────────────────────────── */
  const [childrenList, setChildrenList] = useState([]);
  const [childBookings, setChildBookings] = useState({}); // { childId: [bookings] }
  const [showSessionsModal, setShowSessionsModal] = useState(false);
  const [selectedChildForSessions, setSelectedChildForSessions] = useState(null);
  const [sessionToCancel, setSessionToCancel] = useState(null);
  const { settings } = usePlatformSettings();
  const cancellationWindowHours = parseInt(settings?.cancellationWindow) || 24;
  const [editChildFormData, setEditChildFormData] = useState({});
  const [newChildFormData, setNewChildFormData] = useState({
    name: "",
    dob: "",
    gender: "female",
    specialNeeds: [],
    extraDetails: ""
  });

  /* ── Subscription ────────────────────────────── */
  const [subscription, setSubscription] = useState(CURRENT_SUBSCRIPTION);
  const [adminWarnings, setAdminWarnings] = useState([]);  // warnings from admin

  /* ═══ Load special needs options and children from database ═════ */
  useEffect(() => {
    const initProfile = async () => {
      const parent = getStoredParent();
      setProfileData(parent);
      setEditFormData(parent);

      // Fetch special needs options
      axios
        .get(`${API_BASE}/modules/special_need_type/special_need_type`)
        .then((res) => {
          const data = Array.isArray(res.data) ? res.data : [];
          setSpecialNeedsOptions(data);
        })
        .catch((err) => {
          console.error('Error fetching special needs:', err);
          setSpecialNeedsOptions([]);
        });

      // If we have a P_ID but name is "Loading...", it means we just synced from URL
      // Let's wait a bit for Navbar to fetch full info or fetch it ourselves
      if (parent.P_ID) {
        if (parent.name === "Loading...") {
          try {
            const res = await axios.get(`${API_BASE}/modules/parent/search?keyword=P_ID&keyvalue=${parent.P_ID}`);
            if (Array.isArray(res.data) && res.data.length > 0) {
              const fullParent = res.data[0];
              const mapped = {
                P_ID: fullParent.P_ID,
                name: fullParent.Full_Name || "User",
                email: fullParent.Email || "",
                phone: fullParent.Phone || "",
                location: fullParent.Location || "",
                password: "",
                confirmPassword: ""
              };
              setProfileData(mapped);
              setEditFormData(mapped);
            }
          } catch (e) { }
        }
        fetchChildren(parent.P_ID);
      } else {
        setLoading(false);
      }
    };

    initProfile();

    // Listen for storage changes from other tabs/components
    const handleStorageChange = () => {
      const updated = getStoredParent();
      setProfileData(updated);
      setEditFormData(updated);
    };

    // Listen for login event
    const handleLoginEvent = () => {
      const updated = getStoredParent();
      setProfileData(updated);
      setEditFormData(updated);
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('userLogin', handleLoginEvent);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('userLogin', handleLoginEvent);
    };
  }, []);

  /* ═══ Fetch live subscription from DB ══════════════════════════ */
  useEffect(() => {
    const parent = getStoredParent();
    if (!parent.P_ID) return;

    // Step 1: get the parent record to read their current SID
    axios
      .get(`${API_BASE}/modules/parent/parent?id=${parent.P_ID}`)
      .then(async (res) => {
        const p = Array.isArray(res.data) ? res.data[0] : null;
        if (!p || !p.SID) return; // no subscription yet

        // Step 2: get the subscription row for that SID
        const subRes = await axios.get(
          `${API_BASE}/modules/subscription/subscription?id=${p.SID}`
        );
        const sub = Array.isArray(subRes.data) ? subRes.data[0] : null;
        if (!sub) return;

        setSubscription(prev => ({
          ...prev,
          planId: sub.SID,
          planName: sub.Offer_Details,
          priceNumber: Number(sub.Price),
        }));
      })
      .catch((err) => console.error('Failed to fetch subscription:', err));
    // Runs on mount only — component remounts on every navigation so this is sufficient
  }, []);

  /* ── Fetch admin warnings for this parent ───────── */
  useEffect(() => {
    const parent = getStoredParent();
    if (!parent.P_ID) return;
    axios
      .get(`${API_BASE}/modules/community/community`)
      .then(res => {
        const all = Array.isArray(res.data) ? res.data : [];
        const warnings = all
          .filter(m => m.P_ID === parent.P_ID && String(m.Content).startsWith('ADMIN_WARNING:'))
          .map(m => ({
            id: m.C_ID,
            text: String(m.Content).replace('ADMIN_WARNING:', '').trim(),
          }));
        setAdminWarnings(warnings);
      })
      .catch(err => console.error('Failed to fetch admin warnings:', err));
  }, []);



  /* ═══ Fetch children from database ════════════════════════════ */
  const fetchChildren = async (parentId) => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${API_BASE}/modules/child/child/by-parent?P_ID=${parentId}`
      );

      const children = Array.isArray(res.data) ? res.data : [];
      console.log('📦 Fetched children from database:', children);

      // Transform database format to display format
      const formattedChildren = await Promise.all(
        children.map(async (child) => {
          // Fetch special needs for this child
          let specialNeeds = [];
          try {
            const snRes = await axios.get(
              `${API_BASE}/modules/child_sn/child_sn?id=${child.Child_ID}`
            );
            specialNeeds = Array.isArray(snRes.data) ? snRes.data : [];
          } catch (err) {
            console.warn('Error fetching special needs for child:', err.message);
          }

          const tag = specialNeeds.length > 0
            ? specialNeeds[0].Special_Need_Types
            : 'No special needs';

          return {
            id: child.Child_ID,
            initial: (child.Name || 'C').charAt(0).toUpperCase(),
            initialClass: ['purple', 'mint', 'coral', 'gold'][Math.floor(Math.random() * 4)],
            name: child.Name,
            age: calculateAge(child.DOB),
            born: formatDate(child.DOB),
            tag: tag,
            school: "Not assigned yet",
            therapist: "Not assigned yet",
            teacher: "Not assigned yet",
            nextSession: "Not scheduled",
            dob: child.DOB,
            gender: child.Gender,
            extraDetails: child.Extra_Details,
            specialNeeds: specialNeeds.map(s => s.SNT_ID)
          };
        })
      );

      setChildrenList(formattedChildren);
      console.log('✅ Children formatted and loaded:', formattedChildren);

      // Fetch bookings for each child
      const bookingsMap = {};
      const now = new Date();
      await Promise.all(
        formattedChildren.map(async (child) => {
          try {
            const bRes = await axios.get(
              `${API_BASE}/modules/booking/by-child?Child_ID=${child.id}`
            );
            const data = Array.isArray(bRes.data) ? bRes.data : [];
            const updates = [];

            const formattedData = data.map(b => {
              if (!b.Date) return b;
              const sessionDate = new Date(`${b.Date.split('T')[0]}T${b.Start_time || '00:00:00'}`);
              if (b.Booking_status === 'Confirmed' && sessionDate < now) {
                updates.push(b);
                return { ...b, Booking_status: 'Completed' };
              }
              return b;
            });

            bookingsMap[child.id] = formattedData;

            // Dynamically update backend for any past Confirmed sessions
            updates.forEach(async (b) => {
              try {
                await axios.patch(`${API_BASE}/modules/booking/booking-status?id=${b.B_ID}`, {
                  Booking_status: 'Completed'
                });
                console.log(`Auto-completed session ${b.B_ID}`);
              } catch (e) {
                console.error('Failed to auto-complete session', b.B_ID, e);
              }
            });
          } catch (err) {
            console.warn(`No bookings for child ${child.id}:`, err.message);
            bookingsMap[child.id] = [];
          }
        })
      );
      setChildBookings(bookingsMap);
      console.log('✅ Child bookings loaded:', bookingsMap);
    } catch (err) {
      console.error('Error fetching children:', err);
      setChildrenList([]);
    } finally {
      setLoading(false);
    }
  };

  /* ═══ Profile handlers ════════════════════════ */
  const handleEditClick = () => setIsEditModalOpen(true);

  const handleCloseModal = () => {
    setIsEditModalOpen(false);
    setEditFormData(profileData);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    if (editFormData.password !== editFormData.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }
    setProfileData(editFormData);
    setIsEditModalOpen(false);
    alert("Profile updated successfully!");
  };

  /* ═══ Child handlers ══════════════════════════ */
  const handleEditChildClick = (child) => {
    setEditingChildId(child.id);
    setEditChildFormData({ ...child });
    setIsEditChildModalOpen(true);
  };

  const handleCloseChildModal = () => {
    setIsEditChildModalOpen(false);
    setEditingChildId(null);
    setEditChildFormData({});
  };

  const handleChildInputChange = (e) => {
    const { name, value } = e.target;
    setEditChildFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveChildProfile = async (e) => {
    e.preventDefault();

    try {
      console.log('📝 Updating child in database:', editChildFormData);
      console.log('Child ID:', editingChildId);

      // Extract just the date part (YYYY-MM-DD) from DOB
      let dobDate = editChildFormData.dob;
      if (dobDate && dobDate.includes('T')) {
        // If it has timestamp (ISO format), extract just the date
        dobDate = dobDate.split('T')[0];
      }

      // UPDATE child in database (matching backend expectations)
      const updateRes = await axios.put(
        `${API_BASE}/modules/child/child?id=${editingChildId}`,
        {
          Full_Name: editChildFormData.name,
          Gender: editChildFormData.gender,
          Extra_Details: editChildFormData.extraDetails,
          DOB: dobDate,
        },
        { headers: { 'Content-Type': 'application/json' } }
      );

      if (updateRes.data && updateRes.data.Status === 'OK') {
        console.log('✅ Child updated successfully');

        // Update local state
        setChildrenList(prev =>
          prev.map(child => child.id === editingChildId ? editChildFormData : child)
        );

        setIsEditChildModalOpen(false);
        setEditingChildId(null);
        alert('✅ Child profile updated successfully!');
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err) {
      const errorMsg = err.response?.data?.Message || err.message || 'Failed to update child';
      console.error('❌ Error updating child:', errorMsg);
      alert(`❌ Error: ${errorMsg}`);
    }
  };

  const handleOpenAddChildModal = () => {
    setNewChildFormData({
      name: "",
      dob: "",
      gender: "female",
      specialNeeds: [],
      extraDetails: ""
    });
    setIsAddChildModalOpen(true);
  };

  const handleCloseAddChildModal = () => {
    setIsAddChildModalOpen(false);
    setNewChildFormData({
      name: "",
      dob: "",
      gender: "female",
      specialNeeds: [],
      extraDetails: ""
    });
  };

  const handleNewChildInputChange = (e) => {
    const { name, value } = e.target;
    setNewChildFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleToggleSpecialNeed = (sntId) => {
    setNewChildFormData(prev => ({
      ...prev,
      specialNeeds: prev.specialNeeds.includes(sntId)
        ? prev.specialNeeds.filter(id => id !== sntId)
        : [...prev.specialNeeds, sntId]
    }));
  };

  /* ═══ Add child to database ════════════════════ */
  const handleAddChildSubmit = async (e) => {
    e.preventDefault();

    if (!newChildFormData.name.trim()) {
      alert("Please enter child's name!");
      return;
    }

    if (!newChildFormData.dob) {
      alert("Please enter date of birth!");
      return;
    }

    try {
      console.log('➕ Adding child to database:', newChildFormData);

      // STEP 1: Create child in database
      const childRes = await axios.post(
        `${API_BASE}/modules/child/child`,
        {
          Full_Name: newChildFormData.name,
          DOB: newChildFormData.dob,
          Gender: newChildFormData.gender,
          Extra_Details: newChildFormData.extraDetails,
          P_ID: profileData.P_ID,
        },
        { headers: { 'Content-Type': 'application/json' } }
      );

      if (childRes.data && childRes.data.Status === 'OK' && childRes.data.Child_ID) {
        const childId = childRes.data.Child_ID;
        console.log(`✅ Child created with ID: ${childId}`);

        // STEP 2: Link special needs if any
        if (newChildFormData.specialNeeds.length > 0) {
          try {
            await axios.post(
              `${API_BASE}/modules/child_sn/child_sn`,
              {
                Child_ID: childId,
                specialNeeds: newChildFormData.specialNeeds,
              },
              { headers: { 'Content-Type': 'application/json' } }
            );
            console.log('✅ Special needs linked');
          } catch (snErr) {
            console.warn('Special needs linking failed (child still saved):', snErr.message);
          }
        }

        // Refresh children list
        await fetchChildren(profileData.P_ID);
        handleCloseAddChildModal();
        alert("Child added successfully! 🎉");
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err) {
      const errorMsg = err.response?.data?.Message || err.message || 'Failed to add child';
      console.error('❌ Error adding child:', errorMsg);
      alert(`❌ Error: ${errorMsg}`);
    }
  };

  const handleRemoveChild = async (childId, childName) => {
    if (window.confirm(`Are you sure you want to delete ${childName}? This action cannot be undone.`)) {
      try {
        console.log(`🗑️ Deleting child ${childId} from database`);

        // DELETE child from database (using 'id' query param to match backend)
        const deleteRes = await axios.delete(
          `${API_BASE}/modules/child/child?id=${childId}`,
          { headers: { 'Content-Type': 'application/json' } }
        );

        if (deleteRes.data && deleteRes.data.Status === 'OK') {
          console.log('✅ Child deleted successfully from database');

          // Update local state
          setChildrenList(prev => prev.filter(c => c.id !== childId));
          alert(`✅ ${childName} has been removed successfully!`);
        } else {
          throw new Error('Invalid response from server');
        }
      } catch (err) {
        const errorMsg = err.response?.data?.Message || err.message || 'Failed to delete child';
        console.error('❌ Error deleting child:', errorMsg);
        alert(`❌ Error: ${errorMsg}`);
      }
    }
  };

  /* ═══ Subscription handlers ═══════════════════ */
  const handleSubscribe = (planId, planData) => {
    setShowPricingPopup(false);
    navigate('/subscription-checkout', {
      state: {
        planId,
        planName: planData?.name || PLAN_NAMES[planId] || 'Plan',
        planPrice: planData?.price || `EGP ${PLAN_PRICES[planId] || 0}/month`,
        priceNumber: planData?.priceNumber || PLAN_PRICES[planId] || 0,
        features: planData?.features || PLAN_FEATURES[planId] || [],
      }
    });
  };

  /* ═══ Logout ══════════════════════════════════ */
  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userInitials');
    localStorage.removeItem('parent');
    window.dispatchEvent(new Event('userLogout'));
    navigate('/');
  };

  const confirmCancelSession = async () => {
    if (!sessionToCancel) return;
    const b = sessionToCancel;
    try {
      await axios.patch(`${API_BASE}/modules/booking/booking-status?id=${b.B_ID}`, {
        Booking_status: 'Cancelled'
      });

      // Update local UI state
      setChildBookings(prev => {
        const copy = { ...prev };
        if (copy[selectedChildForSessions?.id]) {
          copy[selectedChildForSessions.id] = copy[selectedChildForSessions.id].map(bk =>
            bk.B_ID === b.B_ID ? { ...bk, Booking_status: 'Cancelled' } : bk
          );
        }
        return copy;
      });
      alert('Session cancelled successfully.');
    } catch (err) {
      alert('Failed to cancel session.');
      console.error(err);
    } finally {
      setSessionToCancel(null);
    }
  };

  if (loading) {
    return (
      <div className="parent_profile_page">
        <Navbar />
        <main className="parent_profile_content">
          <p style={{ textAlign: 'center', paddingTop: '50px' }}>Loading...</p>
        </main>
        <Footer />
      </div>
    );
  }
  if (!subscription) {
    return (
      <div>
        <Navbar />
        <p style={{ textAlign: 'center', marginTop: '50px' }}>
          No subscription yet
        </p>
        <Footer />
      </div>
    );
  }

  // Calculate dynamic stats
  const allBookingsArray = Object.values(childBookings).flat();
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const sessionsThisMonth = allBookingsArray.filter(b => {
    if (b.Booking_status === 'Cancelled') return false;
    if (!b.Date) return false;
    const d = new Date(b.Date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  }).length;

  const communityGroupsJoined = profileData?.P_ID ? 1 : 0;

  // Calculate dynamic subscription limits and dates
  const planIdStr = String(subscription?.planId || '').toLowerCase();
  let sessionsTotalLimit = 0;
  if (planIdStr === '1' || planIdStr === 'starter') sessionsTotalLimit = 1;
  else if (planIdStr === '2' || planIdStr === 'support') sessionsTotalLimit = 5;
  else if (planIdStr === '3' || planIdStr === 'premium') sessionsTotalLimit = 10;

  const activeMonthDate = new Date(currentYear, currentMonth, 1);
  const nextBillingDate = new Date(currentYear, currentMonth + 1, 1);

  const activeSinceStr = activeMonthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const nextBillingStr = nextBillingDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <div className="parent_profile_page">
      <Navbar />

      <main className="parent_profile_content">

        {/* ── ADMIN WARNING BANNERS ───────────────── */}
        {adminWarnings.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
            {adminWarnings.map(w => (
              <div key={w.id} style={{
                display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
                background: '#fff0f0', border: '1.5px solid #f5a5a5',
                borderRadius: '12px', padding: '14px 18px',
                gap: '12px', boxShadow: '0 2px 8px rgba(220,53,69,0.08)',
              }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '20px', lineHeight: 1 }}>&#9888;&#65039;</span>
                  <div>
                    <div style={{ fontWeight: 700, color: '#c0392b', fontSize: '13px', marginBottom: '4px', fontFamily: 'Poppins, sans-serif' }}>
                      &#x1F512; Administrator Warning
                    </div>
                    <div style={{ fontSize: '14px', color: '#2d2d2d', fontFamily: 'Poppins, sans-serif', lineHeight: 1.5 }}>
                      {w.text}
                    </div>
                  </div>
                </div>
                <button
                  onClick={async () => {
                    try {
                      await axios.delete(`${API_BASE}/modules/community/community?id=${w.id}`);
                    } catch (err) {
                      console.error('Failed to delete warning:', err);
                    }
                    // Remove from UI regardless of API result
                    setAdminWarnings(prev => prev.filter(x => x.id !== w.id));
                  }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#999', fontSize: '18px', lineHeight: 1, flexShrink: 0 }}
                  aria-label="Dismiss warning"
                >&#10005;</button>
              </div>
            ))}
          </div>
        )}

        {/* ── HERO ─────────────────────────────────── */}
        <section className="parent_profile_hero">
          <div className="parent_profile_hero_left">
            <div className="parent_profile_avatar">
              {(profileData.name || '?').split(' ').map(n => n[0]).join('')}
            </div>
            <div className="parent_profile_info">
              <h1>{profileData.name}</h1>
              <p>{profileData.email} • {profileData.phone}</p>
              <span className="parent_member_badge">CareConnect Member since 2024</span>
            </div>
          </div>

          <div className="profile_actions">
            <button className="edit_profile_btn" onClick={handleEditClick}>Edit Profile</button>
            <button className="logout_btn" onClick={handleLogout}>Logout</button>
          </div>

          {/* ── EDIT PROFILE MODAL ──────────────────── */}
          {isEditModalOpen && (
            <div className="edit_profile_modal_overlay" onClick={handleCloseModal}>
              <div className="edit_profile_modal" onClick={e => e.stopPropagation()}>
                <div className="edit_modal_header">
                  <h2>Edit Profile</h2>
                  <button className="close_modal_btn" onClick={handleCloseModal}>✕</button>
                </div>
                <form className="edit_profile_form" onSubmit={handleSaveProfile}>
                  <div className="form_group">
                    <label>Full Name</label>
                    <input type="text" name="name" value={editFormData.name} onChange={handleInputChange} placeholder="Enter your full name" required />
                  </div>
                  <div className="form_group">
                    <label>Email Address</label>
                    <input type="email" name="email" value={editFormData.email} onChange={handleInputChange} placeholder="Enter your email" required />
                  </div>
                  <div className="form_group">
                    <label>Phone Number</label>
                    <input type="tel" name="phone" value={editFormData.phone} onChange={handleInputChange} placeholder="+20 100 000 0000" />
                  </div>
                  <div className="form_group">
                    <label>New Password</label>
                    <input type="password" name="password" value={editFormData.password} onChange={handleInputChange} placeholder="Leave blank to keep current" />
                  </div>
                  <div className="form_group">
                    <label>Confirm Password</label>
                    <input type="password" name="confirmPassword" value={editFormData.confirmPassword} onChange={handleInputChange} placeholder="Confirm new password" />
                  </div>
                  <div className="modal_actions">
                    <button type="button" className="cancel_btn" onClick={handleCloseModal}>Cancel</button>
                    <button type="submit" className="save_btn">Save Changes</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ── EDIT CHILD MODAL ────────────────────── */}
          {isEditChildModalOpen && (
            <div className="edit_profile_modal_overlay" onClick={handleCloseChildModal}>
              <div className="edit_profile_modal" onClick={e => e.stopPropagation()}>
                <div className="edit_modal_header">
                  <h2 style={{ fontFamily: "'Poppins', sans-serif", fontSize: '22px', fontWeight: 700, color: '#2d2d2d', margin: 0 }}>Edit Child Profile</h2>
                  <button className="close_modal_btn" onClick={handleCloseChildModal}>✕</button>
                </div>
                <form className="cif" onSubmit={handleSaveChildProfile} style={{ marginTop: '14px' }}>
                  <div className="cif__field">
                    <label className="cif__label">CHILD'S NAME</label>
                    <input type="text" name="name" className="cif__input" value={editChildFormData.name || ''} onChange={handleChildInputChange} placeholder="Enter child's name" required />
                  </div>
                  <div className="cif__field">
                    <label className="cif__label">AGE</label>
                    <input type="text" name="age" className="cif__input" value={editChildFormData.age || ''} onChange={handleChildInputChange} placeholder="e.g. 7 years old" />
                  </div>
                  <div className="cif__field">
                    <label className="cif__label">SPECIAL NEED / TAG</label>
                    <input type="text" name="tag" className="cif__input" value={editChildFormData.tag || ''} onChange={handleChildInputChange} placeholder="e.g. Autism Spectrum" />
                  </div>
                  <div className="cif__field">
                    <label className="cif__label">SCHOOL</label>
                    <input type="text" name="school" className="cif__input" value={editChildFormData.school || ''} onChange={handleChildInputChange} placeholder="Enter school name" />
                  </div>
                  <div className="cif__field">
                    <label className="cif__label">THERAPIST</label>
                    <input type="text" name="therapist" className="cif__input" value={editChildFormData.therapist || ''} onChange={handleChildInputChange} placeholder="Enter therapist name" />
                  </div>
                  <div className="cif__field">
                    <label className="cif__label">SHADOW TEACHER</label>
                    <input type="text" name="teacher" className="cif__input" value={editChildFormData.teacher || ''} onChange={handleChildInputChange} placeholder="Enter shadow teacher name" />
                  </div>
                  <div className="cif__field">
                    <label className="cif__label">NEXT SESSION</label>
                    <input type="text" name="nextSession" className="cif__input" value={editChildFormData.nextSession || ''} onChange={handleChildInputChange} placeholder="e.g., Sat, Apr 23 • 3:00 PM" />
                  </div>
                  <div className="cif__field">
                    <label className="cif__label">EXTRA DETAILS</label>
                    <textarea name="extraDetails" className="cif__input cif__textarea" value={editChildFormData.extraDetails || ''} onChange={handleChildInputChange}
                      placeholder="e.g. Sensory sensitivities, loves music..." rows="3"
                    />
                  </div>
                  <div className="modal_actions" style={{ justifyContent: 'center', marginTop: '24px' }}>
                    <button type="button" className="cancel_btn" onClick={handleCloseChildModal}>Cancel</button>
                    <button type="submit" className="save_btn">Save Changes</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ── ADD CHILD MODAL ─────────────────────── */}
          {isAddChildModalOpen && (
            <div className="edit_profile_modal_overlay" onClick={handleCloseAddChildModal}>
              <div className="edit_profile_modal" onClick={e => e.stopPropagation()}>
                <div className="edit_modal_header">
                  <h2 style={{ fontFamily: "'Poppins', sans-serif", fontSize: '22px', fontWeight: 700, color: '#2d2d2d', margin: 0 }}>Add New Child</h2>
                  <button className="close_modal_btn" onClick={handleCloseAddChildModal}>✕</button>
                </div>
                <form className="cif" onSubmit={handleAddChildSubmit} style={{ marginTop: '14px' }}>
                  <div className="cif__field">
                    <label className="cif__label">CHILD'S NAME *</label>
                    <input type="text" name="name" className="cif__input" value={newChildFormData.name || ''} onChange={handleNewChildInputChange} placeholder="Enter name" required />
                  </div>
                  <div className="cif__field">
                    <label className="cif__label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>DATE OF BIRTH *</span>
                      <span style={{ textTransform: 'none', color: '#999', fontWeight: 'normal', letterSpacing: 'normal' }}>(Type directly or use calendar)</span>
                    </label>
                    <input
                      type="date"
                      name="dob"
                      className="cif__input"
                      value={newChildFormData.dob || ''}
                      onChange={handleNewChildInputChange}
                      max={new Date().toISOString().split("T")[0]}
                      required
                    />
                  </div>
                  <div className="cif__field">
                    <label className="cif__label">GENDER</label>
                    <div className="cif__radio-row">
                      <label className="cif__radio-label">
                        <input type="radio" name="gender" value="female" checked={newChildFormData.gender === 'female'} onChange={handleNewChildInputChange} className="cif__radio-input" />
                        <span className={`cif__radio-circle ${newChildFormData.gender !== 'female' ? 'cif__radio-circle--empty' : ''}`}>
                          {newChildFormData.gender === 'female' && <span className="cif__radio-dot" />}
                        </span>
                        <span className="cif__radio-text">FEMALE</span>
                      </label>
                      <label className="cif__radio-label">
                        <input type="radio" name="gender" value="male" checked={newChildFormData.gender === 'male'} onChange={handleNewChildInputChange} className="cif__radio-input" />
                        <span className={`cif__radio-circle ${newChildFormData.gender !== 'male' ? 'cif__radio-circle--empty' : ''}`}>
                          {newChildFormData.gender === 'male' && <span className="cif__radio-dot" />}
                        </span>
                        <span className="cif__radio-text">MALE</span>
                      </label>
                    </div>
                  </div>
                  <div className="cif__field">
                    <label className="cif__label">SPECIAL NEEDS</label>
                    <div className="cif__checkbox-group">
                      {Array.isArray(specialNeedsOptions) && specialNeedsOptions.map((s) => (
                        <label key={s.SNT_ID} className="cif__checkbox-label">
                          <input
                            type="checkbox"
                            className="cif__checkbox-input"
                            checked={newChildFormData.specialNeeds.includes(s.SNT_ID)}
                            onChange={() => handleToggleSpecialNeed(s.SNT_ID)}
                          />
                          <span className="cif__checkbox-box" />
                          {typeof s.Special_Need_Types === 'string' ? s.Special_Need_Types.toUpperCase() : ''}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="cif__field">
                    <label className="cif__label">EXTRA DETAILS</label>
                    <textarea name="extraDetails" className="cif__input cif__textarea" value={newChildFormData.extraDetails || ''} onChange={handleNewChildInputChange}
                      placeholder="e.g. Sensory sensitivities, loves music..." rows="3"
                    />
                  </div>
                  <div className="modal_actions" style={{ justifyContent: 'center', marginTop: '24px' }}>
                    <button type="button" className="cancel_btn" onClick={handleCloseAddChildModal}>Cancel</button>
                    <button type="submit" className="save_btn">Add Child</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          <div className="hero_blur hero_blur_one" />
          <div className="hero_blur hero_blur_two" />
        </section>

        {/* ── STATS ────────────────────────────────── */}
        <section className="parent_stats_grid">
          <div className="parent_stat_card">
            <h3>CHILDREN</h3>
            <div className="parent_stat_number">{childrenList.length}</div>
            <p>Profiles added</p>
          </div>
          <div className="parent_stat_card">
            <h3>SESSIONS</h3>
            <div className="parent_stat_number">{sessionsThisMonth}</div>
            <p>This month</p>
          </div>
          <div className="parent_stat_card">
            <h3>COMMUNITY</h3>
            <div className="parent_stat_number">{communityGroupsJoined}</div>
            <p>Groups joined</p>
          </div>
        </section>


        {/* ════════════════════════════════════════════
            SUBSCRIPTION SECTION
        ════════════════════════════════════════════ */}

        <section className="sub_section">
          <h2 className="sub_section__title">Subscription</h2>

          <div className="sub_card">
            {/* Top row — badge + price */}
            <div className="sub_card__top">
              <span className="sub_card__badge">CURRENT PLAN</span>
              <div className="sub_card__price-wrap">
                <span className="sub_card__price-num">{subscription.priceNumber}</span>
                <span className="sub_card__price-unit">EGP/month</span>
              </div>
            </div>

            {/* Plan name + active date */}
            <div className="sub_card__plan-name">{subscription.planName}</div>
            <div className="sub_card__active">Active since {activeSinceStr}</div>

            {/* Mid row — sessions used + next billing */}
            <div className="sub_card__meta-row">
              <div className="sub_card__meta-item">
                <span className="sub_card__meta-label">SESSIONS USED</span>
                <span className="sub_card__meta-value">
                  {sessionsThisMonth} / {sessionsTotalLimit}
                </span>
              </div>
              <div className="sub_card__meta-item">
                <span className="sub_card__meta-label">NEXT BILLING</span>
                <span className="sub_card__meta-value sub_card__meta-value--large">
                  {nextBillingStr}
                </span>
              </div>
            </div>

            {/* Change Plan button */}
            <button
              className="sub_card__change-btn"
              onClick={() => setShowPricingPopup(true)}
            >
              Change Plan
            </button>
          </div>
        </section>

        {/* ── CHILDREN ─────────────────────────────── */}
        <section className="parent_children_section">
          <div className="parent_children_header">
            <h2>My Children</h2>
            <button className="add_child_top_btn" onClick={handleOpenAddChildModal}>+ Add Child</button>
          </div>

          <div className="parent_children_grid">
            {childrenList.length > 0 ? (
              childrenList.map((child) => (
                <div className="child_profile_card" key={child.id}>
                  <div className="child_card_top">
                    <div className={`child_initial ${child.initialClass}`}>{child.initial}</div>
                    <div className="child_main_info">
                      <div className="child_name_row">
                        <h3>{child.name}</h3>
                        <span className="child_tag">{child.tag}</span>
                      </div>
                      <p>{child.age}</p>
                      <p>{child.born}</p>
                    </div>
                  </div>

                  <div className="child_details">
                    <div className="child_detail_row">
                      <span>THERAPIST</span>
                      <strong>
                        {(() => {
                          const bookings = (childBookings[child.id] || []).filter(b => b.Booking_status !== 'Cancelled');
                          const therapy = bookings.find(b => b.T_ID);
                          return therapy?.therapist_name || 'Not assigned yet';
                        })()}
                      </strong>
                    </div>
                    <div className="child_detail_row">
                      <span>SHADOW TEACHER</span>
                      <strong>
                        {(() => {
                          const bookings = (childBookings[child.id] || []).filter(b => b.Booking_status !== 'Cancelled');
                          const st = bookings.find(b => b.ST_ID);
                          return st?.shadow_teacher_name || 'Not assigned yet';
                        })()}
                      </strong>
                    </div>
                    <div className="child_detail_row">
                      <span>NEXT SESSION</span>
                      <strong className="session_text">
                        {(() => {
                          const bookings = (childBookings[child.id] || []).filter(b => b.Booking_status !== 'Cancelled');
                          const upcoming = [...bookings]
                            .filter(b => {
                              if (!b.Date) return false;
                              const sessionDate = new Date(`${b.Date.split('T')[0]}T${b.Start_time || '00:00:00'}`);
                              return sessionDate >= new Date();
                            })
                            .sort((a, b) => {
                              const dateA = new Date(`${a.Date.split('T')[0]}T${a.Start_time || '00:00:00'}`);
                              const dateB = new Date(`${b.Date.split('T')[0]}T${b.Start_time || '00:00:00'}`);
                              return dateA - dateB;
                            })[0];

                          if (!upcoming) return 'Not scheduled';
                          const d = new Date(upcoming.Date);
                          const dateStr = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                          const timeStr = upcoming.Start_time
                            ? upcoming.Start_time.substring(0, 5)
                            : '';
                          const label = upcoming.T_ID ? '🦹 Therapy' : '👨‍🏫 Shadow';
                          return `${label} • ${dateStr}${timeStr ? ' • ' + timeStr : ''}`;
                        })()}
                      </strong>
                    </div>
                    {/* Sessions count badge */}
                    {(() => {
                      const validBookings = (childBookings[child.id] || []).filter(b => b.Booking_status !== 'Cancelled');
                      if (validBookings.length === 0) return null;
                      return (
                        <div className="child_detail_row">
                          <span>TOTAL SESSIONS</span>
                          <strong style={{ color: '#9D64AA' }}>
                            {validBookings.length} booked
                          </strong>
                        </div>
                      );
                    })()}
                  </div>

                  <div className="child_card_actions">
                    <button onClick={() => handleEditChildClick(child)}>Edit Info</button>
                    <button
                      onClick={() => {
                        setSelectedChildForSessions(child);
                        setShowSessionsModal(true);
                      }}
                    >
                      Sessions
                    </button>
                    <button onClick={() => handleRemoveChild(child.id, child.name)} className="remove_btn">Remove</button>
                  </div>
                </div>
              ))
            ) : (
              <div className="add_child_card" onClick={handleOpenAddChildModal} style={{ cursor: 'pointer', gridColumn: '1/-1', textAlign: 'center' }}>
                <div className="add_child_circle">+</div>
                <h3>No Children Added Yet</h3>
                <p>Click to add your first child profile</p>
              </div>
            )}

            {childrenList.length > 0 && (
              <div className="add_child_card" onClick={handleOpenAddChildModal} style={{ cursor: 'pointer' }}>
                <div className="add_child_circle">+</div>
                <h3>Add Another Child</h3>
                <p>Create a new profile and connect them to schools, therapists & more</p>
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />

      {/* ── PRICING POPUP ─────────────────────────── */}
      {showPricingPopup && (
        <PricingPopup
          onClose={() => setShowPricingPopup(false)}
          onSubscribe={handleSubscribe}
        />
      )}

      {/* ── SESSIONS MODAL ────────────────────────── */}
      {showSessionsModal && selectedChildForSessions && (() => {
        const allBookings = (childBookings[selectedChildForSessions.id] || []).filter(b => b.Booking_status !== 'Cancelled');
        const today = new Date(new Date().toDateString());
        const upcoming = allBookings.filter(b => b.Date && new Date(b.Date) >= today);
        const past = allBookings.filter(b => b.Date && new Date(b.Date) < today);

        const SessionRow = ({ b }) => {
          const d = new Date(b.Date);
          const dateStr = d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
          const timeStr = b.Start_time ? b.Start_time.substring(0, 5) : '--:--';
          const endStr = b.End_time ? b.End_time.substring(0, 5) : '';
          const provider = b.therapist_name || b.shadow_teacher_name || 'Unknown';
          const isTherapy = !!b.T_ID;

          const sessionDateTime = new Date(`${b.Date.split('T')[0]}T${b.Start_time || '00:00:00'}`);
          const now = new Date();
          const hoursDifference = (sessionDateTime - now) / (1000 * 60 * 60);
          const isCancelled = b.Booking_status === 'Cancelled';
          const canCancel = hoursDifference >= cancellationWindowHours && !isCancelled && sessionDateTime > now;

          return (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '14px',
              padding: '14px 0', borderBottom: '1px solid #f0edf5'
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: '50%',
                background: isTherapy ? 'linear-gradient(135deg,#9D64AA,#c79ecc)' : 'linear-gradient(135deg,#6ab0c8,#a8d8ea)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20, flexShrink: 0
              }}>
                {isTherapy ? '🩺' : '👨‍🏫'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: '#2d2d2d', fontFamily: 'Poppins,sans-serif' }}>
                  {isTherapy ? 'Therapy Session' : 'Shadow Teaching'}
                </div>
                <div style={{ fontSize: 13, color: '#666', fontFamily: 'Poppins,sans-serif', marginTop: 2 }}>
                  {provider}
                </div>
                <div style={{ fontSize: 12, color: '#999', fontFamily: 'Poppins,sans-serif', marginTop: 2 }}>
                  {dateStr} &bull; {timeStr}{endStr ? ` – ${endStr}` : ''}
                </div>
                {b.Notes && (
                  <div style={{
                    marginTop: 8, padding: '8px 12px', background: '#f8f4fc',
                    borderLeft: '3px solid #9D64AA', borderRadius: '0 8px 8px 0',
                    fontSize: 12, color: '#555', fontFamily: 'Poppins,sans-serif',
                    fontStyle: 'italic', lineHeight: 1.5
                  }}>
                    📝 {b.Notes}
                  </div>
                )}
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{
                  display: 'inline-block', padding: '3px 10px', borderRadius: 20,
                  fontSize: 11, fontWeight: 700, fontFamily: 'Poppins,sans-serif',
                  background: b.Booking_status === 'Confirmed' ? '#e8f5e9' : '#fff3e0',
                  color: b.Booking_status === 'Confirmed' ? '#2e7d32' : '#e65100'
                }}>
                  {b.Booking_status || 'Confirmed'}
                </div>
                {b.Session_price && (
                  <div style={{ fontSize: 12, color: '#9D64AA', fontWeight: 700, marginTop: 4, fontFamily: 'Poppins,sans-serif' }}>
                    EGP {b.Session_price}
                  </div>
                )}
                {canCancel && (
                  <button
                    onClick={() => setSessionToCancel(b)}
                    style={{
                      marginTop: 8, padding: '4px 10px', background: 'transparent',
                      border: '1px solid #ff4d4f', color: '#ff4d4f', borderRadius: 4,
                      fontSize: 11, cursor: 'pointer', fontFamily: 'Poppins,sans-serif',
                      transition: 'all 0.2s', width: '100%'
                    }}
                    onMouseOver={e => { e.target.style.background = '#ff4d4f'; e.target.style.color = '#fff'; }}
                    onMouseOut={e => { e.target.style.background = 'transparent'; e.target.style.color = '#ff4d4f'; }}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          );
        };

        return (
          <div
            onClick={() => setShowSessionsModal(false)}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
              backdropFilter: 'blur(4px)', zIndex: 1000,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '20px'
            }}
          >
            <div
              onClick={e => e.stopPropagation()}
              style={{
                background: '#fff', borderRadius: 20, padding: '32px',
                width: '100%', maxWidth: 560, maxHeight: '80vh',
                overflowY: 'auto', boxShadow: '0 24px 80px rgba(157,100,170,0.25)',
                fontFamily: 'Poppins,sans-serif'
              }}
            >
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#2d2d2d' }}>
                    {selectedChildForSessions.name}&apos;s Sessions
                  </h2>
                  <p style={{ margin: '4px 0 0', fontSize: 13, color: '#999' }}>
                    {allBookings.length} total &bull; {upcoming.length} upcoming
                  </p>
                </div>
                <button
                  onClick={() => setShowSessionsModal(false)}
                  style={{
                    background: '#f5f2f8', border: 'none', borderRadius: '50%',
                    width: 36, height: 36, cursor: 'pointer', fontSize: 16,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#666', fontWeight: 700
                  }}
                >✕</button>
              </div>

              {allBookings.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#bbb' }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>📅</div>
                  <p style={{ fontSize: 15, fontWeight: 600 }}>No sessions booked yet</p>
                  <p style={{ fontSize: 13 }}>Book a session from a therapist or shadow teacher profile</p>
                </div>
              ) : (
                <>
                  {upcoming.length > 0 && (
                    <>
                      <div style={{
                        fontSize: 11, fontWeight: 800, letterSpacing: '0.08em',
                        color: '#9D64AA', textTransform: 'uppercase', marginBottom: 8
                      }}>Upcoming</div>
                      {upcoming.map(b => <SessionRow key={b.B_ID} b={b} />)}
                    </>
                  )}

                  {past.length > 0 && (
                    <>
                      <div style={{
                        fontSize: 11, fontWeight: 800, letterSpacing: '0.08em',
                        color: '#aaa', textTransform: 'uppercase',
                        marginTop: upcoming.length > 0 ? 24 : 0, marginBottom: 8
                      }}>Past</div>
                      {past.map(b => (
                        <div key={b.B_ID} style={{ opacity: 0.6 }}>
                          <SessionRow b={b} />
                        </div>
                      ))}
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        );
      })()}
      {/* ── CANCEL CONFIRMATION MODAL ───────────────── */}
      {sessionToCancel && (
        <div
          onClick={() => setSessionToCancel(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(4px)', zIndex: 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '20px'
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#fff', borderRadius: 20, padding: '32px',
              width: '100%', maxWidth: 400, textAlign: 'center',
              boxShadow: '0 24px 80px rgba(0,0,0,0.2)',
              fontFamily: 'Poppins,sans-serif'
            }}
          >
            <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
            <h2 style={{ margin: '0 0 12px', fontSize: 20, fontWeight: 800, color: '#2d2d2d' }}>Cancel Session?</h2>
            <p style={{ margin: '0 0 24px', fontSize: 14, color: '#666', lineHeight: 1.5 }}>
              Are you sure you want to cancel this session? You can only cancel if it's more than {cancellationWindowHours} hours away.
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => setSessionToCancel(null)}
                style={{
                  flex: 1, padding: '12px', background: '#f5f2f8', color: '#666',
                  border: 'none', borderRadius: 12, fontWeight: 700, cursor: 'pointer',
                  fontSize: 14, transition: 'background 0.2s'
                }}
                onMouseOver={e => e.target.style.background = '#e5e2e8'}
                onMouseOut={e => e.target.style.background = '#f5f2f8'}
              >
                No, Keep It
              </button>
              <button
                onClick={confirmCancelSession}
                style={{
                  flex: 1, padding: '12px', background: '#ff4d4f', color: '#fff',
                  border: 'none', borderRadius: 12, fontWeight: 700, cursor: 'pointer',
                  fontSize: 14, transition: 'background 0.2s'
                }}
                onMouseOver={e => e.target.style.background = '#d9363e'}
                onMouseOut={e => e.target.style.background = '#ff4d4f'}
              >
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParentProfile;
