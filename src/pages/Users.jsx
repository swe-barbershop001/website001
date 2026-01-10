import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Input, Select, Option } from "@material-tailwind/react";
import { Analytics } from "@vercel/analytics/react";
import { useAuth } from "../context/AuthContext";
import { AUTH_BASE_URL, API_ENDPOINTS, SERVICES_BASE_URL } from "../data/api";
import { getAuthToken } from "../utils/api";
import Footer from "../components/Footer";

function Users() {
  const navigate = useNavigate();
  const {
    isAuthenticated,
    isAdmin,
    isSuperAdmin,
    user: currentUser,
    logout,
  } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    tg_username: "",
    phone_number: "",
    password: "",
    role: "client",
    working: true,
    work_start_time: "09:00",
    work_end_time: "18:00",
    profile_image: null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: "",
    tg_username: "",
    phone_number: "",
    password: "",
    role: "",
    working: true,
    work_start_time: "09:00",
    work_end_time: "18:00",
    profile_image: null,
  });
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
  const [managingServicesForBarber, setManagingServicesForBarber] =
    useState(null);
  const [barberServices, setBarberServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [editServiceFormData, setEditServiceFormData] = useState({
    name: "",
    price: "",
    duration: "",
  });
  const [isSubmittingServiceEdit, setIsSubmittingServiceEdit] = useState(false);
  const [roleFilter, setRoleFilter] = useState("all"); // all, client, barber, admin, super_admin

  // Get available roles based on current user's role
  // Note: super_admin cannot be created through the UI
  const getAvailableRoles = () => {
    if (isSuperAdmin()) {
      return ["client", "barber", "admin"];
    }
    if (isAdmin()) {
      return ["client", "barber"];
    }
    return [];
  };

  useEffect(() => {
    if (!isAuthenticated() || (!isAdmin() && !isSuperAdmin())) {
      navigate("/admin/login");
      return;
    }

    fetchUsers();
  }, [navigate, isAuthenticated, isAdmin, isSuperAdmin]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError("");

      const token = getAuthToken();
      if (!token) {
        throw new Error("Token topilmadi. Iltimos, qayta kirib ko'ring.");
      }

      // Fetch all users from /users endpoint
      console.log(
        "Fetching users from:",
        `${AUTH_BASE_URL}${API_ENDPOINTS.users}`
      );
      const response = await fetch(`${AUTH_BASE_URL}${API_ENDPOINTS.users}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "*/*",
          Authorization: `Bearer ${token}`,
        },
        mode: "cors",
      });

      console.log(
        "Users response status:",
        response.status,
        response.statusText
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message ||
            `Foydalanuvchilarni yuklash muvaffaqiyatsiz: ${response.status}`
        );
      }

      const data = await response.json();
      console.log("Users data received:", data);

      const usersList = Array.isArray(data)
        ? data
        : data.data || data.users || [];

      // Filter out current user from the list
      const currentUserId = currentUser?.id || currentUser?._id;
      const filteredUsers = usersList.filter(
        (u) => (u.id || u._id) !== currentUserId
      );

      setUsers(filteredUsers);
    } catch (err) {
      console.error("Error fetching users:", err);
      setError(err.message || "Foydalanuvchilarni yuklash muvaffaqiyatsiz");
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error("Token topilmadi. Iltimos, qayta kirib ko'ring.");
      }

      let endpoint;
      let headers = {
        Accept: "*/*",
        Authorization: `Bearer ${token}`,
      };
      let body;

      // Route to different endpoints based on role
      if (formData.role === "admin") {
        // POST /admin - JSON
        endpoint = `${AUTH_BASE_URL}${API_ENDPOINTS.createAdmin}`;
        headers["Content-Type"] = "application/json";
        body = JSON.stringify({
          name: formData.name,
          phone_number: formData.phone_number,
          ...(formData.tg_username && {
            tg_username: formData.tg_username.replace(/^@/, ""),
          }),
          password: formData.password,
        });
      } else if (formData.role === "barber") {
        // POST /barber - multipart/form-data
        endpoint = `${AUTH_BASE_URL}${API_ENDPOINTS.createBarber}`;
        // Don't set Content-Type for FormData, browser will set it with boundary
        const formDataToSend = new FormData();
        formDataToSend.append("name", formData.name);
        if (formData.phone_number) {
          formDataToSend.append("phone_number", formData.phone_number);
        }
        if (formData.tg_username) {
          formDataToSend.append(
            "tg_username",
            formData.tg_username.replace(/^@/, "")
          );
        }
        if (formData.password) {
          formDataToSend.append("password", formData.password);
        }
        if (formData.working !== undefined) {
          formDataToSend.append("working", formData.working);
        }
        if (formData.work_start_time) {
          formDataToSend.append("work_start_time", formData.work_start_time);
        }
        if (formData.work_end_time) {
          formDataToSend.append("work_end_time", formData.work_end_time);
        }
        if (formData.profile_image) {
          const file = formData.profile_image;
          const fileName = file.name.toLowerCase();
          let finalFileName = fileName;

          if (!fileName.match(/\.(jpg|jpeg|png|gif)$/)) {
            if (file.type === "image/jpeg" || file.type === "image/jpg") {
              finalFileName = fileName.endsWith(".")
                ? fileName + "jpg"
                : fileName + ".jpg";
            } else if (file.type === "image/png") {
              finalFileName = fileName.endsWith(".")
                ? fileName + "png"
                : fileName + ".png";
            } else if (file.type === "image/gif") {
              finalFileName = fileName.endsWith(".")
                ? fileName + "gif"
                : fileName + ".gif";
            }
          }

          const fileToSend =
            finalFileName !== fileName
              ? new File([file], finalFileName, { type: file.type })
              : file;

          formDataToSend.append("profile_image", fileToSend);
        }
        body = formDataToSend;
      } else if (formData.role === "client") {
        // POST /client - JSON
        endpoint = `${AUTH_BASE_URL}${API_ENDPOINTS.createClient}`;
        headers["Content-Type"] = "application/json";
        body = JSON.stringify({
          name: formData.name,
          phone_number: formData.phone_number,
          ...(formData.tg_username && {
            tg_username: formData.tg_username.replace(/^@/, ""),
          }),
        });
      } else {
        throw new Error("Noto'g'ri rol tanlandi");
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers,
        body,
        mode: "cors",
      });

      const data = await response.json();

      // Handle different error status codes
      if (response.status === 400) {
        setError(
          data.message ||
            data.error ||
            "Noto'g'ri so'rov. Ma'lumotlarni tekshiring."
        );
      } else if (response.status === 401) {
        setError("Avtorizatsiya muvaffaqiyatsiz. Iltimos, qayta kirib ko'ring.");
        // Optionally redirect to login
        setTimeout(() => {
          logout();
          navigate("/admin/login");
        }, 2000);
      } else if (response.status === 403) {
        setError(
          "Sizda bu amalni bajarish uchun ruxsat yo'q. Iltimos, admin bilan bog'laning."
        );
      } else if (response.status === 409) {
        setError(
          data.message ||
            data.error ||
            "Bu foydalanuvchi allaqachon mavjud. Boshqa ma'lumotlardan foydalaning."
        );
      } else if (response.ok || response.status === 201) {
        setSuccess("Foydalanuvchi muvaffaqiyatli qo'shildi!");
        setFormData({
          name: "",
          tg_username: "",
          phone_number: "",
          password: "",
          role: "client",
          working: true,
          work_start_time: "09:00",
          work_end_time: "18:00",
          profile_image: null,
        });
        setShowAddForm(false);
        fetchUsers();
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(
          data.message || data.error || "Foydalanuvchi qo'shish muvaffaqiyatsiz"
        );
      }
    } catch (err) {
      console.error("Error adding user:", err);
      setError(err.message || "Tarmoq xatosi. Iltimos, qayta urinib ko'ring.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setEditFormData({
      name: user.name || "",
      tg_username: user.tg_username || "",
      phone_number: user.phone_number || "",
      password: "",
      role: user.role || "client",
      working: user.working !== undefined ? user.working : true,
      work_start_time: user.work_start_time || "09:00",
      work_end_time: user.work_end_time || "18:00",
      profile_image: null,
    });
    setError("");
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (!editingUser) return;

    setIsSubmittingEdit(true);
    setError("");
    setSuccess("");

    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error("Token topilmadi. Iltimos, qayta kirib ko'ring.");
      }

      const userId = editingUser.id || editingUser._id;

      // Determine the correct endpoint and data format based on user role
      const userRole = editFormData.role || editingUser.role;
      let endpoint;
      let formDataToSend = new FormData();

      if (userRole === "barber") {
        // For barber: use /barber/{id} endpoint and don't include role field
        endpoint = `${AUTH_BASE_URL}/barber/${userId}`;
        formDataToSend.append("name", editFormData.name);
        formDataToSend.append(
          "tg_username",
          editFormData.tg_username?.replace(/^@/, "") || editFormData.tg_username
        );
        formDataToSend.append("phone_number", editFormData.phone_number);
        formDataToSend.append("working", (editFormData.working !== undefined ? editFormData.working : true).toString());
        formDataToSend.append("work_start_time", editFormData.work_start_time || "09:00");
        formDataToSend.append("work_end_time", editFormData.work_end_time || "18:00");
      } else if (userRole === "client") {
        // For client: use /client/{id} endpoint and don't include role field
        endpoint = `${AUTH_BASE_URL}/client/${userId}`;
        formDataToSend.append("name", editFormData.name);
        formDataToSend.append(
          "tg_username",
          editFormData.tg_username?.replace(/^@/, "") || editFormData.tg_username
        );
        formDataToSend.append("phone_number", editFormData.phone_number);
      } else if (userRole === "admin" || userRole === "super_admin") {
        // For admin: use /admin/{id} endpoint and don't include role field
        endpoint = `${AUTH_BASE_URL}/admin/${userId}`;
        formDataToSend.append("name", editFormData.name);
        formDataToSend.append(
          "tg_username",
          editFormData.tg_username?.replace(/^@/, "") || editFormData.tg_username
        );
        formDataToSend.append("phone_number", editFormData.phone_number);
      } else {
        // Fallback: use original endpoint with role field
        endpoint = `${AUTH_BASE_URL}${API_ENDPOINTS.users}/${userId}`;
        formDataToSend.append("name", editFormData.name);
        formDataToSend.append(
          "tg_username",
          editFormData.tg_username?.replace(/^@/, "") || editFormData.tg_username
        );
        formDataToSend.append("phone_number", editFormData.phone_number);
        formDataToSend.append("role", editFormData.role);
      }

      // Only include password if it's provided
      if (editFormData.password && editFormData.password.trim() !== "") {
        formDataToSend.append("password", editFormData.password);
      }

      // Add profile image if selected (for barber and client)
      if (editFormData.profile_image && (userRole === "barber" || userRole === "client")) {
        const file = editFormData.profile_image;
        const fileName = file.name.toLowerCase();
        let finalFileName = fileName;

        if (!fileName.match(/\.(jpg|jpeg|png|gif)$/)) {
          if (file.type === "image/jpeg" || file.type === "image/jpg") {
            finalFileName = fileName.endsWith(".")
              ? fileName + "jpg"
              : fileName + ".jpg";
          } else if (file.type === "image/png") {
            finalFileName = fileName.endsWith(".")
              ? fileName + "png"
              : fileName + ".png";
          } else if (file.type === "image/gif") {
            finalFileName = fileName.endsWith(".")
              ? fileName + "gif"
              : fileName + ".gif";
          }
        }

        const fileToSend =
          finalFileName !== fileName
            ? new File([file], finalFileName, { type: file.type })
            : file;

        formDataToSend.append("profile_image", fileToSend);
      }

      const response = await fetch(
        endpoint,
        {
          method: "PATCH",
          headers: {
            Accept: "*/*",
            Authorization: `Bearer ${token}`,
          },
          body: formDataToSend,
          mode: "cors",
        }
      );

      const data = await response.json();

      if (response.ok) {
        setSuccess("Foydalanuvchi muvaffaqiyatli yangilandi!");
        setEditingUser(null);
        setEditFormData({
          name: "",
          tg_username: "",
          phone_number: "",
          password: "",
          role: "",
          working: true,
          work_start_time: "09:00",
          work_end_time: "18:00",
          profile_image: null,
        });
        fetchUsers();
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(
          data.message ||
            data.error ||
            "Foydalanuvchini yangilash muvaffaqiyatsiz"
        );
      }
    } catch (err) {
      console.error("Error updating user:", err);
      setError(err.message || "Tarmoq xatosi. Iltimos, qayta urinib ko'ring.");
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Bu foydalanuvchini o'chirishni xohlaysizmi?")) {
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
        `${AUTH_BASE_URL}${API_ENDPOINTS.users}/${userId}`,
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
        setSuccess("Foydalanuvchi muvaffaqiyatli o'chirildi!");
        fetchUsers();
        setTimeout(() => setSuccess(""), 3000);
      } else {
        const data = await response.json().catch(() => ({}));
        setError(data.message || "Foydalanuvchini o'chirish muvaffaqiyatsiz");
      }
    } catch (err) {
      console.error("Error deleting user:", err);
      setError(err.message || "Tarmoq xatosi. Iltimos, qayta urinib ko'ring.");
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      setError("");
      setSuccess("");

      const token = getAuthToken();
      if (!token) {
        throw new Error("Token topilmadi. Iltimos, qayta kirib ko'ring.");
      }

      // Check permissions
      const availableRoles = getAvailableRoles();
      if (!availableRoles.includes(newRole)) {
        setError("Sizda bu rolni o'zgartirishga ruxsat yo'q");
        return;
      }

      const formDataToSend = new FormData();
      formDataToSend.append("role", newRole);

      const response = await fetch(
        `${AUTH_BASE_URL}${API_ENDPOINTS.users}/${userId}/role`,
        {
          method: "PATCH",
          headers: {
            Accept: "*/*",
            Authorization: `Bearer ${token}`,
          },
          body: formDataToSend,
          mode: "cors",
        }
      );

      const data = await response.json();

      if (response.ok) {
        setSuccess("Foydalanuvchi roli muvaffaqiyatli yangilandi!");
        fetchUsers();
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(
          data.message || data.error || "Rolni yangilash muvaffaqiyatsiz"
        );
      }
    } catch (err) {
      console.error("Error changing role:", err);
      setError(err.message || "Tarmoq xatosi. Iltimos, qayta urinib ko'ring.");
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
    if (error) setError("");
  };

  const handleEditInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditFormData({
      ...editFormData,
      [name]: type === "checkbox" ? checked : value,
    });
    if (error) setError("");
  };

  const handleManageServices = async (barber) => {
    setManagingServicesForBarber(barber);
    setBarberServices([]);
    setEditingService(null);
    setError("");

    await fetchBarberServices(barber.id || barber._id);
  };

  const fetchBarberServices = async (barberId) => {
    try {
      setLoadingServices(true);
      const token = getAuthToken();
      if (!token) {
        throw new Error("Token topilmadi");
      }

      const response = await fetch(
        `${SERVICES_BASE_URL}${API_ENDPOINTS.services}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Accept: "*/*",
            Authorization: `Bearer ${token}`,
          },
          mode: "cors",
        }
      );

      if (response.ok) {
        const data = await response.json();
        const servicesList = Array.isArray(data)
          ? data
          : data.data || data.services || [];

        const filtered = servicesList.filter(
          (service) => service.barber_id === barberId || !service.barber_id
        );
        setBarberServices(filtered);
      }
    } catch (err) {
      console.error("Error fetching barber services:", err);
      setError("Xizmatlarni yuklash muvaffaqiyatsiz");
    } finally {
      setLoadingServices(false);
    }
  };

  const handleEditService = (service) => {
    setEditingService(service);
    setEditServiceFormData({
      name: service.name || "",
      price: service.price || "",
      duration: service.duration || "",
    });
    setError("");
  };

  const handleUpdateService = async (e) => {
    e.preventDefault();
    if (!editingService || !managingServicesForBarber) return;

    setIsSubmittingServiceEdit(true);
    setError("");
    setSuccess("");

    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error("Token topilmadi");
      }

      const serviceId = editingService.id || editingService._id;
      const barberId =
        managingServicesForBarber.id || managingServicesForBarber._id;

      const response = await fetch(
        `${SERVICES_BASE_URL}${API_ENDPOINTS.services}/${serviceId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Accept: "*/*",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: editServiceFormData.name,
            price: parseInt(editServiceFormData.price),
            duration: parseInt(editServiceFormData.duration),
          }),
          mode: "cors",
        }
      );

      const data = await response.json();

      if (response.ok) {
        setSuccess("Xizmat muvaffaqiyatli yangilandi!");
        setEditingService(null);
        setEditServiceFormData({
          name: "",
          price: "",
          duration: "",
        });
        await fetchBarberServices(barberId);
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(
          data.message || data.error || "Xizmatni yangilash muvaffaqiyatsiz"
        );
      }
    } catch (err) {
      console.error("Error updating service:", err);
      setError(err.message || "Tarmoq xatosi");
    } finally {
      setIsSubmittingServiceEdit(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("uz-UZ", {
      style: "currency",
      currency: "UZS",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getRoleLabel = (role) => {
    const labels = {
      client: "Foydalanuvchi",
      barber: "Barber",
      admin: "Admin",
      super_admin: "Super Admin",
    };
    return labels[role] || role;
  };

  const getRoleColor = (role) => {
    const colors = {
      client: "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300",
      barber: "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300",
      admin: "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300",
      super_admin: "bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300",
    };
    return colors[role] || "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300";
  };

  // Filter users by role
  const filteredUsers =
    roleFilter === "all" ? users : users.filter((u) => u.role === roleFilter);

  if (loading) {
    return (
      <div className="pt-16 sm:pt-20 md:pt-[92px] min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-barber-gold mx-auto mb-4"></div>
          <p className="text-black dark:text-white">Yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  const availableRoles = getAvailableRoles();

  return (
    <div className="pt-16 sm:pt-20 md:pt-[92px] min-h-screen bg-gray-50 dark:bg-gray-900">
      <section className="w-full py-8 sm:py-10 md:py-12 lg:py-16">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-[127px]">
          <div className="flex justify-between items-center mb-10">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-black dark:text-white">
              Foydalanuvchilar Boshqaruvi
            </h1>
            <div className="flex gap-3">
              <Button
                onClick={() => navigate("/admin")}
                size="sm"
                className="bg-barber-olive hover:bg-barber-gold"
              >
                Admin paneli
              </Button>
              <Button
                onClick={logout}
                size="sm"
                variant="outlined"
                className="border-red-500 dark:border-red-600 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30"
              >
                Chiqish
              </Button>
            </div>
          </div>

          {error && (
            <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg text-sm mb-4">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-100 dark:bg-green-900/30 border border-green-400 dark:border-green-600 text-green-700 dark:text-green-300 px-4 py-3 rounded-lg text-sm mb-4">
              {success}
            </div>
          )}

          <div className="mb-6 flex gap-4 items-center flex-wrap">
            <Button
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-barber-olive hover:bg-barber-gold text-white"
            >
              {showAddForm
                ? "Formani yopish"
                : "+ Yangi foydalanuvchi qo'shish"}
            </Button>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Rol bo'yicha filter:
              </label>
              <div className="w-32">
                <Select
                  value={roleFilter}
                  onChange={(val) => setRoleFilter(val)}
                  size="sm"
                >
                  <Option value="all">Barchasi</Option>
                  <Option value="client">Foydalanuvchi</Option>
                  <Option value="barber">Barber</Option>
                  {isSuperAdmin() && <Option value="admin">Admin</Option>}
                  {isSuperAdmin() && (
                    <Option value="super_admin">Super Admin</Option>
                  )}
                </Select>
              </div>
            </div>
          </div>

          {showAddForm && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-10 shadow-lg border border-gray-200 dark:border-gray-700 mb-8">
              <h2 className="text-xl sm:text-2xl font-bold text-black dark:text-white mb-6">
                Yangi foydalanuvchi qo'shish
              </h2>
              <form
                onSubmit={handleAddUser}
                className="space-y-4 sm:space-y-5 md:space-y-6"
              >
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
                  required={formData.role === "admin"}
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
                  required={formData.role !== "barber"}
                  size="lg"
                  disabled={isSubmitting}
                />

                {formData.role !== "client" && (
                  <Input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    label={formData.role === "admin" ? "Parol" : "Parol (ixtiyoriy)"}
                    required={formData.role === "admin"}
                    size="lg"
                    disabled={isSubmitting}
                  />
                )}

                <div className="w-[250px]">
                  <Select
                    label="Rol"
                    value={formData.role}
                    onChange={(val) => setFormData({ ...formData, role: val })}
                    disabled={isSubmitting}
                    size="sm"
                    className="!min-w-[150px]"
                  >
                    {availableRoles.map((role) => (
                      <Option key={role} value={role}>
                        {getRoleLabel(role)}
                      </Option>
                    ))}
                  </Select>
                </div>

                {formData.role === "barber" && (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input
                        type="time"
                        name="work_start_time"
                        value={formData.work_start_time}
                        onChange={handleInputChange}
                        label="Ish boshlanish vaqti"
                        required
                        size="lg"
                        disabled={isSubmitting}
                      />

                      <Input
                        type="time"
                        name="work_end_time"
                        value={formData.work_end_time}
                        onChange={handleInputChange}
                        label="Ish tugash vaqti"
                        required
                        size="lg"
                        disabled={isSubmitting}
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Profile rasm (ixtiyoriy)
                  </label>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/jpg,image/gif,.jpg,.jpeg,.png,.gif"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        const fileName = file.name.toLowerCase();
                        const validExtensions = [
                          ".jpg",
                          ".jpeg",
                          ".png",
                          ".gif",
                        ];
                        const hasValidExtension = validExtensions.some((ext) =>
                          fileName.endsWith(ext)
                        );

                        if (!hasValidExtension) {
                          setError(
                            "Faqat JPG, JPEG, PNG yoki GIF formatidagi rasmlar qabul qilinadi"
                          );
                          return;
                        }

                        const validMimeTypes = [
                          "image/jpeg",
                          "image/png",
                          "image/jpg",
                          "image/gif",
                        ];
                        if (!validMimeTypes.includes(file.type)) {
                          setError(
                            "Noto'g'ri fayl formati. Faqat rasm fayllari qabul qilinadi"
                          );
                          return;
                        }
                      }
                      setFormData({
                        ...formData,
                        profile_image: file || null,
                      });
                      setError("");
                    }}
                    className="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-barber-olive file:text-white hover:file:bg-barber-gold"
                    disabled={isSubmitting}
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    size="lg"
                    className="bg-barber-olive hover:bg-barber-gold text-white font-semibold"
                    loading={isSubmitting}
                  >
                    {isSubmitting
                      ? "Qo'shilmoqda..."
                      : "Foydalanuvchi qo'shish"}
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
                        role: "client",
                        working: true,
                        work_start_time: "09:00",
                        work_end_time: "18:00",
                        profile_image: null,
                      });
                      setError("");
                    }}
                    size="lg"
                    variant="outlined"
                    className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                  >
                    Bekor qilish
                  </Button>
                </div>
              </form>
            </div>
          )}

          <div className="bg-white dark:bg-gray-800 rounded-2xl sm:rounded-3xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
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
                    <th className="px-2 py-3 text-left text-sm font-semibold w-[120px]">
                      Rol
                    </th>
                    {(roleFilter === "barber" || roleFilter === "all") && (
                      <th className="px-4 py-3 text-left text-sm font-semibold">
                        Ish vaqti
                      </th>
                    )}
                    <th className="px-4 py-3 text-left text-sm font-semibold">
                      Amallar
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td
                        colSpan={
                          roleFilter === "barber" || roleFilter === "all"
                            ? "7"
                            : "6"
                        }
                        className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"
                      >
                        Foydalanuvchilar topilmadi
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => (
                      <tr
                        key={user.id || user._id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <td className="px-4 py-3 text-sm text-black dark:text-white">
                          {user.id || user._id}
                        </td>
                        <td className="px-4 py-3 text-sm text-black dark:text-white">
                          {user.name || user.fullName || "N/A"}
                        </td>
                        <td className="px-4 py-3 text-sm text-black dark:text-white">
                          {user.tg_username || user.telegram_username || "N/A"}
                        </td>
                        <td className="px-4 py-3 text-sm text-black dark:text-white">
                          {user.phone_number || user.phone || "N/A"}
                        </td>
                        <td className="px-2 py-3 text-sm w-[120px]">
                          <div className="flex items-center gap-1">
                            {availableRoles.length > 1 ? (
                              <div className="w-full max-w-[190px]">
                                <Select
                                  value={user.role}
                                  onChange={(newRole) =>
                                    handleRoleChange(
                                      user.id || user._id,
                                      newRole
                                    )
                                  }
                                  size="sm"
                                  className="!min-w-0 border-none  !text-xs"
                                >
                                  {availableRoles.map((role) => (
                                    <Option key={role} value={role}>
                                      {getRoleLabel(role)}
                                    </Option>
                                  ))}
                                </Select>
                              </div>
                            ) : (
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-semibold ${getRoleColor(
                                  user.role
                                )}`}
                              >
                                {getRoleLabel(user.role)}
                              </span>
                            )}
                          </div>
                        </td>
                        {(roleFilter === "barber" || roleFilter === "all") && (
                          <td className="px-4 py-3 text-sm text-black dark:text-white">
                            {user.role === "barber" ? (
                              `${user.work_start_time || "N/A"} - ${
                                user.work_end_time || "N/A"
                              }`
                            ) : (
                              <span className="text-gray-400 dark:text-gray-500">-</span>
                            )}
                          </td>
                        )}
                        <td className="px-4 py-3 text-sm text-black dark:text-white">
                          <div className="flex gap-2 flex-wrap">
                            <Button
                              size="sm"
                              onClick={() => handleEditUser(user)}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 text-xs"
                            >
                              Tahrirlash
                            </Button>
                            {user.role === "barber" && (
                              <Button
                                size="sm"
                                onClick={() => handleManageServices(user)}
                                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 text-xs"
                              >
                                Xizmatlar
                              </Button>
                            )}
                            <Button
                              size="sm"
                              onClick={() =>
                                handleDeleteUser(user.id || user._id)
                              }
                              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 text-xs"
                            >
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

      {/* Manage Services Modal */}
      {managingServicesForBarber && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-black dark:text-white">
                {managingServicesForBarber.name} - Xizmatlar boshqaruvi
              </h3>
              <Button
                onClick={() => {
                  setManagingServicesForBarber(null);
                  setBarberServices([]);
                  setEditingService(null);
                  setError("");
                }}
                variant="text"
                className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                ✕
              </Button>
            </div>

            {error && (
              <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg text-sm mb-4">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-100 dark:bg-green-900/30 border border-green-400 dark:border-green-600 text-green-700 dark:text-green-300 px-4 py-3 rounded-lg text-sm mb-4">
                {success}
              </div>
            )}

            {loadingServices ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-barber-gold mx-auto mb-2"></div>
                <p className="text-gray-600 dark:text-gray-400">Yuklanmoqda...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100 dark:bg-gray-700">
                    <tr>
                      <th className="px-4 py-2 text-left text-sm font-semibold text-black dark:text-white">
                        ID
                      </th>
                      <th className="px-4 py-2 text-left text-sm font-semibold text-black dark:text-white">
                        Xizmat nomi
                      </th>
                      <th className="px-4 py-2 text-left text-sm font-semibold text-black dark:text-white">
                        Narx
                      </th>
                      <th className="px-4 py-2 text-left text-sm font-semibold text-black dark:text-white">
                        Davomiyligi
                      </th>
                      <th className="px-4 py-2 text-left text-sm font-semibold text-black dark:text-white">
                        Amallar
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {barberServices.length === 0 ? (
                      <tr>
                        <td
                          colSpan="5"
                          className="px-4 py-4 text-center text-gray-500 dark:text-gray-400"
                        >
                          Xizmatlar topilmadi
                        </td>
                      </tr>
                    ) : (
                      barberServices.map((service) => (
                        <tr
                          key={service.id || service._id}
                          className="hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                          <td className="px-4 py-2 text-sm text-black dark:text-white">
                            {service.id || service._id}
                          </td>
                          <td className="px-4 py-2 text-sm font-medium text-black dark:text-white">
                            {service.name || "N/A"}
                          </td>
                          <td className="px-4 py-2 text-sm text-black dark:text-white">
                            {formatCurrency(service.price || 0)}
                          </td>
                          <td className="px-4 py-2 text-sm text-black dark:text-white">
                            {service.duration
                              ? `${service.duration} daqiqa`
                              : "N/A"}
                          </td>
                          <td className="px-4 py-2 text-sm">
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleEditService(service)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 text-xs"
                              >
                                Tahrirlash
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Service Modal */}
      {editingService && managingServicesForBarber && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h4 className="text-lg font-bold text-black dark:text-white mb-4">
              Xizmatni tahrirlash
            </h4>

            {error && (
              <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg text-sm mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleUpdateService} className="space-y-4">
              <Input
                type="text"
                name="name"
                value={editServiceFormData.name}
                onChange={(e) =>
                  setEditServiceFormData({
                    ...editServiceFormData,
                    name: e.target.value,
                  })
                }
                label="Xizmat nomi"
                required
                size="lg"
                disabled={isSubmittingServiceEdit}
              />

              <Input
                type="number"
                name="price"
                value={editServiceFormData.price}
                onChange={(e) =>
                  setEditServiceFormData({
                    ...editServiceFormData,
                    price: e.target.value,
                  })
                }
                label="Narx (UZS)"
                required
                min="0"
                size="lg"
                disabled={isSubmittingServiceEdit}
              />

              <Input
                type="number"
                name="duration"
                value={editServiceFormData.duration}
                onChange={(e) =>
                  setEditServiceFormData({
                    ...editServiceFormData,
                    duration: e.target.value,
                  })
                }
                label="Davomiyligi (daqiqa)"
                required
                min="1"
                size="lg"
                disabled={isSubmittingServiceEdit}
              />

              <div className="flex gap-3 justify-end pt-4">
                <Button
                  type="button"
                  onClick={() => {
                    setEditingService(null);
                    setEditServiceFormData({
                      name: "",
                      price: "",
                      duration: "",
                    });
                  }}
                  variant="outlined"
                  className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                  disabled={isSubmittingServiceEdit}
                >
                  Bekor qilish
                </Button>
                <Button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={isSubmittingServiceEdit}
                  loading={isSubmittingServiceEdit}
                >
                  {isSubmittingServiceEdit ? "Yangilanmoqda..." : "Yangilash"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-black dark:text-white mb-4">
              Foydalanuvchini tahrirlash
            </h3>

            {error && (
              <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg text-sm mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleUpdateUser} className="space-y-4">
              <Input
                type="text"
                name="name"
                value={editFormData.name}
                onChange={handleEditInputChange}
                label="To'liq ism"
                required
                size="lg"
                disabled={isSubmittingEdit}
              />

              <Input
                type="text"
                name="tg_username"
                value={editFormData.tg_username}
                onChange={handleEditInputChange}
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
                onChange={handleEditInputChange}
                label="Telefon raqami"
                placeholder="+998901234567"
                required
                size="lg"
                disabled={isSubmittingEdit}
              />

              <div>
                <Select
                  label="Rol"
                  value={editFormData.role}
                  onChange={(val) =>
                    setEditFormData({ ...editFormData, role: val })
                  }
                  disabled={isSubmittingEdit}
                >
                  {availableRoles.map((role) => (
                    <Option key={role} value={role}>
                      {getRoleLabel(role)}
                    </Option>
                  ))}
                </Select>
              </div>

              {editFormData.role === "barber" && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      type="time"
                      name="work_start_time"
                      value={editFormData.work_start_time}
                      onChange={handleEditInputChange}
                      label="Ish boshlanish vaqti"
                      required
                      size="lg"
                      disabled={isSubmittingEdit}
                    />

                    <Input
                      type="time"
                      name="work_end_time"
                      value={editFormData.work_end_time}
                      onChange={handleEditInputChange}
                      label="Ish tugash vaqti"
                      required
                      size="lg"
                      disabled={isSubmittingEdit}
                    />
                  </div>
                </>
              )}

              <Input
                type="password"
                name="password"
                value={editFormData.password}
                onChange={handleEditInputChange}
                label="Yangi parol (ixtiyoriy)"
                placeholder="Parolni o'zgartirmaslik uchun bo'sh qoldiring"
                size="lg"
                disabled={isSubmittingEdit}
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Profile rasm (ixtiyoriy)
                </label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/jpg,image/gif,.jpg,.jpeg,.png,.gif"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      const fileName = file.name.toLowerCase();
                      const validExtensions = [".jpg", ".jpeg", ".png", ".gif"];
                      const hasValidExtension = validExtensions.some((ext) =>
                        fileName.endsWith(ext)
                      );

                      if (!hasValidExtension) {
                        setError(
                          "Faqat JPG, JPEG, PNG yoki GIF formatidagi rasmlar qabul qilinadi"
                        );
                        return;
                      }

                      const validMimeTypes = [
                        "image/jpeg",
                        "image/png",
                        "image/jpg",
                        "image/gif",
                      ];
                      if (!validMimeTypes.includes(file.type)) {
                        setError(
                          "Noto'g'ri fayl formati. Faqat rasm fayllari qabul qilinadi"
                        );
                        return;
                      }
                    }
                    setEditFormData({
                      ...editFormData,
                      profile_image: file || null,
                    });
                    setError("");
                  }}
                  className="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-barber-olive file:text-white hover:file:bg-barber-gold"
                  disabled={isSubmittingEdit}
                />
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <Button
                  type="button"
                  onClick={() => {
                    setEditingUser(null);
                    setEditFormData({
                      name: "",
                      tg_username: "",
                      phone_number: "",
                      password: "",
                      role: "",
                      working: true,
                      work_start_time: "09:00",
                      work_end_time: "18:00",
                      profile_image: null,
                    });
                    setError("");
                  }}
                  variant="outlined"
                  className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                  disabled={isSubmittingEdit}
                >
                  Bekor qilish
                </Button>
                <Button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={isSubmittingEdit}
                  loading={isSubmittingEdit}
                >
                  {isSubmittingEdit ? "Yangilanmoqda..." : "Yangilash"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
      <Analytics />
    </div>
  );
}

export default Users;
