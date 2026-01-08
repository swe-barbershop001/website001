import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button, Input } from "@material-tailwind/react";
import { Analytics } from "@vercel/analytics/react";
import { AUTH_BASE_URL, API_ENDPOINTS } from "../data/api";
import { useAuth } from "../context/AuthContext";
import Footer from "../components/Footer";


function AdminLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    tg_username: "",
    password: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Get the redirect path from location state, default to /admin
  const from = location.state?.from?.pathname || "/admin";

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch(`${AUTH_BASE_URL}${API_ENDPOINTS.login}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tg_username: formData.tg_username,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        const authToken = data.token || data.access_token || data.accessToken;
        const userData = data.user || data;

        if (authToken && userData) {
          // Check if user is admin or super admin before logging in
          const userRole = userData.role || userData.role_type;
          const isAdminUser =
            userRole === "admin" ||
            userRole === "super_admin" ||
            userRole === "SUPER_ADMIN" ||
            userData.isAdmin;

          if (isAdminUser) {
            // Store user data and token
            login(userData, authToken);
            // Redirect to admin page
            navigate(from, { replace: true });
          } else {
            setError(
              "У вас нет прав администратора. Войти могут только администратор или супер-администратор."
            );
          }
        } else {
          setError("Неправильный ответ от сервера");
        }
      } else {
        const errorMessage =
          data.message ||
          data.error ||
          "Вход не удался. Пожалуйста, проверьте свои данные.";
        setError(errorMessage);
      }
    } catch (err) {
      setError(
        "Ошибка сети. Пожалуйста, проверьте подключение к интернету и попробуйте еще раз."
      );
      console.error("Login error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    if (error) setError("");
  };

  return (
    <div className="pt-16 sm:pt-20 md:pt-[92px] min-h-screen bg-white dark:bg-gray-900">
      <section className="w-full py-8 sm:py-10 md:py-12 lg:py-16">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-[127px]">
          <div className="max-w-md mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-10 shadow-lg border border-gray-200 dark:border-gray-700">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-black dark:text-white mb-2 text-center">
                Вход администратора
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base mb-6 text-center">
                Вход в админ-панель
              </p>

              {error && (
                <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg text-sm mb-4">
                  {error}
                </div>
              )}

              <form
                onSubmit={handleFormSubmit}
                className="space-y-4 sm:space-y-5 md:space-y-6">
                <Input
                  type="text"
                  name="tg_username"
                  value={formData.tg_username}
                  onChange={handleInputChange}
                  label="Имя пользователя Telegram"
                  placeholder="@username"
                  required
                  size="lg"
                  disabled={isSubmitting}
                />

                <Input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  label="Пароль"
                  required
                  size="lg"
                  disabled={isSubmitting}
                />

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  size="lg"
                  className="w-full bg-barber-olive hover:bg-barber-gold text-white font-semibold"
                  loading={isSubmitting}>
                  {isSubmitting ? "Вход..." : "Войти"}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </section>
      <Footer />
      <Analytics />
    </div>
  );
}

export default AdminLogin;
