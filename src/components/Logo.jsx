import { Link } from "react-router-dom";

function Logo({ className = "", linkTo = "/", onClick, variant = "light" }) {
  const logoContent = (
    <img
      src="/logo.png"
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
