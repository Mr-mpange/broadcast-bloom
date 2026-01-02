import { ArrowRight } from "lucide-react";

interface BlogPost {
  id: number;
  title: string;
  excerpt: string;
  image: string;
  date: string;
  category: string;
}

const BlogSection = () => {
  const posts: BlogPost[] = [
    {
      id: 1,
      title: "How to Start Your Own Internet Radio Station",
      excerpt: "Learn the essentials of launching your online radio station from scratch.",
      image: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=400&h=300&fit=crop",
      date: "Dec 28, 2025",
      category: "Tutorial",
    },
    {
      id: 2,
      title: "Top 10 Mixing Tips for Live Radio",
      excerpt: "Professional DJs share their secrets for seamless live mixes.",
      image: "https://images.unsplash.com/photo-1571266028243-e4733b0f0bb0?w=400&h=300&fit=crop",
      date: "Dec 25, 2025",
      category: "Tips",
    },
    {
      id: 3,
      title: "Building Your Listener Community",
      excerpt: "Strategies to grow and engage your radio station audience.",
      image: "https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=400&h=300&fit=crop",
      date: "Dec 20, 2025",
      category: "Growth",
    },
  ];

  return (
    <section className="py-16 bg-card relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
      
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-10">
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
            Blog
          </h2>
          <a 
            href="#blog" 
            className="text-primary hover:text-primary/80 font-medium inline-flex items-center gap-2 transition-colors"
          >
            View All
            <ArrowRight size={16} />
          </a>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <article
              key={post.id}
              className="group glass-panel rounded-xl overflow-hidden transition-all duration-300 hover:border-primary/50"
            >
              <div className="aspect-video overflow-hidden">
                <img
                  src={post.image}
                  alt={post.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-medium">
                    {post.category}
                  </span>
                  <span className="text-xs text-muted-foreground">{post.date}</span>
                </div>
                <h3 className="font-display font-semibold text-lg text-foreground mb-2 group-hover:text-primary transition-colors line-clamp-2">
                  {post.title}
                </h3>
                <p className="text-muted-foreground text-sm line-clamp-2">
                  {post.excerpt}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BlogSection;
