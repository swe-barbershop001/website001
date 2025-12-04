import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Input } from "@material-tailwind/react";
import { Analytics } from "@vercel/analytics/react";
import { useAuth } from "../context/AuthContext";
import { API_ENDPOINTS, SERVICES_BASE_URL } from "../data/api";
import { getAuthToken } from "../utils/api";
import Footer from "../components/Footer";

function Services() {
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin, isSuperAdmin, logout } = useAuth();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    duration: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: "",
    price: "",
    duration: "",
  });
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  useEffect(() => {
    if (!isAuthenticated() || (!isAdmin() && !isSuperAdmin())) {
      navigate("/admin/login");
      return;
    }

    fetchServices();
  }, [navigate, isAuthenticated, isAdmin, isSuperAdmin]);

  const fetchServices = async () => {
    try {
      setLoading(true);
      setError("");

      const token = getAuthToken();
      if (!token) {
        throw new Error("Token topilmadi. Iltimos, qayta kirib ko'ring.");
      }

      // Fetch services from /barber-services endpoint
      console.log("Fetching services from:", `${SERVICES_BASE_URL}${API_ENDPOINTS.services}`);
      const response = await fetch(`${SERVICES_BASE_URL}${API_ENDPOINTS.services}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "*/*",
          Authorization: `Bearer ${token}`,
        },
        mode: "cors",
      });

      console.log("Services response status:", response.status, response.statusText);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message ||
            `Xizmatlarni yuklash muvaffaqiyatsiz: ${response.status}`
        );
      }

      const data = await response.json();
      console.log("Services data received:", data);

      const servicesList = Array.isArray(data)
        ? data
        : data.data || data.services || [];

      setServices(servicesList);
    } catch (err) {
      console.error("Error fetching services:", err);
      setError(err.message || "Xizmatlarni yuklash muvaffaqiyatsiz");
    } finally {
      setLoading(false);
    }
  };

  const handleAddService = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error("Token topilmadi. Iltimos, qayta kirib ko'ring.");
      }

      // Create new service using POST /barber-services
      const response = await fetch(`${SERVICES_BASE_URL}${API_ENDPOINTS.services}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "*/*",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name,
          price: parseInt(formData.price),
          duration: parseInt(formData.duration),
        }),
        mode: "cors",
      });

      const data = await response.json();

      if (response.ok || response.status === 201) {
        setSuccess("Xizmat muvaffaqiyatli qo'shildi!");
        setFormData({
          name: "",
          price: "",
          duration: "",
        });
        setShowAddForm(false);
        fetchServices(); // Refresh services list
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(
          data.message || data.error || "Xizmat qo'shish muvaffaqiyatsiz"
        );
      }
    } catch (err) {
      console.error("Error adding service:", err);
      setError(err.message || "Tarmoq xatosi. Iltimos, qayta urinib ko'ring.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditService = (service) => {
    setEditingService(service);
    setEditFormData({
      name: service.name || "",
      price: service.price || "",
      duration: service.duration || "",
    });
    setError("");
  };

  const handleUpdateService = async (e) => {
    e.preventDefault();
    if (!editingService) return;

    setIsSubmittingEdit(true);
    setError("");
    setSuccess("");

    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error("Token topilmadi. Iltimos, qayta kirib ko'ring.");
      }

      const serviceId = editingService.id || editingService._id;

      // Prepare update data
      const updateData = {
        name: editFormData.name,
        price: parseInt(editFormData.price),
        duration: parseInt(editFormData.duration),
      };

      const response = await fetch(
        `${SERVICES_BASE_URL}${API_ENDPOINTS.services}/${serviceId}`,
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
        setSuccess("Xizmat muvaffaqiyatli yangilandi!");
        setEditingService(null);
        setEditFormData({
          name: "",
          price: "",
          duration: "",
        });
        fetchServices(); // Refresh services list
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(data.message || data.error || "Xizmatni yangilash muvaffaqiyatsiz");
      }
    } catch (err) {
      console.error("Error updating service:", err);
      setError(err.message || "Tarmoq xatosi. Iltimos, qayta urinib ko'ring.");
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  const handleDeleteService = async (serviceId) => {
    if (!window.confirm("Bu xizmatni o'chirishni xohlaysizmi?")) {
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
        `${SERVICES_BASE_URL}${API_ENDPOINTS.services}/${serviceId}`,
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
        setSuccess("Xizmat muvaffaqiyatli o'chirildi!");
        fetchServices(); // Refresh services list
        setTimeout(() => setSuccess(""), 3000);
      } else {
        const data = await response.json().catch(() => ({}));
        setError(data.message || "Xizmatni o'chirish muvaffaqiyatsiz");
      }
    } catch (err) {
      console.error("Error deleting service:", err);
      setError(err.message || "Tarmoq xatosi. Iltimos, qayta urinib ko'ring.");
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    if (error) setError("");
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData({
      ...editFormData,
      [name]: value,
    });
    if (error) setError("");
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
              Xizmatlar Boshqaruvi
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
              {showAddForm ? "Formani yopish" : "+ Yangi xizmat qo'shish"}
            </Button>
          </div>

          {showAddForm && (
            <div className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-10 shadow-lg border border-gray-200 mb-8">
              <h2 className="text-xl sm:text-2xl font-bold text-black mb-6">
                Yangi xizmat qo'shish
              </h2>
              <form
                onSubmit={handleAddService}
                className="space-y-4 sm:space-y-5 md:space-y-6">
                <Input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  label="Xizmat nomi"
                  placeholder="Masalan: Soch olish"
                  required
                  size="lg"
                  disabled={isSubmitting}
                />

                <Input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  label="Narx (UZS)"
                  placeholder="50000"
                  required
                  min="0"
                  size="lg"
                  disabled={isSubmitting}
                />

                <Input
                  type="number"
                  name="duration"
                  value={formData.duration}
                  onChange={handleInputChange}
                  label="Davomiyligi (daqiqa)"
                  placeholder="30"
                  required
                  min="1"
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
                    {isSubmitting ? "Qo'shilmoqda..." : "Xizmat qo'shish"}
                  </Button>
                  <Button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false);
                      setFormData({
                        name: "",
                        price: "",
                        duration: "",
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
                      Xizmat nomi
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">
                      Narx
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">
                      Davomiyligi
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">
                      Amallar
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {services.length === 0 ? (
                    <tr>
                      <td
                        colSpan="5"
                        className="px-4 py-8 text-center text-gray-500">
                        Xizmatlar topilmadi
                      </td>
                    </tr>
                  ) : (
                    services.map((service) => (
                      <tr
                        key={service.id || service._id}
                        className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm">
                          {service.id || service._id}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium">
                          {service.name || "N/A"}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {formatCurrency(service.price || 0)}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {service.duration ? `${service.duration} daqiqa` : "N/A"}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleEditService(service)}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 text-xs">
                              Tahrirlash
                            </Button>
                            <Button
                              size="sm"
                              onClick={() =>
                                handleDeleteService(service.id || service._id)
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

      {/* Edit Service Modal */}
      {editingService && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-black mb-4">
              Xizmatni tahrirlash
            </h3>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleUpdateService} className="space-y-4">
              <Input
                type="text"
                name="name"
                value={editFormData.name}
                onChange={handleEditInputChange}
                label="Xizmat nomi"
                required
                size="lg"
                disabled={isSubmittingEdit}
              />

              <Input
                type="number"
                name="price"
                value={editFormData.price}
                onChange={handleEditInputChange}
                label="Narx (UZS)"
                required
                min="0"
                size="lg"
                disabled={isSubmittingEdit}
              />

              <Input
                type="number"
                name="duration"
                value={editFormData.duration}
                onChange={handleEditInputChange}
                label="Davomiyligi (daqiqa)"
                required
                min="1"
                size="lg"
                disabled={isSubmittingEdit}
              />

              <div className="flex gap-3 justify-end pt-4">
                <Button
                  type="button"
                  onClick={() => {
                    setEditingService(null);
                    setEditFormData({
                      name: "",
                      price: "",
                      duration: "",
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

export default Services;

