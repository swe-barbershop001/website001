import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import { Button } from "@material-tailwind/react";
import { useAuth } from "../context/AuthContext";
import { contactInfo } from "../data/contact";
import Logo from "./Logo";

function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user, logout, isAdmin, isSuperAdmin } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  const isActive = (path) => {
    return location.pathname === path;
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const controlHeader = () => {
      const currentScrollY = window.scrollY;

      // Always show header at the top of the page
      if (currentScrollY < 10) {
        setIsVisible(true);
      }
      // Hide header when scrolling down, show when scrolling up
      else if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // Scrolling down
        setIsVisible(false);
      } else if (currentScrollY < lastScrollY) {
        // Scrolling up
        setIsVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", controlHeader, { passive: true });

    return () => {
      window.removeEventListener("scroll", controlHeader);
    };
  }, [lastScrollY]);

  return (
    <motion.header
      initial={{ y: 0 }}
      animate={{
        y: isVisible ? 0 : -100,
      }}
      transition={{
        duration: 0.3,
        ease: "easeInOut",
      }}
      className="fixed top-0 left-0 right-0 bg-white z-50 shadow-md h-16 sm:h-20 md:h-[92px]">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-[93px] h-full flex justify-between items-center">
        <Logo
          onClick={closeMobileMenu}
          linkTo={isAdmin() || isSuperAdmin() ? "/admin" : "/"}
        />

        {/* Desktop Navigation */}
        <nav className="hidden md:flex gap-6 lg:gap-8">
          {!isAdmin() && !isSuperAdmin() && (
            <>
              <Link
                to="/"
                className={`text-sm lg:text-base font-medium transition-colors ${
                  isActive("/")
                    ? "text-barber-gold"
                    : "text-black hover:text-barber-gold"
                }`}
                aria-label="Navigate to Home">
                Bosh sahifa
              </Link>
              <Link
                to="/team"
                className={`text-sm lg:text-base font-medium transition-colors ${
                  isActive("/team")
                    ? "text-barber-gold"
                    : "text-black hover:text-barber-gold"
                }`}
                aria-label="Navigate to Our Team">
                Jamoa
              </Link>
              <Link
                to="/gallery"
                className={`text-sm lg:text-base font-medium transition-colors ${
                  isActive("/gallery")
                    ? "text-barber-gold"
                    : "text-black hover:text-barber-gold"
                }`}
                aria-label="Navigate to Gallery">
                Galereya
              </Link>
              <Link
                to="/delivery"
                className={`text-sm lg:text-base font-medium transition-colors ${
                  isActive("/delivery")
                    ? "text-barber-gold"
                    : "text-black hover:text-barber-gold"
                }`}
                aria-label="Navigate to Delivery">
                Aloqa
              </Link>
            </>
          )}
          {!isAdmin() && !isSuperAdmin() && (
            <Link
              to="/booking"
              className={`text-sm lg:text-base font-medium transition-colors ${
                isActive("/booking")
                  ? "text-barber-gold"
                  : "text-black hover:text-barber-gold"
              }`}>
              Bron qilish
            </Link>
          )}
          {isAuthenticated() && (
            <>
              {isAdmin() && !isSuperAdmin() && (
                <>
                  <Link
                    to="/admin"
                    className={`text-sm mt-1 lg:text-base font-medium transition-colors ${
                      isActive("/admin")
                        ? "text-barber-gold"
                        : "text-black hover:text-barber-gold"
                    }`}>
                    Admin
                  </Link>
                  <Link
                    to="/barbers"
                    className={`text-sm mt-1 lg:text-base font-medium transition-colors ${
                      isActive("/barbers")
                        ? "text-barber-gold"
                        : "text-black hover:text-barber-gold"
                    }`}>
                    Barberlar
                  </Link>
                  <Link
                    to="/services"
                    className={`text-sm mt-1 lg:text-base font-medium transition-colors ${
                      isActive("/services")
                        ? "text-barber-gold"
                        : "text-black hover:text-barber-gold"
                    }`}>
                    Xizmatlar
                  </Link>
                  <Link
                    to="/analytics"
                    className={`text-sm mt-1 lg:text-base font-medium transition-colors ${
                      isActive("/analytics")
                        ? "text-barber-gold"
                        : "text-black hover:text-barber-gold"
                    }`}>
                    Statistika
                  </Link>
                </>
              )}
              {isSuperAdmin() && (
                <>
                  <Link
                    to="/admin"
                    className={`text-sm mt-1 lg:text-base font-medium transition-colors ${
                      isActive("/admin")
                        ? "text-barber-gold"
                        : "text-black hover:text-barber-gold"
                    }`}>
                    Admin
                  </Link>
                  <Link
                    to="/super-admin"
                    className={`text-sm   mt-1 lg:text-base font-medium transition-colors ${
                      isActive("/super-admin")
                        ? "text-barber-gold"
                        : "text-black hover:text-barber-gold"
                    }`}>
                    Super Admin
                  </Link>
                  <Link
                    to="/barbers"
                    className={`text-sm mt-1 lg:text-base font-medium transition-colors ${
                      isActive("/barbers")
                        ? "text-barber-gold"
                        : "text-black hover:text-barber-gold"
                    }`}>
                    Barberlar
                  </Link>
                  <Link
                    to="/services"
                    className={`text-sm mt-1 mt-1lg:text-base font-medium transition-colors ${
                      isActive("/services")
                        ? "text-barber-gold"
                        : "text-black hover:text-barber-gold"
                    }`}>
                    Xizmatlar
                  </Link>
                  <Link
                    to="/analytics"
                    className={`text-sm mt-1 lg:text-base font-medium transition-colors ${
                      isActive("/analytics")
                        ? "text-barber-gold"
                        : "text-black hover:text-barber-gold"
                    }`}>
                    Statistika
                  </Link>
                </>
              )}
              <Button
                size="sm"
                onClick={() => {
                  logout();
                  navigate("/");
                }}
                className=" bg-barber-olive hover:bg-barber-gold text-white">
                Chiqish
              </Button>
            </>
          )}
        </nav>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2 text-black hover:text-barber-gold transition-colors"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle mobile menu">
          {mobileMenuOpen ? (
            <XMarkIcon className="w-6 h-6" />
          ) : (
            <Bars3Icon className="w-6 h-6" />
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-t border-gray-200 shadow-lg">
            <nav className="flex flex-col px-4 py-4 space-y-4">
              {!isAdmin() && !isSuperAdmin() && (
                <>
                  <button
                    onClick={() => {
                      closeMobileMenu();
                      navigate("/");
                    }}
                    className={`text-base font-medium py-2 text-left transition-colors ${
                      isActive("/")
                        ? "text-barber-gold"
                        : "text-black hover:text-barber-gold"
                    }`}>
                    Bosh sahifa
                  </button>
                  <button
                    onClick={() => {
                      closeMobileMenu();
                      navigate("/team");
                    }}
                    className={`text-base font-medium py-2 text-left transition-colors ${
                      isActive("/team")
                        ? "text-barber-gold"
                        : "text-black hover:text-barber-gold"
                    }`}>
                    Jamoa
                  </button>
                  <button
                    onClick={() => {
                      closeMobileMenu();
                      navigate("/gallery");
                    }}
                    className={`text-base font-medium py-2 text-left transition-colors ${
                      isActive("/gallery")
                        ? "text-barber-gold"
                        : "text-black hover:text-barber-gold"
                    }`}>
                    Galereya
                  </button>
                  <button
                    onClick={() => {
                      closeMobileMenu();
                      navigate("/delivery");
                    }}
                    className={`text-base font-medium py-2 text-left transition-colors ${
                      isActive("/delivery")
                        ? "text-barber-gold"
                        : "text-black hover:text-barber-gold"
                    }`}>
                    Aloqa
                  </button>
                </>
              )}
              {!isAdmin() && !isSuperAdmin() && (
                <button
                  onClick={() => {
                    closeMobileMenu();
                    navigate("/booking");
                  }}
                  className={`text-base font-medium py-2 text-left transition-colors ${
                    isActive("/booking")
                      ? "text-barber-gold"
                      : "text-black hover:text-barber-gold"
                  }`}>
                  Bron qilish
                </button>
              )}
              {isAuthenticated() && (
                <>
                  {isAdmin() && !isSuperAdmin() && (
                    <>
                      <button
                        onClick={() => {
                          closeMobileMenu();
                          navigate("/admin");
                        }}
                        className={`text-base font-medium py-2 text-left transition-colors ${
                          isActive("/admin")
                            ? "text-barber-gold"
                            : "text-black hover:text-barber-gold"
                        }`}>
                        Admin
                      </button>
                      <button
                        onClick={() => {
                          closeMobileMenu();
                          navigate("/barbers");
                        }}
                        className={`text-base font-medium py-2 text-left transition-colors ${
                          isActive("/barbers")
                            ? "text-barber-gold"
                            : "text-black hover:text-barber-gold"
                        }`}>
                        Barberlar
                      </button>
                      <button
                        onClick={() => {
                          closeMobileMenu();
                          navigate("/services");
                        }}
                        className={`text-base font-medium py-2 text-left transition-colors ${
                          isActive("/services")
                            ? "text-barber-gold"
                            : "text-black hover:text-barber-gold"
                        }`}>
                        Xizmatlar
                      </button>
                      <button
                        onClick={() => {
                          closeMobileMenu();
                          navigate("/analytics");
                        }}
                        className={`text-base font-medium py-2 text-left transition-colors ${
                          isActive("/analytics")
                            ? "text-barber-gold"
                            : "text-black hover:text-barber-gold"
                        }`}>
                        Statistika
                      </button>
                    </>
                  )}
                  {isSuperAdmin() && (
                    <>
                      <button
                        onClick={() => {
                          closeMobileMenu();
                          navigate("/admin");
                        }}
                        className={`text-base font-medium py-2 text-left transition-colors ${
                          isActive("/admin")
                            ? "text-barber-gold"
                            : "text-black hover:text-barber-gold"
                        }`}>
                        Admin
                      </button>
                      <button
                        onClick={() => {
                          closeMobileMenu();
                          navigate("/super-admin");
                        }}
                        className={`text-base font-medium py-2 text-left transition-colors ${
                          isActive("/super-admin")
                            ? "text-barber-gold"
                            : "text-black hover:text-barber-gold"
                        }`}>
                        Super Admin
                      </button>
                      <button
                        onClick={() => {
                          closeMobileMenu();
                          navigate("/barbers");
                        }}
                        className={`text-base font-medium py-2 text-left transition-colors ${
                          isActive("/barbers")
                            ? "text-barber-gold"
                            : "text-black hover:text-barber-gold"
                        }`}>
                        Barberlar
                      </button>
                      <button
                        onClick={() => {
                          closeMobileMenu();
                          navigate("/services");
                        }}
                        className={`text-base font-medium py-2 text-left transition-colors ${
                          isActive("/services")
                            ? "text-barber-gold"
                            : "text-black hover:text-barber-gold"
                        }`}>
                        Xizmatlar
                      </button>
                      <button
                        onClick={() => {
                          closeMobileMenu();
                          navigate("/analytics");
                        }}
                        className={`text-base font-medium py-2 text-left transition-colors ${
                          isActive("/analytics")
                            ? "text-barber-gold"
                            : "text-black hover:text-barber-gold"
                        }`}>
                        Statistika
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => {
                      logout();
                      closeMobileMenu();
                      navigate("/");
                    }}
                    className="text-base font-medium py-2 text-left text-red-600 hover:text-red-700 transition-colors">
                    Chiqish
                  </button>
                </>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}

export default Header;
