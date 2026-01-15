import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Plus, Edit2, Trash2, Calendar, Clock } from "lucide-react";
import ImageUpload from "./ImageUpload";

interface Show {
  id: string;
  name: string;
  description: string | null;
  genre: string | null;
  image_url: string | null;
  is_active: boolean | null;
}

interface ScheduleSlot {
  id: string;
  show_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
}

interface ShowManagementProps {
  shows: Show[];
  profileId: string;
  onShowsChange: () => void;
}

const GENRES = ["Pop", "Rock", "Hip Hop", "Electronic", "Jazz", "R&B", "Country", "Reggae", "Classical", "Other"];
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const ShowManagement = ({ shows, profileId, onShowsChange }: ShowManagementProps) => {
  const { toast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingShow, setEditingShow] = useState<Show | null>(null);
  const [scheduleShow, setScheduleShow] = useState<Show | null>(null);
  const [scheduleSlots, setScheduleSlots] = useState<ScheduleSlot[]>([]);
  const [loading, setLoading] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [genre, setGenre] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  // Schedule form state
  const [scheduleDayOfWeek, setScheduleDayOfWeek] = useState("1");
  const [scheduleStartTime, setScheduleStartTime] = useState("09:00");
  const [scheduleEndTime, setScheduleEndTime] = useState("12:00");

  const resetForm = () => {
    setName("");
    setDescription("");
    setGenre("");
    setImageUrl("");
  };

  const handleCreateShow = async () => {
    if (!name.trim()) {
      toast({ title: "Error", description: "Show name is required", variant: "destructive" });
      return;
    }

    setLoading(true);
    const { error } = await supabase.from("shows").insert({
      name: name.trim(),
      description: description.trim() || null,
      genre: genre || null,
      image_url: imageUrl.trim() || null,
      host_id: profileId,
      is_active: true,
    });

    setLoading(false);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Show created successfully!" });
      resetForm();
      setIsCreateOpen(false);
      onShowsChange();
    }
  };

  const handleUpdateShow = async () => {
    if (!editingShow || !name.trim()) {
      toast({ title: "Error", description: "Show name is required", variant: "destructive" });
      return;
    }

    setLoading(true);
    const { error } = await supabase
      .from("shows")
      .update({
        name: name.trim(),
        description: description.trim() || null,
        genre: genre || null,
        image_url: imageUrl.trim() || null,
      })
      .eq("id", editingShow.id);

    setLoading(false);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Show updated successfully!" });
      resetForm();
      setEditingShow(null);
      onShowsChange();
    }
  };

  const handleDeleteShow = async (showId: string) => {
    if (!confirm("Are you sure you want to delete this show?")) return;

    const { error } = await supabase.from("shows").delete().eq("id", showId);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Show deleted successfully!" });
      onShowsChange();
    }
  };

  const openEditDialog = (show: Show) => {
    setEditingShow(show);
    setName(show.name);
    setDescription(show.description || "");
    setGenre(show.genre || "");
    setImageUrl(show.image_url || "");
  };

  const openScheduleDialog = async (show: Show) => {
    setScheduleShow(show);
    
    const { data } = await supabase
      .from("schedule")
      .select("*")
      .eq("show_id", show.id)
      .order("day_of_week", { ascending: true });
    
    setScheduleSlots(data || []);
  };

  const handleAddScheduleSlot = async () => {
    if (!scheduleShow) return;

    setLoading(true);
    const { error } = await supabase.from("schedule").insert({
      show_id: scheduleShow.id,
      day_of_week: parseInt(scheduleDayOfWeek),
      start_time: scheduleStartTime,
      end_time: scheduleEndTime,
      is_recurring: true,
    });

    setLoading(false);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Schedule slot added!" });
      openScheduleDialog(scheduleShow);
    }
  };

  const handleDeleteScheduleSlot = async (slotId: string) => {
    const { error } = await supabase.from("schedule").delete().eq("id", slotId);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Schedule slot removed!" });
      if (scheduleShow) openScheduleDialog(scheduleShow);
    }
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  return (
    <Card className="glass-panel border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Clock className="h-5 w-5 text-primary" />
            Manage Shows
          </CardTitle>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus size={16} />
                New Show
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Show</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4 pb-2">
                <div>
                  <Label>Show Name *</Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter show name..."
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe your show..."
                    rows={3}
                  />
                </div>
                <div>
                  <Label>Genre</Label>
                  <Select value={genre} onValueChange={setGenre}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select genre" />
                    </SelectTrigger>
                    <SelectContent>
                      {GENRES.map((g) => (
                        <SelectItem key={g} value={g}>{g}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <ImageUpload
                  currentImageUrl={imageUrl}
                  onImageUploaded={setImageUrl}
                  onImageRemoved={() => setImageUrl("")}
                  userId={profileId}
                />
                <Button onClick={handleCreateShow} disabled={loading} className="w-full">
                  {loading ? "Creating..." : "Create Show"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {shows.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No shows yet. Create your first show to get started!
          </p>
        ) : (
          <div className="space-y-3">
            {shows.map((show) => (
              <div
                key={show.id}
                className="p-4 rounded-lg bg-muted/30 border border-border/50"
              >
                <div className="flex items-start gap-4">
                  {show.image_url && (
                    <img
                      src={show.image_url}
                      alt={show.name}
                      className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-foreground">{show.name}</h3>
                      {show.genre && (
                        <span className="text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                          {show.genre}
                        </span>
                      )}
                      <div
                        className={`w-2 h-2 rounded-full ${
                          show.is_active ? "bg-green-500" : "bg-muted"
                        }`}
                        title={show.is_active ? "Active" : "Inactive"}
                      />
                    </div>
                    {show.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {show.description}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => openScheduleDialog(show)}
                      title="Manage Schedule"
                    >
                      <Calendar size={16} />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => openEditDialog(show)}
                      title="Edit Show"
                    >
                      <Edit2 size={16} />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleDeleteShow(show.id)}
                      title="Delete Show"
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

        {/* Edit Dialog */}
        <Dialog open={!!editingShow} onOpenChange={(open) => !open && setEditingShow(null)}>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Show</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4 pb-2">
              <div>
                <Label>Show Name *</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter show name..."
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your show..."
                  rows={3}
                />
              </div>
              <div>
                <Label>Genre</Label>
                <Select value={genre} onValueChange={setGenre}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select genre" />
                  </SelectTrigger>
                  <SelectContent>
                    {GENRES.map((g) => (
                      <SelectItem key={g} value={g}>{g}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <ImageUpload
                currentImageUrl={imageUrl}
                onImageUploaded={setImageUrl}
                onImageRemoved={() => setImageUrl("")}
                userId={profileId}
              />
              <Button onClick={handleUpdateShow} disabled={loading} className="w-full">
                {loading ? "Updating..." : "Update Show"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Schedule Dialog */}
        <Dialog open={!!scheduleShow} onOpenChange={(open) => !open && setScheduleShow(null)}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Schedule: {scheduleShow?.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4 pb-2">
              {/* Existing slots */}
              {scheduleSlots.length > 0 && (
                <div className="space-y-2">
                  <Label>Current Schedule</Label>
                  {scheduleSlots.map((slot) => (
                    <div
                      key={slot.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border/50"
                    >
                      <div>
                        <span className="font-medium">{DAYS[slot.day_of_week]}</span>
                        <span className="text-muted-foreground ml-2">
                          {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteScheduleSlot(slot.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add new slot */}
              <div className="border-t border-border pt-4">
                <Label className="mb-3 block">Add Time Slot</Label>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs">Day</Label>
                    <Select value={scheduleDayOfWeek} onValueChange={setScheduleDayOfWeek}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DAYS.map((day, i) => (
                          <SelectItem key={i} value={i.toString()}>{day}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Start</Label>
                    <Input
                      type="time"
                      value={scheduleStartTime}
                      onChange={(e) => setScheduleStartTime(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">End</Label>
                    <Input
                      type="time"
                      value={scheduleEndTime}
                      onChange={(e) => setScheduleEndTime(e.target.value)}
                    />
                  </div>
                </div>
                <Button onClick={handleAddScheduleSlot} disabled={loading} className="w-full mt-3">
                  {loading ? "Adding..." : "Add Time Slot"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default ShowManagement;
