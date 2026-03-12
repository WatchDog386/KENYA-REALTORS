// src/services/loginActivityService.ts
import { supabase } from "@/integrations/supabase/client";

export interface LoginActivity {
  id: string;
  user_id: string;
  email: string;
  role: string;
  ip_address: string;
  user_agent: string;
  login_timestamp: string;
  logout_timestamp: string | null;
  session_duration_minutes: number | null;
  login_status: "success" | "failed" | "session_ended";
  failure_reason: string | null;
  created_at: string;
}

export const loginActivityService = {
  /**
   * Record a successful login
   */
  recordLogin: async (userId: string, email: string, role: string) => {
    try {
      const ipAddress = await getClientIP();
      const userAgent = navigator.userAgent;

      const { data, error } = await supabase
        .from("login_activity")
        .insert([
          {
            user_id: userId,
            email,
            role,
            ip_address: ipAddress,
            user_agent: userAgent,
            login_timestamp: new Date().toISOString(),
            login_status: "success",
          },
        ])
        .select()
        .single();

      if (error) {
        console.error("Error recording login:", error);
        return null;
      }

      return data;
    } catch (error) {
      console.error("Error in recordLogin:", error);
      return null;
    }
  },

  /**
   * Record a failed login attempt
   */
  recordFailedLogin: async (email: string, failureReason: string) => {
    try {
      const ipAddress = await getClientIP();
      const userAgent = navigator.userAgent;

      const { data, error } = await supabase
        .from("login_activity")
        .insert([
          {
            email,
            ip_address: ipAddress,
            user_agent: userAgent,
            login_timestamp: new Date().toISOString(),
            login_status: "failed",
            failure_reason: failureReason,
          },
        ])
        .select()
        .single();

      if (error) {
        console.error("Error recording failed login:", error);
        return null;
      }

      return data;
    } catch (error) {
      console.error("Error in recordFailedLogin:", error);
      return null;
    }
  },

  /**
   * Record a logout
   */
  recordLogout: async (userId: string) => {
    try {
      // Get the latest login record for this user
      const { data: latestLogin, error: fetchError } = await supabase
        .from("login_activity")
        .select("*")
        .eq("user_id", userId)
        .eq("login_status", "success")
        .is("logout_timestamp", null)
        .order("login_timestamp", { ascending: false })
        .limit(1)
        .single();

      if (fetchError || !latestLogin) {
        console.error("Could not find active login session:", fetchError);
        return null;
      }

      // Calculate session duration
      const loginTime = new Date(latestLogin.login_timestamp);
      const logoutTime = new Date();
      const durationMinutes = Math.round(
        (logoutTime.getTime() - loginTime.getTime()) / (1000 * 60)
      );

      // Update the login record with logout info
      const { data, error } = await supabase
        .from("login_activity")
        .update({
          logout_timestamp: logoutTime.toISOString(),
          session_duration_minutes: durationMinutes,
          login_status: "session_ended",
        })
        .eq("id", latestLogin.id)
        .select()
        .single();

      if (error) {
        console.error("Error recording logout:", error);
        return null;
      }

      return data;
    } catch (error) {
      console.error("Error in recordLogout:", error);
      return null;
    }
  },

  /**
   * Get login activity for super admin dashboard
   */
  getLoginActivities: async (limit: number = 50, offset: number = 0) => {
    try {
      const { data, error } = await supabase
        .from("login_activity")
        .select("*")
        .order("login_timestamp", { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error("Error fetching login activities:", error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error("Error in getLoginActivities:", error);
      return [];
    }
  },

  /**
   * Get login activities filtered by date range
   */
  getLoginActivitiesByDateRange: async (
    startDate: Date,
    endDate: Date,
    limit: number = 50
  ) => {
    try {
      const { data, error } = await supabase
        .from("login_activity")
        .select("*")
        .gte("login_timestamp", startDate.toISOString())
        .lte("login_timestamp", endDate.toISOString())
        .order("login_timestamp", { ascending: false })
        .limit(limit);

      if (error) {
        console.error("Error fetching filtered login activities:", error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error("Error in getLoginActivitiesByDateRange:", error);
      return [];
    }
  },

  /**
   * Get login activities for a specific user
   */
  getUserLoginActivities: async (userId: string, limit: number = 20) => {
    try {
      const { data, error } = await supabase
        .from("login_activity")
        .select("*")
        .eq("user_id", userId)
        .order("login_timestamp", { ascending: false })
        .limit(limit);

      if (error) {
        console.error("Error fetching user login activities:", error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error("Error in getUserLoginActivities:", error);
      return [];
    }
  },

  /**
   * Get login statistics
   */
  getLoginStatistics: async (days: number = 7) => {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from("login_activity")
        .select("*")
        .gte("login_timestamp", startDate.toISOString());

      if (error) {
        console.error("Error fetching login statistics:", error);
        return {
          totalLogins: 0,
          successfulLogins: 0,
          failedLogins: 0,
          uniqueUsers: 0,
          averageSessionDuration: 0,
        };
      }

      const activities = data || [];

      const successfulLogins = activities.filter(
        (a) => a.login_status === "success" || a.login_status === "session_ended"
      ).length;
      const failedLogins = activities.filter(
        (a) => a.login_status === "failed"
      ).length;
      const uniqueUsers = new Set(
        activities.map((a) => a.user_id).filter(Boolean)
      ).size;

      const sessionDurations = activities
        .filter((a) => a.session_duration_minutes !== null)
        .map((a) => a.session_duration_minutes || 0);
      const averageSessionDuration =
        sessionDurations.length > 0
          ? Math.round(
              sessionDurations.reduce((a, b) => a + b, 0) /
                sessionDurations.length
            )
          : 0;

      return {
        totalLogins: activities.length,
        successfulLogins,
        failedLogins,
        uniqueUsers,
        averageSessionDuration,
      };
    } catch (error) {
      console.error("Error in getLoginStatistics:", error);
      return {
        totalLogins: 0,
        successfulLogins: 0,
        failedLogins: 0,
        uniqueUsers: 0,
        averageSessionDuration: 0,
      };
    }
  },
};

/**
 * Get client IP address (best effort)
 */
async function getClientIP(): Promise<string> {
  try {
    const response = await fetch("https://api.ipify.org?format=json");
    const data = await response.json();
    return data.ip || "Unknown";
  } catch {
    return "Unknown";
  }
}
