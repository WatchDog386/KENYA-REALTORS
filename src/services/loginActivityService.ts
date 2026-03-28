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

const mapLoginActivity = (row: any): LoginActivity => ({
  id: row.id,
  user_id: row.user_id || "",
  email: row.email || "",
  role: row.role || "",
  ip_address: row.ip_address || "",
  user_agent: row.user_agent || "",
  login_timestamp: row.login_timestamp || row.created_at || new Date(0).toISOString(),
  logout_timestamp: row.logout_timestamp || null,
  session_duration_minutes: row.session_duration_minutes ?? null,
  login_status: row.login_status || "failed",
  failure_reason: row.failure_reason || null,
  created_at: row.created_at || row.login_timestamp || new Date(0).toISOString(),
});

export const loginActivityService = {
  /**
   * Record a successful login
   */
  recordLogin: async (userId: string, email: string, role: string) => {
    try {
      console.log("� [recordLogin] START - User:", email, "ID:", userId, "Role:", role);
      
      if (!userId || !email) {
        console.error("🔴 [recordLogin] Missing userId or email", { userId, email });
        return null;
      }

      const ipAddress = await getClientIP();
      const userAgent = navigator.userAgent;
      
      console.log("📝 [recordLogin] Preparing insert with IP:", ipAddress);

      const insertData = {
        user_id: userId,
        email,
        role,
        ip_address: ipAddress,
        user_agent: userAgent,
        login_timestamp: new Date().toISOString(),
        login_status: "success" as const,
      };
      
      console.log("📝 [recordLogin] Insert data:", insertData);

      const { data, error } = await supabase
        .from("login_activity")
        .insert([insertData])
        .select()
        .single();

      if (error) {
        console.error("🔴 [recordLogin] Supabase error:", error.message, error);
        return null;
      }

      if (!data) {
        console.error("🔴 [recordLogin] No data returned from insert");
        return null;
      }

      console.log("✅ [recordLogin] Success! Data:", data);
      return data;
    } catch (error) {
      console.error("🔴 [recordLogin] Exception:", error);
      return null;
    }
  },

  /**
   * Record a failed login attempt
   */
  recordFailedLogin: async (email: string, failureReason: string) => {
    try {
      console.log("🟢 [recordFailedLogin] START - Email:", email, "Reason:", failureReason);
      
      const ipAddress = await getClientIP();
      const userAgent = navigator.userAgent;
      
      console.log("📝 [recordFailedLogin] Preparing insert with IP:", ipAddress);

      const insertData = {
        email,
        ip_address: ipAddress,
        user_agent: userAgent,
        login_timestamp: new Date().toISOString(),
        login_status: "failed" as const,
        failure_reason: failureReason,
      };
      
      console.log("📝 [recordFailedLogin] Insert data:", insertData);

      const { data, error } = await supabase
        .from("login_activity")
        .insert([insertData])
        .select()
        .single();

      if (error) {
        console.error("🔴 [recordFailedLogin] Supabase error:", error.message, error);
        return null;
      }

      if (!data) {
        console.error("🔴 [recordFailedLogin] No data returned from insert");
        return null;
      }

      console.log("✅ [recordFailedLogin] Success! Data:", data);
      return data;
    } catch (error) {
      console.error("🔴 [recordFailedLogin] Exception:", error);
      return null;
    }
  },

  /**
   * Record a logout
   */
  recordLogout: async (userId: string) => {
    try {
      console.log("🟢 [recordLogout] START - User:", userId);

      // Get the latest login record for this user (don't use .single() to avoid errors on empty)
      console.log("📝 [recordLogout] Fetching active login session...");
      const { data: latestLoginArray, error: fetchError } = await supabase
        .from("login_activity")
        .select("*")
        .eq("user_id", userId)
        .eq("login_status", "success")
        .is("logout_timestamp", null)
        .order("login_timestamp", { ascending: false })
        .limit(1);

      if (fetchError) {
        console.error("🔴 [recordLogout] Fetch error:", fetchError.message, fetchError);
        return null;
      }

      const latestLogin = latestLoginArray && latestLoginArray.length > 0 ? latestLoginArray[0] : null;

      if (!latestLogin) {
        console.info("ℹ️ [recordLogout] No active login session found for user:", userId);
        return null;
      }

      console.log("📝 [recordLogout] Found active session, ID:", latestLogin.id);

      // Calculate session duration
      const loginTime = new Date(latestLogin.login_timestamp);
      const logoutTime = new Date();
      const durationMinutes = Math.round(
        (logoutTime.getTime() - loginTime.getTime()) / (1000 * 60)
      );

      console.log("📝 [recordLogout] Session duration:", durationMinutes, "minutes");

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
        console.error("🔴 [recordLogout] Update error:", error.message, error);
        return null;
      }

      if (!data) {
        console.error("🔴 [recordLogout] No data returned from update");
        return null;
      }

      console.log("✅ [recordLogout] Success! Data:", data);
      return data;
    } catch (error) {
      console.error("🔴 [recordLogout] Exception:", error);
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
        // Fallback for environments where login_timestamp is unavailable.
        const { data: fallbackData, error: fallbackError } = await supabase
          .from("login_activity")
          .select("*")
          .order("created_at", { ascending: false })
          .range(offset, offset + limit - 1);

        if (fallbackError) {
          console.error("Error fetching login activities:", fallbackError);
          return [];
        }

        return (fallbackData || []).map(mapLoginActivity);
      }

      return (data || []).map(mapLoginActivity);
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
  getLoginStatistics: async (days: number = 30) => {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - Math.max(days, 0));

      let query = supabase.from("login_activity").select("*");
      if (days > 0) {
        query = query.gte("login_timestamp", startDate.toISOString());
      }

      const { data, error } = await query;

      if (error) {
        let fallbackQuery = supabase.from("login_activity").select("*");
        if (days > 0) {
          fallbackQuery = fallbackQuery.gte("created_at", startDate.toISOString());
        }

        const { data: fallbackData, error: fallbackError } = await fallbackQuery;
        if (fallbackError) {
          console.error("Error fetching login statistics:", fallbackError);
          return {
            totalLogins: 0,
            successfulLogins: 0,
            failedLogins: 0,
            uniqueUsers: 0,
            averageSessionDuration: 0,
          };
        }

        const fallbackActivities = (fallbackData || []).map(mapLoginActivity);
        const successfulLogins = fallbackActivities.filter(
          (a) => a.login_status === "success" || a.login_status === "session_ended"
        ).length;
        const failedLogins = fallbackActivities.filter((a) => a.login_status === "failed").length;
        const uniqueUsers = new Set(fallbackActivities.map((a) => a.user_id).filter(Boolean)).size;
        const sessionDurations = fallbackActivities
          .filter((a) => a.session_duration_minutes !== null)
          .map((a) => a.session_duration_minutes || 0);
        const averageSessionDuration =
          sessionDurations.length > 0
            ? Math.round(sessionDurations.reduce((a, b) => a + b, 0) / sessionDurations.length)
            : 0;

        return {
          totalLogins: fallbackActivities.length,
          successfulLogins,
          failedLogins,
          uniqueUsers,
          averageSessionDuration,
        };
      }

      const activities = (data || []).map(mapLoginActivity);

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
    console.log("📝 [getClientIP] Fetching IP address...");
    const response = await fetch("https://api.ipify.org?format=json", { signal: AbortSignal.timeout(5000) });
    const data = await response.json();
    const ip = data.ip || "Unknown";
    console.log("✅ [getClientIP] Got IP:", ip);
    return ip;
  } catch (error) {
    console.error("🔴 [getClientIP] Failed to fetch IP:", error);
    return "Unknown";
  }
}
