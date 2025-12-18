import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Input } from "@material-tailwind/react";
import { Analytics } from "@vercel/analytics/react";
import { useAuth } from "../context/AuthContext";
import { AUTH_BASE_URL, API_ENDPOINTS, BARBERS_BASE_URL, SERVICES_BASE_URL } from "../data/api";
import { getAuthToken } from "../utils/api";
import Footer from "../components/Footer";

function Barbers() {
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin, isSuperAdmin, logout } = useAuth();
  const [barbers, setBarbers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    tg_username: "",
    phone_number: "",
    password: "",
    working: true,
    work_start_time: "09:00",
    work_end_time: "18:00",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingBarber, setEditingBarber] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: "",
    tg_username: "",
    phone_number: "",
    password: "",
    working: true,
    work_start_time: "09:00",
    work_end_time: "18:00",
  });
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
  const [managingServicesForBarber, setManagingServicesForBarber] = useState(null);
  const [barberServices, setBarberServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [editServiceFormData, setEditServiceFormData] = useState({
    name: "",
    price: "",
    duration: "",
  });
  const [isSubmittingServiceEdit, setIsSubmittingServiceEdit] = useState(false);

  useEffect(() => {
    if (!isAuthenticated() || (!isAdmin() && !isSuperAdmin())) {
      navigate("/admin/login");
      return;
    }

    fetchBarbers();
  }, [navigate, isAuthenticated, isAdmin, isSuperAdmin]);

  const fetchBarbers = async () => {
    try {
      setLoading(true);
      setError("");

      const token = getAuthToken();
      if (!token) {
        throw new Error("Token topilmadi. Iltimos, qayta kirib ko'ring.");
      }

      // Fetch barbers from /users/barbers endpoint
      console.log("Fetching barbers from:", `${BARBERS_BASE_URL}${API_ENDPOINTS.barbers}`);
      const response = await fetch(`${BARBERS_BASE_URL}${API_ENDPOINTS.barbers}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "*/*",
          Authorization: `Bearer ${token}`,
        },
        mode: "cors",
      });

      console.log("Barbers response status:", response.status, response.statusText);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message ||
            `Barberlarni yuklash muvaffaqiyatsiz: ${response.status}`
        );
      }

      const data = await response.json();
      console.log("Barbers data received:", data);

      const barbersList = Array.isArray(data)
        ? data
        : data.data || data.barbers || [];

      setBarbers(barbersList);
    } catch (err) {
      console.error("Error fetching barbers:", err);
      setError(err.message || "Barberlarni yuklash muvaffaqiyatsiz");
    } finally {
      setLoading(false);
    }
  };

  const handleAddBarber = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error("Token topilmadi. Iltimos, qayta kirib ko'ring.");
      }

      // Create new barber using POST /users with role: "barber"
      const response = await fetch(`${AUTH_BASE_URL}${API_ENDPOINTS.users}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "*/*",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name,
          tg_username: formData.tg_username?.replace(/^@/, '') || formData.tg_username,
          phone_number: formData.phone_number,
          password: formData.password,
          role: "barber",
          working: formData.working,
          work_start_time: formData.work_start_time,
          work_end_time: formData.work_end_time,
        }),
        mode: "cors",
      });

      const data = await response.json();

      if (response.ok || response.status === 201) {
        setSuccess("Barber muvaffaqiyatli qo'shildi!");
        setFormData({
          name: "",
          tg_username: "",
          phone_number: "",
          password: "",
          working: true,
          work_start_time: "09:00",
          work_end_time: "18:00",
        });
        setShowAddForm(false);
        fetchBarbers(); // Refresh barber list
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(
          data.message || data.error || "Barber qo'shish muvaffaqiyatsiz"
        );
      }
    } catch (err) {
      console.error("Error adding barber:", err);
      setError(err.message || "Tarmoq xatosi. Iltimos, qayta urinib ko'ring.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditBarber = (barber) => {
    setEditingBarber(barber);
    setEditFormData({
      name: barber.name || "",
      tg_username: barber.tg_username || "",
      phone_number: barber.phone_number || "",
      password: "", // Don't pre-fill password
      working: barber.working !== undefined ? barber.working : true,
      work_start_time: barber.work_start_time || "09:00",
      work_end_time: barber.work_end_time || "18:00",
    });
    setError("");
  };

  const handleUpdateBarber = async (e) => {
    e.preventDefault();
    if (!editingBarber) return;

    setIsSubmittingEdit(true);
    setError("");
    setSuccess("");

    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error("Token topilmadi. Iltimos, qayta kirib ko'ring.");
      }

      const barberId = editingBarber.id || editingBarber._id;

      // Prepare update data (only include fields that have values)
      const updateData = {
        name: editFormData.name,
        tg_username: editFormData.tg_username?.replace(/^@/, '') || editFormData.tg_username,
        phone_number: editFormData.phone_number,
        working: editFormData.working,
        work_start_time: editFormData.work_start_time,
        work_end_time: editFormData.work_end_time,
      };

      // Only include password if it's provided
      if (editFormData.password && editFormData.password.trim() !== "") {
        updateData.password = editFormData.password;
      }

      const response = await fetch(
        `${AUTH_BASE_URL}${API_ENDPOINTS.users}/${barberId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Accept: "*/*",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(updateData),
          mode: "cors",
        }
      );

      const data = await response.json();

      if (response.ok) {
        setSuccess("Barber muvaffaqiyatli yangilandi!");
        setEditingBarber(null);
        setEditFormData({
          name: "",
          tg_username: "",
          phone_number: "",
          password: "",
          working: true,
          work_start_time: "09:00",
          work_end_time: "18:00",
        });
        fetchBarbers(); // Refresh barber list
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(data.message || data.error || "Barberni yangilash muvaffaqiyatsiz");
      }
    } catch (err) {
      console.error("Error updating barber:", err);
      setError(err.message || "Tarmoq xatosi. Iltimos, qayta urinib ko'ring.");
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  const handleDeleteBarber = async (barberId) => {
    if (!window.confirm("Bu barberni o'chirishni xohlaysizmi?")) {
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
        `${AUTH_BASE_URL}${API_ENDPOINTS.users}/${barberId}`,
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
        setSuccess("Barber muvaffaqiyatli o'chirildi!");
        fetchBarbers(); // Refresh barber list
        setTimeout(() => setSuccess(""), 3000);
      } else {
        const data = await response.json().catch(() => ({}));
        setError(data.message || "Barberni o'chirish muvaffaqiyatsiz");
      }
    } catch (err) {
      console.error("Error deleting barber:", err);
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
    
    // Fetch services for this barber
    await fetchBarberServices(barber.id || barber._id);
  };

  const fetchBarberServices = async (barberId) => {
    try {
      setLoadingServices(true);
      const token = getAuthToken();
      if (!token) {
        throw new Error("Token topilmadi");
      }

      // Fetch all services and filter by barber_id if available
      const response = await fetch(`${SERVICES_BASE_URL}${API_ENDPOINTS.services}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "*/*",
          Authorization: `Bearer ${token}`,
        },
        mode: "cors",
      });

      if (response.ok) {
        const data = await response.json();
        const servicesList = Array.isArray(data)
          ? data
          : data.data || data.services || [];
        
        // Filter services by barber_id if the API supports it
        // Otherwise, we'll show all services and let admin assign them
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
      const barberId = managingServicesForBarber.id || managingServicesForBarber._id;

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
        setError(data.message || data.error || "Xizmatni yangilash muvaffaqiyatsiz");
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
          <div className="flex justify-between items-center mb-10">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-black">
              Barberlar Boshqaruvi
            </h1>
            <div className="flex gap-3">
              <Button
                onClick={() => navigate("/admin")}
                size="sm"
                className="bg-barber-olive hover:bg-barber-gold">
                Admin paneli
              </Button>
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
              {showAddForm ? "Formani yopish" : "+ Yangi barber qo'shish"}
            </Button>
          </div>

          {showAddForm && (
            <div className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-10 shadow-lg border border-gray-200 mb-8">
              <h2 className="text-xl sm:text-2xl font-bold text-black mb-6">
                Yangi barber qo'shish
              </h2>
              <form
                onSubmit={handleAddBarber}
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

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="working"
                    checked={formData.working}
                    onChange={handleInputChange}
                    id="working"
                    className="w-4 h-4 text-barber-olive border-gray-300 rounded focus:ring-barber-olive"
                    disabled={isSubmitting}
                  />
                  <label htmlFor="working" className="ml-2 text-sm text-gray-700">
                    Hozirda ishlayapti
                  </label>
                </div>

                <div className="flex gap-3">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    size="lg"
                    className="bg-barber-olive hover:bg-barber-gold text-white font-semibold"
                    loading={isSubmitting}>
                    {isSubmitting ? "Qo'shilmoqda..." : "Barber qo'shish"}
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
                        working: true,
                        work_start_time: "09:00",
                        work_end_time: "18:00",
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
                      Ish vaqti
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">
                      Holat
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">
                      Amallar
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {barbers.length === 0 ? (
                    <tr>
                      <td
                        colSpan="7"
                        className="px-4 py-8 text-center text-gray-500">
                        Barberlar topilmadi
                      </td>
                    </tr>
                  ) : (
                    barbers.map((barber) => (
                      <tr
                        key={barber.id || barber._id}
                        className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm">
                          {barber.id || barber._id}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {barber.name || barber.fullName || "N/A"}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {barber.tg_username ||
                            barber.telegram_username ||
                            "N/A"}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {barber.phone_number || barber.phone || "N/A"}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {barber.work_start_time || "N/A"} -{" "}
                          {barber.work_end_time || "N/A"}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              barber.working
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }`}>
                            {barber.working ? "Ishlayapti" : "Ishlamayapti"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <div className="flex gap-2 flex-wrap">
                            <Button
                              size="sm"
                              onClick={() => handleEditBarber(barber)}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 text-xs">
                              Tahrirlash
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleManageServices(barber)}
                              className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 text-xs">
                              Xizmatlar
                            </Button>
                            <Button
                              size="sm"
                              onClick={() =>
                                handleDeleteBarber(barber.id || barber._id)
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

      {/* Manage Services Modal */}
      {managingServicesForBarber && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-black">
                {managingServicesForBarber.name} - Xizmatlar boshqaruvi
              </h3>
              <Button
                onClick={() => {
                  setManagingServicesForBarber(null);
                  setBarberServices([]);
                  setShowAddServiceForm(false);
                  setEditingService(null);
                  setError("");
                }}
                variant="text"
                className="text-gray-600 hover:text-gray-800">
                ✕
              </Button>
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

            {loadingServices ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-barber-gold mx-auto mb-2"></div>
                <p className="text-gray-600">Yuklanmoqda...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-2 text-left text-sm font-semibold">
                        ID
                      </th>
                      <th className="px-4 py-2 text-left text-sm font-semibold">
                        Xizmat nomi
                      </th>
                      <th className="px-4 py-2 text-left text-sm font-semibold">
                        Narx
                      </th>
                      <th className="px-4 py-2 text-left text-sm font-semibold">
                        Davomiyligi
                      </th>
                      <th className="px-4 py-2 text-left text-sm font-semibold">
                        Amallar
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {barberServices.length === 0 ? (
                      <tr>
                        <td
                          colSpan="5"
                          className="px-4 py-4 text-center text-gray-500">
                          Xizmatlar topilmadi
                        </td>
                      </tr>
                    ) : (
                      barberServices.map((service) => (
                        <tr key={service.id || service._id} className="hover:bg-gray-50">
                          <td className="px-4 py-2 text-sm">
                            {service.id || service._id}
                          </td>
                          <td className="px-4 py-2 text-sm font-medium">
                            {service.name || "N/A"}
                          </td>
                          <td className="px-4 py-2 text-sm">
                            {formatCurrency(service.price || 0)}
                          </td>
                          <td className="px-4 py-2 text-sm">
                            {service.duration
                              ? `${service.duration} daqiqa`
                              : "N/A"}
                          </td>
                          <td className="px-4 py-2 text-sm">
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleEditService(service)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 text-xs">
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
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h4 className="text-lg font-bold text-black mb-4">
              Xizmatni tahrirlash
            </h4>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
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
                  className="border-gray-300 text-gray-700"
                  disabled={isSubmittingServiceEdit}>
                  Bekor qilish
                </Button>
                <Button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={isSubmittingServiceEdit}
                  loading={isSubmittingServiceEdit}>
                  {isSubmittingServiceEdit ? "Yangilanmoqda..." : "Yangilash"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Barber Modal */}
      {editingBarber && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-black mb-4">
              Barberni tahrirlash
            </h3>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleUpdateBarber} className="space-y-4">
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

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="working"
                  checked={editFormData.working}
                  onChange={handleEditInputChange}
                  id="edit-working"
                  className="w-4 h-4 text-barber-olive border-gray-300 rounded focus:ring-barber-olive"
                  disabled={isSubmittingEdit}
                />
                <label
                  htmlFor="edit-working"
                  className="ml-2 text-sm text-gray-700">
                  Hozirda ishlayapti
                </label>
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <Button
                  type="button"
                  onClick={() => {
                    setEditingBarber(null);
                    setEditFormData({
                      name: "",
                      tg_username: "",
                      phone_number: "",
                      password: "",
                      working: true,
                      work_start_time: "09:00",
                      work_end_time: "18:00",
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

      <Footer />
      <Analytics />
    </div>
  );
}

export default Barbers;


