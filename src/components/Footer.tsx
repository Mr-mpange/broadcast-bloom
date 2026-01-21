import { Radio, Instagram, Twitter, Facebook, Youtube, Mail, Phone, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    station: [
      { label: "About Us", href: "#about" },
      { label: "Our DJs", href: "#djs" },
      { label: "Schedule", href: "#schedule" },
      { label: "Shows", href: "#shows" },
    ],
    listen: [
      { label: "Web Player", href: "#" },
      { label: "Mobile App", href: "#" },
      { label: "Smart Speakers", href: "#" },
      { label: "Podcasts", href: "#" },
    ],
    support: [
      { label: "Contact Us", href: "#contact" },
      { label: "Advertise", href: "#" },
      { label: "Careers", href: "#" },
      { label: "Press Kit", href: "#" },
    ],
    legal: [
      { label: "Privacy Policy", href: "#" },
      { label: "Terms of Service", href: "#" },
      { label: "Cookie Policy", href: "#" },
      { label: "Licensing", href: "#" },
    ],
  };

  const socialLinks = [
    { icon: Instagram, href: "#", label: "Instagram" },
    { icon: Twitter, href: "#", label: "Twitter" },
    { icon: Facebook, href: "#", label: "Facebook" },
    { icon: Youtube, href: "#", label: "YouTube" },
  ];

  return (
    <footer id="contact" className="bg-card border-t border-border">
      {/* Main Footer */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-6 gap-12">
          {/* Brand & Contact */}
          <div className="lg:col-span-2">
            <a href="/" className="flex items-center gap-2 mb-4">
              <div className="relative">
                <Radio className="w-8 h-8 text-primary" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full animate-pulse" />
              </div>
              <span className="font-display font-bold text-xl">
                <span className="text-foreground">PULSE</span>
                <span className="text-primary">FM</span>
              </span>
            </a>
            <p className="text-muted-foreground text-sm mb-6 max-w-xs">
              Africa's premier online radio station, broadcasting the best in African music 24/7 to listeners worldwide.
            </p>
            
            {/* Contact Info */}
            <div className="space-y-3 text-sm">
              <a href="mailto:hello@pulsefm.africa" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                <Mail size={16} />
                hello@pulsefm.africa
              </a>
              <a href="tel:+254700000000" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                <Phone size={16} />
                +254 700 000 000
              </a>
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin size={16} />
                Nairobi, Kenya
              </div>
            </div>

            {/* Social Links */}
            <div className="flex gap-2 mt-6">
              {socialLinks.map((social) => (
                <Button
                  key={social.label}
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 text-muted-foreground hover:text-primary hover:bg-primary/10"
                  asChild
                >
                  <a href={social.href} aria-label={social.label}>
                    <social.icon size={18} />
                  </a>
                </Button>
              ))}
            </div>

            {/* Download Links */}
            <div className="mt-6">
              <h5 className="font-semibold text-foreground mb-3 text-sm">Get the App</h5>
              <div className="flex flex-col gap-2">
                <Button variant="outline" size="sm" className="justify-start h-auto p-2">
                  <div className="text-left">
                    <div className="text-xs text-muted-foreground">Download on the</div>
                    <div className="font-semibold text-sm">App Store</div>
                  </div>
                </Button>
                <Button variant="outline" size="sm" className="justify-start h-auto p-2">
                  <div className="text-left">
                    <div className="text-xs text-muted-foreground">Get it on</div>
                    <div className="font-semibold text-sm">Google Play</div>
                  </div>
                </Button>
              </div>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-display font-semibold text-foreground mb-4">Station</h4>
            <ul className="space-y-3">
              {footerLinks.station.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="text-muted-foreground hover:text-primary transition-colors text-sm">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-display font-semibold text-foreground mb-4">Listen</h4>
            <ul className="space-y-3">
              {footerLinks.listen.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="text-muted-foreground hover:text-primary transition-colors text-sm">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-display font-semibold text-foreground mb-4">Support</h4>
            <ul className="space-y-3">
              {footerLinks.support.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="text-muted-foreground hover:text-primary transition-colors text-sm">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-display font-semibold text-foreground mb-4">Legal</h4>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="text-muted-foreground hover:text-primary transition-colors text-sm">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-border">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
            <p>© {currentYear} PulseFM. All rights reserved.</p>
            <p>Made with ❤️ for Africa</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
