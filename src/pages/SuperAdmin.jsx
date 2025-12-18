import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Input } from "@material-tailwind/react";
import { Analytics } from "@vercel/analytics/react";
import { useAuth } from "../context/AuthContext";
import { AUTH_BASE_URL, API_ENDPOINTS, BOOKINGS_BASE_URL, SERVICES_BASE_URL, BARBERS_BASE_URL } from "../data/api";
import { getAuthToken } from "../utils/api";

function SuperAdmin() {
  const navigate = useNavigate();
  const { isAuthenticated, isSuperAdmin, logout } = useAuth();
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    tg_username: "",
    phone_number: "",
    password: "",
    profile_image: null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: "",
    tg_username: "",
    phone_number: "",
    password: "",
    profile_image: null,
  });
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
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

  useEffect(() => {
    if (!isAuthenticated() || !isSuperAdmin()) {
      navigate("/");
      return;
    }

    fetchAdmins();
    fetchBookingData();
  }, [navigate, isAuthenticated, isSuperAdmin]);

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

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    setIsSubmittingBooking(true);
    setError("");
    setSuccess("");

    try {
      const today = new Date().toISOString().split("T")[0];
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
        setBookingFormData({
          barber_id: "",
          service_ids: [],
          date: today,
          time: "",
          name: "",
          phone: "",
        });
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(data.message || data.error || "Bron qo'shish muvaffaqiyatsiz");
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

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      setError("");

        // Get token from localStorage
      const token = getAuthToken();
      if (!token) {
        throw new Error("Token topilmadi. Iltimos, qayta kirib ko'ring.");
      }

      // Fetch all users from /users endpoint with token
      // Use AUTH_BASE_URL (which is BASE_URL) since /users is at root level, not under /api
      console.log("Fetching users from:", `${AUTH_BASE_URL}${API_ENDPOINTS.users}`);
      const response = await fetch(`${AUTH_BASE_URL}${API_ENDPOINTS.users}`, {
            method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "*/*",
          Authorization: `Bearer ${token}`,
        },
        mode: "cors",
      });

      console.log("Users response status:", response.status, response.statusText);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message ||
            `Adminlarni yuklash muvaffaqiyatsiz: ${response.status}`
        );
      }

      const data = await response.json();
      console.log("Users data received:", data);
      
      const usersList = Array.isArray(data)
        ? data
        : data.data || data.admins || data.users || [];

      // Filter for admin role users (exclude super_admin from the list)
      const adminsList = usersList.filter((u) => u.role === "admin");
      setAdmins(adminsList);
    } catch (err) {
      console.error("Error fetching admins:", err);
      setError(err.message || "Adminlarni yuklash muvaffaqiyatsiz");
    } finally {
      setLoading(false);
    }
  };

  const handleAddAdmin = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    setSuccess("");

    try {
      // Create FormData for multipart/form-data
      const formDataToSend = new FormData();
      formDataToSend.append("name", formData.name);
      formDataToSend.append("tg_username", formData.tg_username?.replace(/^@/, '') || formData.tg_username);
      formDataToSend.append("phone_number", formData.phone_number);
      formDataToSend.append("password", formData.password);
      formDataToSend.append("role", "admin");
      
      // Profile image not needed for admins

      // Register new admin with admin role
      const response = await fetch(
        `${AUTH_BASE_URL}${API_ENDPOINTS.users}`,
        {
          method: "POST",
          headers: {
            Accept: "*/*",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            // Don't set Content-Type header - browser will set it with boundary for FormData
          },
          body: formDataToSend,
          mode: "cors",
        }
      );

      const data = await response.json();

      if (response.ok || response.status === 201) {
        setSuccess("Admin muvaffaqiyatli qo'shildi!");
        setFormData({
          name: "",
          tg_username: "",
          phone_number: "",
          password: "",
          profile_image: null,
        });
        setShowAddForm(false);
        fetchAdmins(); // Refresh admin list
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(
          data.message || data.error || "Admin qo'shish muvaffaqiyatsiz"
        );
      }
    } catch (err) {
      console.error("Error adding admin:", err);
      setError("Tarmoq xatosi. Iltimos, qayta urinib ko'ring.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditAdmin = (admin) => {
    setEditingAdmin(admin);
    setEditFormData({
      name: admin.name || "",
      tg_username: admin.tg_username || "",
      phone_number: admin.phone_number || "",
      password: "", // Don't pre-fill password
      profile_image: null,
    });
    setError("");
  };

  const handleUpdateAdmin = async (e) => {
    e.preventDefault();
    if (!editingAdmin) return;

    setIsSubmittingEdit(true);
    setError("");
    setSuccess("");

    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error("Token topilmadi. Iltimos, qayta kirib ko'ring.");
      }

      const adminId = editingAdmin.id || editingAdmin._id;
      
      // Create FormData for multipart/form-data
      const formDataToSend = new FormData();
      formDataToSend.append("name", editFormData.name);
      formDataToSend.append("tg_username", editFormData.tg_username?.replace(/^@/, '') || editFormData.tg_username);
      formDataToSend.append("phone_number", editFormData.phone_number);

      // Only include password if it's provided
      if (editFormData.password && editFormData.password.trim() !== "") {
        formDataToSend.append("password", editFormData.password);
      }

      // Profile image not needed for admins

      const response = await fetch(
        `${AUTH_BASE_URL}${API_ENDPOINTS.users}/${adminId}`,
        {
          method: "PATCH",
          headers: {
            Accept: "*/*",
            Authorization: `Bearer ${token}`,
            // Don't set Content-Type header - browser will set it with boundary for FormData
          },
          body: formDataToSend,
          mode: "cors",
        }
      );

      const data = await response.json();

      if (response.ok) {
        setSuccess("Admin muvaffaqiyatli yangilandi!");
        setEditingAdmin(null);
        setEditFormData({
          name: "",
          tg_username: "",
          phone_number: "",
          password: "",
          profile_image: null,
        });
        fetchAdmins(); // Refresh admin list
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(data.message || data.error || "Adminni yangilash muvaffaqiyatsiz");
      }
    } catch (err) {
      console.error("Error updating admin:", err);
      setError(err.message || "Tarmoq xatosi. Iltimos, qayta urinib ko'ring.");
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  const handleDeleteAdmin = async (adminId) => {
    if (!window.confirm("Bu adminni o'chirishni xohlaysizmi?")) {
      return;
    }

    try {
      setError("");
      setSuccess("");

      const token = getAuthToken();
      if (!token) {
        throw new Error("Token topilmadi. Iltimos, qayta kirib ko'ring.");
      }

      const response = await fetch(
        `${AUTH_BASE_URL}${API_ENDPOINTS.users}/${adminId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Accept: "*/*",
            Authorization: `Bearer ${token}`,
        },
          mode: "cors",
        }
      );

      if (response.ok) {
        setSuccess("Admin muvaffaqiyatli o'chirildi!");
        fetchAdmins(); // Refresh admin list
        setTimeout(() => setSuccess(""), 3000);
      } else {
        const data = await response.json().catch(() => ({}));
        setError(data.message || "Adminni o'chirish muvaffaqiyatsiz");
      }
    } catch (err) {
      console.error("Error deleting admin:", err);
      setError(err.message || "Tarmoq xatosi. Iltimos, qayta urinib ko'ring.");
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    if (error) setError("");
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
    <div className="pt-16 sm:pt-20 md:pt-[92px] min-h-screen bg-white">
      <section className="w-full py-8 sm:py-10 md:py-12 lg:py-16">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-[127px]">
          <div className="flex justify-between items-center mb-10">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-black">
              Super Admin Boshqaruv Paneli
            </h1>
            <div className="flex gap-3">
              <Button
                onClick={logout}
                size="sm"
                variant="outlined"
                className="border-red-500 text-red-500 hover:bg-red-50">
                Chiqish
              </Button>
            </div>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg text-sm mb-4">
              {success}
            </div>
          )}

          <div className="mb-6">
            <Button
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-barber-olive hover:bg-barber-gold text-white">
              {showAddForm ? "Formani yopish" : "+ Yangi admin qo'shish"}
            </Button>
          </div>

          {showAddForm && (
            <div className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-10 shadow-lg border border-gray-200 mb-8">
              <h2 className="text-xl sm:text-2xl font-bold text-black mb-6">
                Yangi admin qo'shish
              </h2>
              <form
                onSubmit={handleAddAdmin}
                className="space-y-4 sm:space-y-5 md:space-y-6">
                <Input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  label="To'liq ism"
                  required
                  size="lg"
                  disabled={isSubmitting}
                />

                <Input
                  type="text"
                  name="tg_username"
                  value={formData.tg_username}
                  onChange={handleInputChange}
                  label="Telegram foydalanuvchi nomi"
                  placeholder="@username"
                  required
                  size="lg"
                  disabled={isSubmitting}
                />

                <Input
                  type="tel"
                  name="phone_number"
                  value={formData.phone_number}
                  onChange={handleInputChange}
                  label="Telefon raqami"
                  placeholder="+998901234567"
                  required
                  size="lg"
                  disabled={isSubmitting}
                />

                <Input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  label="Parol"
                  required
                  size="lg"
                  disabled={isSubmitting}
                />

                <div className="flex gap-3">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    size="lg"
                    className="bg-barber-olive hover:bg-barber-gold text-white font-semibold"
                    loading={isSubmitting}>
                    {isSubmitting ? "Qo'shilmoqda..." : "Admin qo'shish"}
                  </Button>
                  <Button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false);
                      setFormData({
                        name: "",
                        tg_username: "",
                        phone_number: "",
                        password: "",
                        profile_image: null,
                      });
                      setError("");
                    }}
                    size="lg"
                    variant="outlined"
                    className="border-gray-300 text-gray-700">
                    Bekor qilish
                  </Button>
                </div>
              </form>
            </div>
          )}

          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-barber-dark text-white">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold">
                      ID
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">
                      Ism
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">
                      Telegram
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">
                      Telefon
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">
                      Rol
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">
                      Amallar
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {admins.length === 0 ? (
                    <tr>
                      <td
                        colSpan="6"
                        className="px-4 py-8 text-center text-gray-500">
                        Adminlar topilmadi
                      </td>
                    </tr>
                  ) : (
                    admins.map((admin) => (
                      <tr
                        key={admin.id || admin._id}
                        className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm">
                          {admin.id || admin._id}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {admin.name || admin.fullName || "N/A"}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {admin.tg_username ||
                            admin.telegram_username ||
                            "N/A"}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {admin.phone_number || admin.phone || "N/A"}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className="px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                            {admin.role || "admin"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleEditAdmin(admin)}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 text-xs">
                              Tahrirlash
                            </Button>
                          <Button
                            size="sm"
                            onClick={() =>
                              handleDeleteAdmin(admin.id || admin._id)
                            }
                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 text-xs">
                            O'chirish
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

      {/* Edit Admin Modal */}
      {editingAdmin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-black mb-4">
              Adminni tahrirlash
            </h3>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleUpdateAdmin} className="space-y-4">
              <Input
                type="text"
                name="name"
                value={editFormData.name}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    name: e.target.value,
                  })
                }
                label="To'liq ism"
                required
                size="lg"
                disabled={isSubmittingEdit}
              />

              <Input
                type="text"
                name="tg_username"
                value={editFormData.tg_username}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    tg_username: e.target.value,
                  })
                }
                label="Telegram foydalanuvchi nomi"
                placeholder="@username"
                required
                size="lg"
                disabled={isSubmittingEdit}
              />

              <Input
                type="tel"
                name="phone_number"
                value={editFormData.phone_number}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    phone_number: e.target.value,
                  })
                }
                label="Telefon raqami"
                placeholder="+998901234567"
                required
                size="lg"
                disabled={isSubmittingEdit}
              />

              <Input
                type="password"
                name="password"
                value={editFormData.password}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    password: e.target.value,
                  })
                }
                label="Yangi parol (ixtiyoriy)"
                placeholder="Parolni o'zgartirmaslik uchun bo'sh qoldiring"
                size="lg"
                disabled={isSubmittingEdit}
              />

              <div className="flex gap-3 justify-end pt-4">
                <Button
                  type="button"
                  onClick={() => {
                    setEditingAdmin(null);
                    setEditFormData({
                      name: "",
                      tg_username: "",
                      phone_number: "",
                      password: "",
                      profile_image: null,
                    });
                    setError("");
                  }}
                  variant="outlined"
                  className="border-gray-300 text-gray-700"
                  disabled={isSubmittingEdit}>
                  Bekor qilish
                </Button>
                <Button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={isSubmittingEdit}
                  loading={isSubmittingEdit}>
                  {isSubmittingEdit ? "Yangilanmoqda..." : "Yangilash"}
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

export default SuperAdmin;
