// © 2025 Jeff. All rights reserved.
// Unauthorized copying, distribution, or modification of this file is strictly prohibited.

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "react-router-dom";
export interface ClientReview {
  id: string;
  quote_id: string;
  client_name: string;
  client_email: string;
  rating: number;
  review_text?: string;
  project_completion_date?: string;
  created_at: string;
}
export const useClientReviews = () => {
  const [reviews, setReviews] = useState<ClientReview[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, profile } = useAuth();
  const location = useLocation();
  const fetchReviews = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("client_reviews")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setReviews(data || []);
    } catch (error) {
      console.error("Error fetching client reviews:", error);
    } finally {
      setLoading(false);
    }
  };
  const averageRating =
    reviews.length > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
      : 0;
  useEffect(() => {
    fetchReviews();
  }, [user, profile, location.key]);
  return {
    reviews,
    loading,
    averageRating,
    totalReviews: reviews.length,
    refetch: fetchReviews,
  };
};
