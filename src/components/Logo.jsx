import { Link } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";

function Logo({ className = "", linkTo = "/", onClick, variant = "light" }) {
  const { theme } = useTheme();
  
  // Use footer logo for dark theme, regular logo for light theme
  const logoSrc = theme === "dark" ? "/logo_for_footer.png" : "/logo.png";
  
  const logoContent = (
    <img
      src={logoSrc}
      alt="001 Barbershop Logo"
      className={`h-8 sm:h-10 md:h-12 lg:h-14 xl:h-16 w-auto object-contain ${className}`}
    />
  );

  if (linkTo) {
    return (
      <Link
        to={linkTo}
        className="hover:opacity-80 transition-opacity inline-block"
        onClick={onClick}
        aria-label="001 Barbershop Home"
      >
        {logoContent}
      </Link>
    );
  }

  return logoContent;
}

export default Logo;
