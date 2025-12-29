import { useState } from "react";
import { motion } from "framer-motion";
import { Analytics } from "@vercel/analytics/react";
import { imagePool, getImagesInOrder } from "../data/images";
import ContactForm from "../components/ContactForm";
import RegisterModal from "../components/RegisterModal";
import Footer from "../components/Footer";
import ImageLightbox from "../components/ImageLightbox";
import { useLanguage } from "../context/LanguageContext";
import { getTranslation } from "../data/translations";

function Gallery() {
  const { language } = useLanguage();
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [lightboxImages, setLightboxImages] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const imagesPerPage = 8;

  const handleRegisterModal = () => setRegisterModalOpen((cur) => !cur);

  const handleImageClick = (index, images) => {
    setLightboxImages(images);
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const handleCloseLightbox = () => {
    setLightboxOpen(false);
  };

  // Get all images for pagination
  const allGalleryImages = getImagesInOrder(50);
  const totalPages = Math.ceil(allGalleryImages.length / imagesPerPage);
  const startIndex = (currentPage - 1) * imagesPerPage;
  const endIndex = startIndex + imagesPerPage;
  const currentImages = allGalleryImages.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="pt-16 sm:pt-20 md:pt-[92px]">
      {/* Experience Section */}
      <section
        className="w-full bg-barber-dark py-8 sm:py-10 md:py-12 lg:py-16"
        data-aos="fade-up">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-[127px]">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white text-center mb-6 sm:mb-8 md:mb-12">
            {getTranslation(language, "gallery.title")}
          </h2>
          <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-8">
            {currentImages.map((imgSrc, i) => {
              const globalIndex = startIndex + i;
              return (
                <motion.div
                  key={globalIndex}
                  className="w-full h-[200px] xs:h-[220px] sm:h-[250px] md:h-[280px] lg:h-[300px] rounded-2xl sm:rounded-3xl overflow-hidden cursor-pointer"
                  data-aos="zoom-in"
                  data-aos-delay={i * 50}
                  whileHover={{ scale: 1.05 }}
                  onClick={() => handleImageClick(globalIndex, allGalleryImages)}>
                  <img
                    src={imgSrc}
                    alt={`Gallery image ${globalIndex + 1}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </motion.div>
              );
            })}
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 sm:gap-3 mt-8">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-white bg-opacity-20 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-opacity-30 transition-colors">
                {getTranslation(language, "gallery.back")}
              </button>
              
              <div className="flex gap-1 sm:gap-2">
                {[...Array(totalPages)].map((_, index) => {
                  const page = index + 1;
                  // Show first page, last page, current page, and pages around current
                  if (
                    page === 1 ||
                    page === totalPages ||
                    (page >= currentPage - 1 && page <= currentPage + 1)
                  ) {
                    return (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`px-3 sm:px-4 py-2 rounded-lg transition-colors ${
                          currentPage === page
                            ? "bg-white text-barber-dark font-bold"
                            : "bg-white bg-opacity-20 text-white hover:bg-opacity-30"
                        }`}>
                        {page}
                      </button>
                    );
                  } else if (
                    page === currentPage - 2 ||
                    page === currentPage + 2
                  ) {
                    return (
                      <span key={page} className="px-2 text-white">
                        ...
                      </span>
                    );
                  }
                  return null;
                })}
              </div>
              
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-white bg-opacity-20 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-opacity-30 transition-colors">
                {getTranslation(language, "gallery.forward")}
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Contact Section */}


      <Footer />
      <RegisterModal
        open={registerModalOpen}
        handleOpen={handleRegisterModal}
      />
      <ImageLightbox
        images={lightboxImages}
        currentIndex={lightboxIndex}
        isOpen={lightboxOpen}
        onClose={handleCloseLightbox}
      />
      <Analytics />
    </div>
  );
}

export default Gallery;
