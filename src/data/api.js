// API configuration
// Update this with your actual API base URL
export const BASE_URL = "https://api.001barbershop.uz";

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || `${BASE_URL}/api`;
export const AUTH_BASE_URL = import.meta.env.VITE_AUTH_BASE_URL || BASE_URL;
export const SERVICES_BASE_URL =
  import.meta.env.VITE_SERVICES_BASE_URL || BASE_URL;
export const BARBERS_BASE_URL =
  import.meta.env.VITE_BARBERS_BASE_URL || BASE_URL;
export const BOOKINGS_BASE_URL =
  import.meta.env.VITE_BOOKINGS_BASE_URL || BASE_URL;
export const POSTS_BASE_URL =
  import.meta.env.VITE_POSTS_BASE_URL || BASE_URL;

// Socket.IO URL
const getSocketIOUrl = () => {
  const baseUrl = import.meta.env.VITE_BOOKINGS_BASE_URL || BASE_URL;
  return baseUrl;
};

export const SOCKET_IO_URL =
  import.meta.env.VITE_SOCKET_IO_URL || getSocketIOUrl();

export const API_ENDPOINTS = {
  register: "/auth/register",
  login: "/auth/login",
  users: "/users",
  barbers: "/users/barbers",
  services: "/barber-services",
  bookings: "/bookings",
  bookingsMy: "/bookings/my",
  bookingsMultiple: "/bookings/multiple",
  bookingsPending: "/bookings/pending",
  bookingsClient: "/bookings/client",
  bookingsBarber: "/bookings/barber",
  bookingsStatistics: "/bookings/admin/statistics",
  bookingApprove: "/bookings",
  bookingReject: "/bookings",
  bookingStatus: "/bookings",
  comments: "/bookings/comments",
  broadcastPost: "/posts/broadcast",
};
