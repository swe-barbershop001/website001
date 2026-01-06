import { Button } from "@material-tailwind/react";
import { motion } from "framer-motion";
import { Analytics } from "@vercel/analytics/react";
import { contactInfo } from "../data/contact";
import Footer from "../components/Footer";
import { useLanguage } from "../context/LanguageContext";
import { getTranslation } from "../data/translations";

function Delivery() {
  const { language } = useLanguage();
  return (
    <div className=" h-[100%] pt-16 sm:pt-20 md:pt-[92px]  bg-gradient-to-b dark:from-gray-900 dark:to-barber-olive from-white to-barber-olive">
      <section className=" h-screen  w-full py-8 sm:py-10 md:py-12 lg:py-16 pb-0" >
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-[127px]">
          <div className="max-w-2xl mx-auto">
            {/* Header */}
            <div className="text-center mb-8 sm:mb-12" data-aos="fade-up">
              <h1 className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl font-bold  dark:text-white text-black mb-2">
                {contactInfo.tagline}
              </h1>
              <p className="dark:text-white text-black opacity-90 text-base sm:text-lg mb-2">
                {getTranslation(language, "contact.description")}
              </p>
              <p className="dark:text-white text-black opacity-80 text-sm sm:text-base">
                {getTranslation(language, "contact.subtitle")}
              </p>
            </div>

            {/* Instagram Link Card */}
            <motion.div
              className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-10 shadow-2xl mb-6"
              data-aos="zoom-in"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <a
                href={contactInfo.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 group"
              >
                {/* Instagram Icon */}
                <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  <svg
                    className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-white"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                </div>

                {/* Content */}
                <div className="flex-1 text-center sm:text-left">
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-black mb-2">
                    Instagram
                  </h2>
                  <p className="text-gray-600 text-sm sm:text-base mb-3">
                    {getTranslation(language, "delivery.followInstagram")}
                  </p>
                  <div className="flex items-center justify-center sm:justify-start gap-2 text-barber-olive font-semibold text-sm sm:text-base">
                    <span>@001_barbershop_</span>
                    <svg
                      className="w-4 h-4 group-hover:translate-x-1 transition-transform"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </div>
              </a>
            </motion.div>

            {/* Contact Information */}
            <div
              className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-10 shadow-2xl"
              data-aos="fade-up"
            >
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-black mb-6 text-center">
                {getTranslation(language, "delivery.contactInfo")}
              </h2>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-barber-olive rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg
                      className="w-5 h-5 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-black mb-1">
                      {getTranslation(language, "delivery.address")}
                    </h3>
                    <p className="text-gray-600 text-sm sm:text-base">
                      {getTranslation(language, "contact.address")}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-barber-olive rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg
                      className="w-5 h-5 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-black mb-1">
                      {getTranslation(language, "delivery.phone")}
                    </h3>
                    <a
                      href={`tel:${contactInfo.phone}`}
                      className="text-gray-600 hover:text-barber-olive transition-colors text-sm sm:text-base"
                    >
                      {contactInfo.phone}
                    </a>
                  </div>
                </div>

                
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

export default Delivery;
