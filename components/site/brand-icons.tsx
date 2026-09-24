import { siFacebook, siInstagram, siWhatsapp } from "simple-icons";

/** Brand glyphs from Simple Icons (Lucide has deprecated brand logos). */
function BrandIcon({ path, className }: { path: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true" focusable="false">
      <path d={path} />
    </svg>
  );
}

export const InstagramIcon = ({ className }: { className?: string }) => <BrandIcon path={siInstagram.path} className={className} />;
export const FacebookIcon = ({ className }: { className?: string }) => <BrandIcon path={siFacebook.path} className={className} />;
export const WhatsAppIcon = ({ className }: { className?: string }) => <BrandIcon path={siWhatsapp.path} className={className} />;
