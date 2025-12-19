import { contactInfo } from '../data/contact'
import { useLanguage } from '../context/LanguageContext'
import { getTranslation } from '../data/translations'
import Logo from './Logo'

function Footer() {
  const { language } = useLanguage();
  
  return (
    <footer className="w-full bg-barber-dark py-6 sm:py-8 md:py-12">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-[127px]">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 mb-6 sm:mb-8">
          <div>
            <div className="mb-3 sm:mb-4">
              <Logo linkTo="/" variant="dark" />
            </div>
            <p className="text-white opacity-80 text-sm sm:text-base">
              {getTranslation(language, "contact.tagline")}
            </p>
            <p className="text-white opacity-70 text-xs sm:text-sm mt-2">
              {getTranslation(language, "contact.description")}
            </p>
            <p className="text-white opacity-70 text-xs sm:text-sm mt-1">
              {getTranslation(language, "contact.subtitle")}
            </p>
          </div>
          <div>
            <h3 className="text-white text-lg sm:text-xl font-bold mb-3 sm:mb-4">{getTranslation(language, "footer.contacts")}</h3>
            <p className="text-white opacity-80 mb-2 text-sm sm:text-base break-words">{getTranslation(language, "contact.address")}</p>
            <a href={`tel:${contactInfo.phone}`} className="text-white opacity-80 hover:text-barber-gold transition-colors text-sm sm:text-base break-all">
              {contactInfo.phone}
            </a>
          </div>
          <div>
            <h3 className="text-white text-lg sm:text-xl font-bold mb-3 sm:mb-4">{getTranslation(language, "footer.followUs")}</h3>
            <a
              href={contactInfo.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white opacity-80 hover:text-barber-gold transition-colors text-sm sm:text-base"
            >
              Instagram
            </a>
          </div>
        </div>
        <div className="border-t border-white border-opacity-20 pt-6 sm:pt-8 text-center">
          <p className="text-white opacity-60 text-xs sm:text-sm">
            &copy; {new Date().getFullYear()} 001 Barbershop. {getTranslation(language, "footer.allRightsReserved")}.
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
