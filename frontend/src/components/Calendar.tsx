// © 2025 Jeff. All rights reserved.
// Unauthorized copying, distribution, or modification of this file is strictly prohibited.

import { useState } from "react";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useCalendarEvents } from "@/hooks/useCalendarEvents";
import { useToast } from "@/hooks/use-toast";
import { Plus, CalendarDays, Clock, MapPin, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { TimePicker } from "./ui/timepicker";
const Calendar = () => {
  const { events, createEvent, deleteEvent, loading } = useCalendarEvents();
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    new Date()
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    event_time: "",
  });
  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate) return;
    try {
      await createEvent({
        title: formData.title,
        description: formData.description,
        event_date: format(selectedDate, "yyyy-MM-dd"),
        event_time: formData.event_time || undefined,
      });
      toast({
        title: "Success",
        description: "Event created successfully",
      });
      setFormData({ title: "", description: "", event_time: "" });
      setIsDialogOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create event",
        variant: "destructive",
      });
    }
  };
  const handleDeleteEvent = async (eventId: string) => {
    try {
      await deleteEvent(eventId);
      toast({
        title: "Success",
        description: "Event deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete event",
        variant: "destructive",
      });
    }
  };
  const upcomingEvents = events
    .filter((event) => new Date(event.event_date) >= new Date())
    .sort(
      (a, b) =>
        new Date(a.event_date).getTime() - new Date(b.event_date).getTime()
    )
    .slice(0, 5);
  const eventsForSelectedDate = selectedDate
    ? events.filter(
        (event) =>
          format(new Date(event.event_date), "yyyy-MM-dd") ===
          format(selectedDate, "yyyy-MM-dd")
      )
    : [];
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h2 className="sm:text-2xl text-lg font-bold">Calendar</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="text-white hover:bg-blue-500">
              <Plus className="w-4 h-4 mr-2 text-white" />
              Add Event
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Event</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div>
                <Label className="text-white" htmlFor="title">
                  Event Title
                </Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <Label className="text-white" htmlFor="description">
                  Description
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label className="text-white" htmlFor="time">
                  Time (optional)
                </Label>
                <TimePicker
                  value={formData.event_time}
                  onChange={(val) =>
                    setFormData({ ...formData, event_time: val })
                  }
                />
              </div>

              <div>
                <Label className="text-white">Date</Label>
                <p className="text-sm dark:text-muted-foreground text-gray-400">
                  {selectedDate
                    ? format(selectedDate, "PPP")
                    : "No date selected"}
                </p>
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" className="text-white" disabled={loading}>
                  Create Event
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="">
            <CardHeader>
              <CardTitle>Calendar View</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              <CalendarComponent
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-md border"
                modifiers={{
                  hasEvent: events.map((event) => new Date(event.event_date)),
                }}
                modifiersStyles={{
                  hasEvent: {
                    backgroundColor: "hsl(var(--primary))",
                    color: "white",
                    fontWeight: "bold",
                  },
                }}
              />
            </CardContent>
          </Card>

          {selectedDate && eventsForSelectedDate.length > 0 && (
            <Card className=" mt-6">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CalendarDays className="w-5 h-5 mr-2" />
                  Events for {format(selectedDate, "PPP")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {eventsForSelectedDate.map((event) => (
                    <div
                      key={event.id}
                      className="flex items-center justify-between p-3 border rounded"
                    >
                      <div>
                        <div className="font-medium">{event.title}</div>
                        {event.event_time && (
                          <div className="text-sm text-muted-foreground flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            {event.event_time}
                          </div>
                        )}
                        {event.description && (
                          <div className="text-sm text-muted-foreground mt-1">
                            {event.description}
                          </div>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="hover:bg-red-200 hover:text-red-700"
                        onClick={() => handleDeleteEvent(event.id)}
                      >
                        <Trash2 className=" w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div>
          <Card className="">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="w-5 h-5 mr-2" />
                Upcoming Events
              </CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingEvents.length > 0 ? (
                <div className="space-y-3">
                  {upcomingEvents.map((event) => (
                    <div className="flex border rounded-lg">
                      <div key={event.id} className="p-3 w-full">
                        <div className="font-medium">{event.title}</div>
                        <div className="text-sm text-muted-foreground flex items-center mt-1">
                          <CalendarDays className="w-3 h-3 mr-1" />
                          {format(new Date(event.event_date), "MMM d, yyyy")}
                        </div>
                        {event.event_time && (
                          <div className="text-sm text-muted-foreground flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            {event.event_time}
                          </div>
                        )}
                        {event.description && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {event.description}
                          </div>
                        )}
                      </div>
                      <div className="items-center flex">
                        <Button
                          variant="ghost"
                          onClick={() => handleDeleteEvent(event.id)}
                          className="mr-3 dark:bg-white/10 bg-blue-50 hover:bg-red-100 dark:hover:bg-red-100 hover:text-red-800"
                        >
                          <Trash2 className="hover:text-red-800">Delete</Trash2>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No upcoming events
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
export default Calendar;
