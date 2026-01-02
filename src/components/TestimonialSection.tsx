import { Quote } from "lucide-react";

interface Testimonial {
  id: number;
  quote: string;
  name: string;
  role: string;
  image: string;
}

const TestimonialSection = () => {
  const testimonials: Testimonial[] = [
    {
      id: 1,
      quote: "This platform completely transformed how I run my radio station. The analytics alone are worth it!",
      name: "John",
      role: "Station Manager",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
    },
    {
      id: 2,
      quote: "Easy to use, professional quality streaming. My listeners love the crystal clear audio.",
      name: "Sarah",
      role: "Independent DJ",
      image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
    },
    {
      id: 3,
      quote: "The community features helped me grow from 100 to 10,000 listeners in just 6 months.",
      name: "Mike",
      role: "Podcast Host",
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop",
    },
  ];

  return (
    <section className="py-16 bg-background relative overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Featured Testimonial */}
          <div className="relative">
            <div className="absolute -top-6 -left-6 text-primary/20">
              <Quote size={80} />
            </div>
            <div className="glass-panel rounded-2xl p-8 relative">
              <p className="text-xl text-foreground mb-6 leading-relaxed">
                "{testimonials[0].quote}"
              </p>
              <div className="flex items-center gap-4">
                <img
                  src={testimonials[0].image}
                  alt={testimonials[0].name}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <p className="font-semibold text-foreground">*{testimonials[0].name}.</p>
                  <p className="text-sm text-primary">{testimonials[0].role}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Other Testimonials */}
          <div className="space-y-4">
            {testimonials.slice(1).map((testimonial) => (
              <div
                key={testimonial.id}
                className="glass-panel rounded-xl p-6 transition-all duration-300 hover:border-primary/30"
              >
                <p className="text-muted-foreground mb-4 text-sm">
                  "{testimonial.quote}"
                </p>
                <div className="flex items-center gap-3">
                  <img
                    src={testimonial.image}
                    alt={testimonial.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div>
                    <p className="font-medium text-foreground text-sm">{testimonial.name}</p>
                    <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialSection;
