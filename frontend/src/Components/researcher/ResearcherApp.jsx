import { useCallback, useEffect, useState } from "react";
import { ResearcherLayout } from "./ResearcherLayout";
import { ResearcherDashboard } from "./ResearcherDashboard";
import { SearchEquipment } from "./SearchEquipment";
import { EquipmentDetails } from "./EquipmentDetails";
import { BookEquipmentForm } from "./BookEquipmentForm";
import { WaitlistModal } from "./WaitlistModal";
import { MyBookings } from "./MyBookings";
import { ReportIssue } from "./ReportIssue";
import { NotificationsCenter } from "./NotificationsCenter";
import { ProfilePage } from "./ProfilePage";
import { notificationApi } from "../../api/notificationApi";
import { useAuth } from "../../context/AuthContext";

export function ResearcherApp({ toast, onLogout }) {
  const { logout } = useAuth();
  const [view, setView] = useState("dashboard");
  const [selectedEquipmentId, setSelectedEquipmentId] = useState(null);
  const [bookingModalEquipment, setBookingModalEquipment] = useState(null);
  const [waitlistModalEquipment, setWaitlistModalEquipment] = useState(null);
  const [reportIssueEquipment, setReportIssueEquipment] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshUnread = useCallback(() => {
    notificationApi.unreadCount().then((r) => setUnreadCount(r.count)).catch(() => {});
  }, []);

  useEffect(() => {
    refreshUnread();
  }, [refreshUnread]);

  const navigate = (nextView) => {
    setView(nextView);
    setSelectedEquipmentId(null);
    if (nextView !== "report-issue") setReportIssueEquipment(null);
  };

  const goToReportIssue = (equipment) => {
    setReportIssueEquipment(equipment || null);
    setView("report-issue");
    setSelectedEquipmentId(null);
  };

  const handleLogout = () => {
    logout();
    onLogout();
  };

  let content;
  if (view === "dashboard") {
    content = <ResearcherDashboard onNavigate={navigate} toast={toast} />;
  } else if (view === "search" && !selectedEquipmentId) {
    content = <SearchEquipment onSelectEquipment={setSelectedEquipmentId} toast={toast} />;
  } else if (view === "search" && selectedEquipmentId) {
    content = (
      <EquipmentDetails
        equipmentId={selectedEquipmentId}
        onBack={() => setSelectedEquipmentId(null)}
        onBook={setBookingModalEquipment}
        onJoinWaitlist={setWaitlistModalEquipment}
        onReportIssue={goToReportIssue}
        toast={toast}
      />
    );
  } else if (view === "bookings") {
    content = <MyBookings toast={toast} />;
  } else if (view === "report-issue") {
    content = (
      <ReportIssue
        prefillEquipment={reportIssueEquipment}
        onDone={() => navigate("dashboard")}
        toast={toast}
      />
    );
  } else if (view === "notifications") {
    content = <NotificationsCenter toast={toast} onRefreshUnread={refreshUnread} />;
  } else if (view === "profile") {
    content = <ProfilePage toast={toast} />;
  }

  return (
    <ResearcherLayout activeView={view} onNavigate={navigate} unreadCount={unreadCount} onLogout={handleLogout}>
      {content}

      {bookingModalEquipment && (
        <BookEquipmentForm
          equipment={bookingModalEquipment}
          onClose={() => setBookingModalEquipment(null)}
          onBooked={() => {
            setBookingModalEquipment(null);
            navigate("bookings");
          }}
          toast={toast}
        />
      )}

      {waitlistModalEquipment && (
        <WaitlistModal
          equipment={waitlistModalEquipment}
          onClose={() => setWaitlistModalEquipment(null)}
          onJoined={() => {
            setWaitlistModalEquipment(null);
            navigate("bookings");
          }}
          toast={toast}
        />
      )}
    </ResearcherLayout>
  );
}
