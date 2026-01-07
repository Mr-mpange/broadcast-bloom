import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Edit2, Trash2, FileText, Eye, EyeOff } from "lucide-react";
import ImageUpload from "./ImageUpload";

interface Blog {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  featured_image_url: string | null;
  category: string | null;
  tags: string[] | null;
  is_published: boolean;
  is_featured: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string;
}

interface BlogManagementProps {
  profileId: string;
  canManageAll?: boolean; // true for admins
}

const BlogManagement = ({ profileId, canManageAll = false }: BlogManagementProps) => {
  const { toast } = useToast();
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingBlog, setEditingBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState("");
  const [featuredImage, setFeaturedImage] = useState("");
  const [isPublished, setIsPublished] = useState(false);
  const [isFeatured, setIsFeatured] = useState(false);

  useEffect(() => {
    fetchBlogs();
    fetchCategories();
  }, []);

  const fetchBlogs = async () => {
    setLoading(true);
    let query = supabase
      .from("blogs")
      .select("*")
      .order("created_at", { ascending: false });

    if (!canManageAll) {
      query = query.eq("author_id", profileId);
    }

    const { data, error } = await query;

    if (!error && data) {
      setBlogs(data);
    }
    setLoading(false);
  };

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from("blog_categories")
      .select("*")
      .order("name");

    if (!error && data) {
      setCategories(data);
    }
  };

  const resetForm = () => {
    setTitle("");
    setContent("");
    setExcerpt("");
    setCategory("");
    setTags("");
    setFeaturedImage("");
    setIsPublished(false);
    setIsFeatured(false);
  };

  const handleCreateBlog = async () => {
    if (!title.trim() || !content.trim()) {
      toast({ title: "Error", description: "Title and content are required", variant: "destructive" });
      return;
    }

    setLoading(true);
    const { error } = await supabase.from("blogs").insert({
      title: title.trim(),
      content: content.trim(),
      excerpt: excerpt.trim() || null,
      featured_image_url: featuredImage.trim() || null,
      author_id: profileId,
      category: category || null,
      tags: tags ? tags.split(",").map(t => t.trim()).filter(Boolean) : null,
      is_published: isPublished,
      is_featured: isFeatured,
    });

    setLoading(false);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Blog post created successfully!" });
      resetForm();
      setIsCreateOpen(false);
      fetchBlogs();
    }
  };

  const handleUpdateBlog = async () => {
    if (!editingBlog || !title.trim() || !content.trim()) {
      toast({ title: "Error", description: "Title and content are required", variant: "destructive" });
      return;
    }

    setLoading(true);
    const { error } = await supabase
      .from("blogs")
      .update({
        title: title.trim(),
        content: content.trim(),
        excerpt: excerpt.trim() || null,
        featured_image_url: featuredImage.trim() || null,
        category: category || null,
        tags: tags ? tags.split(",").map(t => t.trim()).filter(Boolean) : null,
        is_published: isPublished,
        is_featured: isFeatured,
      })
      .eq("id", editingBlog.id);

    setLoading(false);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Blog post updated successfully!" });
      resetForm();
      setEditingBlog(null);
      fetchBlogs();
    }
  };

  const handleDeleteBlog = async (blogId: string) => {
    if (!confirm("Are you sure you want to delete this blog post?")) return;

    const { error } = await supabase.from("blogs").delete().eq("id", blogId);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Blog post deleted successfully!" });
      fetchBlogs();
    }
  };

  const openEditDialog = (blog: Blog) => {
    setEditingBlog(blog);
    setTitle(blog.title);
    setContent(blog.content);
    setExcerpt(blog.excerpt || "");
    setCategory(blog.category || "");
    setTags(blog.tags ? blog.tags.join(", ") : "");
    setFeaturedImage(blog.featured_image_url || "");
    setIsPublished(blog.is_published);
    setIsFeatured(blog.is_featured);
  };

  const togglePublished = async (blog: Blog) => {
    const { error } = await supabase
      .from("blogs")
      .update({ is_published: !blog.is_published })
      .eq("id", blog.id);

    if (!error) {
      fetchBlogs();
      toast({ 
        title: "Success", 
        description: `Blog post ${!blog.is_published ? 'published' : 'unpublished'}!` 
      });
    }
  };

  return (
    <Card className="glass-panel border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-foreground">
            <FileText className="h-5 w-5 text-primary" />
            Blog Management
          </CardTitle>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus size={16} />
                New Post
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Blog Post</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Title *</Label>
                    <Input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Enter blog title..."
                    />
                  </div>
                  <div>
                    <Label>Category</Label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <Label>Excerpt</Label>
                  <Textarea
                    value={excerpt}
                    onChange={(e) => setExcerpt(e.target.value)}
                    placeholder="Brief description of the post..."
                    rows={2}
                  />
                </div>

                <div>
                  <Label>Content *</Label>
                  <Textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Write your blog content here..."
                    rows={8}
                  />
                </div>

                <div>
                  <Label>Tags (comma-separated)</Label>
                  <Input
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="music, events, news"
                  />
                </div>

                <ImageUpload
                  currentImageUrl={featuredImage}
                  onImageUploaded={setFeaturedImage}
                  onImageRemoved={() => setFeaturedImage("")}
                  userId={profileId}
                />

                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={isPublished}
                      onChange={(e) => setIsPublished(e.target.checked)}
                    />
                    <span className="text-sm">Publish immediately</span>
                  </label>
                  {canManageAll && (
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isFeatured}
                        onChange={(e) => setIsFeatured(e.target.checked)}
                      />
                      <span className="text-sm">Featured post</span>
                    </label>
                  )}
                </div>

                <Button onClick={handleCreateBlog} disabled={loading} className="w-full">
                  {loading ? "Creating..." : "Create Blog Post"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {blogs.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No blog posts yet. Create your first post to get started!
          </p>
        ) : (
          <div className="space-y-4">
            {blogs.map((blog) => (
              <div
                key={blog.id}
                className="p-4 rounded-lg bg-muted/30 border border-border/50"
              >
                <div className="flex items-start gap-4">
                  {blog.featured_image_url && (
                    <img
                      src={blog.featured_image_url}
                      alt={blog.title}
                      className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-foreground">{blog.title}</h3>
                      {blog.category && (
                        <Badge variant="outline" className="text-xs">
                          {blog.category}
                        </Badge>
                      )}
                      {blog.is_featured && (
                        <Badge className="text-xs bg-yellow-500/10 text-yellow-600">
                          Featured
                        </Badge>
                      )}
                      <Badge 
                        variant={blog.is_published ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {blog.is_published ? "Published" : "Draft"}
                      </Badge>
                    </div>
                    {blog.excerpt && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                        {blog.excerpt}
                      </p>
                    )}
                    <div className="text-xs text-muted-foreground">
                      Created: {new Date(blog.created_at).toLocaleDateString()}
                      {blog.published_at && (
                        <span> • Published: {new Date(blog.published_at).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => togglePublished(blog)}
                      title={blog.is_published ? "Unpublish" : "Publish"}
                    >
                      {blog.is_published ? <EyeOff size={16} /> : <Eye size={16} />}
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => openEditDialog(blog)}
                      title="Edit Post"
                    >
                      <Edit2 size={16} />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleDeleteBlog(blog.id)}
                      title="Delete Post"
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Edit Dialog - Similar structure to create dialog */}
        <Dialog open={!!editingBlog} onOpenChange={(open) => !open && setEditingBlog(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Blog Post</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Title *</Label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter blog title..."
                  />
                </div>
                <div>
                  <Label>Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label>Excerpt</Label>
                <Textarea
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  placeholder="Brief description of the post..."
                  rows={2}
                />
              </div>

              <div>
                <Label>Content *</Label>
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write your blog content here..."
                  rows={8}
                />
              </div>

              <div>
                <Label>Tags (comma-separated)</Label>
                <Input
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="music, events, news"
                />
              </div>

              <ImageUpload
                currentImageUrl={featuredImage}
                onImageUploaded={setFeaturedImage}
                onImageRemoved={() => setFeaturedImage("")}
                userId={profileId}
              />

              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={isPublished}
                    onChange={(e) => setIsPublished(e.target.checked)}
                  />
                  <span className="text-sm">Published</span>
                </label>
                {canManageAll && (
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={isFeatured}
                      onChange={(e) => setIsFeatured(e.target.checked)}
                    />
                    <span className="text-sm">Featured post</span>
                  </label>
                )}
              </div>

              <Button onClick={handleUpdateBlog} disabled={loading} className="w-full">
                {loading ? "Updating..." : "Update Blog Post"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default BlogManagement;