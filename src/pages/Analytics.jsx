import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@material-tailwind/react";
import { Analytics } from "@vercel/analytics/react";
import { useAuth } from "../context/AuthContext";
import { API_ENDPOINTS } from "../data/api";
import { apiRequest, getAuthToken } from "../utils/api";
import Footer from "../components/Footer";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  CurrencyDollarIcon,
  ChartBarIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";

const COLORS = ["#10B981", "#3B82F6", "#8B5CF6", "#F59E0B", "#EF4444"];

function AnalyticsPage() {
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin, isSuperAdmin, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [timeRange, setTimeRange] = useState("MAX");
  const [statistics, setStatistics] = useState(null);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
  });

  // Calculate date range based on time range selection
  const calculateDateRange = (range) => {
    const now = new Date();
    const endDate = new Date(now);
    endDate.setHours(23, 59, 59, 999);
    let startDate = new Date(now);
    startDate.setHours(0, 0, 0, 0);

    switch (range) {
      case "1D":
        startDate.setDate(now.getDate() - 1);
        break;
      case "5D":
        startDate.setDate(now.getDate() - 5);
        break;
      case "1M":
        startDate.setMonth(now.getMonth() - 1);
        break;
      case "1Y":
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      case "5Y":
        startDate.setFullYear(now.getFullYear() - 5);
        break;
      case "MAX":
      default:
        // For MAX, use a very old date to get all data
        startDate = new Date(2020, 0, 1);
        break;
    }

    return {
      startDate: startDate.toISOString().split("T")[0],
      endDate: endDate.toISOString().split("T")[0],
    };
  };

  // Handle time range change
  const handleTimeRangeChange = (range) => {
    setTimeRange(range);
    const newDateRange = calculateDateRange(range);
    setDateRange(newDateRange);
  };

  const fetchStatistics = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const token = getAuthToken();
      if (!token) {
        throw new Error("Token topilmadi. Iltimos, qayta kirib ko'ring.");
      }

      const response = await apiRequest(
        API_ENDPOINTS.bookingsStatistics,
        {
          method: "POST",
          body: JSON.stringify({
            startDate: dateRange.startDate,
            endDate: dateRange.endDate,
          }),
        },
        true,
        10000
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `Statistikani yuklash muvaffaqiyatsiz: ${response.status}`
        );
      }

      const data = await response.json();
      const transformedData = transformStatisticsData(data);
      setStatistics(transformedData);
    } catch (err) {
      console.error("Error fetching statistics:", err);
      setError(err.message || "Statistikani yuklash muvaffaqiyatsiz");
      setStatistics(null);
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    if (isAuthenticated() && (isAdmin() || isSuperAdmin())) {
      fetchStatistics();
    } else {
      navigate("/admin/login");
    }
  }, [isAuthenticated, isAdmin, isSuperAdmin, navigate, fetchStatistics]);

  const transformStatisticsData = (apiData) => {
    if (!apiData) return null;

    const summary = apiData.summary || {};
    const barberStats = apiData.barber_statistics || [];

    // Calculate revenue by date from completed bookings
    const revenueByDate = {};
    // Calculate bookings count by date (all bookings)
    const bookingsByDate = {};
    // Service counts from all bookings (not just completed)
    const serviceCounts = {};

    barberStats.forEach((barberStat) => {
      const bookings = barberStat.bookings || [];
      bookings.forEach((booking) => {
        // Handle single service or array of services
        const services = booking.services && Array.isArray(booking.services)
          ? booking.services
          : booking.service
          ? [booking.service]
          : [];

        // Count services from all bookings
        services.forEach((service) => {
          if (service && service.name) {
            serviceCounts[service.name] = (serviceCounts[service.name] || 0) + 1;
          }
        });

        // Count bookings by date (all statuses)
        if (booking.date) {
          bookingsByDate[booking.date] = (bookingsByDate[booking.date] || 0) + 1;
        }

        // Calculate revenue only from completed bookings
        if (booking.status === "completed") {
          let bookingRevenue = 0;
          services.forEach((service) => {
            if (service && service.price) {
              bookingRevenue += parseFloat(service.price) || 0;
            }
          });

          if (booking.date && bookingRevenue > 0) {
            revenueByDate[booking.date] = (revenueByDate[booking.date] || 0) + bookingRevenue;
          }
        }
      });
    });

    // Create revenue over time data - use bookings count if no revenue
    const allDates = new Set([
      ...Object.keys(revenueByDate),
      ...Object.keys(bookingsByDate),
    ]);

    const revenueOverTime = Array.from(allDates)
      .sort((dateA, dateB) => dateA.localeCompare(dateB))
      .map((date) => {
        const dateObj = new Date(date);
        const month = dateObj.getMonth() + 1;
        const day = dateObj.getDate();
        return {
          date: `M${month} ${day}`,
          dateValue: date,
          revenue: revenueByDate[date] || 0,
          bookings: bookingsByDate[date] || 0,
        };
      });

    // Transform services data
    const byServices = Object.entries(serviceCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    // Transform barber statistics
    const byBarbers = barberStats.map((stat) => {
      const bookings = stat.bookings || [];
      const revenue = bookings.reduce((sum, booking) => {
        if (booking.status === "completed") {
          const services = booking.services && Array.isArray(booking.services)
            ? booking.services
            : booking.service
            ? [booking.service]
            : [];

          const bookingRevenue = services.reduce((serviceSum, service) => {
            return serviceSum + (parseFloat(service?.price) || 0);
          }, 0);

          return sum + bookingRevenue;
        }
        return sum;
      }, 0);

      // Count total bookings for this barber
      const totalBookings = bookings.length;

      return {
        name: stat.barber?.name || "N/A",
        revenue: revenue,
        totalBookings: totalBookings,
        percentage: 0,
      };
    });

    const totalRevenue = byBarbers.reduce((sum, barber) => sum + barber.revenue, 0);

    // Calculate percentages
    byBarbers.forEach((barber) => {
      barber.percentage = totalRevenue > 0
        ? Math.round((barber.revenue / totalRevenue) * 100)
        : 0;
    });

    // Use total_revenue from summary if available
    const finalTotalRevenue = summary.total_revenue !== undefined
      ? parseFloat(summary.total_revenue) || 0
      : totalRevenue;

    const profit = Math.round(finalTotalRevenue * 0.3);
    const completedBookings = summary.bookings_by_status?.completed || 0;
    const totalBookings = summary.total_bookings || 0;
    const conversionRate = totalBookings > 0
      ? ((completedBookings / totalBookings) * 100).toFixed(2)
      : 0;

    return {
      total_revenue: finalTotalRevenue,
      profit: profit,
      total_bookings: totalBookings,
      conversion_rate: parseFloat(conversionRate),
      revenue_over_time: revenueOverTime,
      by_services: byServices,
      by_barbers: byBarbers,
      booking_status: {
        total: totalBookings,
        completed: completedBookings,
        approved: summary.bookings_by_status?.approved || 0,
        pending: summary.bookings_by_status?.pending || 0,
        rejected: summary.bookings_by_status?.rejected || 0,
        cancelled: summary.bookings_by_status?.cancelled || 0,
      },
    };
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("uz-UZ", {
      style: "currency",
      currency: "UZS",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // No need for frontend filtering - backend handles date range

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

  const stats = statistics || {
    total_revenue: 0,
    profit: 0,
    total_bookings: 0,
    conversion_rate: 0,
    revenue_over_time: [],
    by_services: [],
    by_barbers: [],
    booking_status: {
      total: 0,
      completed: 0,
      approved: 0,
      pending: 0,
      rejected: 0,
      cancelled: 0,
    },
  };

  // Use revenue data directly from backend (already filtered by date range)
  const revenueData = stats.revenue_over_time || [];

  return (
    <div className="pt-16 sm:pt-20 md:pt-[92px] min-h-screen bg-gray-50 dark:bg-gray-900">
      <section className="w-full py-8 sm:py-10 md:py-12 lg:py-16">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-[127px]">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-black dark:text-white mb-2">
                Statistika va Tahlil
              </h1>
              <p className="text-gray-600 dark:text-gray-400">Booking va daromad statistikasi</p>
            </div>
            <div className="flex gap-3 flex-wrap">
              <Button
                onClick={() => navigate("/admin")}
                size="sm"
                className="bg-barber-olive hover:bg-barber-gold text-white">
                ADMIN PANELI
              </Button>
              {isSuperAdmin() && (
                <Button
                  onClick={() => navigate("/users")}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white">
                  FOYDALANUVCHILAR
                </Button>
              )}
              <Button
                onClick={logout}
                size="sm"
                variant="outlined"
                className="border-red-500 dark:border-red-600 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30">
                CHIQISH
              </Button>
            </div>
          </div>

          {error && (
            <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg text-sm mb-4">
              {error}
            </div>
          )}

          {/* Date Range Selector */}
          <div className="mb-6 bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <CalendarDaysIcon className="w-5 h-5 text-barber-olive" />
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                Vaqt oralig'ini tanlang
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Boshlanish sanasi
                </label>
                <input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => {
                    setDateRange({ ...dateRange, startDate: e.target.value });
                    setTimeRange("CUSTOM"); // Reset time range when manually changing dates
                  }}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-barber-olive focus:border-barber-olive transition-all bg-white dark:bg-gray-700 text-black dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tugash sanasi
                </label>
                <input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => {
                    setDateRange({ ...dateRange, endDate: e.target.value });
                    setTimeRange("CUSTOM"); // Reset time range when manually changing dates
                  }}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-barber-olive focus:border-barber-olive transition-all bg-white dark:bg-gray-700 text-black dark:text-white"
                />
              </div>
            </div>
            <div className="mt-4">
              <Button
                onClick={fetchStatistics}
                className="bg-barber-olive hover:bg-barber-gold text-white">
                Statistikani yangilash
              </Button>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {/* Total Revenue */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 shadow-lg border border-green-200 hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-green-500 rounded-lg">
                  <CurrencyDollarIcon className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Jami Daromad</div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(stats.total_revenue || 0)}
              </div>
            </div>

            {/* Total Bookings */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 shadow-lg border border-purple-200 hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-purple-500 rounded-lg">
                  <CalendarDaysIcon className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Jami Bronlar</div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {stats.total_bookings || 0}
              </div>
            </div>

            {/* Conversion Rate */}
            <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-6 shadow-lg border border-amber-200 hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-amber-500 rounded-lg">
                  <CheckCircleIcon className="w-6 h-6 text-white" />
                </div>
                <span className="text-xs font-semibold text-amber-700 bg-amber-200 px-2 py-1 rounded-full">
                  {stats.conversion_rate >= 80 ? "Yuqori" : stats.conversion_rate >= 50 ? "O'rtacha" : "Past"}
                </span>
              </div>
              <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Konversiya darajasi</div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {(stats.conversion_rate || 0).toFixed(1)}%
              </div>
            </div>
          </div>

          {/* Revenue Over Time Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md border border-gray-200 dark:border-gray-700 mb-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                  Daromad vaqt bo'yicha
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Tanlangan vaqt oralig'idagi daromad dinamikasi
                </p>
              </div>
              <div className="flex gap-2 flex-wrap">
                {["1D", "5D", "1M", "1Y", "5Y", "MAX"].map((range) => (
                  <button
                    key={range}
                    onClick={() => handleTimeRangeChange(range)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      timeRange === range
                        ? "bg-barber-olive text-white shadow-md"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                    }`}>
                    {range}
                  </button>
                ))}
              </div>
            </div>
            {revenueData && revenueData.length > 0 ? (
              <ResponsiveContainer width="100%" height={350} key={timeRange}>
                <LineChart data={revenueData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="date"
                    stroke="#6b7280"
                    style={{ fontSize: "12px" }}
                  />
                  <YAxis
                    yAxisId="revenue"
                    stroke="#6b7280"
                    style={{ fontSize: "12px" }}
                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                  />
                  <YAxis
                    yAxisId="bookings"
                    orientation="right"
                    stroke="#8B5CF6"
                    style={{ fontSize: "12px" }}
                  />
                  <Tooltip
                    formatter={(value, name) => {
                      if (name === "Jami daromad") {
                        return formatCurrency(value);
                      }
                      return value;
                    }}
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      padding: "10px",
                    }}
                    labelStyle={{ color: "#000", fontWeight: "bold" }}
                  />
                  <Legend />
                  {revenueData.some(d => d.revenue > 0) && (
                    <Line
                      yAxisId="revenue"
                      type="monotone"
                      dataKey="revenue"
                      stroke="#10B981"
                      strokeWidth={3}
                      dot={{ fill: "#10B981", r: 4 }}
                      activeDot={{ r: 6 }}
                      name="Jami daromad"
                    />
                  )}
                  {revenueData.some(d => d.bookings > 0) && (
                    <Line
                      yAxisId="bookings"
                      type="monotone"
                      dataKey="bookings"
                      stroke="#8B5CF6"
                      strokeWidth={3}
                      dot={{ fill: "#8B5CF6", r: 4 }}
                      activeDot={{ r: 6 }}
                      name="Bronlar soni"
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[350px] flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <ChartBarIcon className="w-12 h-12 mb-2 opacity-50" />
                <p className="text-sm">Ma'lumotlar mavjud emas</p>
              </div>
            )}
          </div>

          {/* Bottom Three Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
            {/* By Services */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md border border-gray-200 dark:border-gray-700 flex flex-col h-full">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                Xizmatlar bo'yicha
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Eng ko'p buyurtma qilingan xizmatlar</p>
              {stats.by_services && stats.by_services.length > 0 ? (
                <div className="flex-1 min-h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.by_services} margin={{ top: 5, right: 10, left: 0, bottom: 60 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis
                        dataKey="name"
                        angle={-45}
                        textAnchor="end"
                        height={80}
                        stroke="#6b7280"
                        style={{ fontSize: "11px" }}
                      />
                      <YAxis stroke="#6b7280" style={{ fontSize: "12px" }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "white",
                          border: "1px solid #e5e7eb",
                          borderRadius: "8px",
                        }}
                      />
                      <Bar dataKey="count" fill="#3B82F6" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex-1 min-h-[400px] flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <ChartBarIcon className="w-10 h-10 mb-2 opacity-50" />
                  <p className="text-sm">Ma'lumotlar mavjud emas</p>
                </div>
              )}
            </div>

            {/* By Barbers */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                Barberlar bo'yicha
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                {stats.by_barbers.some(b => b.revenue > 0) 
                  ? "Daromad taqsimoti" 
                  : "Bronlar taqsimoti"}
              </p>
              {stats.by_barbers && stats.by_barbers.length > 0 ? (
                <>
                  {stats.by_barbers.some(b => b.revenue > 0) ? (
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={stats.by_barbers.filter(b => b.revenue > 0)}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ percentage }) => `${percentage}%`}
                          outerRadius={70}
                          fill="#8884d8"
                          dataKey="revenue">
                          {stats.by_barbers.filter(b => b.revenue > 0).map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={COLORS[index % COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value) => formatCurrency(value)}
                          contentStyle={{
                            backgroundColor: "white",
                            border: "1px solid #e5e7eb",
                            borderRadius: "8px",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={stats.by_barbers.filter(b => (b.totalBookings || 0) > 0)}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ totalBookings, name }) => `${name}: ${totalBookings}`}
                          outerRadius={70}
                          fill="#8884d8"
                          dataKey="totalBookings">
                          {stats.by_barbers.filter(b => (b.totalBookings || 0) > 0).map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={COLORS[index % COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value) => `${value} bron`}
                          contentStyle={{
                            backgroundColor: "white",
                            border: "1px solid #e5e7eb",
                            borderRadius: "8px",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    {stats.by_barbers.some(b => b.revenue > 0) ? (
                      <div className="text-center mb-3">
                        <span className="text-xs text-gray-500 dark:text-gray-400">Jami daromad: </span>
                        <span className="text-sm font-bold text-gray-900 dark:text-white">
                          {formatCurrency(
                            stats.by_barbers.reduce((sum, b) => sum + b.revenue, 0)
                          )}
                        </span>
                      </div>
                    ) : (
                      <div className="text-center mb-3">
                        <span className="text-xs text-gray-500 dark:text-gray-400">Jami bronlar: </span>
                        <span className="text-sm font-bold text-gray-900 dark:text-white">
                          {stats.by_barbers.reduce((sum, b) => sum + (b.totalBookings || 0), 0)}
                        </span>
                      </div>
                    )}
                    <div className="space-y-2">
                      {stats.by_barbers.map((barber, index) => (
                        <div
                          key={barber.name}
                          className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{
                                backgroundColor: COLORS[index % COLORS.length],
                              }}></div>
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              {barber.name}
                            </span>
                          </div>
                          <div className="text-right">
                            {barber.revenue > 0 ? (
                              <>
                                <div className="text-sm font-bold text-gray-900 dark:text-white">
                                  {formatCurrency(barber.revenue)}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">{barber.percentage}%</div>
                              </>
                            ) : (
                              <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                {barber.totalBookings || 0} bron
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="h-[280px] flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <ChartBarIcon className="w-10 h-10 mb-2 opacity-50" />
                  <p className="text-sm">Ma'lumotlar mavjud emas</p>
                </div>
              )}
            </div>

            {/* Booking Status */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                Bronlar holati
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Bronlarning umumiy ko'rinishi</p>
              <div className="text-center mb-6 p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-xl">
                <div className="text-4xl font-bold text-gray-900 dark:text-white mb-1">
                  {stats.booking_status?.total || 0}
                </div>
                <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Jami bronlar</div>
              </div>
              <div className="space-y-2">
                <div className="flex flex-col p-3 bg-green-50 dark:bg-green-900/30 rounded-lg border border-green-200 dark:border-green-600">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-4 h-4 rounded-full bg-green-500"></div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Tasdiqlangan</span>
                  </div>
                  <span className="font-bold text-green-700 dark:text-green-300 text-lg">
                    {stats.booking_status?.approved || 0}
                  </span>
                </div>
                <div className="flex flex-col p-3 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg border border-yellow-200 dark:border-yellow-600">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Kutilmoqda</span>
                  </div>
                  <span className="font-bold text-yellow-700 dark:text-yellow-300 text-lg">
                    {stats.booking_status?.pending || 0}
                  </span>
                </div>
                {stats.booking_status?.completed > 0 && (
                  <div className="flex flex-col p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-600">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Yakunlangan</span>
                    </div>
                    <span className="font-bold text-blue-700 dark:text-blue-300 text-lg">
                      {stats.booking_status.completed}
                    </span>
                  </div>
                )}
                {stats.booking_status?.rejected > 0 && (
                  <div className="flex flex-col p-3 bg-red-50 dark:bg-red-900/30 rounded-lg border border-red-200 dark:border-red-600">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-4 h-4 rounded-full bg-red-500"></div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Rad etilgan</span>
                    </div>
                    <span className="font-bold text-red-700 dark:text-red-300 text-lg">
                      {stats.booking_status.rejected}
                    </span>
                  </div>
                )}
                {stats.booking_status?.cancelled > 0 && (
                  <div className="flex flex-col p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-4 h-4 rounded-full bg-gray-500"></div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Bekor qilingan</span>
                    </div>
                    <span className="font-bold text-gray-700 dark:text-gray-300 text-lg">
                      {stats.booking_status.cancelled}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
      <Footer />
      <Analytics />
    </div>
  );
}

export default AnalyticsPage;
