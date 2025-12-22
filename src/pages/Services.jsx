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
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    duration: "",
    category_id: "",
    image_url: null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: "",
    price: "",
    duration: "",
    category_id: "",
  });
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
  
  // Category management states
  const [categoryFormData, setCategoryFormData] = useState({
    name: "",
    icon: "",
  });
  const [editingCategory, setEditingCategory] = useState(null);
  const [isSubmittingCategory, setIsSubmittingCategory] = useState(false);

  useEffect(() => {
    if (!isAuthenticated() || (!isAdmin() && !isSuperAdmin())) {
      navigate("/admin/login");
      return;
    }

    fetchServices();
    fetchCategories();
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

      let servicesList = Array.isArray(data)
        ? data
        : data.data || data.services || [];

      // Process services to handle image URLs (convert relative to absolute)
      servicesList = servicesList.map((service) => {
        // Get image URL and handle relative URLs
        let imageUrl = service.image_url || service.imageUrl || service.image || null;
        
        // If image URL is relative, make it absolute using the API base URL
        if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('//') && !imageUrl.startsWith('/')) {
          imageUrl = `${SERVICES_BASE_URL}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
        } else if (imageUrl && imageUrl.startsWith('/') && !imageUrl.startsWith('//')) {
          // If it starts with /, prepend the base URL
          imageUrl = `${SERVICES_BASE_URL}${imageUrl}`;
        }

        return {
          ...service,
          image_url: imageUrl,
          imageUrl: imageUrl,
          image: imageUrl,
        };
      });

      // Debug: Log first service to see image fields
      if (servicesList.length > 0) {
        console.log("First service image fields:", {
          image_url: servicesList[0].image_url,
          imageUrl: servicesList[0].imageUrl,
          image: servicesList[0].image
        });
      }

      setServices(servicesList);
    } catch (err) {
      console.error("Error fetching services:", err);
      setError(err.message || "Xizmatlarni yuklash muvaffaqiyatsiz");
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${SERVICES_BASE_URL}${API_ENDPOINTS.serviceCategories}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "*/*",
        },
        mode: "cors",
      });

      if (response.ok) {
        const data = await response.json();
        const categoriesList = Array.isArray(data) ? data : data.data || data.categories || [];
        setCategories(categoriesList);
      }
    } catch (err) {
      console.error("Error fetching categories:", err);
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

      // Create FormData for multipart/form-data
      const formDataToSend = new FormData();
      formDataToSend.append("name", formData.name);
      formDataToSend.append("price", parseInt(formData.price).toString());
      formDataToSend.append("duration", parseInt(formData.duration).toString());
      formDataToSend.append("category_id", parseInt(formData.category_id).toString());
      
      // Add image if selected
      if (formData.image_url) {
        const file = formData.image_url;
        const fileName = file.name.toLowerCase();
        let finalFileName = fileName;
        
        // If file doesn't have extension, add based on MIME type
        if (!fileName.match(/\.(jpg|jpeg|png|gif)$/)) {
          if (file.type === 'image/jpeg' || file.type === 'image/jpg') {
            finalFileName = fileName.endsWith('.') ? fileName + 'jpg' : fileName + '.jpg';
          } else if (file.type === 'image/png') {
            finalFileName = fileName.endsWith('.') ? fileName + 'png' : fileName + '.png';
          } else if (file.type === 'image/gif') {
            finalFileName = fileName.endsWith('.') ? fileName + 'gif' : fileName + '.gif';
          }
        }
        
        // Create a new File object with the correct name if needed
        const fileToSend = finalFileName !== fileName 
          ? new File([file], finalFileName, { type: file.type })
          : file;
        
        formDataToSend.append("image_url", fileToSend);
      }

      // Create new service using POST /barber-services
      const response = await fetch(`${SERVICES_BASE_URL}${API_ENDPOINTS.services}`, {
        method: "POST",
        headers: {
          Accept: "*/*",
          Authorization: `Bearer ${token}`,
          // Don't set Content-Type header - browser will set it with boundary for FormData
        },
        body: formDataToSend,
        mode: "cors",
      });

      const data = await response.json();

      if (response.ok || response.status === 201) {
        setSuccess("Xizmat muvaffaqiyatli qo'shildi!");
        setFormData({
          name: "",
          price: "",
          duration: "",
          category_id: "",
          image_url: null,
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
      category_id: service.category_id ? String(service.category_id) : "",
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
        category_id: editFormData.category_id ? parseInt(editFormData.category_id) : null,
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
          category_id: "",
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
    const { name, value, type, files } = e.target;
    if (type === "file") {
      const file = files && files[0];
      if (file) {
        // Validate file extension
        const fileName = file.name.toLowerCase();
        const validExtensions = ['.jpg', '.jpeg', '.png', '.gif'];
        const hasValidExtension = validExtensions.some(ext => fileName.endsWith(ext));
        
        if (!hasValidExtension) {
          setError("Faqat JPG, JPEG, PNG yoki GIF formatidagi rasmlar qabul qilinadi");
          return;
        }
        
        // Validate MIME type
        const validMimeTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif'];
        if (!validMimeTypes.includes(file.type)) {
          setError("Noto'g'ri fayl formati. Faqat rasm fayllari qabul qilinadi");
          return;
        }
      }
      setFormData({
        ...formData,
        [name]: file || null,
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
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

  // Category management functions
  const handleAddCategory = async (e) => {
    e.preventDefault();
    setIsSubmittingCategory(true);
    setError("");
    setSuccess("");

    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error("Token topilmadi. Iltimos, qayta kirib ko'ring.");
      }

      const response = await fetch(`${SERVICES_BASE_URL}${API_ENDPOINTS.serviceCategories}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "*/*",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: categoryFormData.name,
          icon: categoryFormData.icon || "",
        }),
        mode: "cors",
      });

      const data = await response.json();

      if (response.ok || response.status === 201) {
        setSuccess("Kategoriya muvaffaqiyatli qo'shildi!");
        setCategoryFormData({ name: "", icon: "" });
        fetchCategories();
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(data.message || data.error || "Kategoriya qo'shish muvaffaqiyatsiz");
      }
    } catch (err) {
      console.error("Error adding category:", err);
      setError(err.message || "Tarmoq xatosi. Iltimos, qayta urinib ko'ring.");
    } finally {
      setIsSubmittingCategory(false);
    }
  };

  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setCategoryFormData({
      name: category.name || "",
      icon: category.icon || "",
    });
    setError("");
  };

  const handleUpdateCategory = async (e) => {
    e.preventDefault();
    if (!editingCategory) return;

    setIsSubmittingCategory(true);
    setError("");
    setSuccess("");

    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error("Token topilmadi. Iltimos, qayta kirib ko'ring.");
      }

      const categoryId = editingCategory.id || editingCategory._id;

      const response = await fetch(
        `${SERVICES_BASE_URL}${API_ENDPOINTS.serviceCategories}/${categoryId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Accept: "*/*",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: categoryFormData.name,
            icon: categoryFormData.icon || "",
          }),
          mode: "cors",
        }
      );

      const data = await response.json();

      if (response.ok) {
        setSuccess("Kategoriya muvaffaqiyatli yangilandi!");
        setEditingCategory(null);
        setCategoryFormData({ name: "", icon: "" });
        fetchCategories();
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(data.message || data.error || "Kategoriyani yangilash muvaffaqiyatsiz");
      }
    } catch (err) {
      console.error("Error updating category:", err);
      setError(err.message || "Tarmoq xatosi. Iltimos, qayta urinib ko'ring.");
    } finally {
      setIsSubmittingCategory(false);
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    if (!window.confirm("Bu kategoriyani o'chirishni xohlaysizmi?")) {
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
        `${SERVICES_BASE_URL}${API_ENDPOINTS.serviceCategories}/${categoryId}`,
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

      if (response.ok || response.status === 204) {
        setSuccess("Kategoriya muvaffaqiyatli o'chirildi!");
        fetchCategories();
        setTimeout(() => setSuccess(""), 3000);
      } else {
        const data = await response.json().catch(() => ({}));
        setError(data.message || "Kategoriyani o'chirish muvaffaqiyatsiz");
      }
    } catch (err) {
      console.error("Error deleting category:", err);
      setError(err.message || "Tarmoq xatosi. Iltimos, qayta urinib ko'ring.");
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

          <div className="mb-6 flex gap-3">
            <Button
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-barber-olive hover:bg-barber-gold text-white">
              {showAddForm ? "Formani yopish" : "+ Yangi xizmat qo'shish"}
            </Button>
            <Button
              onClick={() => {
                setShowCategoryModal(true);
                setEditingCategory(null);
                setCategoryFormData({ name: "", icon: "" });
                setError("");
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white">
              Kategoriyalarni boshqarish
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kategoriya *
                  </label>
                  <select
                    name="category_id"
                    value={formData.category_id}
                    onChange={handleInputChange}
                    required
                    disabled={isSubmitting}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-barber-olive focus:border-barber-olive disabled:bg-gray-100 disabled:cursor-not-allowed">
                    <option value="">Kategoriyani tanlang</option>
                    {categories.map((category) => (
                      <option key={category.id || category._id} value={category.id || category._id}>
                        {category.icon ? `${category.icon} ` : ''}{category.name}
                      </option>
                    ))}
                  </select>
                  {categories.length === 0 && (
                    <p className="mt-1 text-sm text-gray-500">
                      Kategoriyalar mavjud emas.{" "}
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddForm(false);
                          setShowCategoryModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-800 underline">
                        Kategoriya qo'shish
                      </button>
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Xizmat rasmi (ixtiyoriy)
                  </label>
                  <input
                    type="file"
                    name="image_url"
                    accept="image/jpeg,image/png,image/jpg,image/gif,.jpg,.jpeg,.png,.gif"
                    onChange={handleInputChange}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-barber-olive file:text-white hover:file:bg-barber-gold"
                    disabled={isSubmitting}
                  />
                </div>

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
                        category_id: "",
                        image_url: null,
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
                      Rasm
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">
                      Xizmat nomi
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">
                      Kategoriya
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
                        colSpan="7"
                        className="px-4 py-8 text-center text-gray-500">
                        Xizmatlar topilmadi
                      </td>
                    </tr>
                  ) : (
                    services.map((service) => {
                      const serviceImageUrl = service.image_url || service.imageUrl || service.image;
                      const serviceCategoryId = service.category_id;
                      const serviceCategory = categories.find(
                        (cat) => String(cat.id || cat._id) === String(serviceCategoryId)
                      );
                      return (
                        <tr
                          key={service.id || service._id}
                          className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm">
                            {service.id || service._id}
                          </td>
                          <td className="px-4 py-3">
                            {serviceImageUrl ? (
                              <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 relative">
                                <img
                                  src={serviceImageUrl}
                                  alt={service.name || "Service"}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.target.parentElement.innerHTML = '<div class="w-full h-full flex items-center justify-center"><span class="text-gray-400 text-xs">Error</span></div>';
                                  }}
                                  loading="lazy"
                                />
                              </div>
                            ) : (
                              <div className="w-16 h-16 rounded-lg bg-gray-200 flex items-center justify-center">
                                <span className="text-gray-400 text-xs">No image</span>
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm font-medium">
                            {service.name || "N/A"}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {serviceCategory ? (
                              <div className="flex items-center gap-2">
                                {serviceCategory.icon && <span>{serviceCategory.icon}</span>}
                                <span>{serviceCategory.name}</span>
                              </div>
                            ) : (
                              <span className="text-gray-400">Kategoriya yo'q</span>
                            )}
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
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Category Management Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-black">
                Kategoriyalarni boshqarish
              </h3>
              <Button
                type="button"
                onClick={() => {
                  setShowCategoryModal(false);
                  setEditingCategory(null);
                  setCategoryFormData({ name: "", icon: "" });
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

            <form
              onSubmit={editingCategory ? handleUpdateCategory : handleAddCategory}
              className="space-y-4 mb-6 pb-4 border-b">
              <Input
                type="text"
                name="name"
                value={categoryFormData.name}
                onChange={(e) =>
                  setCategoryFormData({
                    ...categoryFormData,
                    name: e.target.value,
                  })
                }
                label="Kategoriya nomi"
                placeholder="Masalan: Soch olish"
                required
                size="lg"
                disabled={isSubmittingCategory}
              />

              <Input
                type="text"
                name="icon"
                value={categoryFormData.icon}
                onChange={(e) =>
                  setCategoryFormData({
                    ...categoryFormData,
                    icon: e.target.value,
                  })
                }
                label="Icon (emoji) - ixtiyoriy"
                placeholder="✂️"
                size="lg"
                disabled={isSubmittingCategory}
              />

              <div className="flex gap-3">
                <Button
                  type="submit"
                  disabled={isSubmittingCategory}
                  size="lg"
                  className="bg-barber-olive hover:bg-barber-gold text-white font-semibold"
                  loading={isSubmittingCategory}>
                  {isSubmittingCategory
                    ? "Saqlanmoqda..."
                    : editingCategory
                    ? "Yangilash"
                    : "Qo'shish"}
                </Button>
                {editingCategory && (
                  <Button
                    type="button"
                    onClick={() => {
                      setEditingCategory(null);
                      setCategoryFormData({ name: "", icon: "" });
                      setError("");
                    }}
                    size="lg"
                    variant="outlined"
                    className="border-gray-300 text-gray-700">
                    Bekor qilish
                  </Button>
                )}
              </div>
            </form>

            <div>
              <h4 className="text-lg font-semibold text-black mb-4">
                Mavjud kategoriyalar
              </h4>
              {categories.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  Kategoriyalar mavjud emas
                </p>
              ) : (
                <div className="space-y-2">
                  {categories.map((category) => (
                    <div
                      key={category.id || category._id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
                      <div className="flex items-center gap-3">
                        {category.icon && <span className="text-2xl">{category.icon}</span>}
                        <span className="font-medium">{category.name}</span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleEditCategory(category)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 text-xs">
                          Tahrirlash
                        </Button>
                        <Button
                          size="sm"
                          onClick={() =>
                            handleDeleteCategory(category.id || category._id)
                          }
                          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 text-xs">
                          O'chirish
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kategoriya
                </label>
                <select
                  name="category_id"
                  value={editFormData.category_id}
                  onChange={handleEditInputChange}
                  disabled={isSubmittingEdit}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-barber-olive focus:border-barber-olive disabled:bg-gray-100 disabled:cursor-not-allowed">
                  <option value="">Kategoriyani tanlang</option>
                  {categories.map((category) => (
                    <option key={category.id || category._id} value={category.id || category._id}>
                      {category.icon ? `${category.icon} ` : ''}{category.name}
                    </option>
                  ))}
                </select>
                {categories.length === 0 && (
                  <p className="mt-1 text-sm text-gray-500">
                    Kategoriyalar mavjud emas.{" "}
                    <button
                      type="button"
                      onClick={() => {
                        setEditingService(null);
                        setShowCategoryModal(true);
                      }}
                      className="text-blue-600 hover:text-blue-800 underline">
                      Kategoriya qo'shish
                    </button>
                  </p>
                )}
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <Button
                  type="button"
                  onClick={() => {
                    setEditingService(null);
                    setEditFormData({
                      name: "",
                      price: "",
                      duration: "",
                      category_id: "",
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

