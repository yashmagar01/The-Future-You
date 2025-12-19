import { Link } from "react-router-dom";
import { Video, Github, Twitter, Linkedin, Mail } from "lucide-react";

const Footer = () => {
  const footerLinks = {
    product: [
      { label: "Features", href: "#features" },
      { label: "How it Works", href: "#how-it-works" },
      { label: "Roadmap", href: "#roadmap" },
      { label: "Join Beta", href: "/record" }
    ],
    company: [
      { label: "About", href: "/about" },
      { label: "Contact", href: "/contact" }
    ],
    legal: [
      { label: "Privacy Policy", href: "/privacy-policy" },
      { label: "Terms of Service", href: "/terms" }
    ]
  };

  const socialLinks = [
    { icon: Github, href: "https://github.com/yashmagar01", label: "GitHub" },
    { icon: Twitter, href: "https://x.com/yashmag50534849", label: "X (Twitter)" },
    { icon: Linkedin, href: "https://www.linkedin.com/in/yash-magar/", label: "LinkedIn" },
    { icon: Mail, href: "mailto:yashajaymagar10@gmail.com", label: "Email" }
  ];

  return (
    <footer className="border-t border-border bg-muted/30" role="contentinfo" aria-label="Site footer">
      <div className="container mx-auto max-w-7xl px-4 py-12">
        {/* Top Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {/* Brand Column */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-brand-green to-accent flex items-center justify-center">
                <Video className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-lg">The Future You</span>
            </Link>
            <p className="text-sm text-muted-foreground mb-4">
              Build confidence through daily reflections and AI-powered feedback.
            </p>
            {/* Social Links */}
            <div className="flex gap-3">
              {socialLinks.map((social, index) => {
                const Icon = social.icon;
                return (
                  <a
                    key={index}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    className="h-9 w-9 rounded-lg bg-muted hover:bg-brand-green/10 flex items-center justify-center text-muted-foreground hover:text-brand-green transition-colors"
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h3 className="font-semibold mb-4">Product</h3>
            <ul className="space-y-3">
              {footerLinks.product.map((link, index) => (
                <li key={index}>
                  <Link
                    to={link.href}
                    className="text-sm text-muted-foreground hover:text-brand-green transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="font-semibold mb-4">Company</h3>
            <ul className="space-y-3">
              {footerLinks.company.map((link, index) => (
                <li key={index}>
                  <Link
                    to={link.href}
                    className="text-sm text-muted-foreground hover:text-brand-green transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className="font-semibold mb-4">Legal</h3>
            <ul className="space-y-3">
              {footerLinks.legal.map((link, index) => (
                <li key={index}>
                  <Link
                    to={link.href}
                    className="text-sm text-muted-foreground hover:text-brand-green transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} The Future You. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <Link to="/privacy" className="hover:text-brand-green transition-colors">
              Privacy
            </Link>
            <Link to="/terms" className="hover:text-brand-green transition-colors">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
