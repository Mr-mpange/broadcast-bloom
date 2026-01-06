import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Menu, X, Radio, Headphones, LogIn, LogOut, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import LiveBadge from "./LiveBadge";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDJOrAdmin, setIsDJOrAdmin] = useState(false);
  const { user, signOut } = useAuth();

  useEffect(() => {
    if (!user) {
      setIsDJOrAdmin(false);
      return;
    }

    const checkRole = async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .in("role", ["dj", "admin"]);
      
      setIsDJOrAdmin(data && data.length > 0);
    };

    checkRole();
  }, [user]);

  const navLinks = [
    { label: "Schedule", href: "/#schedule" },
    { label: "DJs", href: "/#djs" },
    { label: "Shows", href: "/shows" },
    { label: "Favorites", href: "/favorites" },
    { label: "Contact", href: "/#contact" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass-panel border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2 group">
            <div className="relative">
              <Radio className="w-8 h-8 text-primary transition-transform group-hover:scale-110" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full animate-pulse" />
            </div>
            <span className="font-display font-bold text-xl">
              <span className="text-foreground">PULSE</span>
              <span className="text-primary">FM</span>
            </span>
          </a>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => 
              link.href.startsWith("/") && !link.href.includes("#") ? (
                <Link
                  key={link.label}
                  to={link.href}
                  className="text-muted-foreground hover:text-foreground transition-colors font-medium"
                >
                  {link.label}
                </Link>
              ) : (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-muted-foreground hover:text-foreground transition-colors font-medium"
                >
                  {link.label}
                </a>
              )
            )}
          </nav>

          {/* CTA & Live Badge */}
          <div className="hidden md:flex items-center gap-4">
            <LiveBadge size="sm" />
            <Button variant="live" size="sm" className="gap-2">
              <Headphones size={16} />
              Listen Live
            </Button>
            {isDJOrAdmin && (
              <Link to="/dj">
                <Button variant="outline" size="sm" className="gap-2">
                  <LayoutDashboard size={16} />
                  Dashboard
                </Button>
              </Link>
            )}
            {user ? (
              <Button variant="ghost" size="sm" className="gap-2" onClick={signOut}>
                <LogOut size={16} />
                Sign Out
              </Button>
            ) : (
              <Link to="/auth">
                <Button variant="ghost" size="sm" className="gap-2">
                  <LogIn size={16} />
                  Sign In
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </Button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-border animate-fade-in-up">
            <nav className="flex flex-col gap-4">
              {navLinks.map((link) => 
                link.href.startsWith("/") && !link.href.includes("#") ? (
                  <Link
                    key={link.label}
                    to={link.href}
                    className="text-muted-foreground hover:text-foreground transition-colors font-medium py-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {link.label}
                  </Link>
                ) : (
                  <a
                    key={link.label}
                    href={link.href}
                    className="text-muted-foreground hover:text-foreground transition-colors font-medium py-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {link.label}
                  </a>
                )
              )}
              <Button variant="live" className="w-full mt-4 gap-2">
                <Headphones size={16} />
                Listen Live
              </Button>
              {isDJOrAdmin && (
                <Link to="/dj" onClick={() => setIsMenuOpen(false)}>
                  <Button variant="outline" className="w-full mt-2 gap-2">
                    <LayoutDashboard size={16} />
                    Dashboard
                  </Button>
                </Link>
              )}
              {user ? (
                <Button variant="ghost" className="w-full mt-2 gap-2" onClick={signOut}>
                  <LogOut size={16} />
                  Sign Out
                </Button>
              ) : (
                <Link to="/auth" onClick={() => setIsMenuOpen(false)}>
                  <Button variant="ghost" className="w-full mt-2 gap-2">
                    <LogIn size={16} />
                    Sign In
                  </Button>
                </Link>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
