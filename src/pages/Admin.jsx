import { useState, useEffect, useRef } from "react";
import { Button, Input } from "@material-tailwind/react";
import { Analytics } from "@vercel/analytics/react";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { io } from "socket.io-client";
import { API_ENDPOINTS, BOOKINGS_BASE_URL, AUTH_BASE_URL, SERVICES_BASE_URL, BARBERS_BASE_URL, SOCKET_IO_URL } from "../data/api";
import { apiRequest } from "../utils/api";

function Admin() {
  const { isAuthenticated, isAdmin, isSuperAdmin, logout } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [filter, setFilter] = useState("all"); // all, pending, approved, rejected, completed
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [showAddAdmin, setShowAddAdmin] = useState(false);
  const [adminForm, setAdminForm] = useState({
    name: "",
    tg_username: "",
    phone_number: "",
    password: "",
    role: "admin",
  });
  const [isSubmittingAdmin, setIsSubmittingAdmin] = useState(false);
  const [showStatistics, _setShowStatistics] = useState(false);
  const [statistics, setStatistics] = useState(null);
  const [loadingStatistics, setLoadingStatistics] = useState(false);
  const [statisticsDateRange, setStatisticsDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
  });
  const today = new Date().toISOString().split("T")[0];
  const [bookingFormData, setBookingFormData] = useState({
    barber_id: "",
    service_ids: [],
    date: today,
    time: "",
    name: "",
    phone: "",
  });
  const [services, setServices] = useState([]);
  const [barbers, setBarbers] = useState([]);
  const [loadingBookingData, setLoadingBookingData] = useState(false);
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [searchCriteria, setSearchCriteria] = useState({
    clientName: "",
    phone: "",
    barberId: "",
    serviceId: "",
    dateFrom: "",
    dateTo: "",
    status: "",
  });
  const [allBookings, setAllBookings] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  // Socket.IO state
  const [wsConnected, setWsConnected] = useState(false); // Keep same name for UI compatibility
  const [wsReconnectAttempts, setWsReconnectAttempts] = useState(0);
  const socketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const filterRef = useRef(filter); // Keep current filter in ref for Socket.IO handler
  const pollingIntervalRef = useRef(null); // Fallback polling interval
  const [usePollingFallback, setUsePollingFallback] = useState(false);
  const reconnectAttemptsRef = useRef(0); // Track reconnect attempts in ref
  const pollingNotificationShownRef = useRef(false); // Track if polling notification was shown

  const fetchBookingData = async () => {
    try {
      setLoadingBookingData(true);
      const [servicesRes, barbersRes] = await Promise.all([
        fetch(`${SERVICES_BASE_URL}${API_ENDPOINTS.services}`, {
          method: "GET",
          headers: {
            Accept: "*/*",
            "Content-Type": "application/json",
          },
          mode: "cors",
        }),
        fetch(`${BARBERS_BASE_URL}${API_ENDPOINTS.barbers}`, {
          method: "GET",
          headers: {
            Accept: "*/*",
            "Content-Type": "application/json",
          },
          mode: "cors",
        }),
      ]);

      if (servicesRes.ok) {
        const servicesData = await servicesRes.json();
        const servicesList = Array.isArray(servicesData)
          ? servicesData
          : servicesData.data || servicesData.services || [];
        setServices(servicesList);
      }

      if (barbersRes.ok) {
        const barbersData = await barbersRes.json();
        const barbersList = Array.isArray(barbersData)
          ? barbersData
          : barbersData.data || barbersData.barbers || [];
        setBarbers(barbersList);
      }
    } catch (err) {
      console.error("Error fetching booking data:", err);
    } finally {
      setLoadingBookingData(false);
    }
  };

  // Update filter ref when filter changes
  useEffect(() => {
    filterRef.current = filter;
  }, [filter]);

  useEffect(() => {
    // ProtectedRoute handles authentication, but double-check here
    if (isAuthenticated() && (isAdmin() || isSuperAdmin())) {
      fetchBookings();
      fetchBookingData();
    }
  }, [isAuthenticated, isAdmin, isSuperAdmin, filter]);

  useEffect(() => {
    // Fetch booking data when modal opens
    if (showBookingForm && (barbers.length === 0 || services.length === 0)) {
      fetchBookingData();
    }
  }, [showBookingForm]);

  // Helper function to sort bookings by date and time (newest first)
  const sortBookings = (bookings) => {
    return [...bookings].sort((a, b) => {
      // First, try to sort by created_at timestamp if available (most reliable)
      const createdAtA = a.created_at || a.createdAt || a.created_at_timestamp;
      const createdAtB = b.created_at || b.createdAt || b.created_at_timestamp;
      
      if (createdAtA && createdAtB) {
        const dateA = new Date(createdAtA);
        const dateB = new Date(createdAtB);
        if (!isNaN(dateA.getTime()) && !isNaN(dateB.getTime())) {
          return dateB.getTime() - dateA.getTime(); // Descending (newest first)
        }
      }
      
      // Fallback: Sort by booking ID (assuming newer bookings have higher IDs)
      const idA = parseInt(a.id || a._id || 0);
      const idB = parseInt(b.id || b._id || 0);
      if (idA !== idB && idA > 0 && idB > 0) {
        return idB - idA; // Descending (higher ID = newer)
      }
      
      // Fallback: Sort by date and time
      const dateA = a.date || "";
      const timeA = a.time || "";
      const dateB = b.date || "";
      const timeB = b.time || "";
      
      // If dates are the same, compare by time
      if (dateA === dateB) {
        if (timeA && timeB) {
          return timeB.localeCompare(timeA); // Descending (newest time first)
        }
        // If same date and no time, use ID as tiebreaker
        return idB - idA;
      }
      
      // Compare dates (descending - newest date first)
      if (dateA && dateB) {
        return dateB.localeCompare(dateA);
      }
      
      // Final fallback: use ID
      return idB - idA;
    });
  };

  // fetchBookings function - moved before WebSocket to be accessible
  const fetchBookings = async (skipLoading = false, useCurrentFilter = false) => {
    try {
      if (!skipLoading) {
        setLoading(true);
      }
      setError("");
      if (!skipLoading) {
        setSuccess("");
      }

      // Use current filter from ref if called from WebSocket, otherwise use state
      const currentFilter = useCurrentFilter ? filterRef.current : filter;
      
      let endpoint = API_ENDPOINTS.bookings;
      if (currentFilter === "pending") {
        endpoint = API_ENDPOINTS.bookingsPending;
      }

      console.log("Fetching bookings from:", endpoint, "with filter:", currentFilter);
      const response = await apiRequest(
        endpoint,
        {
          method: "GET",
        },
        true,
        5000
      ); // Use bookings base URL with 5 second timeout

      if (!response.ok) {
        throw new Error(`Failed to fetch bookings: ${response.status}`);
      }

      const data = await response.json();
      let bookingsList = Array.isArray(data)
        ? data
        : data.data || data.bookings || [];

      // Always update allBookings with the full list
      const sortedAllBookings = sortBookings(bookingsList || []);
      setAllBookings(sortedAllBookings);

      // Filter bookings based on current filter
      if (currentFilter !== "all" && currentFilter !== "pending") {
        const filtered = bookingsList.filter(
          (booking) => booking.status?.toLowerCase() === currentFilter.toLowerCase()
        );
        const sortedFiltered = sortBookings(filtered);
        setBookings(sortedFiltered);
      } else {
        // For "all" or "pending", use the sorted list
        setBookings(sortedAllBookings);
      }
    } catch (err) {
      console.error("Error fetching bookings:", err);
      if (!skipLoading) {
        if (err.message && err.message.includes("timeout")) {
          setError(
            "Backend javob bermadi (5 soniya). Iltimos, qayta urinib ko'ring."
          );
        } else {
          setError(
            err.message || "Bronlarni yuklash muvaffaqiyatsiz. Iltimos, qayta urinib ko'ring."
          );
        }
        setBookings([]);
      }
    } finally {
      if (!skipLoading) {
        setLoading(false);
      }
    }
  };

  // Socket.IO event handlers
  const handleNewBooking = (data) => {
    try {
      console.log("📨 Socket.IO: new_booking event received:", data);
      
      // Data might be in data.bookings array or data directly
      const booking = Array.isArray(data?.bookings) && data.bookings.length > 0 
        ? data.bookings[0] 
        : data?.booking || data;
      
      const clientName = booking?.client_name || booking?.client?.name || "N/A";
      const barberName = booking?.barber?.name || booking?.barber_name || "N/A";
      const date = booking?.date || "";
      const time = booking?.time || "";
      
      toast.success(
        `🆕 Yangi bron qo'shildi!\n👤 ${clientName}\n💇 ${barberName}\n📅 ${date} ${time}`,
        {
          duration: 5000,
          style: {
            background: '#10b981',
            color: '#fff',
            padding: '16px',
            borderRadius: '8px',
            whiteSpace: 'pre-line',
          },
        }
      );
      
      console.log("🔄 Socket.IO: Refreshing bookings due to new_booking");
      fetchBookings(true, true);
    } catch (err) {
      console.error("❌ Error handling new_booking event:", err, data);
    }
  };

  const handleBookingStatusChanged = (data) => {
    try {
      console.log("📨 Socket.IO: booking_status_changed event received:", data);
      
      const booking = data?.booking || data;
      const clientName = booking?.client_name || booking?.client?.name || "N/A";
      const status = booking?.status || "updated";
      const statusLabels = {
        pending: "Kutilmoqda",
        approved: "Tasdiqlangan",
        rejected: "Rad etilgan",
        completed: "Yakunlangan"
      };
      const statusLabel = statusLabels[status?.toLowerCase()] || status;
      
      toast.success(
        `✏️ Bron holati yangilandi!\n👤 ${clientName}\n📊 Holat: ${statusLabel}`,
        {
          duration: 4000,
          style: {
            background: '#3b82f6',
            color: '#fff',
            padding: '16px',
            borderRadius: '8px',
            whiteSpace: 'pre-line',
          },
        }
      );
      
      console.log("🔄 Socket.IO: Refreshing bookings due to booking_status_changed");
      fetchBookings(true, true);
    } catch (err) {
      console.error("❌ Error handling booking_status_changed event:", err, data);
    }
  };

  // Start polling fallback
  const startPollingFallback = () => {
    if (pollingIntervalRef.current) {
      // Already polling, don't show notification again
      return;
    }
    console.log("🔄 Starting polling fallback (every 5 seconds)");
    
    // Only show notification when switching to polling (first time)
    if (!pollingNotificationShownRef.current) {
      toast("Socket.IO ulanmadi - Polling rejimida ishlayapti (har 5 soniyada)", {
        duration: 4000,
        icon: '🟡',
        style: {
          background: '#f59e0b',
          color: '#fff',
          padding: '16px',
          borderRadius: '8px',
        },
      });
      pollingNotificationShownRef.current = true;
    }
    
    setUsePollingFallback(true);
    
    pollingIntervalRef.current = setInterval(() => {
      console.log("🔄 Polling: Fetching bookings...");
      fetchBookings(true, true);
    }, 5000); // Poll every 5 seconds
  };

  // Stop polling fallback
  const stopPollingFallback = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    setUsePollingFallback(false);
    pollingNotificationShownRef.current = false; // Reset notification flag when stopping polling
    console.log("⏹️ Stopped polling fallback");
  };

  // Socket.IO connection function
  const connectSocketIO = () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.log("⚠️ No token available for Socket.IO connection");
        setWsConnected(false);
        // Start polling fallback if no token
        startPollingFallback();
        return;
      }

      // Close existing connection if any
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }

      // Create Socket.IO connection with token
      console.log("🔌 Connecting to Socket.IO:", SOCKET_IO_URL);
      console.log("📍 Socket.IO URL:", SOCKET_IO_URL);

      const socket = io(SOCKET_IO_URL, {
        auth: {
          token: token
        },
        query: {
          token: token
        },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 10000
      });

      socketRef.current = socket;

      // Set connection timeout
      const connectionTimeout = setTimeout(() => {
        if (!socket.connected) {
          console.error("❌ Socket.IO connection timeout after 10 seconds");
          socket.disconnect();
          setWsConnected(false);
          socketRef.current = null;
          // Start polling fallback on timeout
          setWsReconnectAttempts((prev) => {
            const newAttempts = prev + 1;
            reconnectAttemptsRef.current = newAttempts;
            if (newAttempts >= 3) {
              console.log("🔄 Too many connection failures, switching to polling fallback");
              startPollingFallback();
            }
            return newAttempts;
          });
        }
      }, 10000); // 10 second timeout

      socket.on("connect", () => {
        clearTimeout(connectionTimeout);
        console.log("✅ Socket.IO connected successfully");
        const wasReconnecting = reconnectAttemptsRef.current > 0;
        setWsConnected(true);
        setWsReconnectAttempts(0);
        reconnectAttemptsRef.current = 0;
        stopPollingFallback(); // Stop polling when Socket.IO connects
        
        // Show connection notification
        if (wasReconnecting) {
          toast.success("🟢 Socket.IO qayta ulandi", {
            duration: 2000,
            style: {
              background: '#10b981',
              color: '#fff',
            },
          });
        } else {
          toast.success("Socket.IO ulandi - Bronlar real vaqtda yangilanadi", {
            duration: 3000,
            style: {
              background: '#10b981',
              color: '#fff',
            },
          });
        }
      });

      // Listen for new_booking event
      socket.on("new_booking", handleNewBooking);
      
      // Listen for booking_status_changed event
      socket.on("booking_status_changed", handleBookingStatusChanged);

      socket.on("disconnect", (reason) => {
        clearTimeout(connectionTimeout);
        console.log("🔌 Socket.IO disconnected:", reason);
        setWsConnected(false);
        
        if (reason === "io server disconnect") {
          // Server disconnected, try to reconnect
          socket.connect();
        }
      });

      socket.on("connect_error", (error) => {
        clearTimeout(connectionTimeout);
        console.error("❌ Socket.IO connection error:", error);
        setWsConnected(false);
        
        // Start polling fallback on error after a few attempts
        setWsReconnectAttempts((prev) => {
          const newAttempts = prev + 1;
          reconnectAttemptsRef.current = newAttempts;
          if (newAttempts >= 2) {
            console.log("🔄 Socket.IO errors detected, starting polling fallback");
            startPollingFallback();
          }
          return newAttempts;
        });
      });
    } catch (err) {
      console.error("❌ Error creating Socket.IO connection:", err);
      setWsConnected(false);
      // Start polling fallback on error
      startPollingFallback();
    }
  };

  // Socket.IO connection effect
  useEffect(() => {
    if (!isAuthenticated() || (!isAdmin() && !isSuperAdmin())) {
      // Close Socket.IO if user is not authenticated or not admin
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setWsConnected(false);
      }
      return;
    }

    // Connect Socket.IO only if not already connected
    if (!socketRef.current || !socketRef.current.connected) {
      connectSocketIO();
    } else if (socketRef.current.connected) {
      // Already connected
      setWsConnected(true);
    }

    // Cleanup function
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setWsConnected(false);
      setUsePollingFallback(false);
    };
    // Only reconnect when auth changes, not when filter changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, isAdmin, isSuperAdmin]);

  const handleApprove = async (bookingId) => {
    try {
      setError("");
      setSuccess("");
      console.log("Approving booking:", bookingId);
      const response = await apiRequest(
        `${API_ENDPOINTS.bookingStatus}/${bookingId}/status`,
        {
          method: "PATCH",
          body: JSON.stringify({ status: "approved" }),
        },
        true
      ); // Use bookings base URL

      if (response.ok) {
        setSuccess("Bron muvaffaqiyatli tasdiqlandi");
        
        // Show toast notification
        const booking = bookings.find(b => String(b.id || b._id) === String(bookingId));
        const clientName = booking?.client_name || booking?.client?.name || "N/A";
        toast.success(
          `✅ Bron tasdiqlandi!\n👤 ${clientName}`,
          {
            duration: 3000,
            style: {
              background: '#10b981',
              color: '#fff',
              padding: '16px',
              borderRadius: '8px',
              whiteSpace: 'pre-line',
            },
          }
        );
        
        fetchBookings();
        setTimeout(() => setSuccess(""), 3000);
      } else {
        const data = await response.json();
        const errorMsg = data.message || "Bronni tasdiqlash muvaffaqiyatsiz";
        setError(errorMsg);
        toast.error(errorMsg, {
          duration: 4000,
        });
      }
    } catch (err) {
      setError(err.message || "Bronni tasdiqlash muvaffaqiyatsiz");
    }
  };

  const handleReject = async (bookingId) => {
    try {
      setError("");
      setSuccess("");
      console.log("Rejecting booking:", bookingId);
      const response = await apiRequest(
        `${API_ENDPOINTS.bookingStatus}/${bookingId}/status`,
        {
          method: "PATCH",
          body: JSON.stringify({ status: "rejected" }),
        },
        true
      ); // Use bookings base URL

      if (response.ok) {
        setSuccess("Bron muvaffaqiyatli rad etildi");
        
        // Show toast notification
        const booking = bookings.find(b => String(b.id || b._id) === String(bookingId));
        const clientName = booking?.client_name || booking?.client?.name || "N/A";
        toast.error(
          `❌ Bron rad etildi!\n👤 ${clientName}`,
          {
            duration: 3000,
            style: {
              background: '#ef4444',
              color: '#fff',
              padding: '16px',
              borderRadius: '8px',
              whiteSpace: 'pre-line',
            },
          }
        );
        
        fetchBookings();
        setTimeout(() => setSuccess(""), 3000);
      } else {
        const data = await response.json();
        const errorMsg = data.message || "Bronni rad etish muvaffaqiyatsiz";
        setError(errorMsg);
        toast.error(errorMsg, {
          duration: 4000,
        });
      }
    } catch (err) {
      setError(err.message || "Bronni rad etish muvaffaqiyatsiz");
    }
  };

  const handleDelete = async (bookingId) => {
    try {
      setError("");
      setSuccess("");
      console.log("Deleting booking:", bookingId);
      const response = await apiRequest(
        `${API_ENDPOINTS.bookings}/${bookingId}`,
        {
          method: "DELETE",
        },
        true
      ); // Use bookings base URL

      if (response.ok) {
        setSuccess("Bron muvaffaqiyatli o'chirildi");
        
        // Show toast notification
        const booking = bookings.find(b => String(b.id || b._id) === String(bookingId));
        const clientName = booking?.client_name || booking?.client?.name || "N/A";
        toast.error(
          `🗑️ Bron o'chirildi!\n👤 ${clientName}`,
          {
            duration: 3000,
            style: {
              background: '#ef4444',
              color: '#fff',
              padding: '16px',
              borderRadius: '8px',
              whiteSpace: 'pre-line',
            },
          }
        );
        
        setDeleteConfirm(null);
        fetchBookings();
        setTimeout(() => setSuccess(""), 3000);
      } else {
        const data = await response.json();
        const errorMsg = data.message || "Bronni o'chirish muvaffaqiyatsiz";
        setError(errorMsg);
        toast.error(errorMsg, {
          duration: 4000,
        });
        setDeleteConfirm(null);
      }
    } catch (err) {
      setError(err.message || "Bronni o'chirish muvaffaqiyatsiz");
      setDeleteConfirm(null);
    }
  };

  const handleStatusChange = async (bookingId, status) => {
    try {
      setError("");
      setSuccess("");
      console.log("Updating booking status:", bookingId, status);
      const response = await apiRequest(
        `${API_ENDPOINTS.bookingStatus}/${bookingId}/status`,
        {
          method: "PATCH",
          body: JSON.stringify({ status }),
        },
        true
      ); // Use bookings base URL

      if (response.ok) {
        setSuccess("Bron holati muvaffaqiyatli yangilandi");
        
        // Show toast notification
        const booking = bookings.find(b => String(b.id || b._id) === String(bookingId));
        const clientName = booking?.client_name || booking?.client?.name || "N/A";
        const statusLabels = {
          pending: "Kutilmoqda",
          approved: "Tasdiqlangan",
          rejected: "Rad etilgan",
          completed: "Yakunlangan"
        };
        const statusLabel = statusLabels[status?.toLowerCase()] || status;
        
        toast.success(
          `✏️ Bron holati yangilandi!\n👤 ${clientName}\n📊 ${statusLabel}`,
          {
            duration: 3000,
            style: {
              background: '#3b82f6',
              color: '#fff',
              padding: '16px',
              borderRadius: '8px',
              whiteSpace: 'pre-line',
            },
          }
        );
        
        fetchBookings();
        setTimeout(() => setSuccess(""), 3000);
      } else {
        const data = await response.json();
        const errorMsg = data.message || "Bron holatini yangilash muvaffaqiyatsiz";
        setError(errorMsg);
        toast.error(errorMsg, {
          duration: 4000,
        });
      }
    } catch (err) {
      setError(err.message || "Bron holatini yangilash muvaffaqiyatsiz");
    }
  };

  const handleAddAdmin = async (e) => {
    e.preventDefault();
    setIsSubmittingAdmin(true);
    setError("");
    setSuccess("");

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${AUTH_BASE_URL}${API_ENDPOINTS.register}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "*/*",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
          body: JSON.stringify(adminForm),
          mode: "cors",
        }
      );

      if (response.ok || response.status === 201) {
        setSuccess("Admin muvaffaqiyatli qo'shildi");
        setShowAddAdmin(false);
        setAdminForm({
          name: "",
          tg_username: "",
          phone_number: "",
          password: "",
          role: "admin",
        });
        setTimeout(() => setSuccess(""), 3000);
      } else {
        const data = await response.json();
        setError(data.message || "Admin qo'shish muvaffaqiyatsiz");
      }
    } catch (err) {
      setError(err.message || "Admin qo'shish muvaffaqiyatsiz");
    } finally {
      setIsSubmittingAdmin(false);
    }
  };

  const handleAdminFormChange = (name, value) => {
    setAdminForm({
      ...adminForm,
      [name]: value,
    });
    if (error) setError("");
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    setIsSubmittingBooking(true);
    setError("");
    setSuccess("");

    try {
      const bookingData = {
        phone_number: bookingFormData.phone,
        barber_id: parseInt(bookingFormData.barber_id),
        service_ids: bookingFormData.service_ids.map((id) => parseInt(id)),
        date: bookingFormData.date || today,
        time: bookingFormData.time,
        client_name: bookingFormData.name,
      };

      const response = await fetch(
        `${BOOKINGS_BASE_URL}${API_ENDPOINTS.bookings}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "*/*",
          },
          body: JSON.stringify(bookingData),
          mode: "cors",
        }
      );

      const data = await response.json();

      if (response.ok || response.status === 201) {
        setSuccess("Bron muvaffaqiyatli qo'shildi!");
        
        // Show toast notification
        const barberName = barbers.find(b => String(b.id || b._id) === String(bookingData.barber_id))?.name || "N/A";
        toast.success(
          `✅ Yangi bron qo'shildi!\n👤 ${bookingData.client_name}\n💇 ${barberName}\n📅 ${bookingData.date} ${bookingData.time}`,
          {
            duration: 5000,
            style: {
              background: '#10b981',
              color: '#fff',
              padding: '16px',
              borderRadius: '8px',
              whiteSpace: 'pre-line',
            },
          }
        );
        
        setBookingFormData({
          barber_id: "",
          service_ids: [],
          date: today,
          time: "",
          name: "",
          phone: "",
        });
        setShowBookingForm(false);
        fetchBookings();
        setTimeout(() => setSuccess(""), 3000);
      } else {
        const errorMsg = data.message || data.error || "Bron qo'shish muvaffaqiyatsiz";
        setError(errorMsg);
        toast.error(errorMsg, {
          duration: 4000,
        });
      }
    } catch (err) {
      console.error("Error creating booking:", err);
      setError(err.message || "Tarmoq xatosi");
    } finally {
      setIsSubmittingBooking(false);
    }
  };

  const handleServiceToggle = (serviceId) => {
    const serviceIdString = String(serviceId);
    setBookingFormData((prev) => {
      const currentIds = prev.service_ids || [];
      const isSelected = currentIds.includes(serviceIdString);
      if (isSelected) {
        return {
          ...prev,
          service_ids: currentIds.filter((id) => id !== serviceIdString),
        };
      } else {
        return {
          ...prev,
          service_ids: [...currentIds, serviceIdString],
        };
      }
    });
  };

  const handleSearch = () => {
    setIsSearching(true);
    let filtered = [...allBookings];

    // Filter by client name
    if (searchCriteria.clientName.trim()) {
      filtered = filtered.filter((booking) => {
        const clientName = (
          booking.client?.name ||
          booking.client_name ||
          ""
        ).toLowerCase();
        return clientName.includes(searchCriteria.clientName.toLowerCase());
      });
    }

    // Filter by phone
    if (searchCriteria.phone.trim()) {
      filtered = filtered.filter((booking) => {
        const phone = (
          booking.client?.phone_number ||
          booking.phone_number ||
          ""
        ).toLowerCase();
        return phone.includes(searchCriteria.phone.toLowerCase());
      });
    }

    // Filter by barber
    if (searchCriteria.barberId) {
      filtered = filtered.filter((booking) => {
        const barberId = booking.barber?.id || booking.barber_id || booking.barber?._id;
        return String(barberId) === String(searchCriteria.barberId);
      });
    }

    // Filter by service
    if (searchCriteria.serviceId) {
      filtered = filtered.filter((booking) => {
        if (booking.service?.id || booking.service_id) {
          const serviceId = booking.service?.id || booking.service_id;
          return String(serviceId) === String(searchCriteria.serviceId);
        }
        if (booking.services && Array.isArray(booking.services)) {
          return booking.services.some(
            (s) => String(s.id || s._id) === String(searchCriteria.serviceId)
          );
        }
        return false;
      });
    }

    // Filter by date range
    if (searchCriteria.dateFrom) {
      filtered = filtered.filter((booking) => {
        const bookingDate = booking.date || "";
        return bookingDate >= searchCriteria.dateFrom;
      });
    }

    if (searchCriteria.dateTo) {
      filtered = filtered.filter((booking) => {
        const bookingDate = booking.date || "";
        return bookingDate <= searchCriteria.dateTo;
      });
    }

    // Filter by status
    if (searchCriteria.status) {
      filtered = filtered.filter((booking) => {
        return (
          booking.status?.toLowerCase() === searchCriteria.status.toLowerCase()
        );
      });
    }

    // Sort filtered results (newest first)
    const sortedFiltered = sortBookings(filtered);
    setBookings(sortedFiltered);
    setShowSearchModal(false);
    setIsSearching(false);
  };

  const handleResetSearch = () => {
    setSearchCriteria({
      clientName: "",
      phone: "",
      barberId: "",
      serviceId: "",
      dateFrom: "",
      dateTo: "",
      status: "",
    });
    setBookings(allBookings);
    setIsSearching(false);
    setShowSearchModal(false);
  };

  const handleSearchCriteriaChange = (field, value) => {
    setSearchCriteria({
      ...searchCriteria,
      [field]: value,
    });
  };

  const fetchStatistics = async () => {
    try {
      setLoadingStatistics(true);
      setError("");

      const response = await apiRequest(
        API_ENDPOINTS.bookingsStatistics,
        {
          method: "POST",
          body: JSON.stringify({
            startDate: statisticsDateRange.startDate,
            endDate: statisticsDateRange.endDate,
          }),
        },
        true,
        5000
      );

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(
          data.message || `Failed to fetch statistics: ${response.status}`
        );
      }

      const data = await response.json();
      setStatistics(data);
    } catch (err) {
      console.error("Error fetching statistics:", err);
      setError(err.message || "Statistikani yuklash muvaffaqiyatsiz");
    } finally {
      setLoadingStatistics(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "approved":
        return "bg-green-100 text-green-800 border-green-300";
      case "rejected":
        return "bg-red-100 text-red-800 border-red-300";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "completed":
        return "bg-blue-100 text-blue-800 border-blue-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  if (loading) {
    return (
      <div className="pt-16 sm:pt-20 md:pt-[92px] min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-barber-gold mx-auto mb-4"></div>
          <p className="text-black">Yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-16 sm:pt-20 md:pt-[92px] min-h-screen bg-gray-50">
      <section className="w-full py-8 sm:py-10 md:py-12 lg:py-16">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-[127px]">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-black mb-2">
                Admin Boshqaruv Paneli
              </h1>
              <p className="text-gray-600">
                Bronlarni boshqarish va nazorat qilish
              </p>
            </div>
            <div className="flex gap-3 flex-wrap">
              <Button
                onClick={() => setShowBookingForm(true)}
                size="sm"
                className="bg-barber-olive hover:bg-barber-gold text-white">
                + Yangi bron qo'shish
              </Button>
              <Button
                onClick={() => setShowSearchModal(true)}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white">
                🔍 Qidirish
              </Button>
              {isSearching && (
                <Button
                  onClick={handleResetSearch}
                  size="sm"
                  variant="outlined"
                  className="border-gray-500 text-gray-700 hover:bg-gray-50">
                  Filterni tozalash
                </Button>
              )}
              <Button
                onClick={logout}
                size="sm"
                variant="outlined"
                className="border-red-500 text-red-500 hover:bg-red-50">
                Chiqish
              </Button>
            </div>
          </div>

          {/* Messages */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg text-sm mb-4">
              ✅ {success}
            </div>
          )}

          {/* Statistics Section */}
          {showStatistics && (
            <div className="mb-6 bg-white rounded-2xl sm:rounded-3xl shadow-lg border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-black mb-4">
                Booking Statistikasi
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Boshlanish sanasi
                  </label>
                  <Input
                    type="date"
                    value={statisticsDateRange.startDate}
                    onChange={(e) =>
                      setStatisticsDateRange({
                        ...statisticsDateRange,
                        startDate: e.target.value,
                      })
                    }
                    size="lg"
                    className="!text-black !bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tugash sanasi
                  </label>
                  <Input
                    type="date"
                    value={statisticsDateRange.endDate}
                    onChange={(e) =>
                      setStatisticsDateRange({
                        ...statisticsDateRange,
                        endDate: e.target.value,
                      })
                    }
                    size="lg"
                    className="!text-black !bg-white"
                  />
                </div>
              </div>
              <Button
                onClick={fetchStatistics}
                disabled={loadingStatistics}
                className="bg-purple-600 hover:bg-purple-700 text-white mb-4"
                loading={loadingStatistics}>
                {loadingStatistics ? "Yuklanmoqda..." : "Statistikani olish"}
              </Button>

              {statistics && (
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {Object.entries(statistics)
                    .filter(([, value]) => {
                      // Skip date range objects and other non-displayable objects
                      if (
                        typeof value === "object" &&
                        value !== null &&
                        !Array.isArray(value)
                      ) {
                        // Skip if it looks like a date range object
                        if (
                          ("start_date" in value || "startDate" in value) &&
                          ("end_date" in value || "endDate" in value)
                        ) {
                          return false;
                        }
                        // Skip other complex objects
                        return false;
                      }
                      return true;
                    })
                    .map(([key, value]) => {
                      // Format the key for display
                      const displayKey = key
                        .replace(/_/g, " ")
                        .replace(/\b\w/g, (l) => l.toUpperCase());

                      // Handle different value types
                      let displayValue;
                      if (typeof value === "number") {
                        displayValue = value.toLocaleString();
                      } else if (Array.isArray(value)) {
                        displayValue = value.length.toString();
                      } else if (typeof value === "boolean") {
                        displayValue = value ? "Ha" : "Yo'q";
                      } else if (value === null || value === undefined) {
                        displayValue = "N/A";
                      } else {
                        displayValue = String(value);
                      }

                      return (
                        <div
                          key={key}
                          className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                          <div className="text-sm text-gray-600 mb-1">
                            {displayKey}
                          </div>
                          <div className="text-2xl font-bold text-black break-words">
                            {displayValue}
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          )}

          {/* Filter and Stats */}
          <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bronlarni filtrlash
              </label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full sm:w-auto min-w-[200px] px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-barber-olive focus:border-barber-olive text-base">
                <option value="all">Barcha bronlar ({bookings.length})</option>
                <option value="pending">Kutilmoqda</option>
                <option value="approved">Tasdiqlangan</option>
                <option value="rejected">Rad etilgan</option>
                <option value="completed">Yakunlangan</option>
              </select>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
              {/* Socket.IO connection status */}
              <div className="flex items-center gap-1.5 bg-white rounded-md px-1.5 py-1 border border-gray-300">
                <div className="flex items-center gap-1.5">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      wsConnected 
                        ? "bg-green-500 animate-pulse" 
                        : usePollingFallback 
                        ? "bg-yellow-500 animate-pulse" 
                        : "bg-red-500"
                    }`}
                    title={
                      wsConnected 
                        ? "Socket.IO connected" 
                        : usePollingFallback 
                        ? "Polling fallback active" 
                        : "Socket.IO disconnected"
                    }
                  />
                  <span className="text-xs font-medium text-gray-700">
                    {wsConnected 
                      ? "Live" 
                      : usePollingFallback 
                      ? "Live" 
                      : "Offline"}
                  </span>
                  {!wsConnected && !usePollingFallback && wsReconnectAttempts > 0 && (
                    <span className="text-[10px] text-gray-500">
                      ({wsReconnectAttempts}/5)
                    </span>
                  )}
                </div>
                {!wsConnected && (
                  <Button
                    onClick={() => {
                      console.log("🔄 Manual reconnect triggered");
                      setWsReconnectAttempts(0);
                      reconnectAttemptsRef.current = 0;
                      stopPollingFallback(); // Stop polling when manually reconnecting
                      if (socketRef.current) {
                        socketRef.current.disconnect();
                        socketRef.current = null;
                      }
                      // Manually trigger reconnection
                      if (isAuthenticated() && (isAdmin() || isSuperAdmin())) {
                        connectSocketIO();
                      }
                    }}
                    size="sm"
                    variant="outlined"
                    className="ml-1 border-blue-500 text-blue-600 hover:bg-blue-50 text-[10px] px-1.5 py-0.5">
                    {usePollingFallback ? "Socket.IO'ga qaytish" : "Qayta ulanish"}
                  </Button>
                )}
              </div>
              <div className="flex gap-2 text-sm flex-wrap">
                <div className="px-3 py-2 bg-yellow-100 text-yellow-800 rounded-lg">
                  Kutilmoqda:{" "}
                  {
                    bookings.filter((b) => b.status?.toLowerCase() === "pending")
                      .length
                  }
                </div>
                <div className="px-3 py-2 bg-green-100 text-green-800 rounded-lg">
                  Tasdiqlangan:{" "}
                  {
                    bookings.filter((b) => b.status?.toLowerCase() === "approved")
                      .length
                  }
                </div>
                <div className="px-3 py-2 bg-red-100 text-red-800 rounded-lg">
                  Rad etilgan:{" "}
                  {
                    bookings.filter((b) => b.status?.toLowerCase() === "rejected")
                      .length
                  }
                </div>
                <div className="px-3 py-2 bg-blue-100 text-blue-800 rounded-lg">
                  Yakunlangan:{" "}
                  {
                    bookings.filter((b) => b.status?.toLowerCase() === "completed")
                      .length
                  }
                </div>
              </div>
            </div>
          </div>

          {/* Bookings Table */}
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-barber-dark text-white">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold whitespace-nowrap">
                      ID
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold whitespace-nowrap">
                      Mijoz
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold whitespace-nowrap">
                      Telefon
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold whitespace-nowrap">
                      Barber
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold whitespace-nowrap">
                      Xizmat
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold whitespace-nowrap">
                      Sana
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold whitespace-nowrap">
                      Vaqt
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold whitespace-nowrap">
                      Holat
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold whitespace-nowrap">
                      Amallar
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {bookings.length === 0 ? (
                    <tr>
                      <td
                        colSpan="9"
                        className="px-4 py-8 text-center text-gray-500">
                        Bronlar topilmadi
                      </td>
                    </tr>
                  ) : (
                    bookings.map((booking) => (
                      <tr
                        key={booking.id || booking._id}
                        className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium whitespace-nowrap">
                          {booking.id || booking._id}
                        </td>
                        <td className="px-4 py-3 text-sm whitespace-nowrap">
                          {booking.client?.name || booking.client_name || "N/A"}
                        </td>
                        <td className="px-4 py-3 text-sm whitespace-nowrap">
                          {booking.client?.phone_number ||
                            booking.phone_number ||
                            "N/A"}
                        </td>
                        <td className="px-4 py-3 text-sm whitespace-nowrap">
                          {booking.barber?.name || booking.barber_name || "N/A"}
                        </td>
                        <td className="px-4 py-3 text-sm whitespace-nowrap">
                          {booking.service?.name ||
                            booking.service_name ||
                            (booking.services && booking.services.length > 0
                              ? booking.services
                                  .map((s) => s.name || s.service_name)
                                  .join(", ")
                              : "N/A")}
                        </td>
                        <td className="px-4 py-3 text-sm whitespace-nowrap">
                          {booking.date || "N/A"}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium whitespace-nowrap">
                          {booking.time || "N/A"}
                        </td>
                        <td className="px-4 py-3 text-sm whitespace-nowrap">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold border whitespace-nowrap ${getStatusColor(
                              booking.status
                            )}`}>
                            {booking.status || "pending"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm whitespace-nowrap">
                          <div className="flex flex-nowrap gap-2 items-center">
                            {booking.status?.toLowerCase() === "pending" && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    handleApprove(booking.id || booking._id)
                                  }
                                  className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 text-xs">
                                  ✓ Tasdiqlash
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    handleReject(booking.id || booking._id)
                                  }
                                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 text-xs">
                                  ✗ Rad etish
                                </Button>
                              </>
                            )}
                            <select
                              value={booking.status || "pending"}
                              onChange={(e) =>
                                handleStatusChange(
                                  booking.id || booking._id,
                                  e.target.value
                                )
                              }
                              className="px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-barber-olive focus:border-barber-olive text-xs">
                              <option value="pending">Kutilmoqda</option>
                              <option value="approved">Tasdiqlangan</option>
                              <option value="rejected">Rad etilgan</option>
                              <option value="completed">Yakunlangan</option>
                            </select>
                            <Button
                              size="sm"
                              onClick={() =>
                                setDeleteConfirm(booking.id || booking._id)
                              }
                              className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 text-xs">
                              🗑️ O'chirish
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold text-black mb-4">
              Bronni o'chirish
            </h3>
            <p className="text-gray-700 mb-6">
              Bu bronni o'chirishni xohlaysizmi? Bu amalni qaytarib bo'lmaydi.
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                onClick={() => setDeleteConfirm(null)}
                variant="outlined"
                className="border-gray-300 text-gray-700">
                Bekor qilish
              </Button>
              <Button
                onClick={() => handleDelete(deleteConfirm)}
                className="bg-red-600 hover:bg-red-700 text-white">
                O'chirish
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Booking Form Modal */}
      {showBookingForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-black">
                Yangi bron qo'shish
              </h3>
              <button
                onClick={() => {
                  setShowBookingForm(false);
                  setBookingFormData({
                    barber_id: "",
                    service_ids: [],
                    date: today,
                    time: "",
                    name: "",
                    phone: "",
                  });
                }}
                className="text-gray-500 hover:text-gray-700 text-2xl">
                ×
              </button>
            </div>

            <form onSubmit={handleBookingSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Barber <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={bookingFormData.barber_id}
                    onChange={(e) =>
                      setBookingFormData({
                        ...bookingFormData,
                        barber_id: e.target.value,
                      })
                    }
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-barber-olive focus:border-barber-olive">
                    <option value="">Barberni tanlang</option>
                    {barbers.map((barber) => (
                      <option
                        key={barber.id || barber._id}
                        value={barber.id || barber._id}>
                        {barber.name || barber.fullName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sana <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="date"
                    value={bookingFormData.date}
                    onChange={(e) =>
                      setBookingFormData({
                        ...bookingFormData,
                        date: e.target.value,
                      })
                    }
                    required
                    size="lg"
                    min={new Date().toISOString().split("T")[0]}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vaqt <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="time"
                    value={bookingFormData.time}
                    onChange={(e) =>
                      setBookingFormData({
                        ...bookingFormData,
                        time: e.target.value,
                      })
                    }
                    required
                    size="lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mijoz ismi <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    value={bookingFormData.name}
                    onChange={(e) =>
                      setBookingFormData({
                        ...bookingFormData,
                        name: e.target.value,
                      })
                    }
                    required
                    size="lg"
                    placeholder="Ism kiriting"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Telefon raqami <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="tel"
                    value={bookingFormData.phone}
                    onChange={(e) =>
                      setBookingFormData({
                        ...bookingFormData,
                        phone: e.target.value,
                      })
                    }
                    required
                    size="lg"
                    placeholder="+998901234567"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Xizmatlar
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {services.map((service) => (
                    <label
                      key={service.id || service._id}
                      className="flex items-center space-x-2 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={bookingFormData.service_ids.includes(
                          String(service.id || service._id)
                        )}
                        onChange={() =>
                          handleServiceToggle(service.id || service._id)
                        }
                        className="w-4 h-4 text-barber-olive border-gray-300 rounded focus:ring-barber-olive"
                      />
                      <span className="text-sm text-gray-700">
                        {service.name}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
                <Button
                  type="button"
                  onClick={() => {
                    setShowBookingForm(false);
                    setBookingFormData({
                      barber_id: "",
                      service_ids: [],
                      date: today,
                      time: "",
                      name: "",
                      phone: "",
                    });
                  }}
                  variant="outlined"
                  className="border-gray-300 text-gray-700">
                  Bekor qilish
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmittingBooking || loadingBookingData}
                  size="lg"
                  className="bg-barber-olive hover:bg-barber-gold text-white font-semibold"
                  loading={isSubmittingBooking}>
                  {isSubmittingBooking ? "Qo'shilmoqda..." : "Bron qo'shish"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Search Modal */}
      {showSearchModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-black mb-6">
              Bronlarni qidirish
            </h3>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mijoz ismi
                  </label>
                  <Input
                    type="text"
                    value={searchCriteria.clientName}
                    onChange={(e) =>
                      handleSearchCriteriaChange("clientName", e.target.value)
                    }
                    placeholder="Mijoz ismini kiriting"
                    size="lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Telefon raqami
                  </label>
                  <Input
                    type="tel"
                    value={searchCriteria.phone}
                    onChange={(e) =>
                      handleSearchCriteriaChange("phone", e.target.value)
                    }
                    placeholder="+998901234567"
                    size="lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Barber
                  </label>
                  <select
                    value={searchCriteria.barberId}
                    onChange={(e) =>
                      handleSearchCriteriaChange("barberId", e.target.value)
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-barber-olive focus:border-barber-olive">
                    <option value="">Barcha barberlar</option>
                    {barbers.map((barber) => (
                      <option
                        key={barber.id || barber._id}
                        value={barber.id || barber._id}>
                        {barber.name || barber.fullName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Xizmat
                  </label>
                  <select
                    value={searchCriteria.serviceId}
                    onChange={(e) =>
                      handleSearchCriteriaChange("serviceId", e.target.value)
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-barber-olive focus:border-barber-olive">
                    <option value="">Barcha xizmatlar</option>
                    {services.map((service) => (
                      <option
                        key={service.id || service._id}
                        value={service.id || service._id}>
                        {service.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sanadan
                  </label>
                  <Input
                    type="date"
                    value={searchCriteria.dateFrom}
                    onChange={(e) =>
                      handleSearchCriteriaChange("dateFrom", e.target.value)
                    }
                    size="lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sanagacha
                  </label>
                  <Input
                    type="date"
                    value={searchCriteria.dateTo}
                    onChange={(e) =>
                      handleSearchCriteriaChange("dateTo", e.target.value)
                    }
                    size="lg"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Holat
                  </label>
                  <select
                    value={searchCriteria.status}
                    onChange={(e) =>
                      handleSearchCriteriaChange("status", e.target.value)
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-barber-olive focus:border-barber-olive">
                    <option value="">Barcha holatlar</option>
                    <option value="pending">Kutilmoqda</option>
                    <option value="approved">Tasdiqlangan</option>
                    <option value="rejected">Rad etilgan</option>
                    <option value="completed">Yakunlangan</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
                <Button
                  type="button"
                  onClick={() => setShowSearchModal(false)}
                  variant="outlined"
                  className="border-gray-300 text-gray-700">
                  Bekor qilish
                </Button>
                <Button
                  type="button"
                  onClick={handleResetSearch}
                  variant="outlined"
                  className="border-orange-500 text-orange-600 hover:bg-orange-50">
                  Tozalash
                </Button>
                <Button
                  type="button"
                  onClick={handleSearch}
                  className="bg-blue-600 hover:bg-blue-700 text-white">
                  Qidirish
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Admin Modal */}
      {showAddAdmin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-black mb-4">
              Yangi Admin Qo'shish
            </h3>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleAddAdmin} className="space-y-4">
              <Input
                type="text"
                name="name"
                value={adminForm.name}
                onChange={(e) => handleAdminFormChange("name", e.target.value)}
                label="Ism"
                placeholder="Ism kiriting"
                required
                size="lg"
                disabled={isSubmittingAdmin}
              />

              <Input
                type="text"
                name="tg_username"
                value={adminForm.tg_username}
                onChange={(e) =>
                  handleAdminFormChange("tg_username", e.target.value)
                }
                label="Telegram foydalanuvchi nomi"
                placeholder="@username"
                required
                size="lg"
                disabled={isSubmittingAdmin}
              />

              <Input
                type="tel"
                name="phone_number"
                value={adminForm.phone_number}
                onChange={(e) =>
                  handleAdminFormChange("phone_number", e.target.value)
                }
                label="Telefon raqami"
                placeholder="+998901234567"
                required
                size="lg"
                disabled={isSubmittingAdmin}
              />

              <Input
                type="password"
                name="password"
                value={adminForm.password}
                onChange={(e) =>
                  handleAdminFormChange("password", e.target.value)
                }
                label="Parol"
                placeholder="Parol kiriting"
                required
                size="lg"
                disabled={isSubmittingAdmin}
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rol
                </label>
                <select
                  value={adminForm.role}
                  onChange={(e) =>
                    handleAdminFormChange("role", e.target.value)
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-barber-olive focus:border-barber-olive text-base"
                  disabled={isSubmittingAdmin}>
                  <option value="admin">Admin</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <Button
                  type="button"
                  onClick={() => {
                    setShowAddAdmin(false);
                    setAdminForm({
                      name: "",
                      tg_username: "",
                      phone_number: "",
                      password: "",
                      role: "admin",
                    });
                    setError("");
                  }}
                  variant="outlined"
                  className="border-gray-300 text-gray-700"
                  disabled={isSubmittingAdmin}>
                  Bekor qilish
                </Button>
                <Button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={isSubmittingAdmin}
                  loading={isSubmittingAdmin}>
                  {isSubmittingAdmin ? "Qo'shilmoqda..." : "Qo'shish"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Analytics />
    </div>
  );
}

export default Admin;
