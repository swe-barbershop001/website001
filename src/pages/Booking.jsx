import { useState, useEffect } from "react";
import { Button, Input } from "@material-tailwind/react";
import { Analytics } from "@vercel/analytics/react";
import {
  BOOKINGS_BASE_URL,
  API_ENDPOINTS,
  SERVICES_BASE_URL,
  AUTH_BASE_URL,
} from "../data/api";
import { contactInfo } from "../data/contact";
import Footer from "../components/Footer";
import { fetchWithTimeout } from "../utils/api";

function Booking() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    barber_id: "",
    service_ids: [], // Changed to array for multiple selection
    date: "",
    time: "",
    name: "",
    phone: "",
  });
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [barbers, setBarbers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [selectedBarber, setSelectedBarber] = useState(null);
  const [useCustomTime, setUseCustomTime] = useState(false);
  const [customTime, setCustomTime] = useState("");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedCategory, setSelectedCategory] = useState("all"); // YouTube-style category filter

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split("T")[0];

  // Set today's date as default on mount
  useEffect(() => {
    if (!formData.date) {
      setFormData((prev) => ({
        ...prev,
        date: today,
      }));
    }
  }, []);

  // Scroll to top whenever step changes
  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "smooth",
    });
  }, [currentStep]);

  // Generate time slots by hours only (8:00 AM to 9:00 PM)
  const generateTimeSlotsByHour = () => {
    const slotsByHour = {};
    for (let hour = 8; hour <= 21; hour++) {
      const timeString = `${hour.toString().padStart(2, "0")}:00`;
      slotsByHour[hour] = [timeString];
    }
    return slotsByHour;
  };

  const timeSlotsByHour = generateTimeSlotsByHour();

  useEffect(() => {
    // Fetch services, categories, and barbers from API
    const fetchData = async () => {
      try {
        console.log(
          "Fetching services from:",
          `${SERVICES_BASE_URL}${API_ENDPOINTS.services}`
        );
        console.log(
          "Fetching categories from:",
          `${SERVICES_BASE_URL}${API_ENDPOINTS.serviceCategories}`
        );
        console.log(
          "Fetching barbers from:",
          `${AUTH_BASE_URL}${API_ENDPOINTS.createBarber}`
        );

        const [servicesRes, categoriesRes, barbersRes] = await Promise.all([
          fetchWithTimeout(
            `${SERVICES_BASE_URL}${API_ENDPOINTS.services}`,
            {
              method: "GET",
              headers: {
                Accept: "*/*",
                "Content-Type": "application/json",
              },
              mode: "cors",
            },
            5000
          ),
          fetchWithTimeout(
            `${SERVICES_BASE_URL}${API_ENDPOINTS.serviceCategories}`,
            {
              method: "GET",
              headers: {
                Accept: "*/*",
                "Content-Type": "application/json",
              },
              mode: "cors",
            },
            5000
          ),
          fetchWithTimeout(
            `${AUTH_BASE_URL}${API_ENDPOINTS.createBarber}`,
            {
              method: "GET",
              headers: {
                Accept: "*/*",
                "Content-Type": "application/json",
              },
              mode: "cors",
            },
            5000
          ),
        ]);

        console.log("Services response status:", servicesRes.status);
        console.log("Categories response status:", categoriesRes.status);
        console.log("Barbers response status:", barbersRes.status);

        if (!servicesRes.ok) {
          const errorText = await servicesRes.text();
          console.error("Services fetch error:", errorText);
          throw new Error(`Failed to fetch services: ${servicesRes.status}`);
        }

        if (!categoriesRes.ok) {
          console.warn("Categories fetch failed:", categoriesRes.status);
          // Categories are optional, so we don't throw an error
        }

        if (!barbersRes.ok) {
          const errorText = await barbersRes.text();
          console.error("Barbers fetch error:", errorText);
          throw new Error(`Failed to fetch barbers: ${barbersRes.status}`);
        }

        const servicesData = await servicesRes.json();
        const categoriesData = categoriesRes.ok ? await categoriesRes.json() : [];
        const barbersData = await barbersRes.json();

        console.log("Services data:", servicesData);
        console.log("Categories data:", categoriesData);
        console.log("Barbers data:", barbersData);
        
        // Debug: Log first service to see image fields
        if (servicesData && (Array.isArray(servicesData) ? servicesData : servicesData.data || servicesData.services || []).length > 0) {
          const firstService = Array.isArray(servicesData) ? servicesData[0] : (servicesData.data || servicesData.services || [])[0];
          console.log("First service image fields:", {
            image_url: firstService.image_url,
            imageUrl: firstService.imageUrl,
            image: firstService.image
          });
        }

        // Handle services response - API returns array directly
        let servicesList = Array.isArray(servicesData)
          ? servicesData
          : servicesData.data || servicesData.services || [];

        // Map services to include formatted price and preserve image URLs
        const mappedServices = (servicesList || []).map((service) => {
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
            _id: String(service.id),
            title: service.name,
            image_url: imageUrl,
            imageUrl: imageUrl,
            image: imageUrl,
            // Format price if it's a number string
            price: service.price
              ? `${parseFloat(service.price).toLocaleString("uz-UZ")} UZS`
              : "",
          };
        });

        setServices(mappedServices);

        // Handle categories response
        let categoriesList = Array.isArray(categoriesData)
          ? categoriesData
          : categoriesData.data || categoriesData.categories || [];
        setCategories(categoriesList);

        // Handle barbers response
        let barbersList = Array.isArray(barbersData)
          ? barbersData
          : barbersData.data || barbersData.barbers || [];

        // Map barbers to ensure _id exists
        const mappedBarbers = (barbersList || []).map((barber) => ({
          ...barber,
          _id: String(barber.id || barber._id),
          fullName: barber.name || barber.fullName || barber.full_name,
        }));

        setBarbers(mappedBarbers);
      } catch (err) {
        console.error("Error fetching data:", err);
        if (err.message && err.message.includes("timeout")) {
          setError(
            "Backend не ответил (5 секунд). Пожалуйста, попробуйте еще раз."
          );
        } else {
          setError(
            "Не удалось загрузить данные с backend. Пожалуйста, попробуйте еще раз."
          );
        }
        setServices([]);
        setBarbers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    setSuccess(false);

    try {
      // Match API structure: phone_number, client_name, service_ids (array), barber_id, date, time
      const bookingData = {
        phone_number: formData.phone,
        barber_id: parseInt(formData.barber_id),
        service_ids: formData.service_ids.map((id) => parseInt(id)), // Array of selected service IDs
        date: formData.date || today,
        time: formData.time,
        client_name: formData.name,
      };

      console.log("Submitting booking:", bookingData);

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
      console.log("Booking response:", data);

      if (response.ok || response.status === 201) {
        setSuccess(true);
        setFormData({
          barber_id: "",
          service_ids: [], // Reset to empty array
          date: today,
          time: "",
          name: "",
          phone: "",
        });
        setSelectedBarber(null);
        setCurrentStep(1);
        setTimeout(() => {
          setSuccess(false);
        }, 5000);
      } else {
        const errorMessage =
          data.message ||
          data.error ||
          `Запись не удалась (${response.status}). Пожалуйста, попробуйте еще раз.`;
        setError(errorMessage);
        console.error("Booking failed:", data);
      }
    } catch (err) {
      console.error("Booking error:", err);
      setError(
        err.message ||
          "Ошибка сети. Пожалуйста, проверьте подключение к интернету и попробуйте еще раз."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (name, value) => {
    setFormData({
      ...formData,
      [name]: value,
    });
    if (error) setError("");

    // When barber is selected, update selectedBarber state
    if (name === "barber_id") {
      const barber = barbers.find((b) => String(b.id || b._id) === value);
      setSelectedBarber(barber || null);
    }

    // When time is selected from preset hours, disable custom time
    if (name === "time" && !useCustomTime) {
      setUseCustomTime(false);
      setCustomTime("");
    }
  };

  // Handle service selection (toggle multiple services)
  const handleServiceToggle = (serviceId) => {
    const serviceIdString = String(serviceId);
    setFormData((prev) => {
      const currentIds = prev.service_ids || [];
      const isSelected = currentIds.includes(serviceIdString);

      if (isSelected) {
        // Remove service if already selected
        return {
          ...prev,
          service_ids: currentIds.filter((id) => id !== serviceIdString),
        };
      } else {
        // Add service if not selected
        return {
          ...prev,
          service_ids: [...currentIds, serviceIdString],
        };
      }
    });
    if (error) setError("");
  };

  const handleCustomTimeChange = (value) => {
    setCustomTime(value);
    if (value) {
      // Validate custom time format (HH:MM)
      const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
      if (timeRegex.test(value)) {
        const [hours] = value.split(":").map(Number);
        // Check if time is within working hours (8:00 - 21:00)
        if (hours >= 8 && hours <= 21) {
          setFormData({
            ...formData,
            time: value,
          });
          setError("");
        } else {
          setError("Время должно быть с 8:00 до 21:00");
        }
      } else if (value.length === 5) {
        setError(
          "Неверный формат времени. Пожалуйста, введите в формате ЧЧ:ММ (например: 14:30)"
        );
      }
    } else {
      setFormData({
        ...formData,
        time: "",
      });
    }
  };

  const toggleCustomTime = () => {
    setUseCustomTime(!useCustomTime);
    if (!useCustomTime) {
      // Switching to custom time - clear preset time
      setFormData({
        ...formData,
        time: "",
      });
      setCustomTime("");
    } else {
      // Switching back to preset hours - clear custom time
      setCustomTime("");
      setFormData({
        ...formData,
        time: "",
      });
    }
    setError("");
  };

  const handleNext = () => {
    if (currentStep === 1) {
      // Validate step 1: barber, date, and time must be selected
      if (!formData.barber_id || !formData.date || !formData.time) {
        setError("Пожалуйста, выберите барбера, дату и время");
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      // Validate step 2: at least one service must be selected
      if (!formData.service_ids || formData.service_ids.length === 0) {
        setError("Пожалуйста, выберите хотя бы одну услугу");
        return;
      }
      setCurrentStep(3);
    }
    setError("");
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setError("");
    }
  };

  // Format date for display
  const formatDateDisplay = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString + "T00:00:00");
    const days = [
      "Воскресенье",
      "Понедельник",
      "Вторник",
      "Среда",
      "Четверг",
      "Пятница",
      "Суббота",
    ];
    const months = [
      "Январь",
      "Февраль",
      "Март",
      "Апрель",
      "Май",
      "Июнь",
      "Июль",
      "Август",
      "Сентябрь",
      "Октябрь",
      "Ноябрь",
      "Декабрь",
    ];
    return `${days[date.getDay()]}, ${date.getDate()} ${
      months[date.getMonth()]
    }`;
  };

  // Calendar functions
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    return days;
  };

  const handleDateSelect = (day) => {
    if (!day) return;
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    // Format date string manually to avoid timezone issues
    const dateString = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    setFormData((prev) => ({
      ...prev,
      date: dateString,
    }));
  };

  const handlePrevMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
    );
  };

  const handleNextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
    );
  };

  const isDateSelected = (day) => {
    if (!day || !formData.date) return false;
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    // Format date string manually to avoid timezone issues
    const dateString = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return formData.date === dateString;
  };

  const isDateToday = (day) => {
    if (!day) return false;
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    // Format date string manually to avoid timezone issues
    const dateString = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return dateString === today;
  };

  const isDatePast = (day) => {
    if (!day) return false;
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    // Format date string manually to avoid timezone issues
    const dateString = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return dateString < today;
  };

  const monthNames = [
    "Январь",
    "Февраль",
    "Март",
    "Апрель",
    "Май",
    "Июнь",
    "Июль",
    "Август",
    "Сентябрь",
    "Октябрь",
    "Ноябрь",
    "Декабрь",
  ];
  const dayNames = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];

  if (loading) {
    return (
      <div className="pt-16 sm:pt-20 md:pt-[92px] min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-barber-gold mx-auto mb-4"></div>
          <p className="text-black">Загрузка...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-16 sm:pt-20 md:pt-[92px] min-h-screen bg-white">
      <section className="w-full py-8 sm:py-10 md:py-12 lg:py-16">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-[127px]">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-black mb-6 text-center">
              Запись на прием
            </h1>

            {/* Step Indicator */}
            <div className="flex justify-center mb-8">
              <div className="flex items-center space-x-4">
                <div
                  className={`flex items-center ${
                    currentStep >= 1 ? "text-barber-olive" : "text-gray-400"
                  }`}>
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                      currentStep >= 1
                        ? "border-barber-olive bg-barber-olive text-white"
                        : "border-gray-300 bg-white"
                    }`}>
                    {currentStep > 1 ? "✓" : "1"}
                  </div>
                  <span className="ml-2 text-sm font-medium hidden sm:inline">
                    Барбер и время
                  </span>
                </div>
                <div
                  className={`w-12 h-0.5 ${
                    currentStep >= 2 ? "bg-barber-olive" : "bg-gray-300"
                  }`}></div>
                <div
                  className={`flex items-center ${
                    currentStep >= 2 ? "text-barber-olive" : "text-gray-400"
                  }`}>
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                      currentStep >= 2
                        ? "border-barber-olive bg-barber-olive text-white"
                        : "border-gray-300 bg-white"
                    }`}>
                    {currentStep > 2 ? "✓" : "2"}
                  </div>
                  <span className="ml-2 text-sm font-medium hidden sm:inline">
                    Услуга
                  </span>
                </div>
                <div
                  className={`w-12 h-0.5 ${
                    currentStep >= 3 ? "bg-barber-olive" : "bg-gray-300"
                  }`}></div>
                <div
                  className={`flex items-center ${
                    currentStep >= 3 ? "text-barber-olive" : "text-gray-400"
                  }`}>
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                      currentStep >= 3
                        ? "border-barber-olive bg-barber-olive text-white"
                        : "border-gray-300 bg-white"
                    }`}>
                    3
                  </div>
                  <span className="ml-2 text-sm font-medium hidden sm:inline">
                    Данные
                  </span>
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg text-sm mb-4">
                ✅ Запись успешно создана!
              </div>
            )}

            <div className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-10 shadow-lg border border-gray-200">
              {/* Step 1: Barber and Time Selection */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <h2 className="text-xl sm:text-2xl font-bold text-black mb-4">
                    Выберите барбера и время
                  </h2>

                  {/* Barbers Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Выберите барбера
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {barbers.map((barber) => {
                        const barberId = String(barber.id || barber._id);
                        const isSelected = formData.barber_id === barberId;
                        return (
                          <button
                            key={barberId}
                            type="button"
                            onClick={() =>
                              handleInputChange("barber_id", barberId)
                            }
                            className={`p-4 rounded-lg border-2 transition-all text-left ${
                              isSelected
                                ? "border-barber-olive bg-barber-olive/10"
                                : "border-gray-300 hover:border-barber-olive/50"
                            }`}>
                            <h3 className="font-bold text-lg text-black mb-1">
                              {barber.name || barber.fullName || "Barber"}
                            </h3>
                            <p className="text-sm text-gray-600">
                              Время работы: 8:00 - 21:00
                            </p>
                            {isSelected && (
                              <p className="text-sm text-barber-olive font-semibold mt-2">
                                ✓ Выбрано
                              </p>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Date Selection Calendar */}
                  {formData.barber_id && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Выберите дату
                      </label>
                      <div className="bg-white border border-gray-200 rounded-lg p-2 shadow-sm max-w-md mx-auto">
                        {/* Calendar Header */}
                        <div className="flex items-center justify-between mb-2">
                          <button
                            type="button"
                            onClick={handlePrevMonth}
                            className="p-1 hover:bg-gray-100 rounded transition-colors">
                            <svg
                              className="w-4 h-4 text-gray-600"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 19l-7-7 7-7"
                              />
                            </svg>
                          </button>
                          <h3 className="text-sm font-semibold text-black">
                            {monthNames[currentMonth.getMonth()]}{" "}
                            {currentMonth.getFullYear()}
                          </h3>
                          <button
                            type="button"
                            onClick={handleNextMonth}
                            className="p-1 hover:bg-gray-100 rounded transition-colors">
                            <svg
                              className="w-4 h-4 text-gray-600"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 5l7 7-7 7"
                              />
                            </svg>
                          </button>
                        </div>

                        {/* Calendar Grid */}
                        <div className="grid grid-cols-7 gap-0.5 mb-1">
                          {dayNames.map((day) => (
                            <div
                              key={day}
                              className="text-center text-[10px] font-semibold text-gray-500 py-1">
                              {day}
                            </div>
                          ))}
                        </div>
                        <div className="grid grid-cols-7 gap-0.5">
                          {getDaysInMonth(currentMonth).map((day, index) => {
                            if (day === null) {
                              return (
                                <div
                                  key={`empty-${index}`}
                                  className="aspect-square"
                                />
                              );
                            }
                            const isSelected = isDateSelected(day);
                            const isToday = isDateToday(day);
                            const isPast = isDatePast(day);

                            return (
                              <button
                                key={day}
                                type="button"
                                onClick={() => !isPast && handleDateSelect(day)}
                                disabled={isPast}
                                className={`aspect-square rounded text-xs font-medium transition-all ${
                                  isSelected
                                    ? "bg-barber-olive text-white shadow-md scale-105"
                                    : isToday
                                    ? "bg-barber-gold/20 text-black border border-barber-gold"
                                    : isPast
                                    ? "text-gray-300 cursor-not-allowed"
                                    : "text-gray-700 hover:bg-gray-100 hover:border-barber-olive/50 border border-transparent"
                                }`}>
                                {day}
                              </button>
                            );
                          })}
                        </div>
                        {formData.date && (
                          <div className="mt-2 pt-2 border-t border-gray-200">
                            <p className="text-xs text-gray-600">
                              Выбранная дата:
                            </p>
                            <p className="text-sm font-bold text-barber-olive">
                              {formatDateDisplay(formData.date)}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Time Selection - Organized by Hours with Switch Buttons */}
                  {formData.barber_id && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <label className="block text-sm font-medium text-gray-700">
                          Выберите время
                        </label>
                        <button
                          type="button"
                          onClick={toggleCustomTime}
                          className={`text-xs px-3 py-1.5 rounded-lg transition-all ${
                            useCustomTime
                              ? "bg-barber-olive text-white"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }`}>
                          {useCustomTime ? "Часы" : "Другое время"}
                        </button>
                      </div>

                      {!useCustomTime ? (
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                          {Object.entries(timeSlotsByHour).map(
                            ([hour, slots]) => {
                              const hourNum = parseInt(hour);
                              const time = slots[0]; // Only one time slot per hour now
                              const isSelected = formData.time === time;
                              const displayHour =
                                hourNum < 12
                                  ? `${hourNum}:00`
                                  : hourNum === 12
                                  ? "12:00"
                                  : `${hourNum}:00`;
                              const period = hourNum < 12 ? "AM" : "PM";

                              return (
                                <button
                                  key={hour}
                                  type="button"
                                  onClick={() =>
                                    handleInputChange("time", time)
                                  }
                                  className={`relative px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                                    isSelected
                                      ? "bg-barber-olive text-white shadow-lg transform scale-105"
                                      : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md border border-gray-300"
                                  }`}
                                  disabled={isSubmitting}>
                                  <div className="text-center">
                                    <div className="text-base font-bold">
                                      {displayHour}
                                    </div>
                                    <div className="text-xs opacity-75">
                                      {period}
                                    </div>
                                  </div>
                                  {isSelected && (
                                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center">
                                      <svg
                                        className="w-3 h-3 text-barber-olive"
                                        fill="currentColor"
                                        viewBox="0 0 20 20">
                                        <path
                                          fillRule="evenodd"
                                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                          clipRule="evenodd"
                                        />
                                      </svg>
                                    </span>
                                  )}
                                </button>
                              );
                            }
                          )}
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <Input
                            type="time"
                            name="customTime"
                            value={customTime}
                            onChange={(e) =>
                              handleCustomTimeChange(e.target.value)
                            }
                            label="Введите другое время"
                            placeholder="ЧЧ:ММ (например: 14:30)"
                            size="lg"
                            disabled={isSubmitting}
                            min="08:00"
                            max="21:00"
                          />
                          <p className="text-xs text-gray-500">
                            Пожалуйста, введите время с 8:00 до 21:00
                          </p>
                          {formData.time && (
                            <div className="p-3 bg-barber-olive/10 border border-barber-olive rounded-lg">
                              <p className="text-sm text-gray-600">
                                Выбранное время:
                              </p>
                              <p className="text-base font-bold text-black">
                                {formData.time}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex justify-end pt-4">
                    <Button
                      type="button"
                      onClick={handleNext}
                      disabled={!formData.barber_id || !formData.time}
                      size="lg"
                      className="bg-barber-olive hover:bg-barber-gold text-white font-semibold">
                      Keyingi
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 2: Service Selection */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <h2 className="text-xl sm:text-2xl font-bold text-black mb-4">
                    Выберите услугу
                  </h2>

                  {/* Selected Barber and Time Summary */}
                  {selectedBarber && (
                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      <p className="text-sm text-gray-600 mb-1">Выбрано:</p>
                      <p className="font-semibold text-black">
                        {selectedBarber.name || selectedBarber.fullName} -{" "}
                        {formData.date} {formData.time}
                      </p>
                    </div>
                  )}

                  {/* Services Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Выберите услугу{" "}
                      {formData.service_ids.length > 0 &&
                        `(${formData.service_ids.length} выбрано)`}
                    </label>
                    
                    {/* YouTube-style Category Tabs */}
                    {categories.length > 0 && (
                      <div className="mb-6 overflow-x-auto pb-2">
                        <div className="flex gap-2 min-w-max">
                          {/* All Categories Button */}
                          <button
                            type="button"
                            onClick={() => setSelectedCategory("all")}
                            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                              selectedCategory === "all"
                                ? "bg-barber-olive text-white shadow-md"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            }`}>
                            Все
                          </button>
                          
                          {/* Category Buttons */}
                          {categories.map((category) => {
                            const categoryId = String(category.id || category._id);
                            const isSelected = selectedCategory === categoryId;
                            
                            return (
                              <button
                                key={categoryId}
                                type="button"
                                onClick={() => setSelectedCategory(categoryId)}
                                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all flex items-center gap-2 ${
                                  isSelected
                                    ? "bg-barber-olive text-white shadow-md"
                                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                }`}>
                                {category.icon && <span>{category.icon}</span>}
                                <span>{category.name}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Filtered Services Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {(() => {
                        // Filter services based on selected category
                        let filteredServices = services;
                        
                        if (selectedCategory !== "all" && categories.length > 0) {
                          filteredServices = services.filter((service) => {
                            const serviceCategoryId = String(service.category_id);
                            return serviceCategoryId === selectedCategory;
                          });
                        }

                        if (filteredServices.length === 0) {
                          return (
                            <div className="col-span-2 text-center py-8 text-gray-500">
                              <p>Услуги не найдены в этой категории</p>
                            </div>
                          );
                        }

                        return filteredServices.map((service) => {
                          const serviceId = String(service.id || service._id);
                          const isSelected =
                            formData.service_ids &&
                            formData.service_ids.includes(serviceId);
                          const serviceName =
                            service.name || service.title || "Service";
                          const servicePrice =
                            service.price ||
                            (service.price_raw
                              ? `${parseFloat(service.price_raw).toLocaleString(
                                  "uz-UZ"
                                )} UZS`
                              : "");
                          const serviceDuration = service.duration
                            ? `${service.duration} min`
                            : "";

                          const serviceImageUrl = service.image_url || service.imageUrl || service.image;

                          return (
                            <button
                              key={serviceId}
                              type="button"
                              onClick={() => handleServiceToggle(serviceId)}
                              className={`p-4 rounded-lg border-2 transition-all text-left relative overflow-hidden ${
                                isSelected
                                  ? "border-barber-olive bg-barber-olive/10"
                                  : "border-gray-300 hover:border-barber-olive/50"
                              }`}>
                              {/* Service Image */}
                              {serviceImageUrl ? (
                                <div className="w-full h-32 mb-3 rounded-lg overflow-hidden bg-gray-100 relative">
                                  <img
                                    src={serviceImageUrl}
                                    alt={serviceName}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      e.target.parentElement.style.display = 'none';
                                    }}
                                    loading="lazy"
                                  />
                                </div>
                              ) : null}
                              
                              {/* Checkbox indicator */}
                              <div
                                className={`absolute top-3 right-3 w-6 h-6 rounded border-2 flex items-center justify-center z-10 ${
                                  isSelected
                                    ? "border-barber-olive bg-barber-olive"
                                    : "border-gray-300 bg-white"
                                }`}>
                                {isSelected && (
                                  <svg
                                    className="w-4 h-4 text-white"
                                    fill="currentColor"
                                    viewBox="0 0 20 20">
                                    <path
                                      fillRule="evenodd"
                                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                )}
                              </div>
                              <h3 className="font-bold text-lg text-black mb-1 pr-8">
                                {serviceName}
                              </h3>
                              {servicePrice && (
                                <p className="text-sm font-semibold text-barber-olive mb-1">
                                  {servicePrice}
                                </p>
                              )}
                              {serviceDuration && (
                                <p className="text-sm text-gray-600">
                                  {serviceDuration}
                                </p>
                              )}
                            </button>
                          );
                        });
                      })()}
                    </div>
                  </div>

                  <div className="flex justify-between pt-4">
                    <Button
                      type="button"
                      onClick={handlePrevious}
                      variant="outlined"
                      size="lg"
                      className="border-gray-300 text-gray-700 hover:bg-gray-50">
                      Назад
                    </Button>
                    <Button
                      type="button"
                      onClick={handleNext}
                      disabled={
                        !formData.service_ids ||
                        formData.service_ids.length === 0
                      }
                      size="lg"
                      className="bg-barber-olive hover:bg-barber-gold text-white font-semibold">
                      Далее
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 3: Personal Details */}
              {currentStep === 3 && (
                <form onSubmit={handleFormSubmit} className="space-y-6">
                  <h2 className="text-xl sm:text-2xl font-bold text-black mb-4">
                    Личные данные
                  </h2>

                  {/* Summary */}
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <p className="text-sm text-gray-600 mb-2">
                      Информация о записи:
                    </p>
                    {selectedBarber && (
                      <p className="text-sm text-black mb-1">
                        <span className="font-semibold">Барбер:</span>{" "}
                        {selectedBarber.name || selectedBarber.fullName}
                      </p>
                    )}
                    <p className="text-sm text-black mb-1">
                      <span className="font-semibold">Дата и время:</span>{" "}
                      {formatDateDisplay(formData.date || today)}{" "}
                      {formData.time}
                    </p>
                    {formData.service_ids &&
                      formData.service_ids.length > 0 && (
                        <div className="text-sm text-black">
                          <span className="font-semibold">Услуги:</span>
                          <ul className="list-disc list-inside mt-1 ml-2">
                            {formData.service_ids.map((serviceId) => {
                              const service = services.find(
                                (s) => String(s.id || s._id) === serviceId
                              );
                              return (
                                <li key={serviceId}>
                                  {service?.name || service?.title || "N/A"}
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      )}
                  </div>

                  {/* Name Input */}
                  <Input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    label="Имя"
                    placeholder="Введите ваше имя"
                    required
                    size="lg"
                    disabled={isSubmitting}
                  />

                  {/* Phone Input */}
                  <Input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    label="Номер телефона"
                    placeholder="+998 XX XXX XX XX"
                    required
                    size="lg"
                    disabled={isSubmitting}
                  />

                  <div className="flex justify-between pt-4">
                    <Button
                      type="button"
                      onClick={handlePrevious}
                      variant="outlined"
                      size="lg"
                      className="border-gray-300 text-gray-700 hover:bg-gray-50"
                      disabled={isSubmitting}>
                      Назад
                    </Button>
                    <Button
                      type="submit"
                      disabled={
                        isSubmitting || !formData.name || !formData.phone
                      }
                      size="lg"
                      className="bg-barber-olive hover:bg-barber-gold text-white font-semibold"
                      loading={isSubmitting}>
                      {isSubmitting ? "Создание записи..." : "Записаться"}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
      <Footer />
      <Analytics />
    </div>
  );
}

export default Booking;
