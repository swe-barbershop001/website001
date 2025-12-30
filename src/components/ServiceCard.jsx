import { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@material-tailwind/react'
import { useNavigate } from 'react-router-dom'

function ServiceCard({ service, index }) {
  const navigate = useNavigate()
  const [imageError, setImageError] = useState(false)

  const handleServiceClick = () => {
    navigate('/booking')
  }
  // Icon mapping based on service type
  const getIcon = () => {
    switch(service.icon) {
      case 'scissors':
        return (
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none" className="text-white w-8 h-8 md:w-10 md:h-10" aria-hidden="true">
            <path d="M12 8L8 12M28 8L32 12M20 4v32M8 20h24" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <circle cx="12" cy="12" r="2" fill="currentColor"/>
            <circle cx="28" cy="12" r="2" fill="currentColor"/>
          </svg>
        )
      case 'beard':
        return (
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none" className="text-white w-8 h-8 md:w-10 md:h-10" aria-hidden="true">
            <path d="M20 10c-2 0-4 1-5 3M20 10c2 0 4 1 5 3M15 18c-1 2-1 4 0 6M25 18c1 2 1 4 0 6M12 24c-1 2-1 4 0 6M28 24c1 2 1 4 0 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <circle cx="20" cy="30" r="3" fill="currentColor"/>
          </svg>
        )
      case 'razor':
        return (
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none" className="text-white w-8 h-8 md:w-10 md:h-10" aria-hidden="true">
            <rect x="8" y="18" width="24" height="4" rx="2" fill="currentColor"/>
            <path d="M8 20L4 16M32 20L36 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        )
      case 'kid':
        return (
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none" className="text-white w-8 h-8 md:w-10 md:h-10" aria-hidden="true">
            <circle cx="20" cy="12" r="6" fill="currentColor"/>
            <path d="M10 28c0-5 4-9 10-9s10 4 10 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        )
      default:
        return (
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none" className="text-white w-8 h-8 md:w-10 md:h-10" aria-hidden="true">
            <path d="M20 5L5 15v10l15 10 15-10V15L20 5z" stroke="currentColor" strokeWidth="2" fill="none"/>
          </svg>
        )
    }
  }

  // Get image URL from service
  const imageUrl = service.image_url || service.imageUrl || service.image;
  
  // Debug logging
  if (service.name && !imageUrl) {
    console.log(`Service "${service.name}" has no image URL. Available fields:`, Object.keys(service));
  }
  if (imageUrl) {
    console.log(`Service "${service.name}" image URL:`, imageUrl);
  }

  return (
    <motion.div
      className="flex flex-col items-center gap-4 sm:gap-6 md:gap-8"
      data-aos="fade-up"
      data-aos-delay={index * 100}
      whileHover={{ y: -10 }}
    >
      <div className="w-[80px] h-[80px] xs:w-[90px] xs:h-[90px] sm:w-[100px] sm:h-[100px] md:w-[121px] md:h-[119px] bg-black dark:bg-gray-800 rounded-lg flex items-center justify-center overflow-hidden">
        {imageUrl && !imageError ? (
          <img
            src={imageUrl}
            alt={service.name || "Service"}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            {getIcon()}
          </div>
        )}
      </div>
      <h3 className="text-base sm:text-lg md:text-xl font-semibold text-black dark:text-white text-center">{service.name}</h3>
      {service.price && (
        <p className="text-sm text-gray-600 dark:text-gray-400 text-center">{service.price}</p>
      )}
      {service.duration && !service.price && (
        <p className="text-sm text-gray-600 dark:text-gray-400 text-center">{service.duration} min</p>
      )}
      <Button
        size="lg"
        onClick={handleServiceClick}
        className="w-full max-w-[180px] sm:max-w-[200px] h-[50px] xs:h-[55px] sm:h-[60px] md:h-[77px] bg-black dark:bg-white text-white dark:text-black rounded-xl sm:rounded-2xl font-semibold text-sm sm:text-base hover:bg-gray-800 dark:hover:bg-gray-200"
        aria-label={`Learn more about ${service.name}`}
      >
        BATAFSIL
      </Button>
    </motion.div>
  )
}

export default ServiceCard
