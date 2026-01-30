import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Calendar as CalendarIcon, Clock, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  type: "deadline" | "reminder" | "event";
  description: string;
}

const CalendarPage: React.FC = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([
    {
      id: "1",
      title: "Rent Payment Due",
      date: "2026-02-01",
      time: "23:59",
      type: "deadline",
      description: "Monthly rent payment deadline",
    },
    {
      id: "2",
      title: "Lease Renewal",
      date: "2026-03-15",
      time: "09:00",
      type: "reminder",
      description: "Your lease renewal discussion meeting",
    },
    {
      id: "3",
      title: "Maintenance Inspection",
      date: "2026-02-10",
      time: "14:00",
      type: "event",
      description: "Property inspection scheduled",
    },
  ]);

  // Mock CRUD functions for future implementation
  /*
  const fetchEvents = async () => {
    try {
      const response = await fetch(`/api/tenant/calendar/events`);
      const data = await response.json();
      setEvents(data);
    } catch (error) {
      console.error("Error fetching events:", error);
    }
  };

  const createEvent = async (newEvent: Omit<Event, 'id'>) => {
    try {
      const response = await fetch(`/api/tenant/calendar/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEvent),
      });
      const data = await response.json();
      setEvents([...events, data]);
    } catch (error) {
      console.error("Error creating event:", error);
    }
  };

  const updateEvent = async (id: string, updatedEvent: Partial<Event>) => {
    try {
      const response = await fetch(`/api/tenant/calendar/events/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedEvent),
      });
      const data = await response.json();
      setEvents(events.map(event => event.id === id ? data : event));
    } catch (error) {
      console.error("Error updating event:", error);
    }
  };

  const deleteEvent = async (id: string) => {
    try {
      await fetch(`/api/tenant/calendar/events/${id}`, {
        method: 'DELETE',
      });
      setEvents(events.filter(event => event.id !== id));
    } catch (error) {
      console.error("Error deleting event:", error);
    }
  };
  */

  const getTypeColor = (type: Event["type"]) => {
    switch (type) {
      case "deadline":
        return "bg-red-50 border-red-200";
      case "reminder":
        return "bg-yellow-50 border-yellow-200";
      case "event":
        return "bg-blue-50 border-blue-200";
      default:
        return "bg-gray-50 border-gray-200";
    }
  };

  const getTypeIcon = (type: Event["type"]) => {
    switch (type) {
      case "deadline":
        return <AlertCircle size={16} className="text-red-600" />;
      case "reminder":
        return <Clock size={16} className="text-yellow-600" />;
      case "event":
        return <CalendarIcon size={16} className="text-blue-600" />;
      default:
        return <CalendarIcon size={16} className="text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("/portal/tenant")}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <div>
          <h1 className="text-3xl font-light text-[#00356B] tracking-tight">
            Calendar
          </h1>
          <p className="text-sm text-gray-600">View upcoming events and deadlines</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upcoming Events</CardTitle>
        </CardHeader>
        <CardContent>
          {events.length > 0 ? (
            <div className="space-y-3">
              {events.map((event) => (
                <div
                  key={event.id}
                  className={`p-4 border rounded-lg ${getTypeColor(event.type)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      {getTypeIcon(event.type)}
                      <div>
                        <h3 className="font-semibold text-gray-800">{event.title}</h3>
                        <p className="text-sm text-gray-600">{event.description}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          <span>{new Date(event.date).toLocaleDateString()}</span>
                          <span>{event.time}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">
              No upcoming events. You're all set!
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CalendarPage;
