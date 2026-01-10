import { useState, useEffect } from "react";
import { ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  featured_image_url?: string;
  published_at: string;
  category?: string;
  slug: string;
}

const BlogSection = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBlogPosts();
  }, []);

  const fetchBlogPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('blogs')
        .select(`
          id,
          title,
          excerpt,
          featured_image_url,
          published_at,
          slug,
          blog_categories (
            name
          )
        `)
        .eq('is_published', true)
        .order('published_at', { ascending: false })
        .limit(3);

      if (error) {
        console.error('Error fetching blog posts:', error);
        setLoading(false);
        return;
      }

      const formattedPosts: BlogPost[] = (data || []).map(post => ({
        id: post.id,
        title: post.title,
        excerpt: post.excerpt || '',
        featured_image_url: post.featured_image_url || undefined,
        published_at: post.published_at,
        category: post.blog_categories?.name || 'General',
        slug: post.slug
      }));

      setPosts(formattedPosts);
    } catch (error) {
      console.error('Error in fetchBlogPosts:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <section className="py-16 bg-card relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
        
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-10">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
              Blog
            </h2>
          </div>
          <div className="text-center py-8 text-muted-foreground">
            Loading latest articles...
          </div>
        </div>
      </section>
    );
  }

  if (posts.length === 0) {
    return (
      <section className="py-16 bg-card relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
        
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-10">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
              Blog
            </h2>
          </div>
          <div className="text-center py-8 text-muted-foreground">
            <p>No blog posts available yet.</p>
            <p className="text-sm mt-2">Check back soon for the latest articles and updates!</p>
          </div>
        </div>
      </section>
    );
  }

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
                  src={post.featured_image_url || "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=400&h=300&fit=crop"}
                  alt={post.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-medium">
                    {post.category}
                  </span>
                  <span className="text-xs text-muted-foreground">{formatDate(post.published_at)}</span>
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
