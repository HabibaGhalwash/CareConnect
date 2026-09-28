import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
import { PlatformSettingsProvider } from './context/PlatformSettingsContext';
import Signup from './pages/Signup/Signup';
import Login from './pages/Login/Login';
import ChildInfo from './pages/ChildInfo/ChildInfo';
import Home from './pages/Home/Home';
import About from './pages/AboutUs/AboutUs';
import School from './pages/School/School';
import Therapist from './pages/Therapist/Therapist';
import TherapistProfile from './pages/TherapistProfile/TherapistProfile';
import ShadowTeacher from './pages/shadow_teacher/shadow_teacher';
import STProfile from './pages/st_profile/st_profile';
import Booking from './pages/Booking/Booking';
import Donation from './pages/Donation/Donation';
import DonateItemForm from './pages/DonateItemForm/DonateItemForm';
import Donateditem from './pages/Donateditem/Donateditem';
import CommunityCenter from './pages/CommunityCenter/CommunityCenter';
import CommunicationTool from './pages/communication_tool/communication_tool';
import ParentProfile from './pages/parentprofile/parentprofile'; 
import SubscriptionCheckout from './pages/SubscriptionCheckout/SubscriptionCheckout'; 
import TherapistInterface from './pages/TherapistInterface/TherapistInterface';
import ShadowTeacherInterface from './pages/ShadowTeacherInterface/ShadowTeacherInterface';
import AdminInterface from './pages/AdminInterface/AdminInterface';
import BookingSuccess from './pages/BookingSuccess/BookingSuccess';
import ScrollToTop from './components/ScrollToTop/ScrollToTop';
import './App.css';

// Override global alert function to use toast notifications
window.alert = (message) => {
  if (!message) return;
  const msgStr = String(message).toLowerCase();
  if (msgStr.includes('error') || msgStr.includes('fail') || msgStr.includes('❌') || msgStr.includes('not found') || msgStr.includes('please')) {
    toast.error(message, { duration: 4000 });
  } else if (msgStr.includes('success') || msgStr.includes('✅')) {
    toast.success(message, { duration: 4000 });
  } else {
    toast(message, { duration: 4000 });
  }
};

function App() {
  return (
    <PlatformSettingsProvider>
      <Toaster position="top-center" reverseOrder={false} />
      <Router>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />
          <Route path="/child-info" element={<ChildInfo />} />
          <Route path="/schools" element={<School />} />
          <Route path="/therapist" element={<Therapist />} />
          <Route path="/therapist/:id" element={<TherapistProfile />} />
          <Route path="/shadow-teacher" element={<ShadowTeacher />} />
          <Route path="/st-profile/:id" element={<STProfile />} /> 
          <Route path="/booking" element={<Booking />} /> 
          <Route path="/Donation" element={<Donation />} />
          <Route path="/donate-item-form" element={<DonateItemForm />} />
          <Route path="/donateditem" element={<Donateditem />} />
          <Route path="/community-center" element={<CommunityCenter />} />
          <Route path="/communication-tools" element={<CommunicationTool />} />
          <Route path="/ParentProfile"   element={<ParentProfile />} />
          <Route path="/parent-profile"   element={<ParentProfile />} />
          <Route path="/subscription-checkout" element={<SubscriptionCheckout />} />
          <Route path="/therapist-interface/:id" element={<TherapistInterface />} />
          <Route path="/shadow-teacher-interface/:id" element={<ShadowTeacherInterface />} />
          <Route path="/admin-interface" element={<AdminInterface />} />
          <Route path="/booking-success" element={<BookingSuccess />} />

          {/* Add more routes as pages are built */}
          {/* <Route path="/schools" element={<Schools />} /> */}
          {/* <Route path="/therapist" element={<Therapist />} /> */}
          {/* <Route path="/shadow-teacher" element={<ShadowTeacher />} /> */}
          {/* <Route path="/donations" element={<Donations />} /> */}
          {/* <Route path="/community-center" element={<CommunityCenter />} /> */}
          {/* <Route path="/communication-tools" element={<CommunicationTools />} /> */}
          {/* <Route path="/about" element={<About />} /> */}
          {/* <Route path="/login" element={<Login />} /> */}
          {/* <Route path="/signup" element={<Signup />} /> */}
        </Routes>
      </Router>
    </PlatformSettingsProvider>
  );
}

export default App;