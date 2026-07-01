import LocalizedClientLink from "@/components/molecules/LocalizedLink/LocalizedLink"
import footerLinks from "@/data/footerLinks"

export function Footer() {
  return (
    <footer className="bg-primary container" data-testid="footer">
      <div className="grid grid-cols-1 lg:grid-cols-3">
        {/* Customer Services Column */}
        <div className="p-6 border rounded-sm" data-testid="footer-customer-services">
          <h2 className="heading-sm text-primary mb-3 uppercase">
            Customer services
          </h2>
          <nav className="space-y-3" aria-label="Customer services navigation">
            {footerLinks.customerServices.map(({ label, path }) => (
              <LocalizedClientLink
                key={label}
                href={path}
                className="block label-md"
                data-testid={`footer-link-${label.toLowerCase().replace(/\s+/g, '-')}`}
              >
                {label}
              </LocalizedClientLink>
            ))}
          </nav>
        </div>

        {/* About Column */}
        <div className="p-6 border rounded-sm" data-testid="footer-about">
          <h2 className="heading-sm text-primary mb-3 uppercase">About</h2>
          <nav className="space-y-3" aria-label="About navigation">
            {footerLinks.about.map(({ label, path }) => (
              <LocalizedClientLink
                key={label}
                href={path}
                className="block label-md"
                data-testid={`footer-link-${label.toLowerCase().replace(/\s+/g, '-')}`}
              >
                {label}
              </LocalizedClientLink>
            ))}
          </nav>
        </div>

        {/* Connect Column */}
        <div className="p-6 border rounded-sm" data-testid="footer-connect">
          <h2 className="heading-sm text-primary mb-3 uppercase">connect</h2>
          <nav className="space-y-3" aria-label="Social media navigation">
            {footerLinks.connect.map(({ label, path }) => (
              <a
                aria-label={`Go to ${label} page`}
                title={`Go to ${label} page`}
                key={label}
                href={path}
                className="block label-md"
                target="_blank"
                rel="noopener noreferrer"
                data-testid={`footer-link-${label.toLowerCase().replace(/\s+/g, '-')}`}
              >
                {label}
              </a>
            ))}
          </nav>
        </div>
      </div>

      <div className="py-6 border rounded-sm " data-testid="footer-copyright">
        <p className="text-md text-secondary text-center ">© 2024 Fleek</p>
      </div>
    </footer>
  )
}
