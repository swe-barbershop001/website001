import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@material-tailwind/react";
import { motion } from "framer-motion";
import { Analytics } from "@vercel/analytics/react";
import { contactInfo } from "../data";
import { imagePool } from "../data/images";
import { API_BASE_URL, API_ENDPOINTS, BARBERS_BASE_URL } from "../data/api";
import RegisterModal from "../components/RegisterModal";
import Footer from "../components/Footer";
import { useLanguage } from "../context/LanguageContext";
import { getTranslation } from "../data/translations";

function Team() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [barbers, setBarbers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBarbers = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(
          `${BARBERS_BASE_URL}/barber`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch barbers");
        }

        const data = await response.json();
        // Handle both array response and object with data property
        let barbersList = Array.isArray(data)
          ? data
          : data.data || data.barbers || [];
        
        barbersList = barbersList.map((barber) => {
          // Get profile image from backend only
          let profileImage = null;
          if (barber.profile_image) {
            // If profile_image is a full URL, use it as is
            if (barber.profile_image.startsWith('http://') || barber.profile_image.startsWith('https://')) {
              profileImage = barber.profile_image;
            } else {
              // If it's a relative path, construct full URL
              // Remove leading slash if present to avoid double slashes
              const imagePath = barber.profile_image.startsWith('/') 
                ? barber.profile_image.substring(1) 
                : barber.profile_image;
              profileImage = `${BARBERS_BASE_URL}/${imagePath}`;
            }
          }
          
          return {
            ...barber,
            // Only use profile_image from backend, no fallbacks
            image: profileImage || null,
          };
        });
        
        setBarbers(barbersList);
      } catch (err) {
        console.error("Error fetching barbers:", err);
        setError(err.message);
        // Don't fallback to static data with images
        setBarbers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBarbers();
  }, []);

  // Use API barbers only, no static fallback
  const displayBarbers = barbers;
  const [registerModalOpen, setRegisterModalOpen] = useState(false);

  const handleRegisterModal = () => setRegisterModalOpen((cur) => !cur);

  return (
    <div className="pt-16 sm:pt-20 md:pt-[92px]">
      {/* About Us Section */}
      <section
        className="w-full bg-white dark:bg-gray-900 py-8 sm:py-10 md:py-12 lg:py-16"
        data-aos="fade-up">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-[127px] grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 md:gap-12 items-center">
          <div className="order-2 lg:order-1" data-aos="fade-up">
            <div className="text-xs sm:text-sm font-semibold text-barber-gold mb-3 sm:mb-4 tracking-wider">
              {getTranslation(language, "team.aboutUs")}
            </div>
            <h1 className="text-3xl xs:text-4xl sm:text-5xl md:text-5xl lg:text-6xl font-bold text-black dark:text-white mb-4 sm:mb-6 md:mb-8 leading-tight">
              {getTranslation(language, "team.title")}
            </h1>
            <p className="text-black dark:text-white text-base sm:text-lg mb-4 sm:mb-6 opacity-80">
              {getTranslation(language, "team.description")}
            </p>
            <Button
              size="lg"
              onClick={() => navigate("/booking")}
              className="w-full sm:w-auto px-5 sm:px-6 md:px-8 py-2.5 sm:py-3 md:py-4 bg-black dark:bg-white text-white dark:text-black rounded-xl sm:rounded-2xl font-semibold text-sm sm:text-base hover:bg-gray-800 dark:hover:bg-gray-200"
              aria-label="Book an appointment">
              {getTranslation(language, "team.bookAppointment")}
            </Button>
          </div>
          <div
            className="w-full h-[400px] xs:h-[450px] sm:h-[500px] md:h-[600px] lg:h-[700px] rounded-2xl sm:rounded-3xl overflow-hidden order-1 lg:order-2"
            data-aos="fade-up">
            <img
              src={imagePool[0]}
              alt="Professional barbers at 001 Barbershop"
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        </div>
      </section>

      {/* Our Barbers Section */}
      <section
        className="w-full bg-barber-olive py-8 sm:py-10 md:py-12 lg:py-16"
        data-aos="fade-up">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-[127px]">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white text-center mb-6 sm:mb-8 md:mb-12">
            {getTranslation(language, "team.ourBarbers")}
          </h2>

          {loading && (
            <div className="text-center py-12">
              <p className="text-white text-lg">{getTranslation(language, "team.loadingBarbers")}</p>
            </div>
          )}

          {error && !loading && (
            <div className="text-center py-4 mb-6">
              <p className="text-yellow-300 text-sm">
                {getTranslation(language, "team.errorMessage").replace("{error}", error)}
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
            {displayBarbers.map((barber, i) => {
              // Handle both API response format and static data format
              const barberId = barber.id || barber._id || i + 1;
              const barberName = barber.name || barber.fullName || "Barber";
              const barberRole =
                barber.role || barber.position || barber.specialty || "Barber";
              const barberDescription =
                barber.description ||
                barber.bio ||
                barber.about ||
                "Professional barber with years of experience.";
              // Get profile image from backend only, no fallbacks
              let barberImage = barber.image || null;

              return (
                <motion.div
                  key={barberId}
                  className="bg-barber-dark rounded-2xl sm:rounded-3xl p-4 sm:p-5 md:p-6 overflow-hidden"
                  data-aos="zoom-in"
                  data-aos-delay={i * 100}
                  whileHover={{ y: -10 }}>
                  {barberImage && (
                    <div className="w-full h-[200px] xs:h-[220px] sm:h-[250px] md:h-[280px] lg:h-[300px] rounded-xl sm:rounded-2xl mb-3 sm:mb-4 overflow-hidden">
                      <img
                        src={barberImage}
                        alt={barberName}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  )}
                  <h3 className="text-base sm:text-lg md:text-xl font-bold text-white mb-1 uppercase">
                    {barberName}
                  </h3>
                  <p className="text-barber-gold mb-2 sm:mb-3 md:mb-4 text-sm sm:text-base">
                    {barberRole}
                  </p>
                  <p className="text-white text-xs sm:text-sm mb-3 sm:mb-4 md:mb-6 opacity-80">
                    {barberDescription}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Full Service Section */}
      <section
        className="w-full bg-barber-dark py-8 sm:py-10 md:py-12 lg:py-16"
        data-aos="fade-up">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-[127px]">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-3 sm:mb-4 md:mb-6 text-left">
            {getTranslation(language, "team.fullService")}
          </h2>
          <p className="text-white text-sm sm:text-base md:text-lg mb-4 sm:mb-6 md:mb-8 text-left opacity-90 max-w-3xl">
            {getTranslation(language, "team.fullServiceDesc").replace("{tagline}", contactInfo.tagline)}
          </p>
          <div className="flex flex-col xs:flex-row gap-3 sm:gap-4 justify-start">
            <Button
              size="lg"
              variant="filled"
              onClick={() => navigate("/#narxlar")}
              className="w-full xs:w-auto px-5 sm:px-6 md:px-8 py-2.5 sm:py-3 md:py-4 bg-white dark:bg-gray-800 text-black dark:text-white rounded-xl sm:rounded-2xl font-semibold text-sm sm:text-base hover:bg-gray-100 dark:hover:bg-gray-700"
              aria-label="View pricing">
              {getTranslation(language, "team.viewPricing")}
            </Button>
            <Button
              size="lg"
              variant="outlined"
              onClick={() => navigate("/booking")}
              className="w-full xs:w-auto px-5 sm:px-6 md:px-8 py-2.5 sm:py-3 md:py-4 bg-transparent border-2 border-white dark:border-gray-300 text-white dark:text-gray-300 rounded-xl sm:rounded-2xl font-semibold text-sm sm:text-base hover:bg-white dark:hover:bg-gray-700 hover:text-black dark:hover:text-white"
              aria-label="Book an appointment online">
              {getTranslation(language, "team.bookOnline")}
            </Button>
          </div>
        </div>
      </section>

      <Footer />
      <RegisterModal
        open={registerModalOpen}
        handleOpen={handleRegisterModal}
      />
      <Analytics />
    </div>
  );
}

export default Team;
