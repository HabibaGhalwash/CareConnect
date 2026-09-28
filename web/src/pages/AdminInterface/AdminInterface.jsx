/*
 * AdminInterface.jsx — CareConnect Admin Portal
 *
 * Accessible ONLY when a user logs in with admin credentials.
 * The Login page must check the user's role from the API response:
 *   role === 'admin'  →  navigate('/admin-interface')
 *   Otherwise         →  redirect back to /login
 *
 * Screens (managed with useState):
 *   dashboard | users | bookings | schools | donations | community | reports | settings
 *
 * Props:
 *   adminName – string (passed from login)
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE } from '../../services/api';
import {
  Users,
  Calendar,
  TrendingUp,
  Gift,
  CheckCircle,
  User,
  Accessibility,
  Flag,
  Building,
  Key,
  MessageSquare,
  Download,
  AlertCircle,
  Trash2,
  Stethoscope,
  BookOpen,
  BarChart3,
  Edit2,
} from 'lucide-react';
import AdminSidebar from '../../components/admin/AdminSidebar/AdminSidebar';
import AdminTopbar from '../../components/admin/AdminTopbar/AdminTopbar';
import AdminToggle from '../../components/admin/AdminToggle/AdminToggle';
import { usePlatformSettings } from '../../context/PlatformSettingsContext';
import '../../components/admin/admin-base.css';
import './AdminInterface.css';

/* ════════════════════════════════════════════════════
   ICON HELPER
════════════════════════════════════════════════════ */
const IconComp = ({ icon, size = 24, color = 'currentColor' }) => {
  const iconProps = { size, color, strokeWidth: 1.8 };
  const iconMap = {
    Users: <Users {...iconProps} />,
    Calendar: <Calendar {...iconProps} />,
    TrendingUp: <TrendingUp {...iconProps} />,
    Gift: <Gift {...iconProps} />,
    CheckCircle: <CheckCircle {...iconProps} />,
    User: <User {...iconProps} />,
    Accessibility: <Accessibility {...iconProps} />,
    Flag: <Flag {...iconProps} />,
    Building: <Building {...iconProps} />,
    Key: <Key {...iconProps} />,
    MessageSquare: <MessageSquare {...iconProps} />,
    Download: <Download {...iconProps} />,
    AlertCircle: <AlertCircle {...iconProps} />,
    Trash2: <Trash2 {...iconProps} />,
    Stethoscope: <Stethoscope {...iconProps} />,
    BookOpen: <BookOpen {...iconProps} />,
    BarChart3: <BarChart3 {...iconProps} />,
  };
  return iconMap[icon] || null;
};

/* ════════════════════════════════════════════════════
   SCREEN 0 — DASHBOARD
════════════════════════════════════════════════════ */

const AdminDashboard = () => {
  const [showAllActivities, setShowAllActivities] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalUsers: 0, totalSessions: 0, totalRevenue: 0, totalDonations: 0, pendingDonations: 0, parents: 0, therapists: 0, shadowTeachers: 0, schools: 0, pendingProviders: 0, flaggedMessages: 0 });
  const [activities, setActivities] = useState([]);


  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [pRes, tRes, stRes, schRes, bRes, dRes, cRes] = await Promise.all([
          axios.get(`${API_BASE}/modules/parent/parent`).catch(() => ({ data: [] })),
          axios.get(`${API_BASE}/modules/therapist/therapist`).catch(() => ({ data: [] })),
          axios.get(`${API_BASE}/modules/shadow_teacher/shadow_teacher`).catch(() => ({ data: [] })),
          axios.get(`${API_BASE}/modules/school/school`).catch(() => ({ data: [] })),
          axios.get(`${API_BASE}/modules/booking/all-bookings`).catch(() => ({ data: [] })),
          axios.get(`${API_BASE}/modules/market_place/market_place`).catch(() => ({ data: [] })),
          axios.get(`${API_BASE}/modules/community/community`).catch(() => ({ data: [] })),
        ]);
        const parents = Array.isArray(pRes.data) ? pRes.data : [];
        const therapists = Array.isArray(tRes.data) ? tRes.data : [];
        const sts = Array.isArray(stRes.data) ? stRes.data : [];
        const schools = Array.isArray(schRes.data) ? schRes.data : [];
        const bookings = Array.isArray(bRes.data) ? bRes.data : [];
        const donations = Array.isArray(dRes.data) ? dRes.data : [];
        const messages = Array.isArray(cRes.data) ? cRes.data : [];

        const pendingProviders = [...therapists, ...sts].filter(u => (u.Status || '').trim().toLowerCase() === 'pending').length;
        const flaggedMessages = messages.filter(m => FLAG_KEYWORDS.some(kw => (m.Content || '').toLowerCase().includes(kw))).length;
        const totalRevenue = bookings.reduce((s, b) => s + (parseFloat(b.Session_price) || 0), 0);
        const pendingDonations = donations.filter(d => d.Status === 'Pending').length;

        setStats({ totalUsers: parents.length + therapists.length + sts.length, totalSessions: bookings.length, totalRevenue, totalDonations: donations.length, pendingDonations, parents: parents.length, therapists: therapists.length, shadowTeachers: sts.length, schools: schools.length, pendingProviders, flaggedMessages });

        // Build activity feed
        const feed = [];
        [...parents].sort((a, b) => new Date(b.CreatedAt) - new Date(a.CreatedAt)).slice(0, 2).forEach(p => {
          feed.push({ id: `p-${p.P_ID}`, bg: 'var(--adm-purple-pale)', icon: 'User', text: <>New parent registered: <strong>{p.Full_Name}</strong></>, time: p.CreatedAt ? new Date(p.CreatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Recently' });
        });
        bookings.slice(0, 3).forEach(b => {
          feed.push({ id: `b-${b.B_ID}`, bg: 'var(--adm-green-pale)', icon: 'CheckCircle', text: <><strong>{b.child_name || 'A patient'}</strong> booked a session with <strong>{b.therapist_name || b.shadow_teacher_name || 'a provider'}</strong></>, time: b.Date || 'Recently' });
        });
        [...therapists, ...sts].filter(u => (u.Status || '').trim().toLowerCase() === 'pending').slice(0, 2).forEach(u => {
          feed.push({ id: `prov-${u.T_ID || u.ST_ID}`, bg: 'var(--adm-orange-pale)', icon: 'Key', text: <><strong>{u.Fullname}</strong> submitted account verification docs</>, time: u.CreatedAt ? new Date(u.CreatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Recently' });
        });
        donations.filter(d => d.Status === 'Pending').slice(0, 2).forEach(d => {
          feed.push({ id: `don-${d.M_ID}`, bg: 'var(--adm-orange-pale)', icon: 'Accessibility', text: <><strong>{d.Item_Name}</strong> donation submitted — awaiting confirmation</>, time: 'Pending' });
        });
        setActivities(feed);
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);



  const displayActivities = showAllActivities ? activities : activities.slice(0, 4);
  const maxUsers = Math.max(stats.parents, stats.therapists, stats.shadowTeachers, stats.schools, 1);
  const totalUrgent = stats.pendingProviders + stats.pendingDonations + stats.flaggedMessages;

  if (loading) return <div className="adm-content"><p style={{ textAlign: 'center', padding: '40px' }}>Loading dashboard...</p></div>;

  return (
    <div className="adm-content">
      <div className="adm-stats-grid cols4">
        {[
          { cls: 'sc-purple', icon: 'Users', val: stats.totalUsers.toLocaleString(), label: 'Total Registered Users', sub: `${stats.parents} parents · ${stats.therapists} therapists` },
          { cls: 'sc-teal', icon: 'Calendar', val: stats.totalSessions.toLocaleString(), label: 'Total Sessions', sub: 'All booking types' },
          { cls: 'sc-orange', icon: 'TrendingUp', val: `EGP ${stats.totalRevenue.toLocaleString()}`, label: 'Platform Revenue', sub: 'Sum of all session prices', small: true },
          { cls: 'sc-green', icon: 'Gift', val: stats.totalDonations, label: 'Donations Listed', sub: `${stats.pendingDonations} pending approval` },
        ].map(s => (
          <div key={s.label} className={`adm-stat ${s.cls}`}>
            <div className="adm-stat__icon"><IconComp icon={s.icon} size={28} color="currentColor" /></div>
            <div className="adm-stat__val" style={s.small ? { fontSize: 22 } : {}}>{s.val}</div>
            <div className="adm-stat__label">{s.label}</div>
            <div className="adm-stat__sub">{s.sub}</div>
          </div>
        ))}
      </div>

      {showAllActivities && (
        <div className="adm-modal-overlay" onClick={() => setShowAllActivities(false)}>
          <div className="adm-modal" onClick={e => e.stopPropagation()}>
            <div className="adm-modal-header">
              <h2>All Activities</h2>
              <button className="adm-modal-close" onClick={() => setShowAllActivities(false)}>✕</button>
            </div>
            <div className="adm-modal-body">
              {activities.map((f, i) => (
                <div key={f.id} className="adm-feed-item" style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: i < activities.length - 1 ? '1px solid #f0f0f0' : 'none' }}>
                  <div className="adm-feed-dot" style={{ background: f.bg }}><IconComp icon={f.icon} size={20} color="currentColor" /></div>
                  <div><div className="adm-feed-text">{f.text}</div><div className="adm-feed-time">{f.time}</div></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="adm-two-col">
        <div className="adm-card">
          <div className="adm-sec-head">
            <h3>Live Activity Feed</h3>
            {activities.length > 4 && <button className="adm-link-btn" onClick={() => setShowAllActivities(true)}>See all</button>}
          </div>
          {displayActivities.length === 0
            ? <p style={{ padding: '20px', color: 'var(--adm-gray)', fontSize: 13 }}>No recent activity found.</p>
            : displayActivities.map(f => (
              <div key={f.id} className="adm-feed-item">
                <div className="adm-feed-dot" style={{ background: f.bg }}><IconComp icon={f.icon} size={20} color="currentColor" /></div>
                <div><div className="adm-feed-text">{f.text}</div><div className="adm-feed-time">{f.time}</div></div>
              </div>
            ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="adm-card">
            <div className="adm-sec-head"><h3>Platform Breakdown</h3></div>
            <div className="adm-chart-area">
              {[
                ['Parents', stats.parents, 'var(--adm-purple)'],
                ['Therapists', stats.therapists, 'var(--adm-teal)'],
                ['Shadow Teachers', stats.shadowTeachers, 'var(--adm-orange)'],
                ['Schools Listed', stats.schools, 'var(--adm-green)'],
              ].map(([label, val, color]) => (
                <div key={label} className="adm-chart-row">
                  <div className="adm-chart-label">{label}</div>
                  <div className="adm-chart-bar-bg">
                    <div className="adm-chart-bar" style={{ width: `${Math.round((val / maxUsers) * 100)}%`, background: color }} />
                  </div>
                  <div className="adm-chart-val">{val}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="adm-card">
            <div className="adm-sec-head">
              <h3>Pending Actions</h3>
              {totalUrgent > 0 && <span className="adm-badge b-red">{totalUrgent} urgent</span>}
            </div>
            <div style={{ padding: '10px 22px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { bg: 'var(--adm-red-pale)', color: 'var(--adm-red)', label: <><Flag size={16} style={{ display: 'inline', marginRight: 8 }} />Flagged community messages</>, cls: 'b-red', count: stats.flaggedMessages },
                { bg: 'var(--adm-orange-pale)', color: 'var(--adm-orange)', label: <><AlertCircle size={16} style={{ display: 'inline', marginRight: 8 }} />Provider verifications pending</>, cls: 'b-orange', count: stats.pendingProviders },
                { bg: 'var(--adm-orange-pale)', color: 'var(--adm-orange)', label: <><Accessibility size={16} style={{ display: 'inline', marginRight: 8 }} />Donation requests to confirm</>, cls: 'b-orange', count: stats.pendingDonations },
                { bg: 'var(--adm-purple-pale)', color: 'var(--adm-purple)', label: <><Building size={16} style={{ display: 'inline', marginRight: 8 }} />Schools listed</>, cls: 'b-purple', count: stats.schools },
              ].map((p, idx) => (
                <div key={idx} className="adm-pending-pill" style={{ background: p.bg }}>
                  <span style={{ color: p.color }}>{p.label}</span>
                  <span className={`adm-badge ${p.cls}`}>{p.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ════════════════════════════════════════════════════
   SCREEN 1 — USER MANAGEMENT
════════════════════════════════════════════════════ */
const AdminUsers = () => {
  const [selectedRole, setSelectedRole] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [verifying, setVerifying] = useState(null);

  // Fetch users from backend on mount
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);

      // Fetch all user types in parallel
      const [therapistRes, stRes, parentRes, childRes] = await Promise.all([
        axios.get(`${API_BASE}/modules/therapist/therapist`).catch(() => ({ data: [] })),
        axios.get(`${API_BASE}/modules/shadow_teacher/shadow_teacher`).catch(() => ({ data: [] })),
        axios.get(`${API_BASE}/modules/parent/parent`).catch(() => ({ data: [] })),
        axios.get(`${API_BASE}/modules/child/child`).catch(() => ({ data: [] }))
      ]);

      const therapists = Array.isArray(therapistRes.data) ? therapistRes.data : [];
      const shadowTeachers = Array.isArray(stRes.data) ? stRes.data : [];
      const parents = Array.isArray(parentRes.data) ? parentRes.data : [];
      const childrenRaw = Array.isArray(childRes.data) ? childRes.data : [];

      // Transform therapists
      const therapistUsers = therapists.map(t => {
        const status = (t.Status || '').trim().toLowerCase();
        const isPending = status === 'pending';
        const isRejected = status === 'rejected';
        return {
          id: `t-${t.T_ID}`,
          type: 'therapist',
          T_ID: t.T_ID,
          i: (t.Fullname || 'T').charAt(0),
          c: 'var(--adm-teal)',
          n: t.Fullname || 'Unknown Therapist',
          e: t.Email || '—',
          r: 'Therapist',
          rC: 'b-teal',
          j: t.CreatedAt ? new Date(t.CreatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—',
          st: isPending ? 'Pending' : isRejected ? 'Rejected' : 'Accepted',
          sC: isPending ? 'b-orange' : isRejected ? 'b-red' : 'b-green',
          v: isPending ? '⏳ Awaiting' : isRejected ? 'Rejected' : '✓ Verified',
          vC: isPending ? 'b-orange' : isRejected ? 'b-red' : 'b-green',
          a: isPending ? [{ l: '✓ Verify', c: 'btn-green' }, { l: 'Reject', c: 'btn-red' }, { l: 'View', c: 'btn-ghost' }, { l: 'Delete', c: 'btn-red' }] : [{ l: 'View', c: 'btn-ghost' }, { l: 'Delete', c: 'btn-red' }],
          orange: isPending,
          cv: t.CV || t.CVpath || null,
          exp: t.Experience || null
        };
      });

      // Transform shadow teachers
      const stUsers = shadowTeachers.map(st => {
        const status = (st.Status || '').trim().toLowerCase();
        const isPending = status === 'pending';
        const isRejected = status === 'rejected';
        return {
          id: `st-${st.ST_ID}`,
          type: 'shadow_teacher',
          ST_ID: st.ST_ID,
          i: (st.Fullname || 'S').charAt(0),
          c: 'var(--adm-orange)',
          n: st.Fullname || 'Unknown Shadow Teacher',
          e: st.Email || '—',
          r: 'Shadow Tchr',
          rC: 'b-orange',
          j: st.CreatedAt ? new Date(st.CreatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—',
          st: isPending ? 'Pending' : isRejected ? 'Rejected' : 'Accepted',
          sC: isPending ? 'b-orange' : isRejected ? 'b-red' : 'b-green',
          v: isPending ? '⏳ Awaiting' : isRejected ? 'Rejected' : '✓ Verified',
          vC: isPending ? 'b-orange' : isRejected ? 'b-red' : 'b-green',
          a: isPending ? [{ l: '✓ Verify', c: 'btn-green' }, { l: 'Reject', c: 'btn-red' }, { l: 'View', c: 'btn-ghost' }, { l: 'Delete', c: 'btn-red' }] : [{ l: 'View', c: 'btn-ghost' }, { l: 'Delete', c: 'btn-red' }],
          orange: isPending,
          cv: st.CV || st.CVpath || null,
          exp: st.Experience || null
        };
      });

      // Transform parents
      const parentUsers = parents.map(p => {
        return {
          id: `p-${p.P_ID}`,
          type: 'parent',
          P_ID: p.P_ID,
          i: (p.Full_Name || 'P').charAt(0),
          c: 'var(--adm-purple)',
          n: p.Full_Name || 'Unknown Parent',
          e: p.Email || '—',
          r: 'Parent',
          rC: 'b-purple',
          j: p.CreatedAt ? new Date(p.CreatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—',
          st: 'Active',
          sC: 'b-green',
          v: '✓ Verified',
          vC: 'b-green',
          a: [{ l: 'View', c: 'btn-ghost' }, { l: 'Delete', c: 'btn-red' }],
          orange: false
        };
      });

      // Transform children
      const childUsers = childrenRaw.map(ch => {
        const parent = parents.find(p => p.P_ID === ch.P_ID);
        const parentName = parent ? parent.Full_Name : `Parent ID: ${ch.P_ID}`;
        return {
          id: `ch-${ch.Child_ID}`,
          type: 'child',
          Child_ID: ch.Child_ID,
          P_ID: ch.P_ID,
          i: (ch.Name || 'C').charAt(0),
          c: 'var(--adm-blue)',
          n: ch.Name || 'Unknown Child',
          e: `Parent: ${parentName}`,
          r: 'Child',
          rC: 'b-blue',
          j: ch.DOB ? new Date(ch.DOB).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—', // Use DOB for joined or just '—'
          st: 'Active',
          sC: 'b-green',
          v: '✓ Active',
          vC: 'b-green',
          a: [{ l: 'View', c: 'btn-ghost' }, { l: 'Delete', c: 'btn-red' }],
          orange: false,
          gender: ch.Gender,
          details: ch.Extra_Details
        };
      });

      // Combine all users
      const allUsers = [...parentUsers, ...therapistUsers, ...stUsers, ...childUsers];
      setUsers(allUsers);
      console.log('✓ Users loaded:', allUsers);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (user) => {
    if (!window.confirm(`⚠️ PERMANENT DELETE: Are you sure you want to remove "${user.n}"? This action cannot be undone and will delete all records associated with this user.`)) return;

    setVerifying(user.id);
    try {
      const userTypeId = user.type === 'therapist' ? user.T_ID : user.type === 'shadow_teacher' ? user.ST_ID : user.type === 'child' ? user.Child_ID : user.P_ID;
      const endpoint = user.type === 'therapist' ? 'therapist' : user.type === 'shadow_teacher' ? 'shadow_teacher' : user.type === 'child' ? 'child' : 'parent';

      console.log(`🗑️ Deleting ${user.n} (Type: ${user.type}, ID: ${userTypeId})`);

      const response = await axios.delete(`${API_BASE}/modules/${endpoint}/${endpoint}?id=${userTypeId}`);

      if (response.status === 200 || response.data?.Status === 'OK' || response.data?.message?.toLowerCase().includes('success')) {
        setUsers(prev => prev.filter(u => u.id !== user.id));
        if (selectedUser?.id === user.id) setSelectedUser(null);
        alert(`✅ User "${user.n}" has been removed from the database.`);
      } else {
        throw new Error(response.data?.Message || 'Failed to delete user');
      }
    } catch (err) {
      console.error('❌ Delete error:', err);
      alert(`❌ Failed to delete user: ${err.response?.data?.Message || err.message}`);
    } finally {
      setVerifying(null);
    }
  };

  const handleUserAction = async (userId, action) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    if (action === 'View') {
      setSelectedUser(user);
      return;
    }

    if (action === 'Delete') {
      handleDeleteUser(user);
      return;
    }

    setVerifying(userId);

    try {
      if (user.type === 'parent') {
        alert('Parent accounts are automatically verified');
        setVerifying(null);
        return;
      }

      const userTypeId = user.type === 'therapist' ? user.T_ID : user.ST_ID;
      const endpoint = user.type === 'therapist' ? 'therapist' : 'shadow_teacher';

      if (action === 'Verify' || action === '✓ Verify') {
        console.log(`🔄 Verifying ${user.n} (${endpoint} ID: ${userTypeId})`);

        // Send status update to backend
        const response = await axios.put(
          `${API_BASE}/modules/${endpoint}/${endpoint}?id=${userTypeId}`,
          { Status: 'Accepted' }
        );

        console.log(`✅ Verification response:`, response.data);

        if (response.status === 200 || response.data?.message?.includes('success') || response.data?.message?.includes('Success')) {
          // Update local state
          setUsers(prevUsers =>
            prevUsers.map(u =>
              u.id === userId
                ? { ...u, st: 'Accepted', sC: 'b-green', v: '✓ Verified', vC: 'b-green', a: [{ l: 'View', c: 'btn-ghost' }, { l: 'Delete', c: 'btn-red' }], orange: false }
                : u
            )
          );

          // Update modal if open
          if (selectedUser?.id === userId) {
            setSelectedUser(prev => ({
              ...prev,
              st: 'Accepted',
              sC: 'b-green',
              v: '✓ Verified',
              vC: 'b-green',
              a: [{ l: 'View', c: 'btn-ghost' }, { l: 'Delete', c: 'btn-red' }],
              orange: false
            }));
          }

          console.log(`✅ ${user.n} VERIFIED - Status saved to database`);
          alert(`✅ SUCCESS! ${user.n} is now VERIFIED and can log in!`);

          // Close modal after 1 second
          setTimeout(() => setSelectedUser(null), 1000);
        }

      } else if (action === 'Reject') {
        console.log(`🔄 Rejecting ${user.n} (${endpoint} ID: ${userTypeId})`);

        // Send status update to backend
        const response = await axios.put(
          `${API_BASE}/modules/${endpoint}/${endpoint}?id=${userTypeId}`,
          { Status: 'Rejected' }
        );

        console.log(`✅ Rejection response:`, response.data);

        if (response.status === 200 || response.data?.message?.includes('success') || response.data?.message?.includes('Success')) {
          // Update local state
          setUsers(prevUsers =>
            prevUsers.map(u =>
              u.id === userId
                ? { ...u, st: 'Rejected', sC: 'b-red', v: '❌ Rejected', vC: 'b-red', a: [{ l: 'View', c: 'btn-ghost' }, { l: 'Delete', c: 'btn-red' }], orange: false }
                : u
            )
          );

          // Update modal if open
          if (selectedUser?.id === userId) {
            setSelectedUser(prev => ({
              ...prev,
              st: 'Rejected',
              sC: 'b-red',
              v: '❌ Rejected',
              vC: 'b-red',
              a: [{ l: 'View', c: 'btn-ghost' }, { l: 'Delete', c: 'btn-red' }],
              orange: false
            }));
          }

          console.log(`✅ ${user.n} REJECTED - Status saved to database`);
          alert(`✅ ${user.n}'s application has been REJECTED`);

          // Close modal after 1 second
          setTimeout(() => setSelectedUser(null), 1000);
        }
      }
    } catch (err) {
      console.error(`❌ ERROR during ${action}:`, err);
      console.error(`Response Status: ${err.response?.status}`);
      console.error(`Response Data:`, err.response?.data);
      alert(`❌ FAILED: ${err.response?.data?.message || err.message}\n\nMake sure the backend is running and the database is accessible.`);
    } finally {
      setVerifying(null);
    }
  };

  const filteredUsers = users.filter(user => {
    const roleMatch = selectedRole === 'All' || user.r === selectedRole || (selectedRole === 'Shadow Teacher' && user.r === 'Shadow Tchr');
    const statusMatch = selectedStatus === 'All' || user.st === selectedStatus;
    const searchMatch = !searchTerm || 
      user.n.toLowerCase().includes(searchTerm.toLowerCase()) || 
      user.e.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.r.toLowerCase().includes(searchTerm.toLowerCase());
    return roleMatch && statusMatch && searchMatch;
  });

  // Dynamic counts from actual data
  const parentCount = users.filter(u => u.r === 'Parent').length;
  const therapistCount = users.filter(u => u.r === 'Therapist').length;
  const therapistVerified = users.filter(u => u.r === 'Therapist' && u.st === 'Accepted').length;
  const shadowTeacherCount = users.filter(u => u.r === 'Shadow Tchr').length;
  const shadowTeacherVerified = users.filter(u => u.r === 'Shadow Tchr' && u.st === 'Accepted').length;
  const pendingCount = users.filter(u => u.st === 'Pending').length;
  const childCount = users.filter(u => u.r === 'Child').length;

  return (
    <div className="adm-content">
      {loading ? (
        <p style={{ textAlign: 'center', padding: '40px' }}>Loading users...</p>
      ) : (
        <>
          <div className="adm-stats-grid cols4">
            {[
              { cls: 'sc-purple', icon: 'Users', val: parentCount, label: 'Parents', sub: `${parentCount} members` },
              { cls: 'sc-teal', icon: 'Stethoscope', val: therapistCount, label: 'Therapists', sub: `${therapistVerified} verified` },
              { cls: 'sc-orange', icon: 'BookOpen', val: shadowTeacherCount, label: 'Shadow Teachers', sub: `${shadowTeacherVerified} verified` },
              { cls: 'sc-red', icon: 'AlertCircle', val: pendingCount, label: 'Awaiting Verification', sub: 'Action required' },
              { cls: 'sc-blue', icon: 'Users', val: childCount, label: 'Children', sub: `${childCount} registered` },
            ].map(s => (
              <div key={s.label} className={`adm-stat ${s.cls}`}>
                <div className="adm-stat__icon"><IconComp icon={s.icon} size={28} color="currentColor" /></div>
                <div className="adm-stat__val">{s.val}</div>
                <div className="adm-stat__label">{s.label}</div>
                <div className="adm-stat__sub">{s.sub}</div>
              </div>
            ))}
          </div>

          <div className="adm-card">
            <div className="adm-sec-head">
              <h3>All Users ({filteredUsers.length})</h3>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#999', pointerEvents: 'none', display: 'flex' }}>
                    <IconComp icon="Search" size={16} />
                  </div>
                  <input 
                    type="text" 
                    placeholder="Search name, email or role..." 
                    className="adm-select" 
                    style={{ paddingLeft: 36, width: 240, cursor: 'text' }}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <select className="adm-select" value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)}>
                  <option value="All">All Roles</option>
                  <option value="Parent">Parent</option>
                  <option value="Therapist">Therapist</option>
                  <option value="Shadow Tchr">Shadow Teacher</option>
                  <option value="Child">Child</option>
                </select>
                <select className="adm-select" value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
                  <option value="All">All Status</option>
                  <option value="Accepted">Verified</option>
                  <option value="Pending">Pending</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>
            </div>
            <table className="adm-table">
              <thead><tr><th>Name</th><th>Role</th><th>Email</th><th>Joined</th><th>Status</th><th>Verified</th><th>Actions</th></tr></thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr><td colSpan="7" style={{ textAlign: 'center', padding: '20px', color: 'var(--adm-gray)' }}>No users found</td></tr>
                ) : (
                  filteredUsers.map(r => (
                    <tr key={r.id} className={r.orange ? 'row-orange' : ''}>
                      <td><div className="adm-user-cell"><div className="adm-mv" style={{ background: r.c }}>{r.i}</div><div><div className="adm-user-name">{r.n}</div></div></div></td>
                      <td><span className={`adm-badge ${r.rC}`}>{r.r}</span></td>
                      <td style={{ fontSize: 12 }}>{r.e}</td>
                      <td>{r.j}</td>
                      <td><span className={`adm-badge ${r.sC}`}>{r.st}</span></td>
                      <td>{r.v !== '—' ? <span className={`adm-badge ${r.vC}`}>{r.v}</span> : '—'}</td>
                      <td style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', minWidth: '180px' }}>
                        {r.a && r.a.length > 0 ? r.a.map(a => (<button key={a.l} onClick={() => handleUserAction(r.id, a.l)} className={`adm-btn ${a.c}`} style={{ padding: '6px 12px', fontSize: 11, cursor: 'pointer' }} disabled={verifying === r.id}>{verifying === r.id ? 'Processing...' : a.l}</button>)) : <span style={{ fontSize: 11, color: 'var(--adm-gray)' }}>—</span>}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {selectedUser && (
            <div className="adm-modal-overlay" onClick={() => setSelectedUser(null)}>
              <div className="adm-modal" onClick={e => e.stopPropagation()}>
                <div className="adm-modal-header">
                  <h2>User Details</h2>
                  <button className="adm-modal-close" onClick={() => setSelectedUser(null)}>✕</button>
                </div>
                <div className="adm-modal-body">
                  <div style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '30px', paddingBottom: '20px', borderBottom: '1px solid var(--adm-bg-gray)' }}>
                      <div className="adm-mv" style={{ background: selectedUser.c, width: '60px', height: '60px', fontSize: '24px', marginRight: '20px' }}>{selectedUser.i}</div>
                      <div>
                        <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--adm-dark)' }}>{selectedUser.n}</div>
                        <div style={{ fontSize: 13, color: 'var(--adm-gray)' }}>{selectedUser.e}</div>
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                      <div>
                        <div style={{ fontSize: 11, color: 'var(--adm-gray)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6, fontWeight: 600 }}>Role</div>
                        <span className={`adm-badge ${selectedUser.rC}`}>{selectedUser.r}</span>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: 'var(--adm-gray)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6, fontWeight: 600 }}>Status</div>
                        <span className={`adm-badge ${selectedUser.sC}`}>{selectedUser.st}</span>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: 'var(--adm-gray)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6, fontWeight: 600 }}>Joined</div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--adm-dark)' }}>{selectedUser.j}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: 'var(--adm-gray)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6, fontWeight: 600 }}>Verified</div>
                        <span className={`adm-badge ${selectedUser.vC}`}>{selectedUser.v}</span>
                      </div>
                    </div>
                    {/* Provider-specific details */}
                    {(selectedUser.type === 'therapist' || selectedUser.type === 'shadow_teacher') && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px', paddingTop: '10px', borderTop: '1px solid var(--adm-bg-gray)' }}>
                        <div>
                          <div style={{ fontSize: 11, color: 'var(--adm-gray)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6, fontWeight: 600 }}>Experience</div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--adm-dark)' }}>
                            {selectedUser.exp ? `${selectedUser.exp} Years` : 'Not provided'}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: 11, color: 'var(--adm-gray)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6, fontWeight: 600 }}>CV / Certification</div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--adm-dark)' }}>
                            {selectedUser.cv ? (
                              <a href={`${API_BASE}${selectedUser.cv}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--adm-purple)', textDecoration: 'none', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                📄 View Document
                              </a>
                            ) : 'No CV uploaded'}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Child-specific details */}
                    {selectedUser.type === 'child' && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px', paddingTop: '10px', borderTop: '1px solid var(--adm-bg-gray)' }}>
                        <div>
                          <div style={{ fontSize: 11, color: 'var(--adm-gray)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6, fontWeight: 600 }}>Gender</div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--adm-dark)', textTransform: 'capitalize' }}>
                            {selectedUser.gender || 'Not specified'}
                          </div>
                        </div>
                        <div style={{ gridColumn: '1 / span 2' }}>
                          <div style={{ fontSize: 11, color: 'var(--adm-gray)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6, fontWeight: 600 }}>Extra Details</div>
                          <div style={{ fontSize: 13, color: 'var(--adm-dark)', background: 'var(--adm-bg-gray)', padding: '10px', borderRadius: '8px', lineHeight: 1.5 }}>
                            {selectedUser.details || 'No additional details provided.'}
                          </div>
                        </div>
                      </div>
                    )}

                    {selectedUser.a && selectedUser.a.length > 1 && (
                      <div style={{ display: 'flex', gap: '10px', marginTop: '20px', paddingTop: '20px', borderTop: '1px solid var(--adm-bg-gray)', flexWrap: 'wrap' }}>
                        {selectedUser.a.map(a => a.l !== 'View' && (
                          <button key={a.l} onClick={() => { handleUserAction(selectedUser.id, a.l); setSelectedUser(null); }} className={`adm-btn ${a.c}`} style={{ padding: '8px 16px', fontSize: 12, cursor: 'pointer' }} disabled={verifying === selectedUser.id}>
                            {verifying === selectedUser.id ? 'Processing...' : a.l}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

/* ════════════════════════════════════════════════════
   SCREEN 2 — BOOKINGS
════════════════════════════════════════════════════ */
const AdminBookings = ({ searchValue = '' }) => {
  const [selectedType, setSelectedType] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [rawBookings, setRawBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API_BASE}/modules/booking/all-bookings`)
      .then(r => {
        const data = Array.isArray(r.data) ? r.data : [];
        const now = new Date();
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

        setRawBookings(formattedData);

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
      })
      .catch(err => console.error('Error loading bookings:', err))
      .finally(() => setLoading(false));
  }, []);

  const PALETTE = ['var(--adm-purple)', 'var(--adm-teal)', 'var(--adm-orange)', 'var(--adm-red)', 'var(--adm-green)'];

  const allBookings = rawBookings
    .filter(b => {
      const status = b.Booking_status || 'Pending';
      return ['Confirmed', 'Completed', 'Cancelled'].includes(status);
    })
    .map((b, idx) => {
      const isShadow = !b.T_ID && !!b.ST_ID;
      const isOnline = (b.Session_type || '').toLowerCase().includes('online');
      const status = b.Booking_status;
      const statusColor = status === 'Completed' ? 'b-green' : status === 'Confirmed' ? 'b-teal' : 'b-red';
      const amtColor = status === 'Completed' ? 'var(--adm-green)' : status === 'Cancelled' ? 'var(--adm-red)' : 'var(--adm-orange)';
      const patientName = b.child_name || '—';
      const providerName = b.therapist_name || b.shadow_teacher_name || '—';
      return {
        id: `#${b.B_ID}`, i: (patientName[0] || 'C').toUpperCase(),
        c: PALETTE[idx % PALETTE.length], n: patientName, prov: providerName,
        typ: isShadow ? 'Shadow Tchr' : 'Therapy', tC: isShadow ? 'b-orange' : 'b-purple',
        d: b.Date ? `${b.Date}${b.Start_time ? ' · ' + b.Start_time : ''}` : '—',
        md: isOnline ? 'Online' : 'In-Person', mC: isOnline ? 'b-teal' : 'b-purple',
        amt: b.Session_price ? `EGP ${Number(b.Session_price).toLocaleString()}` : '—',
        aC: amtColor, st: status, sC: statusColor,
      };
    });

  const filteredBookings = allBookings.filter(b => {
    const typeMatch = selectedType === 'All' || b.typ === selectedType;
    const statusMatch = selectedStatus === 'All' || b.st === selectedStatus;
    const sl = searchValue.toLowerCase().trim();
    const searchMatch = !sl || b.n.toLowerCase().includes(sl) || b.prov.toLowerCase().includes(sl) || b.typ.toLowerCase().includes(sl);
    return typeMatch && statusMatch && searchMatch;
  });

  const totalBookings = allBookings.length;
  const therapyCount = allBookings.filter(b => b.typ === 'Therapy').length;
  const shadowCount = allBookings.filter(b => b.typ === 'Shadow Tchr').length;
  const onlineCount = allBookings.filter(b => b.md === 'Online').length;
  const inPersonCount = totalBookings - onlineCount;
  const onlinePercent = totalBookings > 0 ? (onlineCount / totalBookings * 100).toFixed(1) : 0;
  const therapyArc = totalBookings > 0 ? (therapyCount / totalBookings * 251).toFixed(0) : 0;
  const shadowArc = totalBookings > 0 ? (shadowCount / totalBookings * 251).toFixed(0) : 0;
  const onlineArc = totalBookings > 0 ? (onlineCount / totalBookings * 251).toFixed(0) : 0;

  const handleUpdateStatus = async (bookingIdStr, newStatus) => {
    try {
      const numericId = Number(bookingIdStr.replace('#', ''));

      await axios.patch(`${API_BASE}/modules/booking/booking-status?id=${numericId}`, {
        Booking_status: newStatus
      });

      setRawBookings(prev => prev.map(b => b.B_ID === numericId ? { ...b, Booking_status: newStatus } : b));
      if (selectedBooking && selectedBooking.id === bookingIdStr) {
        setSelectedBooking({
          ...selectedBooking,
          st: newStatus,
          sC: newStatus === 'Completed' ? 'b-green' : newStatus === 'Confirmed' ? 'b-teal' : 'b-red',
          aC: newStatus === 'Completed' ? 'var(--adm-green)' : newStatus === 'Cancelled' ? 'var(--adm-red)' : 'var(--adm-orange)'
        });
      }
    } catch (err) {
      alert('Failed to update status in database');
      console.error(err);
    }
  };

  if (loading) return <div className="adm-content"><p style={{ textAlign: 'center', padding: '40px' }}>Loading bookings...</p></div>;

  return (
    <div className="adm-content">
      {selectedBooking && (
        <div className="adm-modal-overlay" onClick={() => setSelectedBooking(null)}>
          <div className="adm-modal" onClick={e => e.stopPropagation()}>
            <div className="adm-modal-header">
              <h2>Booking Details</h2>
              <button className="adm-modal-close" onClick={() => setSelectedBooking(null)}>✕</button>
            </div>
            <div className="adm-modal-body">
              <div style={{ padding: '20px' }}>
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ fontSize: 12, color: 'var(--adm-gray)', marginBottom: 4 }}>BOOKING ID</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--adm-dark)' }}>{selectedBooking.id}</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                  <div><div style={{ fontSize: 11, color: 'var(--adm-gray)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6, fontWeight: 600 }}>Patient/Student</div><div style={{ fontSize: 16, fontWeight: 700, color: 'var(--adm-dark)' }}>{selectedBooking.n}</div></div>
                  <div><div style={{ fontSize: 11, color: 'var(--adm-gray)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6, fontWeight: 600 }}>Provider</div><div style={{ fontSize: 16, fontWeight: 700, color: 'var(--adm-dark)' }}>{selectedBooking.prov}</div></div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                  <div><div style={{ fontSize: 11, color: 'var(--adm-gray)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6, fontWeight: 600 }}>Type</div><span className={`adm-badge ${selectedBooking.tC}`}>{selectedBooking.typ}</span></div>
                  <div><div style={{ fontSize: 11, color: 'var(--adm-gray)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6, fontWeight: 600 }}>Mode</div><span className={`adm-badge ${selectedBooking.mC}`}>{selectedBooking.md}</span></div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                  <div><div style={{ fontSize: 11, color: 'var(--adm-gray)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6, fontWeight: 600 }}>Date & Time</div><div style={{ fontSize: 14, color: 'var(--adm-dark)' }}>{selectedBooking.d}</div></div>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--adm-gray)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6, fontWeight: 600 }}>Status</div>
                    <select
                      className={`adm-badge ${selectedBooking.sC}`}
                      value={selectedBooking.st}
                      onChange={(e) => handleUpdateStatus(selectedBooking.id, e.target.value)}
                      style={{ border: '1px solid #eee', cursor: 'pointer', outline: 'none', appearance: 'auto' }}
                    >
                      <option value="Confirmed">Confirmed</option>
                      <option value="Completed">Completed</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>
                <div><div style={{ fontSize: 11, color: 'var(--adm-gray)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6, fontWeight: 600 }}>Amount</div><div style={{ fontSize: 18, fontWeight: 700, color: selectedBooking.aC }}>{selectedBooking.amt}</div></div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="adm-stats-grid cols4">
        {[
          { cls: 'sc-teal', icon: 'Calendar', val: totalBookings, label: 'Total Bookings', sub: 'All booking types' },
          { cls: 'sc-green', icon: 'CheckCircle', val: allBookings.filter(b => b.st === 'Completed').length, label: 'Completed', sub: 'Successfully finished' },
          { cls: 'sc-orange', icon: 'AlertCircle', val: allBookings.filter(b => b.st === 'Confirmed').length, label: 'Confirmed', sub: 'Awaiting session' },
          { cls: 'sc-red', icon: 'AlertCircle', val: allBookings.filter(b => b.st === 'Cancelled').length, label: 'Cancelled', sub: 'Booking cancellations' },
        ].map(s => (
          <div key={s.label} className={`adm-stat ${s.cls}`}>
            <div className="adm-stat__icon"><IconComp icon={s.icon} size={28} color="currentColor" /></div>
            <div className="adm-stat__val">{s.val}</div>
            <div className="adm-stat__label">{s.label}</div>
            <div className="adm-stat__sub">{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="adm-two-col">
        <div className="adm-card">
          <div className="adm-sec-head"><h3>Bookings by Type</h3></div>
          <div className="adm-donut-wrap">
            <svg className="adm-donut-svg" viewBox="0 0 110 110">
              <circle cx="55" cy="55" r="40" fill="none" stroke="var(--adm-purple-pale)" strokeWidth="18" />
              <circle cx="55" cy="55" r="40" fill="none" stroke="var(--adm-purple)" strokeWidth="18" strokeDasharray={`${therapyArc} 251`} strokeDashoffset="63" strokeLinecap="round" />
              <circle cx="55" cy="55" r="40" fill="none" stroke="var(--adm-teal)" strokeWidth="18" strokeDasharray={`${shadowArc} 251`} strokeDashoffset={`-${(Number(therapyArc) + 25)}`} strokeLinecap="round" />
              <text x="55" y="51" textAnchor="middle" fontSize="14" fontWeight="800" fill="var(--adm-dark)" fontFamily="Plus Jakarta Sans">{totalBookings}</text>
              <text x="55" y="64" textAnchor="middle" fontSize="9" fill="var(--adm-gray)" fontFamily="Plus Jakarta Sans">Total</text>
            </svg>
            <div className="adm-donut-legend">
              <div className="adm-dl-item"><div className="adm-dl-dot" style={{ background: 'var(--adm-purple)' }}></div><span className="adm-dl-label">Therapy Sessions</span><span className="adm-dl-val">{therapyCount}</span></div>
              <div className="adm-dl-item"><div className="adm-dl-dot" style={{ background: 'var(--adm-teal)' }}></div><span className="adm-dl-label">Shadow Teacher</span><span className="adm-dl-val">{shadowCount}</span></div>
            </div>
          </div>
        </div>
        <div className="adm-card">
          <div className="adm-sec-head"><h3>Session Mode</h3></div>
          <div className="adm-donut-wrap">
            <svg className="adm-donut-svg" viewBox="0 0 110 110">
              <circle cx="55" cy="55" r="40" fill="none" stroke="var(--adm-purple-pale)" strokeWidth="18" />
              <circle cx="55" cy="55" r="40" fill="none" stroke="var(--adm-teal)" strokeWidth="18" strokeDasharray={`${onlineArc} 251`} strokeDashoffset="63" strokeLinecap="round" />
              <circle cx="55" cy="55" r="40" fill="none" stroke="var(--adm-mint)" strokeWidth="18" strokeDasharray={`${(251 - Number(onlineArc)).toFixed(0)} 251`} strokeDashoffset={`-${(Number(onlineArc) + 25)}`} strokeLinecap="round" />
              <text x="55" y="51" textAnchor="middle" fontSize="14" fontWeight="800" fill="var(--adm-dark)" fontFamily="Plus Jakarta Sans">{onlinePercent}%</text>
              <text x="55" y="64" textAnchor="middle" fontSize="9" fill="var(--adm-gray)" fontFamily="Plus Jakarta Sans">Online</text>
            </svg>
            <div className="adm-donut-legend">
              <div className="adm-dl-item"><div className="adm-dl-dot" style={{ background: 'var(--adm-teal)' }}></div><span className="adm-dl-label">Online</span><span className="adm-dl-val">{onlineCount}</span></div>
              <div className="adm-dl-item"><div className="adm-dl-dot" style={{ background: 'var(--adm-mint)' }}></div><span className="adm-dl-label">In-Person</span><span className="adm-dl-val">{inPersonCount}</span></div>
            </div>
          </div>
        </div>
      </div>

      <div className="adm-card">
        <div className="adm-sec-head">
          <h3>All Bookings ({filteredBookings.length})</h3>
          <div style={{ display: 'flex', gap: 8 }}>
            <select className="adm-select" value={selectedType} onChange={e => setSelectedType(e.target.value)}>
              <option value="All">All Types</option>
              <option value="Therapy">Therapy</option>
              <option value="Shadow Tchr">Shadow Tchr</option>
            </select>
            <select className="adm-select" value={selectedStatus} onChange={e => setSelectedStatus(e.target.value)}>
              <option value="All">All Status</option>
              <option value="Completed">Completed</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>
        <table className="adm-table">
          <thead><tr><th>#</th><th>Patient/Student</th><th>Provider</th><th>Type</th><th>Date</th><th>Mode</th><th>Amount</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {filteredBookings.length === 0
              ? <tr><td colSpan="9" style={{ textAlign: 'center', padding: '20px', color: 'var(--adm-gray)' }}>No bookings found</td></tr>
              : filteredBookings.map(r => (
                <tr key={r.id}>
                  <td style={{ color: 'var(--adm-gray)', fontSize: 11 }}>{r.id}</td>
                  <td><div className="adm-user-cell"><div className="adm-mv" style={{ background: r.c, fontSize: 11 }}>{r.i}</div><div className="adm-user-name">{r.n}</div></div></td>
                  <td>{r.prov}</td>
                  <td><span className={`adm-badge ${r.tC}`}>{r.typ}</span></td>
                  <td>{r.d}</td>
                  <td><span className={`adm-badge ${r.mC}`}>{r.md}</span></td>
                  <td style={{ fontWeight: 700, color: r.aC, fontFamily: 'var(--adm-font-head)' }}>{r.amt}</td>
                  <td><span className={`adm-badge ${r.sC}`}>{r.st}</span></td>
                  <td><button className="adm-btn btn-ghost" style={{ padding: '4px 10px', fontSize: 11 }} onClick={() => setSelectedBooking(r)}>View</button></td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};



/* ════════════════════════════════════════════════════
   SCREEN 3 — SCHOOLS
════════════════════════════════════════════════════ */
const AdminSchools = ({ searchValue = '', onAddSchool }) => {
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingSchool, setEditingSchool] = useState(null);
  const [addingSchool, setAddingSchool] = useState(false);
  const [newSchool, setNewSchool] = useState({ Name: '', Address: '', Special_Need_Prog: '', Rating: '5.0', Website_Link: '', image: null, imagePreview: null });
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [editImage, setEditImage] = useState(null);
  const [editImagePreview, setEditImagePreview] = useState(null);

  // Fetch schools from database
  useEffect(() => {
    fetchSchools();
  }, []);

  const fetchSchools = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE}/modules/school/school`);
      setSchools(response.data || []);
    } catch (err) {
      console.error('Error fetching schools:', err);
      alert('Failed to load schools');
    } finally {
      setLoading(false);
    }
  };

  const filteredSchools = schools.filter(s => {
    const searchLower = searchValue.toLowerCase().trim();
    if (!searchLower) return true;
    return s.Name?.toLowerCase().includes(searchLower) || s.Address?.toLowerCase().includes(searchLower);
  });

  const handleAddSchoolClick = () => {
    setAddingSchool(true);
  };

  const handleImageSelect = (e, isEdit = false) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (isEdit) {
          setEditImage(file);
          setEditImagePreview(reader.result);
        } else {
          setNewSchool({ ...newSchool, image: file, imagePreview: reader.result });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveNewSchool = async () => {
    if (!newSchool.Name?.trim() || !newSchool.Address?.trim() || !newSchool.Website_Link?.trim() || !newSchool.image) {
      alert('Please fill in all fields and select an image');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('Name', newSchool.Name);
      formData.append('Address', newSchool.Address);
      formData.append('Special_Need_Prog', newSchool.Special_Need_Prog);
      formData.append('Rating', newSchool.Rating);
      formData.append('Website_Link', newSchool.Website_Link);
      formData.append('P_ID', 1); // Default parent ID, adjust as needed
      formData.append('image', newSchool.image);

      const response = await axios.post(`${API_BASE}/modules/school/school`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.Status === 'OK') {
        alert('✅ School added successfully!');
        setAddingSchool(false);
        setNewSchool({ Name: '', Address: '', Special_Need_Prog: '', Rating: '5.0', Website_Link: '', image: null, imagePreview: null });
        fetchSchools();
      }
    } catch (err) {
      console.error('Error adding school:', err);
      alert(`❌ Error: ${err.response?.data?.Message || err.message}`);
    }
  };

  const handleEdit = (school) => {
    setEditingSchool({ ...school });
    setEditImage(null);
    setEditImagePreview(null);
  };

  const handleSaveEdit = async () => {
    try {
      const formData = new FormData();
      formData.append('Name', editingSchool.Name);
      formData.append('Address', editingSchool.Address);
      formData.append('Special_Need_Prog', editingSchool.Special_Need_Prog);
      formData.append('Rating', editingSchool.Rating);
      formData.append('Website_Link', editingSchool.Website_Link);
      formData.append('P_ID', editingSchool.P_ID || 1);
      if (editImage) {
        formData.append('image', editImage);
      }

      const response = await axios.put(`${API_BASE}/modules/school/school?id=${editingSchool.School_ID}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.Status === 'OK') {
        alert('✅ School updated successfully!');
        setEditingSchool(null);
        setEditImage(null);
        setEditImagePreview(null);
        fetchSchools();
      }
    } catch (err) {
      console.error('Error updating school:', err);
      alert(`❌ Error: ${err.response?.data?.Message || err.message}`);
    }
  };

  const handleDeleteClick = (school) => {
    setDeleteConfirm(school);
  };

  const handleConfirmDelete = async () => {
    try {
      const response = await axios.delete(`${API_BASE}/modules/school/school?id=${deleteConfirm.School_ID}`);

      if (response.data.Status === 'OK') {
        alert('✅ School removed successfully!');
        setDeleteConfirm(null);
        fetchSchools();
      }
    } catch (err) {
      console.error('Error deleting school:', err);
      alert(`❌ Error: ${err.response?.data?.Message || err.message}`);
    }
  };

  if (loading) {
    return <div className="adm-content"><p style={{ textAlign: 'center', padding: '40px' }}>Loading schools...</p></div>;
  }

  return (
    <div className="adm-content">
      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="adm-modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="adm-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <div className="adm-modal-header">
              <h2>Remove School</h2>
              <button className="adm-modal-close" onClick={() => setDeleteConfirm(null)}>✕</button>
            </div>
            <div className="adm-modal-body" style={{ padding: '20px' }}>
              <p style={{ marginBottom: '20px', color: 'var(--adm-dark)' }}>Are you sure you want to remove <strong>{deleteConfirm.Name}</strong>? This action cannot be undone.</p>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button className="adm-btn btn-ghost" onClick={() => setDeleteConfirm(null)}>Cancel</button>
                <button className="adm-btn btn-red" onClick={handleConfirmDelete}>Remove School</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add School Modal */}
      {addingSchool && (
        <div className="adm-modal-overlay" onClick={() => setAddingSchool(false)}>
          <div className="adm-modal" onClick={e => e.stopPropagation()}>
            <div className="adm-modal-header">
              <h2>Add School</h2>
              <button className="adm-modal-close" onClick={() => setAddingSchool(false)}>✕</button>
            </div>
            <div className="adm-modal-body" style={{ padding: '20px' }}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--adm-gray)', fontWeight: 600, marginBottom: 8 }}>School Name *</label>
                <input type="text" value={newSchool.Name} onChange={(e) => setNewSchool({ ...newSchool, Name: e.target.value })} style={{ width: '100%', padding: '10px 12px', border: '1px solid #e0e0e0', borderRadius: 6, fontSize: 14, boxSizing: 'border-box' }} />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--adm-gray)', fontWeight: 600, marginBottom: 8 }}>Location/Address *</label>
                <input type="text" value={newSchool.Address} onChange={(e) => setNewSchool({ ...newSchool, Address: e.target.value })} style={{ width: '100%', padding: '10px 12px', border: '1px solid #e0e0e0', borderRadius: 6, fontSize: 14, boxSizing: 'border-box' }} />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--adm-gray)', fontWeight: 600, marginBottom: 8 }}>Specialization</label>
                <input type="text" placeholder="e.g. Speech Delay, ADHD" value={newSchool.Special_Need_Prog} onChange={(e) => setNewSchool({ ...newSchool, Special_Need_Prog: e.target.value })} style={{ width: '100%', padding: '10px 12px', border: '1px solid #e0e0e0', borderRadius: 6, fontSize: 14, boxSizing: 'border-box' }} />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--adm-gray)', fontWeight: 600, marginBottom: 8 }}>Rating</label>
                <input type="number" min="0" max="5" step="0.5" value={newSchool.Rating} onChange={(e) => setNewSchool({ ...newSchool, Rating: e.target.value })} style={{ width: '100%', padding: '10px 12px', border: '1px solid #e0e0e0', borderRadius: 6, fontSize: 14, boxSizing: 'border-box' }} />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--adm-gray)', fontWeight: 600, marginBottom: 8 }}>Website *</label>
                <input type="text" placeholder="e.g. example.com" value={newSchool.Website_Link} onChange={(e) => setNewSchool({ ...newSchool, Website_Link: e.target.value })} style={{ width: '100%', padding: '10px 12px', border: '1px solid #e0e0e0', borderRadius: 6, fontSize: 14, boxSizing: 'border-box' }} />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--adm-gray)', fontWeight: 600, marginBottom: 8 }}>School Image *</label>
                <div style={{ border: '2px dashed #ddd', borderRadius: 6, padding: '20px', textAlign: 'center', cursor: 'pointer', background: newSchool.imagePreview ? '#f5f5f5' : '#fafafa' }}>
                  {newSchool.imagePreview ? (
                    <div>
                      <img src={newSchool.imagePreview} alt="preview" style={{ maxHeight: '150px', maxWidth: '100%', marginBottom: '10px' }} />
                      <input type="file" accept="image/*" onChange={(e) => handleImageSelect(e, false)} style={{ fontSize: 12 }} />
                    </div>
                  ) : (
                    <div>
                      <p style={{ margin: '0 0 10px 0', fontSize: 12, color: 'var(--adm-gray)' }}>Click to upload school image</p>
                      <input type="file" accept="image/*" onChange={(e) => handleImageSelect(e, false)} />
                    </div>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button className="adm-btn btn-ghost" onClick={() => setAddingSchool(false)}>Cancel</button>
                <button className="adm-btn btn-purple" onClick={handleSaveNewSchool}>Add School</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit School Modal */}
      {editingSchool && (
        <div className="adm-modal-overlay" onClick={() => setEditingSchool(null)}>
          <div className="adm-modal" onClick={e => e.stopPropagation()}>
            <div className="adm-modal-header">
              <h2>Edit School</h2>
              <button className="adm-modal-close" onClick={() => setEditingSchool(null)}>✕</button>
            </div>
            <div className="adm-modal-body" style={{ padding: '20px' }}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--adm-gray)', fontWeight: 600, marginBottom: 8 }}>School Name</label>
                <input type="text" value={editingSchool.Name} onChange={(e) => setEditingSchool({ ...editingSchool, Name: e.target.value })} style={{ width: '100%', padding: '10px 12px', border: '1px solid #e0e0e0', borderRadius: 6, fontSize: 14, boxSizing: 'border-box' }} />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--adm-gray)', fontWeight: 600, marginBottom: 8 }}>Location/Address</label>
                <input type="text" value={editingSchool.Address} onChange={(e) => setEditingSchool({ ...editingSchool, Address: e.target.value })} style={{ width: '100%', padding: '10px 12px', border: '1px solid #e0e0e0', borderRadius: 6, fontSize: 14, boxSizing: 'border-box' }} />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--adm-gray)', fontWeight: 600, marginBottom: 8 }}>Specialization</label>
                <input type="text" value={editingSchool.Special_Need_Prog} onChange={(e) => setEditingSchool({ ...editingSchool, Special_Need_Prog: e.target.value })} style={{ width: '100%', padding: '10px 12px', border: '1px solid #e0e0e0', borderRadius: 6, fontSize: 14, boxSizing: 'border-box' }} />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--adm-gray)', fontWeight: 600, marginBottom: 8 }}>Rating</label>
                <input type="number" min="0" max="5" step="0.5" value={editingSchool.Rating} onChange={(e) => setEditingSchool({ ...editingSchool, Rating: e.target.value })} style={{ width: '100%', padding: '10px 12px', border: '1px solid #e0e0e0', borderRadius: 6, fontSize: 14, boxSizing: 'border-box' }} />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--adm-gray)', fontWeight: 600, marginBottom: 8 }}>Website</label>
                <input type="text" value={editingSchool.Website_Link} onChange={(e) => setEditingSchool({ ...editingSchool, Website_Link: e.target.value })} style={{ width: '100%', padding: '10px 12px', border: '1px solid #e0e0e0', borderRadius: 6, fontSize: 14, boxSizing: 'border-box' }} />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--adm-gray)', fontWeight: 600, marginBottom: 8 }}>School Image</label>
                <div style={{ border: '2px dashed #ddd', borderRadius: 6, padding: '20px', textAlign: 'center', cursor: 'pointer', background: '#fafafa' }}>
                  {editImagePreview ? (
                    <div>
                      <img src={editImagePreview} alt="preview" style={{ maxHeight: '150px', maxWidth: '100%', marginBottom: '10px' }} />
                      <input type="file" accept="image/*" onChange={(e) => handleImageSelect(e, true)} style={{ fontSize: 12 }} />
                    </div>
                  ) : (
                    <div>
                      <img src={`${API_BASE}/images/${editingSchool.Image}`} alt={editingSchool.Name} style={{ maxHeight: '150px', maxWidth: '100%', marginBottom: '10px' }} />
                      <p style={{ margin: '0 0 10px 0', fontSize: 12, color: 'var(--adm-gray)' }}>Click to change image</p>
                      <input type="file" accept="image/*" onChange={(e) => handleImageSelect(e, true)} />
                    </div>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button className="adm-btn btn-ghost" onClick={() => setEditingSchool(null)}>Cancel</button>
                <button className="adm-btn btn-purple" onClick={handleSaveEdit}>Save Changes</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="adm-stats-grid cols3">
        {[
          { cls: 'sc-purple', icon: 'Building', val: schools.length, label: 'Total Schools Listed', sub: 'Across Egypt' },
          { cls: 'sc-green', icon: 'CheckCircle', val: schools.length, label: 'Verified & Live', sub: 'Publicly visible' },
          { cls: 'sc-orange', icon: 'AlertCircle', val: '0', label: 'Pending Verification', sub: 'Needs review' },
        ].map(s => (
          <div key={s.label} className={`adm-stat ${s.cls}`}>
            <div className="adm-stat__icon"><IconComp icon={s.icon} size={28} color="currentColor" /></div>
            <div className="adm-stat__val">{s.val}</div>
            <div className="adm-stat__label">{s.label}</div>
            <div className="adm-stat__sub">{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="adm-card">
        <div className="adm-sec-head">
          <h3>All Schools ({filteredSchools.length})</h3>
          <button className="adm-btn btn-purple" onClick={handleAddSchoolClick}>+ Add School</button>
        </div>
        <table className="adm-table">
          <thead><tr><th>School Name</th><th>Location</th><th>Specialization</th><th>Rating</th><th>Website</th><th>Actions</th></tr></thead>
          <tbody>
            {filteredSchools.map(r => (
              <tr key={r.School_ID}>
                <td><div className="adm-user-name">{r.Name}</div></td>
                <td>{r.Address}</td>
                <td><span className="adm-badge b-purple" style={{ fontSize: 10 }}>{r.Special_Need_Prog}</span></td>
                <td style={{ color: 'var(--adm-star)', fontWeight: 700 }}>★ {r.Rating}</td>
                <td><a href={`https://${r.Website_Link}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--adm-purple)', textDecoration: 'underline', cursor: 'pointer', fontSize: 13 }}>{r.Website_Link}</a></td>
                <td style={{ display: 'flex', gap: 5 }}><button className="adm-btn btn-ghost" style={{ padding: '4px 10px', fontSize: 11 }} onClick={() => handleEdit(r)}>Edit</button><button className="adm-btn btn-red" style={{ padding: '4px 10px', fontSize: 11 }} onClick={() => handleDeleteClick(r)}>Remove</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* ════════════════════════════════════════════════════
   SCREEN 4 — DONATIONS (API-Connected)
════════════════════════════════════════════════════ */
const AdminDonations = ({ searchValue = '' }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [addingItem, setAddingItem] = useState(false);
  const [showAllPending, setShowAllPending] = useState(false);
  const [savingAction, setSavingAction] = useState(false);
  const [newItem, setNewItem] = useState({
    Item_Name: '',
    Years: '',
    Conditions: 'Good Condition',
    Phone: '',
    Image: null,
    imagePreview: null,
    Description: '',
    Status: 'Active',
    P_ID: 0,
  });

  // Fetch items from backend on mount
  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${API_BASE}/modules/market_place/market_place`, {
        timeout: 5000,
      });
      console.log('✓ Donations fetched:', response.data);
      setItems(response.data || []);
    } catch (err) {
      console.error('Error fetching donations:', err);
      setError('Failed to load donations');
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return 'b-green';
      case 'Pending': return 'b-orange';
      case 'Rejected': return 'b-red';
      default: return 'b-gray';
    }
  };

  const filteredItems = items.filter(item => {
    const searchLower = searchValue.toLowerCase().trim();
    if (!searchLower) return true;
    return item.Item_Name.toLowerCase().includes(searchLower);
  });

  const pendingItems = items.filter(i => i.Status === 'Pending').slice(0, 3);

  const handleEditClick = (item) => {
    setEditingItem({ ...item, imagePreview: null });
  };

  const handleSaveEdit = async () => {
    if (!editingItem.Item_Name.trim()) {
      alert('Item name is required');
      return;
    }

    setSavingAction(true);
    try {
      const formData = new FormData();
      formData.append('Item_Name', editingItem.Item_Name);
      formData.append('Description', editingItem.Description);
      formData.append('Years', editingItem.Years || 'Not specified');
      formData.append('Conditions', editingItem.Conditions);
      formData.append('Phone', editingItem.Phone);
      formData.append('Status', editingItem.Status);
      formData.append('P_ID', editingItem.P_ID);

      if (editingItem.Image instanceof File) {
        formData.append('image', editingItem.Image);
      }

      const response = await axios.put(
        `${API_BASE}/modules/market_place/market_place?id=${editingItem.M_ID}`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      console.log('✓ Item updated:', response.data);
      setItems(items.map(i => i.M_ID === editingItem.M_ID ? { ...editingItem, Image: response.data.Image || editingItem.Image } : i));
      setEditingItem(null);
    } catch (err) {
      console.error('Error updating item:', err);
      alert('Failed to update item');
    } finally {
      setSavingAction(false);
    }
  };

  const handleDeleteItem = async (item) => {
    if (!window.confirm(`Delete "${item.Item_Name}"? This action cannot be undone.`)) return;

    setSavingAction(true);
    try {
      const response = await axios.delete(
        `${API_BASE}/modules/market_place/market_place?id=${item.M_ID}`
      );
      console.log('✓ Item deleted:', response.data);
      setItems(items.filter(i => i.M_ID !== item.M_ID));
    } catch (err) {
      console.error('Error deleting item:', err);
      alert('Failed to delete item');
    } finally {
      setSavingAction(false);
    }
  };

  const handleConfirm = async (item) => {
    setSavingAction(true);
    try {
      const formData = new FormData();
      formData.append('Item_Name', item.Item_Name);
      formData.append('Description', item.Description);
      formData.append('Years', item.Years || 'Not specified');
      formData.append('Conditions', item.Conditions);
      formData.append('Phone', item.Phone);
      formData.append('Status', 'Active');
      formData.append('P_ID', item.P_ID);

      const response = await axios.put(
        `${API_BASE}/modules/market_place/market_place?id=${item.M_ID}`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      console.log('✓ Item confirmed and now visible in Donation page:', response.data);
      setItems(items.map(i => i.M_ID === item.M_ID ? { ...i, Status: 'Active' } : i));
      setShowAllPending(false);
      alert(`"${item.Item_Name}" has been approved and is now visible in the Donation Center!`);
    } catch (err) {
      console.error('Error confirming item:', err);
      alert('Failed to confirm item');
    } finally {
      setSavingAction(false);
    }
  };

  const handleReject = async (item) => {
    if (!window.confirm(`Reject "${item.Item_Name}"?`)) return;

    setSavingAction(true);
    try {
      const response = await axios.delete(
        `${API_BASE}/modules/market_place/market_place?id=${item.M_ID}`
      );
      console.log('✓ Item rejected:', response.data);
      setItems(items.filter(i => i.M_ID !== item.M_ID));
      setShowAllPending(false);
    } catch (err) {
      console.error('Error rejecting item:', err);
      alert('Failed to reject item');
    } finally {
      setSavingAction(false);
    }
  };

  const handleAddItemClick = () => {
    setAddingItem(true);
  };

  const handleImageChange = (e, isEditing = false) => {
    const file = e.target.files[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    if (isEditing) {
      setEditingItem(prev => ({ ...prev, Image: file, imagePreview: previewUrl }));
    } else {
      setNewItem(prev => ({ ...prev, Image: file, imagePreview: previewUrl }));
    }
  };

  const handleSaveNewItem = async () => {
    if (!newItem.Item_Name.trim() || !newItem.Phone.trim() || !newItem.Image) {
      alert('Item name, phone, and image are required');
      return;
    }

    setSavingAction(true);
    try {
      const M_ID = Math.floor(Date.now() / 1000) + Math.floor(Math.random() * 1000);
      const formData = new FormData();
      formData.append('M_ID', M_ID);
      formData.append('Item_Name', newItem.Item_Name);
      formData.append('Description', newItem.Description);
      formData.append('Years', newItem.Years || 'Not specified');
      formData.append('Conditions', newItem.Conditions);
      formData.append('Phone', newItem.Phone);
      formData.append('image', newItem.Image);
      formData.append('Status', newItem.Status);
      formData.append('P_ID', newItem.P_ID || 0);

      const response = await axios.post(
        `${API_BASE}/modules/market_place/market_place`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      console.log('✓ Item added:', response.data);
      fetchItems();
      setAddingItem(false);
      setNewItem({
        Item_Name: '',
        Years: '',
        Conditions: 'Good Condition',
        Phone: '',
        Image: null,
        imagePreview: null,
        Description: '',
        Status: 'Active',
        P_ID: 0,
      });
    } catch (err) {
      console.error('Error adding item:', err);
      alert('Failed to add item');
    } finally {
      setSavingAction(false);
    }
  };

  return (
    <div className="adm-content">
      {/* Add Item Modal */}
      {addingItem && (
        <div className="adm-modal-overlay" onClick={() => setAddingItem(false)}>
          <div className="adm-modal" onClick={e => e.stopPropagation()}>
            <div className="adm-modal-header">
              <h2>Add Item to Donation Center</h2>
              <button className="adm-modal-close" onClick={() => setAddingItem(false)}>✕</button>
            </div>
            <div className="adm-modal-body" style={{ padding: '20px' }}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--adm-gray)', fontWeight: 600, marginBottom: 8 }}>Item Name *</label>
                <input type="text" value={newItem.Item_Name} onChange={(e) => setNewItem({ ...newItem, Item_Name: e.target.value })} placeholder="e.g. Wheelchair, Crutches" style={{ width: '100%', padding: '10px 12px', border: '1px solid #e0e0e0', borderRadius: 6, fontSize: 14, boxSizing: 'border-box' }} />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--adm-gray)', fontWeight: 600, marginBottom: 8 }}>Duration of Use</label>
                <input type="text" value={newItem.Years} onChange={(e) => setNewItem({ ...newItem, Years: e.target.value })} placeholder="e.g. 3 years, 6 months" style={{ width: '100%', padding: '10px 12px', border: '1px solid #e0e0e0', borderRadius: 6, fontSize: 14, boxSizing: 'border-box' }} />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--adm-gray)', fontWeight: 600, marginBottom: 8 }}>Description</label>
                <textarea value={newItem.Description} onChange={(e) => setNewItem({ ...newItem, Description: e.target.value })} placeholder="Describe the item's condition and features..." style={{ width: '100%', padding: '10px 12px', border: '1px solid #e0e0e0', borderRadius: 6, fontSize: 14, boxSizing: 'border-box', fontFamily: 'inherit', minHeight: '80px', resize: 'vertical' }} />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--adm-gray)', fontWeight: 600, marginBottom: 8 }}>Condition *</label>
                <select value={newItem.Conditions} onChange={(e) => setNewItem({ ...newItem, Conditions: e.target.value })} style={{ width: '100%', padding: '10px 12px', border: '1px solid #e0e0e0', borderRadius: 6, fontSize: 14, boxSizing: 'border-box' }}>
                  <option>Still New</option>
                  <option>Like New</option>
                  <option>Good Condition</option>
                  <option>Fair Condition</option>
                  <option>Needs Repair</option>
                </select>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--adm-gray)', fontWeight: 600, marginBottom: 8 }}>Donor Phone *</label>
                <input type="tel" value={newItem.Phone} onChange={(e) => setNewItem({ ...newItem, Phone: e.target.value })} placeholder="e.g. 01001234567" style={{ width: '100%', padding: '10px 12px', border: '1px solid #e0e0e0', borderRadius: 6, fontSize: 14, boxSizing: 'border-box' }} />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--adm-gray)', fontWeight: 600, marginBottom: 8 }}>Item Photo *</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageChange(e, false)}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #e0e0e0', borderRadius: 6, fontSize: 14, boxSizing: 'border-box', cursor: 'pointer' }}
                />
                {newItem.imagePreview && (
                  <div style={{ marginTop: '10px', position: 'relative', width: '80px', height: '80px', borderRadius: 6, overflow: 'hidden', border: '1px solid #e0e0e0' }}>
                    <img src={newItem.imagePreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                )}
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--adm-gray)', fontWeight: 600, marginBottom: 8 }}>Status</label>
                <select value={newItem.Status} onChange={(e) => setNewItem({ ...newItem, Status: e.target.value })} style={{ width: '100%', padding: '10px 12px', border: '1px solid #e0e0e0', borderRadius: 6, fontSize: 14, boxSizing: 'border-box' }}>
                  <option>Active</option>
                  <option>Pending</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button className="adm-btn btn-ghost" onClick={() => setAddingItem(false)} disabled={savingAction}>Cancel</button>
                <button className="adm-btn btn-purple" onClick={handleSaveNewItem} disabled={savingAction}>{savingAction ? 'Adding...' : 'Add Item'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Item Modal */}
      {editingItem && (
        <div className="adm-modal-overlay" onClick={() => setEditingItem(null)}>
          <div className="adm-modal" onClick={e => e.stopPropagation()}>
            <div className="adm-modal-header">
              <h2>Edit Item</h2>
              <button className="adm-modal-close" onClick={() => setEditingItem(null)}>✕</button>
            </div>
            <div className="adm-modal-body" style={{ padding: '20px' }}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--adm-gray)', fontWeight: 600, marginBottom: 8 }}>Item Name</label>
                <input type="text" value={editingItem.Item_Name} onChange={(e) => setEditingItem({ ...editingItem, Item_Name: e.target.value })} style={{ width: '100%', padding: '10px 12px', border: '1px solid #e0e0e0', borderRadius: 6, fontSize: 14, boxSizing: 'border-box' }} />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--adm-gray)', fontWeight: 600, marginBottom: 8 }}>Duration of Use</label>
                <input type="text" value={editingItem.Years || ''} onChange={(e) => setEditingItem({ ...editingItem, Years: e.target.value })} style={{ width: '100%', padding: '10px 12px', border: '1px solid #e0e0e0', borderRadius: 6, fontSize: 14, boxSizing: 'border-box' }} />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--adm-gray)', fontWeight: 600, marginBottom: 8 }}>Description</label>
                <textarea value={editingItem.Description || ''} onChange={(e) => setEditingItem({ ...editingItem, Description: e.target.value })} style={{ width: '100%', padding: '10px 12px', border: '1px solid #e0e0e0', borderRadius: 6, fontSize: 14, boxSizing: 'border-box', fontFamily: 'inherit', minHeight: '80px', resize: 'vertical' }} />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--adm-gray)', fontWeight: 600, marginBottom: 8 }}>Condition</label>
                <select value={editingItem.Conditions} onChange={(e) => setEditingItem({ ...editingItem, Conditions: e.target.value })} style={{ width: '100%', padding: '10px 12px', border: '1px solid #e0e0e0', borderRadius: 6, fontSize: 14, boxSizing: 'border-box' }}>
                  <option>Still New</option>
                  <option>Like New</option>
                  <option>Good Condition</option>
                  <option>Fair Condition</option>
                  <option>Needs Repair</option>
                </select>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--adm-gray)', fontWeight: 600, marginBottom: 8 }}>Donor Phone Number</label>
                <input type="tel" value={editingItem.Phone || ''} onChange={(e) => setEditingItem({ ...editingItem, Phone: e.target.value })} style={{ width: '100%', padding: '10px 12px', border: '1px solid #e0e0e0', borderRadius: 6, fontSize: 14, boxSizing: 'border-box' }} />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--adm-gray)', fontWeight: 600, marginBottom: 8 }}>Item Photo</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageChange(e, true)}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #e0e0e0', borderRadius: 6, fontSize: 14, boxSizing: 'border-box', cursor: 'pointer' }}
                />
                {(editingItem.imagePreview || editingItem.Image) && (
                  <div style={{ marginTop: '10px', position: 'relative', width: '80px', height: '80px', borderRadius: 6, overflow: 'hidden', border: '1px solid #e0e0e0' }}>
                    <img
                      src={editingItem.imagePreview || `${API_BASE}/images/${editingItem.Image}`}
                      alt="Preview"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                )}
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--adm-gray)', fontWeight: 600, marginBottom: 8 }}>Status</label>
                <select value={editingItem.Status} onChange={(e) => setEditingItem({ ...editingItem, Status: e.target.value })} style={{ width: '100%', padding: '10px 12px', border: '1px solid #e0e0e0', borderRadius: 6, fontSize: 14, boxSizing: 'border-box' }}>
                  <option>Active</option>
                  <option>Pending</option>
                  <option>Rejected</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button className="adm-btn btn-ghost" onClick={() => setEditingItem(null)} disabled={savingAction}>Cancel</button>
                <button className="adm-btn btn-purple" onClick={handleSaveEdit} disabled={savingAction}>{savingAction ? 'Saving...' : 'Save Changes'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* See All Pending Modal */}
      {showAllPending && (
        <div className="adm-modal-overlay" onClick={() => setShowAllPending(false)}>
          <div className="adm-modal" onClick={e => e.stopPropagation()}>
            <div className="adm-modal-header">
              <h2>All Items Awaiting Approval ({items.filter(i => i.Status === 'Pending').length})</h2>
              <button className="adm-modal-close" onClick={() => setShowAllPending(false)}>✕</button>
            </div>
            <div className="adm-modal-body" style={{ padding: '20px' }}>
              {items.filter(i => i.Status === 'Pending').length === 0 ? (
                <p style={{ textAlign: 'center', color: 'var(--adm-gray)', padding: '20px' }}>No items awaiting approval</p>
              ) : (
                items.filter(i => i.Status === 'Pending').map(d => (
                  <div key={d.M_ID} className="adm-don-item" style={{ marginBottom: '16px' }}>
                    <div className="adm-don-img">
                      <img
                        src={`${API_BASE}/images/${d.Image}`}
                        alt={d.Item_Name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 4 }}
                      />
                    </div>
                    <div>
                      <div className="adm-don-name">{d.Item_Name}</div>
                      <div className="adm-don-detail">Condition: {d.Conditions}</div>
                      <div className="adm-don-detail">Use: {d.Years}</div>
                    </div>
                    <div className="adm-don-actions">
                      <button className="adm-btn btn-green" style={{ padding: '5px 12px', fontSize: 11 }} onClick={() => handleConfirm(d)} disabled={savingAction}><CheckCircle size={14} style={{ display: 'inline', marginRight: 4 }} />Approve</button>
                      <button className="adm-btn btn-red" style={{ padding: '5px 12px', fontSize: 11 }} onClick={() => handleReject(d)} disabled={savingAction}><AlertCircle size={14} style={{ display: 'inline', marginRight: 4 }} />Reject</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Loading/Error States */}
      {loading && <p style={{ textAlign: 'center', padding: '40px 20px' }}>Loading donations...</p>}
      {error && <p style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--adm-red)' }}>{error}</p>}

      {!loading && !error && (
        <>
          <div className="adm-stats-grid cols4">
            {[
              { cls: 'sc-green', icon: 'Accessibility', val: items.filter(i => i.Status === 'Active').length, label: 'Published Items', sub: 'Visible in Donation Center' },
              { cls: 'sc-teal', icon: 'CheckCircle', val: items.filter(i => i.Status === 'Matched').length || 0, label: 'Completed', sub: 'Items given away' },
              { cls: 'sc-orange', icon: 'AlertCircle', val: items.filter(i => i.Status === 'Pending').length, label: 'Awaiting Approval', sub: 'New donations to review' },
              { cls: 'sc-purple', icon: 'Download', val: items.length, label: 'Total Items', sub: 'In system' },
            ].map(s => (
              <div key={s.label} className={`adm-stat ${s.cls}`}>
                <div className="adm-stat__icon"><IconComp icon={s.icon} size={28} color="currentColor" /></div>
                <div className="adm-stat__val">{s.val}</div>
                <div className="adm-stat__label">{s.label}</div>
                <div className="adm-stat__sub">{s.sub}</div>
              </div>
            ))}
          </div>

          <div className="adm-two-col">
            <div className="adm-card">
              <div className="adm-sec-head">
                <h3>Items Awaiting Approval <span className="adm-badge b-orange" style={{ marginLeft: 6 }}>{pendingItems.length}</span></h3>
                {pendingItems.length > 0 && <button className="adm-link-btn" onClick={() => setShowAllPending(true)}>See all</button>}
              </div>
              {pendingItems.length === 0 ? (
                <p style={{ padding: '20px', textAlign: 'center', color: 'var(--adm-gray)', fontSize: 14 }}>✓ No pending items - all donations approved!</p>
              ) : (
                pendingItems.map(d => (
                  <div key={d.M_ID} className="adm-don-item">
                    <div className="adm-don-img">
                      <img
                        src={`${API_BASE}/images/${d.Image}`}
                        alt={d.Item_Name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 4 }}
                      />
                    </div>
                    <div>
                      <div className="adm-don-name">{d.Item_Name}</div>
                      <div className="adm-don-detail">Condition: {d.Conditions}</div>
                      <div className="adm-don-detail">Use: {d.Years}</div>
                    </div>
                    <div className="adm-don-actions">
                      <button className="adm-btn btn-green" style={{ padding: '5px 12px', fontSize: 11 }} onClick={() => handleConfirm(d)} disabled={savingAction}><CheckCircle size={14} style={{ display: 'inline', marginRight: 4 }} />Approve</button>
                      <button className="adm-btn btn-red" style={{ padding: '5px 12px', fontSize: 11 }} onClick={() => handleReject(d)} disabled={savingAction}><AlertCircle size={14} style={{ display: 'inline', marginRight: 4 }} />Reject</button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="adm-card">
              <div className="adm-sec-head"><h3>All Listed Items ({filteredItems.length})</h3><button className="adm-link-btn" onClick={handleAddItemClick}>+ Add Item</button></div>
              {filteredItems.length === 0 ? (
                <p style={{ padding: '20px', textAlign: 'center', color: 'var(--adm-gray)', fontSize: 14 }}>No items found</p>
              ) : (
                <table className="adm-table">
                  <thead><tr><th>Item</th><th>Use</th><th>Phone</th><th>Condition</th><th>Status</th><th></th></tr></thead>
                  <tbody>
                    {filteredItems.map(d => (
                      <tr key={d.M_ID}>
                        <td style={{ fontWeight: 600, fontSize: 12.5, fontFamily: 'var(--adm-font-head)' }}>{d.Item_Name}</td>
                        <td>{d.Years || '—'}</td>
                        <td style={{ fontSize: 12 }}>{d.Phone || '—'}</td>
                        <td style={{ fontSize: 12 }}>{d.Conditions}</td>
                        <td><span className={`adm-badge ${getStatusColor(d.Status)}`}>{d.Status}</span></td>
                        <td style={{ whiteSpace: 'nowrap' }}>
                          <button className="adm-btn btn-ghost" style={{ padding: '4px 8px', fontSize: 11, marginRight: 6 }} onClick={() => handleEditClick(d)} disabled={savingAction}>Edit</button>
                          <button className="adm-btn btn-red" style={{ padding: '4px 8px', fontSize: 11 }} onClick={() => handleDeleteItem(d)} disabled={savingAction}><Trash2 size={12} style={{ display: 'inline' }} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

/* ════════════════════════════════════════════════════
   SCREEN 5 — COMMUNITY  (fully dynamic)
════════════════════════════════════════════════════ */

/** Keywords that raise a moderation concern */
const FLAG_KEYWORDS = [
  'medication', 'prescription', 'pill', 'drug', 'dosage', 'medicine', 'pharmacy',
  'abuse', 'violence', 'hurt', 'harm', 'dangerous', 'threat', 'attack',
  'emergency', 'crisis', 'help me', 'cannot cope',
  'suicid', 'self-harm', 'self harm', 'overdose', 'end my life', 'kill myself',
  'illegal', 'kill', 'banned', 'prohibited', 'without prescription',
];

const isConcerning = (text = '') => {
  const lower = text.toLowerCase();
  return FLAG_KEYWORDS.some(kw => lower.includes(kw));
};

const AdminCommunity = () => {
  const [allMessages, setAllMessages] = useState([]);
  const [members, setMembers] = useState([]);
  const [flaggedMessages, setFlaggedMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  const [newGroupModalOpen, setNewGroupModalOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [warnModalOpen, setWarnModalOpen] = useState(false);
  const [selectedUserToWarn, setSelectedUserToWarn] = useState(null);
  const [warnText, setWarnText] = useState('');
  const [manageModalOpen, setManageModalOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [msgRes, parentRes] = await Promise.all([
        axios.get(`${API_BASE}/modules/community/community`),
        axios.get(`${API_BASE}/modules/parent/parent`),
      ]);
      const msgs = Array.isArray(msgRes.data) ? msgRes.data : [];
      const parents = Array.isArray(parentRes.data) ? parentRes.data : [];

      const parentMap = {};
      parents.forEach(p => { parentMap[p.P_ID] = p.Full_Name; });

      setAllMessages(msgs);
      setMembers(parents);

      const flagged = msgs
        .filter(m => isConcerning(m.Content))
        .map(m => ({
          id: m.C_ID,
          P_ID: m.P_ID,              // needed to POST the warning back to this parent
          author: parentMap[m.P_ID] || 'Unknown Parent',
          group: 'Group: We Are One',
          msg: `"${m.Content}"`,
          sC: 'b-red',
          st: 'Flagged',
          bC: 'var(--adm-red-pale)',
        }));
      setFlaggedMessages(flagged);
    } catch (err) {
      console.error('Error fetching community data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      await axios.delete(`${API_BASE}/modules/community/community?id=${messageId}`);
      setFlaggedMessages(prev => prev.filter(m => m.id !== messageId));
      setAllMessages(prev => prev.filter(m => m.C_ID !== messageId));
    } catch (err) {
      console.error('Failed to delete message:', err);
      alert('Could not delete the message. Please try again.');
    }
  };

  const handleDismissMessage = (messageId) =>
    setFlaggedMessages(prev => prev.filter(m => m.id !== messageId));

  const handleWarnUser = (message) => {
    setSelectedUserToWarn(message);
    setWarnText('');
    setWarnModalOpen(true);
  };

  const handleManageGroup = (group) => { setSelectedGroup(group); setManageModalOpen(true); };
  const handleCreateNewGroup = () => { setNewGroupName(''); setNewGroupDesc(''); setNewGroupModalOpen(false); };

  const totalMessages = allMessages.length;
  const totalMembers = members.length;
  const groups = [{ n: 'We Are One', sub: 'General parent community', m: totalMembers, msg: totalMessages }];

  if (loading) return <div className="adm-content"><p style={{ textAlign: 'center', padding: '40px' }}>Loading community data…</p></div>;

  return (
    <div className="adm-content">

      {newGroupModalOpen && (
        <div className="adm-modal-overlay" onClick={() => setNewGroupModalOpen(false)}>
          <div className="adm-modal" onClick={e => e.stopPropagation()}>
            <div className="adm-modal-header"><h2>Create New Group</h2><button className="adm-modal-close" onClick={() => setNewGroupModalOpen(false)}>✕</button></div>
            <div className="adm-modal-body" style={{ padding: '20px' }}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--adm-gray)', fontWeight: 600, marginBottom: 8 }}>Group Name</label>
                <input type="text" placeholder="Enter group name..." value={newGroupName} onChange={e => setNewGroupName(e.target.value)} style={{ width: '100%', padding: '10px 12px', border: '1px solid #e0e0e0', borderRadius: 6, fontSize: 14, boxSizing: 'border-box', fontFamily: 'inherit' }} />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--adm-gray)', fontWeight: 600, marginBottom: 8 }}>Description</label>
                <textarea placeholder="Enter group description..." value={newGroupDesc} onChange={e => setNewGroupDesc(e.target.value)} style={{ width: '100%', padding: '10px 12px', border: '1px solid #e0e0e0', borderRadius: 6, fontSize: 14, boxSizing: 'border-box', fontFamily: 'inherit', minHeight: '80px', resize: 'vertical' }} />
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button className="adm-btn btn-ghost" onClick={() => setNewGroupModalOpen(false)}>Cancel</button>
                <button className="adm-btn btn-purple" onClick={handleCreateNewGroup} disabled={!newGroupName.trim()} style={{ opacity: !newGroupName.trim() ? 0.5 : 1 }}>Create Group</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {warnModalOpen && selectedUserToWarn && (
        <div className="adm-modal-overlay" onClick={() => setWarnModalOpen(false)}>
          <div className="adm-modal" onClick={e => e.stopPropagation()}>
            <div className="adm-modal-header">
              <h2>Warn User: {selectedUserToWarn.author}</h2>
              <button className="adm-modal-close" onClick={() => setWarnModalOpen(false)}>✕</button>
            </div>
            <div className="adm-modal-body" style={{ padding: '20px' }}>
              <div style={{ marginBottom: '12px', padding: '12px', background: 'var(--adm-red-pale)', borderRadius: 8, fontSize: 13, color: 'var(--adm-dark)' }}>
                <strong>Flagged message:</strong> {selectedUserToWarn.msg}
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--adm-gray)', fontWeight: 600, marginBottom: 8 }}>Warning Message</label>
                <textarea
                  placeholder="Type the warning message to send to the user..."
                  value={warnText}
                  onChange={e => setWarnText(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #e0e0e0', borderRadius: 6, fontSize: 14, boxSizing: 'border-box', fontFamily: 'inherit', minHeight: '100px', resize: 'vertical' }}
                />
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button className="adm-btn btn-ghost" onClick={() => setWarnModalOpen(false)}>Cancel</button>
                <button
                  className="adm-btn btn-orange"
                  disabled={!warnText.trim()}
                  style={{ opacity: !warnText.trim() ? 0.5 : 1 }}
                  onClick={async () => {
                    try {
                      await axios.post(`${API_BASE}/modules/community/community`, {
                        Content: `ADMIN_WARNING: ${warnText.trim()}`,
                        P_ID: selectedUserToWarn.P_ID,
                      });
                      setWarnModalOpen(false);
                      setWarnText('');
                      alert(`✅ Warning sent to ${selectedUserToWarn.author}`);
                    } catch (err) {
                      console.error('Failed to send warning:', err);
                      alert('❌ Could not send warning. Please try again.');
                    }
                  }}
                >
                  Send Warning
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {manageModalOpen && selectedGroup && (
        <div className="adm-modal-overlay" onClick={() => setManageModalOpen(false)}>
          <div className="adm-modal" onClick={e => e.stopPropagation()}>
            <div className="adm-modal-header"><h2>Manage {selectedGroup.n}</h2><button className="adm-modal-close" onClick={() => setManageModalOpen(false)}>✕</button></div>
            <div className="adm-modal-body" style={{ padding: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--adm-gray)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6, fontWeight: 600 }}>Members</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--adm-dark)' }}>{selectedGroup.m}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--adm-gray)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6, fontWeight: 600 }}>Total Messages</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--adm-dark)' }}>{selectedGroup.msg}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--adm-gray)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6, fontWeight: 600 }}>Flagged</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--adm-red)' }}>{flaggedMessages.length}</div>
                </div>
              </div>
              <div style={{ fontSize: 11, color: 'var(--adm-gray)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6, fontWeight: 600 }}>Description</div>
              <div style={{ fontSize: 14, color: 'var(--adm-dark)', marginBottom: 20 }}>{selectedGroup.sub}</div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button className="adm-btn btn-ghost" onClick={() => setManageModalOpen(false)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Live stat cards */}
      <div className="adm-stats-grid cols4">
        {[
          { cls: 'sc-purple', icon: 'Users', val: groups.length, label: 'Active Groups', sub: 'We Are One community' },
          { cls: 'sc-teal', icon: 'MessageSquare', val: totalMessages, label: 'Total Messages', sub: 'In We Are One group' },
          { cls: 'sc-red', icon: 'Flag', val: flaggedMessages.length, label: 'Flagged Messages', sub: flaggedMessages.length > 0 ? 'Needs moderation' : 'All clear' },
          { cls: 'sc-green', icon: 'User', val: totalMembers, label: 'Active Members', sub: 'We Are One members' },
        ].map(s => (
          <div key={s.label} className={`adm-stat ${s.cls}`}>
            <div className="adm-stat__icon"><IconComp icon={s.icon} size={28} color="currentColor" /></div>
            <div className="adm-stat__val">{s.val}</div>
            <div className="adm-stat__label">{s.label}</div>
            <div className="adm-stat__sub">{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="adm-two-col">
        {/* Flagged messages */}
        <div className="adm-card">
          <div className="adm-sec-head">
            <h3><Flag size={18} style={{ display: 'inline', marginRight: 8 }} />Flagged Messages</h3>
            <span className="adm-badge b-red">{flaggedMessages.length} pending</span>
          </div>
          <div style={{ padding: '14px 22px' }}>
            {flaggedMessages.length > 0 ? flaggedMessages.map(m => (
              <div key={m.id} className="adm-mod-card" style={{ borderColor: m.bC }}>
                <div className="adm-mod-card-head">
                  <div><div className="adm-mod-author">{m.author}</div><div className="adm-mod-group">{m.group}</div></div>
                  <span className={`adm-badge ${m.sC}`}>{m.st}</span>
                </div>
                <div className="adm-mod-msg">{m.msg}</div>
                <div className="adm-mod-actions">
                  <button className="adm-btn btn-red" onClick={() => handleDeleteMessage(m.id)}>
                    <Trash2 size={14} style={{ display: 'inline', marginRight: 4 }} />Delete
                  </button>
                  <button className="adm-btn btn-ghost" onClick={() => handleWarnUser(m)}>Warn User</button>
                  <button className="adm-btn btn-green" style={{ fontSize: 11 }} onClick={() => handleDismissMessage(m.id)}>
                    <CheckCircle size={14} style={{ display: 'inline', marginRight: 4 }} />Dismiss
                  </button>
                </div>
              </div>
            )) : (
              <div style={{ padding: '30px', textAlign: 'center', color: 'var(--adm-gray)' }}>
                <CheckCircle size={32} style={{ marginBottom: 8, opacity: 0.4, display: 'block', margin: '0 auto 8px' }} />
                No flagged messages — community is all clear!
              </div>
            )}
          </div>
        </div>

        {/* Community groups table */}
        <div className="adm-card">
          <div className="adm-sec-head">
            <h3>Community Groups</h3>
            <button className="adm-link-btn" onClick={() => setNewGroupModalOpen(true)}>+ New Group</button>
          </div>
          <table className="adm-table">
            <thead><tr><th>Group Name</th><th>Members</th><th>Messages</th><th></th></tr></thead>
            <tbody>
              {groups.map(g => (
                <tr key={g.n}>
                  <td><div className="adm-user-name">{g.n}</div><div className="adm-user-sub">{g.sub}</div></td>
                  <td>{g.m}</td>
                  <td>{g.msg}</td>
                  <td><button className="adm-btn btn-ghost" style={{ padding: '4px 10px', fontSize: 11 }} onClick={() => handleManageGroup(g)}>Manage</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

/* ════════════════════════════════════════════════════
   SCREEN 6 — REPORTS
════════════════════════════════════════════════════ */
const AdminReports = () => {
  const [loading, setLoading] = useState(true);
  const [rd, setRd] = useState({ totalUsers: 0, totalSessions: 0, totalRevenue: 0, completedSessions: 0, cancelledSessions: 0, therapySessions: 0, shadowSessions: 0, completionRate: 0, cancellationRate: 0 });

  useEffect(() => {
    const fetchReportData = async () => {
      try {
        const [pRes, tRes, stRes, bRes] = await Promise.all([
          axios.get(`${API_BASE}/modules/parent/parent`).catch(() => ({ data: [] })),
          axios.get(`${API_BASE}/modules/therapist/therapist`).catch(() => ({ data: [] })),
          axios.get(`${API_BASE}/modules/shadow_teacher/shadow_teacher`).catch(() => ({ data: [] })),
          axios.get(`${API_BASE}/modules/booking/all-bookings`).catch(() => ({ data: [] })),
        ]);
        const parents = Array.isArray(pRes.data) ? pRes.data : [];
        const therapists = Array.isArray(tRes.data) ? tRes.data : [];
        const sts = Array.isArray(stRes.data) ? stRes.data : [];
        const bookings = Array.isArray(bRes.data) ? bRes.data : [];

        const totalRevenue = bookings.reduce((s, b) => s + (parseFloat(b.Session_price) || 0), 0);
        const completed = bookings.filter(b => (b.Booking_status || '').toLowerCase() === 'completed').length;
        const cancelled = bookings.filter(b => (b.Booking_status || '').toLowerCase() === 'cancelled').length;
        const therapy = bookings.filter(b => b.T_ID && !b.ST_ID).length;
        const shadow = bookings.filter(b => b.ST_ID && !b.T_ID).length;
        const n = bookings.length || 1;

        setRd({
          totalUsers: parents.length + therapists.length + sts.length,
          totalSessions: bookings.length,
          totalRevenue,
          completedSessions: completed,
          cancelledSessions: cancelled,
          therapySessions: therapy,
          shadowSessions: shadow,
          completionRate: ((completed / n) * 100).toFixed(0),
          cancellationRate: ((cancelled / n) * 100).toFixed(0),
        });
      } catch (err) {
        console.error('Reports fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchReportData();
  }, []);

  if (loading) return <div className="adm-content"><p style={{ textAlign: 'center', padding: '40px' }}>Loading reports...</p></div>;

  const therapyRevPct = rd.totalSessions > 0 ? Math.round((rd.therapySessions / rd.totalSessions) * 100) : 50;
  const shadowRevPct = 100 - therapyRevPct;

  return (
    <div className="adm-content">
      <div className="adm-stats-grid cols6">
        {[
          { cls: 'sc-purple', val: rd.totalUsers.toLocaleString(), label: 'Total Users', sub: 'All roles combined' },
          { cls: 'sc-teal', val: rd.totalSessions.toLocaleString(), label: 'Sessions', sub: 'All booking types' },
          { cls: 'sc-orange', val: `EGP ${rd.totalRevenue.toLocaleString()}`, label: 'Revenue', sub: 'Sum of session prices' },
          { cls: 'sc-green', val: `${rd.completionRate}%`, label: 'Completion Rate', sub: `${rd.completedSessions} completed` },
          { cls: 'sc-blue', val: '—', label: 'Avg. Rating', sub: 'Coming soon' },
          { cls: 'sc-red', val: `${rd.cancellationRate}%`, label: 'Cancellation', sub: `${rd.cancelledSessions} cancelled` },
        ].map(s => (
          <div key={s.label} className={`adm-stat ${s.cls}`}>
            <div className="adm-stat__val" style={{ fontSize: 20 }}>{s.val}</div>
            <div className="adm-stat__label">{s.label}</div>
            <div className="adm-stat__sub">{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="adm-two-col">
        <div className="adm-card">
          <div className="adm-sec-head"><h3>Sessions by Type</h3></div>
          <div className="adm-chart-area">
            {[
              ['Therapy Sessions', rd.therapySessions, rd.totalSessions, 'var(--adm-purple)'],
              ['Shadow Teacher Sessions', rd.shadowSessions, rd.totalSessions, 'var(--adm-teal)'],
              ['Completed', rd.completedSessions, rd.totalSessions, 'var(--adm-green)'],
              ['Cancelled', rd.cancelledSessions, rd.totalSessions, 'var(--adm-red)'],
            ].map(([l, val, total, c]) => (
              <div key={l} className="adm-chart-row">
                <div className="adm-chart-label">{l}</div>
                <div className="adm-chart-bar-bg"><div className="adm-chart-bar" style={{ width: total > 0 ? `${Math.round(val / total * 100)}%` : '0%', background: c }} /></div>
                <div className="adm-chart-val">{val}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="adm-card">
          <div className="adm-sec-head"><h3>Revenue Breakdown</h3></div>
          <div className="adm-chart-area">
            {[
              ['Therapy', `${therapyRevPct}%`, 'var(--adm-purple)', `EGP ${Math.round(rd.totalRevenue * therapyRevPct / 100).toLocaleString()}`],
              ['Shadow Tchr', `${shadowRevPct}%`, 'var(--adm-teal)', `EGP ${Math.round(rd.totalRevenue * shadowRevPct / 100).toLocaleString()}`],
            ].map(([l, w, c, v]) => (
              <div key={l} className="adm-chart-row">
                <div className="adm-chart-label">{l}</div>
                <div className="adm-chart-bar-bg"><div className="adm-chart-bar" style={{ width: w, background: c }} /></div>
                <div className="adm-chart-val">{v}</div>
              </div>
            ))}
          </div>
          <div style={{ borderTop: '1px solid var(--adm-bg-gray)', padding: '12px 22px' }}>
            <div className="adm-chart-row">
              <div className="adm-chart-label">Total Revenue</div>
              <div style={{ flex: 1 }}></div>
              <div className="adm-chart-val" style={{ color: 'var(--adm-green)', fontWeight: 700 }}>EGP {rd.totalRevenue.toLocaleString()}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="adm-card">
        <div className="adm-sec-head"><h3>Booking Status Overview</h3></div>
        <div className="adm-chart-area">
          {[
            ['Completed', rd.completedSessions, 'var(--adm-green)'],
            ['Active / Confirmed', rd.totalSessions - rd.completedSessions - rd.cancelledSessions, 'var(--adm-teal)'],
            ['Cancelled', rd.cancelledSessions, 'var(--adm-red)'],
          ].map(([l, val, c]) => (
            <div key={l} className="adm-chart-row">
              <div className="adm-chart-label">{l}</div>
              <div className="adm-chart-bar-bg"><div className="adm-chart-bar" style={{ width: rd.totalSessions > 0 ? `${Math.round(Math.max(0, val) / rd.totalSessions * 100)}%` : '0%', background: c }} /></div>
              <div className="adm-chart-val">{Math.max(0, val)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};


/* ════════════════════════════════════════════════════
   SCREEN 7 — SETTINGS  (toggle groups)
════════════════════════════════════════════════════ */
const ToggleGroup = ({ items }) => {
  const [vals, setVals] = useState(items.map(i => i.def));
  return (
    <>
      {items.map((item, i) => (
        <div key={item.title} className="adm-setting-row">
          <div className="adm-setting-info"><h4>{item.title}</h4><p>{item.desc}</p></div>
          <AdminToggle value={vals[i]} onChange={v => setVals(prev => { const n = [...prev]; n[i] = v; return n; })} />
        </div>
      ))}
    </>
  );
};

const AdminSettings = () => {
  const { settings, saveSettings } = usePlatformSettings();
  const [platformCommission, setPlatformCommission] = useState(settings.platformCommission.toString());
  const [cancellationWindow, setCancellationWindow] = useState(settings.cancellationWindow.toString());
  const [instapayEnabled, setInstapayEnabled] = useState(settings.instapayEnabled);
  const [visaEnabled, setVisaEnabled] = useState(settings.visaEnabled);
  const [saveMessage, setSaveMessage] = useState('');

  // Admin Accounts
  const [admins, setAdmins] = useState([]);
  const [adminsLoading, setAdminsLoading] = useState(true);
  const [addAdminModal, setAddAdminModal] = useState(false);
  const [editAdminModal, setEditAdminModal] = useState(false);
  const [newAdmin, setNewAdmin] = useState({ Admin_ID: '', Email: '', Password: '' });
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [adminSaving, setAdminSaving] = useState(false);

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      setAdminsLoading(true);
      const res = await axios.get(`${API_BASE}/modules/admin/Admin`);
      setAdmins(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to fetch admins:', err);
    } finally {
      setAdminsLoading(false);
    }
  };

  const handleAddAdmin = async () => {
    if (!newAdmin.Admin_ID.trim() || !newAdmin.Email.trim() || !newAdmin.Password.trim()) {
      alert('Admin ID, Email, and Password are all required.');
      return;
    }
    setAdminSaving(true);
    try {
      await axios.post(`${API_BASE}/modules/admin/Admin`, {
        Admin_ID: Number(newAdmin.Admin_ID),
        Email: newAdmin.Email,
        Password: newAdmin.Password,
      });
      setAddAdminModal(false);
      setNewAdmin({ Admin_ID: '', Email: '', Password: '' });
      fetchAdmins();
    } catch (err) {
      alert(`❌ Failed to add admin: ${err.response?.data?.Message || err.message}`);
    } finally {
      setAdminSaving(false);
    }
  };

  const handleRemoveAdmin = async (admin) => {
    if (!window.confirm(`Remove admin "${admin.Email}"? This cannot be undone.`)) return;
    try {
      await axios.delete(`${API_BASE}/modules/admin/Admin?id=${admin.Admin_ID}`);
      setAdmins(prev => prev.filter(a => a.Admin_ID !== admin.Admin_ID));
    } catch (err) {
      alert(`❌ Failed to remove admin: ${err.response?.data?.Message || err.message}`);
    }
  };

  const handleEditAdmin = (admin) => {
    setEditingAdmin({ ...admin, Password: '' }); // Don't show password for security, let them enter new one
    setEditAdminModal(true);
  };

  const handleUpdateAdmin = async () => {
    if (!editingAdmin.Email.trim() || !editingAdmin.Password.trim()) {
      alert('Email and Password are required to update.');
      return;
    }
    setAdminSaving(true);
    try {
      await axios.put(`${API_BASE}/modules/admin/Admin?id=${editingAdmin.Admin_ID}`, {
        Email: editingAdmin.Email,
        Password: editingAdmin.Password,
      });
      setEditAdminModal(false);
      setEditingAdmin(null);
      fetchAdmins();
      alert('✅ Admin account updated successfully!');
    } catch (err) {
      alert(`❌ Failed to update admin: ${err.response?.data?.Message || err.message}`);
    } finally {
      setAdminSaving(false);
    }
  };

  const AVATAR_COLORS = ['var(--adm-purple)', 'var(--adm-teal)', 'var(--adm-orange)', 'var(--adm-red)', 'var(--adm-green)'];
  const initials = (email) => email ? email.slice(0, 2).toUpperCase() : '??';

  const handleSaveChanges = () => {
    const updated = {
      platformCommission: parseFloat(platformCommission) || 15,
      cancellationWindow: parseInt(cancellationWindow) || 24,
      instapayEnabled,
      visaEnabled,
    };
    saveSettings(updated);
    setSaveMessage('All changes saved successfully!');
    setTimeout(() => setSaveMessage(''), 3000);
  };

  return (
    <div className="adm-content">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div></div>
        <button className="adm-btn btn-purple" onClick={handleSaveChanges} style={{ fontSize: 14, fontWeight: 600 }}>Save All Changes</button>
      </div>
      <div className="adm-two-col">
        {/* Left */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="adm-card">
            <div className="adm-sec-head"><h3>Platform Features</h3></div>
            <ToggleGroup items={[
              { title: 'Therapist Bookings', desc: 'Allow parents to book therapy sessions', def: true },
              { title: 'Shadow Teacher Bookings', desc: 'Allow parents to book shadow teacher services', def: true },
              { title: 'Donation Center', desc: 'Allow users to donate and receive items', def: true },
              { title: 'Community Center', desc: 'Allow parents to access and join groups', def: true },
              { title: 'Communication Tools (AAC)', desc: 'Enable the AAC visual communication board', def: true },
              { title: 'Newsletter Signups', desc: 'Allow users to subscribe to newsletter', def: false },
            ]} />
          </div>
          <div className="adm-card">
            <div className="adm-sec-head"><h3>Verification Requirements</h3></div>
            <ToggleGroup items={[
              { title: 'Manual Therapist Verification', desc: 'Admin must review & approve all therapist accounts', def: true },
              { title: 'Manual Shadow Teacher Verification', desc: 'Admin must review & approve all shadow teacher accounts', def: true },
            ]} />
          </div>
        </div>

        {/* Right */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="adm-card">
            <div className="adm-sec-head"><h3>Payment Settings</h3></div>
            <div style={{ padding: '16px 22px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--adm-gray)', textTransform: 'uppercase', letterSpacing: '.4px', fontFamily: 'var(--adm-font-head)' }}>Platform Commission (%)</label>
                <input type="number" min="0" max="100" value={platformCommission} onChange={(e) => setPlatformCommission(e.target.value)} style={{ padding: '9px 12px', border: '1.5px solid var(--adm-bg-gray)', borderRadius: 8, fontSize: 13, fontFamily: 'var(--adm-font-body)', outline: 'none', color: 'var(--adm-dark)' }} />
                <div style={{ fontSize: 11, color: 'var(--adm-gray)', marginTop: 4 }}>This percentage will be deducted from therapist and shadow teacher earnings</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--adm-gray)', textTransform: 'uppercase', letterSpacing: '.4px', fontFamily: 'var(--adm-font-head)' }}>Default Cancellation Window (hours)</label>
                <input type="number" min="1" value={cancellationWindow} onChange={(e) => setCancellationWindow(e.target.value)} style={{ padding: '9px 12px', border: '1.5px solid var(--adm-bg-gray)', borderRadius: 8, fontSize: 13, fontFamily: 'var(--adm-font-body)', outline: 'none', color: 'var(--adm-dark)' }} />
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button
                  onClick={() => setInstapayEnabled(!instapayEnabled)}
                  className="adm-pay-badge"
                  style={{ opacity: instapayEnabled ? 1 : 0.5, cursor: 'pointer', border: '2px solid var(--adm-bg-gray)', transition: 'all 0.2s' }}
                >
                  <span>💳</span>Instapay {instapayEnabled ? 'Enabled' : 'Disabled'}
                </button>
                <button
                  onClick={() => setVisaEnabled(!visaEnabled)}
                  className="adm-pay-badge"
                  style={{ opacity: visaEnabled ? 1 : 0.5, cursor: 'pointer', border: '2px solid var(--adm-bg-gray)', transition: 'all 0.2s' }}
                >
                  <span>💳</span>Visa {visaEnabled ? 'Enabled' : 'Disabled'}
                </button>
              </div>
            </div>
          </div>

          {/* Add Admin Modal */}
          {addAdminModal && (
            <div className="adm-modal-overlay" onClick={() => setAddAdminModal(false)}>
              <div className="adm-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
                <div className="adm-modal-header">
                  <h2>Add Admin Account</h2>
                  <button className="adm-modal-close" onClick={() => setAddAdminModal(false)}>✕</button>
                </div>
                <div className="adm-modal-body" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--adm-gray)', textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: 6 }}>Admin ID *</label>
                    <input type="number" value={newAdmin.Admin_ID} onChange={e => setNewAdmin({ ...newAdmin, Admin_ID: e.target.value })} placeholder="e.g. 3" style={{ width: '100%', padding: '10px 12px', border: '1.5px solid var(--adm-bg-gray)', borderRadius: 8, fontSize: 13, boxSizing: 'border-box', fontFamily: 'var(--adm-font-body)' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--adm-gray)', textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: 6 }}>Email *</label>
                    <input type="email" value={newAdmin.Email} onChange={e => setNewAdmin({ ...newAdmin, Email: e.target.value })} placeholder="admin@careconnect.eg" style={{ width: '100%', padding: '10px 12px', border: '1.5px solid var(--adm-bg-gray)', borderRadius: 8, fontSize: 13, boxSizing: 'border-box', fontFamily: 'var(--adm-font-body)' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--adm-gray)', textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: 6 }}>Password *</label>
                    <input type="password" value={newAdmin.Password} onChange={e => setNewAdmin({ ...newAdmin, Password: e.target.value })} placeholder="Secure password" style={{ width: '100%', padding: '10px 12px', border: '1.5px solid var(--adm-bg-gray)', borderRadius: 8, fontSize: 13, boxSizing: 'border-box', fontFamily: 'var(--adm-font-body)' }} />
                  </div>
                  <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
                    <button className="adm-btn btn-ghost" onClick={() => setAddAdminModal(false)} disabled={adminSaving}>Cancel</button>
                    <button className="adm-btn btn-purple" onClick={handleAddAdmin} disabled={adminSaving}>{adminSaving ? 'Adding...' : 'Add Admin'}</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Edit Admin Modal */}
          {editAdminModal && editingAdmin && (
            <div className="adm-modal-overlay" onClick={() => setEditAdminModal(false)}>
              <div className="adm-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
                <div className="adm-modal-header">
                  <h2>Edit Admin Account</h2>
                  <button className="adm-modal-close" onClick={() => setEditAdminModal(false)}>✕</button>
                </div>
                <div className="adm-modal-body" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--adm-gray)', textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: 6 }}>Admin ID</label>
                    <input type="text" value={editingAdmin.Admin_ID} disabled style={{ width: '100%', padding: '10px 12px', border: '1.5px solid var(--adm-bg-gray)', borderRadius: 8, fontSize: 13, boxSizing: 'border-box', fontFamily: 'var(--adm-font-body)', background: '#f5f5f5', color: '#999' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--adm-gray)', textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: 6 }}>Email *</label>
                    <input type="email" value={editingAdmin.Email} onChange={e => setEditingAdmin({ ...editingAdmin, Email: e.target.value })} placeholder="admin@careconnect.eg" style={{ width: '100%', padding: '10px 12px', border: '1.5px solid var(--adm-bg-gray)', borderRadius: 8, fontSize: 13, boxSizing: 'border-box', fontFamily: 'var(--adm-font-body)' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--adm-gray)', textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: 6 }}>New Password *</label>
                    <input type="password" value={editingAdmin.Password} onChange={e => setEditingAdmin({ ...editingAdmin, Password: e.target.value })} placeholder="Enter new secure password" style={{ width: '100%', padding: '10px 12px', border: '1.5px solid var(--adm-bg-gray)', borderRadius: 8, fontSize: 13, boxSizing: 'border-box', fontFamily: 'var(--adm-font-body)' }} />
                  </div>
                  <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
                    <button className="adm-btn btn-ghost" onClick={() => setEditAdminModal(false)} disabled={adminSaving}>Cancel</button>
                    <button className="adm-btn btn-purple" onClick={handleUpdateAdmin} disabled={adminSaving}>{adminSaving ? 'Updating...' : 'Save Changes'}</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="adm-card">
            <div className="adm-sec-head"><h3>Admin Accounts</h3><button className="adm-link-btn" onClick={() => setAddAdminModal(true)}>+ Add Admin</button></div>
            {adminsLoading ? (
              <p style={{ padding: '16px 22px', color: 'var(--adm-gray)', fontSize: 13 }}>Loading admins...</p>
            ) : (
              <table className="adm-table">
                <thead><tr><th>Email</th><th>Admin ID</th><th>Role</th><th></th></tr></thead>
                <tbody>
                  {admins.length === 0 ? (
                    <tr><td colSpan="4" style={{ textAlign: 'center', padding: '16px', color: 'var(--adm-gray)' }}>No admin accounts found</td></tr>
                  ) : admins.map((a, idx) => (
                    <tr key={a.Admin_ID}>
                      <td>
                        <div className="adm-user-cell">
                          <div className="adm-mv" style={{ background: AVATAR_COLORS[idx % AVATAR_COLORS.length] }}>{initials(a.Email)}</div>
                          <div>
                            <div className="adm-user-name">{a.Email}</div>
                            <div className="adm-user-sub">ID: {a.Admin_ID}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ color: 'var(--adm-gray)', fontSize: 12 }}>#{a.Admin_ID}</td>
                      <td><span className="adm-badge b-purple">Admin</span></td>
                      <td style={{ display: 'flex', gap: 8 }}>
                        <button
                          className="adm-btn btn-ghost"
                          style={{ padding: '4px 10px', fontSize: 11, background: 'var(--adm-purple-pale)', color: 'var(--adm-purple)', border: 'none' }}
                          onClick={() => handleEditAdmin(a)}
                        >
                          Edit
                        </button>
                        <button
                          className="adm-btn btn-red"
                          style={{ padding: '4px 10px', fontSize: 11 }}
                          onClick={() => handleRemoveAdmin(a)}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="adm-card">
            <div className="adm-sec-head"><h3>Notifications & Alerts</h3></div>
            <ToggleGroup items={[
              { title: 'Email alerts for new verifications', desc: 'Get notified when a new provider registers', def: true },
              { title: 'Flagged content alerts', desc: 'Immediate notification for flagged community posts', def: true },
              { title: 'Daily revenue digest', desc: 'Summary email every morning at 8:00 AM', def: false },
            ]} />
          </div>
        </div>
      </div>
      {saveMessage && <div style={{ position: 'fixed', bottom: 20, right: 20, background: 'var(--adm-green)', color: 'white', padding: '12px 20px', borderRadius: 8, fontSize: 14, fontWeight: 600 }}>{saveMessage}</div>}
    </div>
  );
};

/* ════════════════════════════════════════════════════
   SCREEN 8 — Communication tools
════════════════════════════════════════════════════ */
const BASE_URL = `${API_BASE}/modules/communicationtool`;

const AdminCommunicationTools = () => {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQ, setSearchQ] = useState('');
  const [modal, setModal] = useState(null);   // null | 'add' | 'edit'
  const [selected, setSelected] = useState(null);   // card being edited
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);   // { msg, type }

  // Form state
  const [form, setForm] = useState({ CT_ID: '', Phrase: '', Button_Label: '', Icon_Image: '' });
  const [imgTab, setImgTab] = useState('upload');   // 'upload' | 'url'
  const [imgFile, setImgFile] = useState(null);       // raw File object for multipart upload

  /* ── helpers ── */
  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchCards = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${BASE_URL}/communication_tool`);
      setCards(res.data);
    } catch (e) {
      setError('Failed to load communication tools. Is the server running?');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCards(); }, []);

  const openAdd = () => {
    setForm({ CT_ID: '', Phrase: '', Button_Label: '', Icon_Image: '' });
    setImgTab('upload');
    setImgFile(null);
    setSelected(null);
    setModal('add');
  };

  const openEdit = (card) => {
    setSelected(card);
    // Icon_Image in DB is now a filename; show it via the images server URL for preview
    const previewSrc = card.Icon_Image
      ? (card.Icon_Image.startsWith('http') ? card.Icon_Image : `${API_BASE}/images/${card.Icon_Image}`)
      : '';
    setForm({ CT_ID: card.CT_ID, Phrase: card.Phrase, Button_Label: card.Button_Label, Icon_Image: previewSrc });
    setImgTab('upload');
    setImgFile(null);
    setModal('edit');
  };

  const closeModal = () => { setModal(null); setSelected(null); };

  const handleSave = async () => {
    if (!form.Phrase.trim() || !form.Button_Label.trim()) {
      showToast('Phrase and Button Label are required.', 'error');
      return;
    }
    if (modal === 'add' && !imgFile) {
      showToast('Please upload an image file.', 'error');
      return;
    }
    setSaving(true);
    try {
      if (modal === 'add') {
        /* ── ADD: always multipart (image required) ── */
        const fd = new FormData();
        fd.append('Phrase', form.Phrase);
        fd.append('Button_Label', form.Button_Label);
        fd.append('image', imgFile);
        await axios.post(`${BASE_URL}/communication_tool`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        showToast('Card added successfully!');

      } else if (imgFile) {
        /* ── EDIT with new image: multipart ── */
        const fd = new FormData();
        fd.append('Phrase', form.Phrase);
        fd.append('Button_Label', form.Button_Label);
        fd.append('image', imgFile);
        await axios.put(`${BASE_URL}/communication_tool?id=${selected.CT_ID}`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        showToast('Card updated successfully!');

      } else {
        /* ── EDIT text-only (no new image): plain JSON ── */
        await axios.put(`${BASE_URL}/communication_tool?id=${selected.CT_ID}`, {
          Phrase: form.Phrase,
          Button_Label: form.Button_Label,
          Icon_Image: selected.Icon_Image, // keep existing filename
        });
        showToast('Card updated successfully!');
      }

      closeModal();
      fetchCards();
    } catch (e) {
      console.error('Save error details:', e);
      const serverMsg = e?.response?.data?.Message || e?.response?.data?.error || e.message;
      showToast(`Save failed: ${serverMsg}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (card) => {
    if (!window.confirm(`Delete "${card.Button_Label}"?`)) return;
    try {
      await axios.delete(`${BASE_URL}/communication_tool?id=${card.CT_ID}`);
      showToast('Card deleted.');
      fetchCards();
    } catch (e) {
      showToast('Delete failed.', 'error');
    }
  };

  const filtered = cards.filter(c =>
    c.Button_Label?.toLowerCase().includes(searchQ.toLowerCase()) ||
    c.Phrase?.toLowerCase().includes(searchQ.toLowerCase())
  );

  /* ── card color rotation (mirrors CommunicationTool page) ── */
  const COLORS = ['#A8D8A8', '#9CCFC9', '#B8D8E8', '#C8B8E8', '#A8C8E8', '#B8E8D0'];
  const cardColor = (idx) => COLORS[idx % COLORS.length];

  /* ── render ── */
  return (
    <div className="adm-content">
      {/* ── Header row ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, gap: 12, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontFamily: 'var(--adm-font-head)', fontSize: 13, fontWeight: 700, color: 'var(--adm-gray)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 4 }}>
            AAC Communication Board
          </div>
          <div style={{ fontSize: 13, color: 'var(--adm-gray)' }}>
            {cards.length} cards total — manage phrases, labels &amp; icons shown to users
          </div>
        </div>
        <button
          className="adm-btn btn-purple"
          onClick={openAdd}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px' }}
        >
          + Add New Card
        </button>
      </div>

      {/* ── Search ── */}
      <div style={{ marginBottom: 18 }}>
        <div className="adm-tb-search" style={{ maxWidth: 340, border: '1.5px solid var(--adm-bg-gray)', borderRadius: 10, padding: '8px 14px', background: '#fff' }}>
          <span>🔍</span>
          <input
            placeholder="Search by label or phrase…"
            value={searchQ}
            onChange={e => setSearchQ(e.target.value)}
            style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: 13, fontFamily: 'var(--adm-font-body)', width: '100%' }}
          />
        </div>
      </div>

      {/* ── States ── */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--adm-gray)', fontSize: 14 }}>
          Loading communication tools…
        </div>
      )}

      {error && (
        <div style={{ background: 'var(--adm-red-pale)', color: 'var(--adm-red)', padding: '14px 18px', borderRadius: 10, fontSize: 13, marginBottom: 16 }}>
          {error}
        </div>
      )}

      {/* ── Cards grid ── */}
      {!loading && !error && (
        <>
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--adm-gray)', fontSize: 14 }}>
              No cards found.
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
              gap: 16,
            }}>
              {filtered.map((card, idx) => (
                <div key={card.CT_ID} className="adm-card" style={{ padding: 0, overflow: 'hidden', position: 'relative' }}>
                  {/* colour band */}
                  <div style={{ height: 8, background: cardColor(idx) }} />

                  {/* Image preview */}
                  <div style={{ padding: '14px 16px 10px', display: 'flex', justifyContent: 'center' }}>
                    <img
                      src={card.Icon_Image && card.Icon_Image.startsWith('http') ? card.Icon_Image : `${API_BASE}/images/${card.Icon_Image}`}
                      alt={card.Button_Label}
                      onError={e => { e.target.style.display = 'none'; }}
                      style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 10, border: '2px solid var(--adm-bg-gray)' }}
                    />
                  </div>

                  {/* Info */}
                  <div style={{ padding: '0 16px 14px' }}>
                    <div style={{ fontFamily: 'var(--adm-font-head)', fontWeight: 700, fontSize: 13, color: 'var(--adm-dark)', marginBottom: 4, textAlign: 'center' }}>
                      {card.Button_Label}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--adm-gray)', textAlign: 'center', marginBottom: 12, fontStyle: 'italic' }}>
                      "{card.Phrase}"
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--adm-gray-light)', textAlign: 'center', marginBottom: 10 }}>
                      ID: {card.CT_ID}
                    </div>
                    {/* Actions */}
                    <div style={{ display: 'flex', gap: 8, borderTop: '1px solid var(--adm-bg-gray)', paddingTop: 12 }}>
                      <button
                        className="adm-btn btn-ghost"
                        onClick={() => openEdit(card)}
                        style={{ flex: 1, padding: '7px 0', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                      >
                        <Edit2 size={14} /> Edit
                      </button>
                      <button
                        className="adm-btn btn-ghost"
                        onClick={() => handleDelete(card)}
                        style={{ flex: 1, padding: '7px 0', fontSize: 12, color: 'var(--adm-red)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                      >
                        <Trash2 size={14} /> Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Add / Edit Modal ── */}
      {modal && (
        <div className="adm-modal-overlay" onClick={closeModal}>
          <div className="adm-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className="adm-modal-header">
              <h2>{modal === 'add' ? '➕ Add New Card' : '✏️ Edit Card'}</h2>
              <button className="adm-modal-close" onClick={closeModal}>✕</button>
            </div>
            <div className="adm-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Button Label */}
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--adm-gray)', textTransform: 'uppercase', letterSpacing: '.4px', fontFamily: 'var(--adm-font-head)', display: 'block', marginBottom: 6 }}>
                  Button Label *
                </label>
                <input
                  type="text"
                  value={form.Button_Label}
                  onChange={e => setForm(f => ({ ...f, Button_Label: e.target.value }))}
                  placeholder="e.g. Eat, Drink, Happy…"
                  style={{ width: '100%', padding: '10px 12px', border: '1.5px solid var(--adm-bg-gray)', borderRadius: 8, fontSize: 13, fontFamily: 'var(--adm-font-body)', color: 'var(--adm-dark)', boxSizing: 'border-box', outline: 'none' }}
                />
              </div>

              {/* Phrase */}
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--adm-gray)', textTransform: 'uppercase', letterSpacing: '.4px', fontFamily: 'var(--adm-font-head)', display: 'block', marginBottom: 6 }}>
                  Phrase (spoken / displayed) *
                </label>
                <input
                  type="text"
                  value={form.Phrase}
                  onChange={e => setForm(f => ({ ...f, Phrase: e.target.value }))}
                  placeholder="e.g. I want to eat"
                  style={{ width: '100%', padding: '10px 12px', border: '1.5px solid var(--adm-bg-gray)', borderRadius: 8, fontSize: 13, fontFamily: 'var(--adm-font-body)', color: 'var(--adm-dark)', boxSizing: 'border-box', outline: 'none' }}
                />
              </div>

              {/* Icon Image — Upload file OR paste URL */}
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--adm-gray)', textTransform: 'uppercase', letterSpacing: '.4px', fontFamily: 'var(--adm-font-head)', display: 'block', marginBottom: 8 }}>
                  Icon Image *
                </label>

                {/* Tab row */}
                <div style={{ display: 'flex', gap: 0, marginBottom: 10, border: '1.5px solid var(--adm-bg-gray)', borderRadius: 8, overflow: 'hidden' }}>
                  {['upload', 'url'].map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setImgTab(t)}
                      style={{
                        flex: 1, padding: '7px 0', fontSize: 12,
                        fontFamily: 'var(--adm-font-head)', fontWeight: 600,
                        border: 'none', cursor: 'pointer',
                        background: imgTab === t ? 'var(--adm-purple)' : '#fff',
                        color: imgTab === t ? '#fff' : 'var(--adm-gray)',
                        transition: 'all .15s',
                      }}
                    >
                      {t === 'upload' ? '📁 Upload File' : '🔗 Image URL'}
                    </button>
                  ))}
                </div>

                {imgTab === 'upload' ? (
                  <div
                    style={{
                      border: '2px dashed var(--adm-bg-gray)', borderRadius: 8,
                      padding: '18px', textAlign: 'center',
                      background: '#fafafa', cursor: 'pointer',
                    }}
                    onClick={() => document.getElementById('ct-file-input').click()}
                  >
                    <input
                      id="ct-file-input"
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={e => {
                        const file = e.target.files[0];
                        if (!file) return;
                        // Store raw file for FormData upload (same as school pattern)
                        setImgFile(file);
                        // Create object URL just for preview — not stored in DB
                        const previewUrl = URL.createObjectURL(file);
                        setForm(f => ({ ...f, Icon_Image: previewUrl }));
                      }}
                    />
                    {imgFile ? (
                      <div>
                        <img src={form.Icon_Image} alt="preview" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8, border: '2px solid var(--adm-bg-gray)', marginBottom: 8 }} />
                        <div style={{ fontSize: 11, color: 'var(--adm-gray)' }}>Click to change image</div>
                      </div>
                    ) : (
                      <div>
                        <div style={{ fontSize: 28, marginBottom: 6 }}>🖼️</div>
                        <div style={{ fontSize: 12, color: 'var(--adm-gray)', fontFamily: 'var(--adm-font-body)' }}>
                          Click to browse or drop an image here
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--adm-gray)', marginTop: 4 }}>PNG, JPG, JPEG, GIF — saved to server disk</div>
                      </div>
                    )}
                  </div>
                ) : (
                  <input
                    type="text"
                    value={imgFile ? '' : form.Icon_Image}
                    onChange={e => {
                      setImgFile(null);
                      setForm(f => ({ ...f, Icon_Image: e.target.value }));
                    }}
                    placeholder="https://example.com/image.png"
                    style={{ width: '100%', padding: '10px 12px', border: '1.5px solid var(--adm-bg-gray)', borderRadius: 8, fontSize: 13, fontFamily: 'var(--adm-font-body)', color: 'var(--adm-dark)', boxSizing: 'border-box', outline: 'none' }}
                  />
                )}

                {/* Live preview */}
                {form.Icon_Image && (
                  <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <img
                      src={form.Icon_Image}
                      alt="preview"
                      onError={e => { e.target.style.opacity = 0.15; }}
                      style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 8, border: '2px solid var(--adm-bg-gray)' }}
                    />
                    <span style={{ fontSize: 11, color: 'var(--adm-gray)' }}>
                      {imgFile ? '✅ File ready to upload' : '🔗 URL image'}
                    </span>
                    <button
                      type="button"
                      onClick={() => { setImgFile(null); setForm(f => ({ ...f, Icon_Image: '' })); }}
                      style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#bbb', fontSize: 16 }}
                    >✕</button>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button
                  className="adm-btn btn-purple"
                  onClick={handleSave}
                  disabled={saving}
                  style={{ flex: 1, padding: '11px 0', fontSize: 13 }}
                >
                  {saving ? 'Saving…' : modal === 'add' ? 'Add Card' : 'Save Changes'}
                </button>
                <button
                  className="adm-btn"
                  onClick={closeModal}
                  style={{ flex: 1, padding: '11px 0', fontSize: 13, background: 'var(--adm-bg-gray)', color: 'var(--adm-dark)' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Toast ── */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24,
          background: toast.type === 'error' ? 'var(--adm-red)' : 'var(--adm-green)',
          color: '#fff', padding: '12px 20px', borderRadius: 10,
          fontSize: 13, fontWeight: 600, fontFamily: 'var(--adm-font-head)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          zIndex: 9999,
          animation: 'admFadeIn .2s ease',
        }}>
          {toast.type === 'error' ? '⚠️' : '✅'} {toast.msg}
        </div>
      )}
    </div>
  );
};


/* ════════════════════════════════════════════════════
   MAIN: AdminInterface
════════════════════════════════════════════════════ */
const TITLES = {
  dashboard: { title: 'Admin Dashboard' },
  users: { title: 'User Management' },
  bookings: { title: 'All Bookings' },
  schools: { title: 'Schools Management' },
  donations: { title: 'Donation Center' },
  community: { title: 'Community Center' },
  reports: { title: 'Reports & Analytics' },
  settings: { title: 'Platform Settings' },
  communication: { title: 'Communication Tools (AAC)' },
};

const generateRecentMonths = () => {
  const months = [];
  const date = new Date();
  const startYear = 2026;
  const startMonth = 2; // March (0-indexed)

  while (date.getFullYear() > startYear || (date.getFullYear() === startYear && date.getMonth() >= startMonth)) {
    const month = date.toLocaleString('default', { month: 'long' });
    const year = date.getFullYear();
    months.push(`${month} ${year}`);
    date.setMonth(date.getMonth() - 1);
  }

  // Fallback if current date is somehow before March 2026
  if (months.length === 0) {
    months.push(`March ${startYear}`);
  }

  return months;
};

const TOP_EXTRAS = {
  reports: (
    <select key="month" className="adm-select">
      {generateRecentMonths().map((m) => (
        <option key={m}>{m}</option>
      ))}
    </select>
  ),
};

const NO_SEARCH = ['dashboard', 'donations', 'settings', 'community', 'reports', 'users', 'communication'];
const NO_NOTIF = ['dashboard', 'donations', 'users', 'bookings', 'schools', 'community', 'settings', 'communication', 'reports'];

const AdminInterface = ({ adminName: propAdminName = 'Admin' }) => {
  const navigate = useNavigate();
  const [screen, setScreen] = useState('dashboard');
  const [searchValue, setSearchValue] = useState('');
  const [adminName, setAdminName] = useState(propAdminName);
  const [badges, setBadges] = useState({});

  // Dynamic notification badges
  useEffect(() => {
    const fetchBadges = async () => {
      try {
        const [tRes, stRes, dRes, cRes] = await Promise.all([
          axios.get(`${API_BASE}/modules/therapist/therapist`).catch(() => ({ data: [] })),
          axios.get(`${API_BASE}/modules/shadow_teacher/shadow_teacher`).catch(() => ({ data: [] })),
          axios.get(`${API_BASE}/modules/market_place/market_place`).catch(() => ({ data: [] })),
          axios.get(`${API_BASE}/modules/community/community`).catch(() => ({ data: [] })),
        ]);

        const therapists = Array.isArray(tRes.data) ? tRes.data : [];
        const sts = Array.isArray(stRes.data) ? stRes.data : [];
        const donations = Array.isArray(dRes.data) ? dRes.data : [];
        const messages = Array.isArray(cRes.data) ? cRes.data : [];

        const pendingUsers = [...therapists, ...sts].filter(u => (u.Status || '').trim().toLowerCase() === 'pending').length;
        const pendingDonations = donations.filter(d => d.Status === 'Pending').length;

        const FLAG_KEYWORDS = ['spam', 'abuse', 'hate', 'scam', 'inappropriate', 'offensive', 'fake', 'bullying'];
        const flaggedMessages = messages.filter(m => FLAG_KEYWORDS.some(kw => (m.Content || '').toLowerCase().includes(kw))).length;

        setBadges({
          users: pendingUsers,
          donations: pendingDonations,
          community: flaggedMessages
        });
      } catch (err) {
        console.error('Error fetching badges', err);
      }
    };

    fetchBadges();
    const intervalId = setInterval(fetchBadges, 30000); // Poll every 30s
    return () => clearInterval(intervalId);
  }, []);

  // Load admin data from localStorage on mount
  useEffect(() => {
    const storedAdmin = localStorage.getItem('admin');
    if (storedAdmin) {
      try {
        const parsedAdmin = JSON.parse(storedAdmin);
        // Display admin email (or Admin_ID if email not available)
        const displayName = parsedAdmin.Email || `Admin ${parsedAdmin.Admin_ID}`;
        setAdminName(displayName);
        console.log('✅ Admin loaded:', parsedAdmin);
      } catch (err) {
        console.error('Error parsing admin data:', err);
      }
    } else {
      console.warn('⚠️ No admin data found in localStorage. Redirecting to login.');
      navigate('/login');
    }
  }, [navigate]);

  const handleLogout = () => {
    // Clear all admin-related localStorage
    localStorage.removeItem('admin');
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userRole');
    localStorage.removeItem('careconnect_token');
    localStorage.removeItem('careconnect_role');
    localStorage.removeItem('careconnect_name');
    console.log('✅ Admin logged out');
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'LOGOUT', action: 'logout' }));
    }
    navigate('/login');
  };

  const handleAddSchool = () => {
    // This will be handled within AdminSchools component
  };

  const renderScreen = () => {
    switch (screen) {
      case 'dashboard': return <AdminDashboard />;
      case 'users': return <AdminUsers />;
      case 'bookings': return <AdminBookings searchValue={searchValue} />;
      case 'schools': return <AdminSchools searchValue={searchValue} onAddSchool={handleAddSchool} />;
      case 'donations': return <AdminDonations searchValue={searchValue} />;
      case 'community': return <AdminCommunity />;
      case 'reports': return <AdminReports />;
      case 'settings': return <AdminSettings />;
      case 'communication': return <AdminCommunicationTools />;
      default: return <AdminDashboard />;
    }
  };

  const titleInfo = TITLES[screen] || TITLES.dashboard;

  return (
    <div className="adm-shell adm-portal">
      <AdminSidebar
        activeScreen={screen}
        onNavigate={setScreen}
        onLogout={handleLogout}
        adminName={adminName}
        badges={badges}
      />
      <div className="adm-main">
        <AdminTopbar
          title={titleInfo.title}
          sub={titleInfo.sub || null}
          extra={TOP_EXTRAS[screen] || null}
          showSearch={!NO_SEARCH.includes(screen)}
          showNotif={!NO_NOTIF.includes(screen)}
          searchValue={searchValue}
          onSearchChange={setSearchValue}
        />
        {renderScreen()}
      </div>
    </div>
  );
};

export default AdminInterface;