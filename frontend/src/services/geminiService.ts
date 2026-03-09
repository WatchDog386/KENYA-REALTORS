// © 2025 Jeff. All rights reserved.
// Unauthorized copying, distribution, or modification of this file is strictly prohibited.
export interface MaterialRelationship {
  relatedMaterial: string;
  relationType:
    | "requires"
    | "dependsOn"
    | "precedes"
    | "follows"
    | "alternative";
  description: string;
}
export interface MaterialRequirement {
  type: "environmental" | "structural" | "aesthetic" | "performance";
  description: string;
}
export interface GeminiMaterialAnalysis {
  category: string;
  location: string;
  element: string;
  description: string;
  unit: string;
  quantity: number;
  rate: number;
  amount: number;
  confidence: number;
  materialType:
    | "primary"
    | "secondary"
    | "preparatory"
    | "finishing"
    | "protective"
    | "joint"
    | "auxiliary";
  relationships: MaterialRelationship[];
  requirements: MaterialRequirement[];
  applicationContext: string;
  suggestedCategory?: string;
  notes?: string;
  variations?: string[];
  alternatives?: string[];
  preparationSteps?: string[];
}
export interface GeminiMaterialResponse {
  materials: GeminiMaterialAnalysis[];
  summary: {
    totalMaterials: number;
    totalCost: number;
    categories: Record<string, number>;
  };
}
class GeminiService {
  private supabaseUrl = "https://jtdtzkpqncpmmenywnlw.supabase.co";
  private endpoint = `${this.supabaseUrl}/functions/v1/analyze-materials`;

  async analyzeMaterials(quoteData: any) {
    try {
      const response = await fetch(this.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ quoteData }),
      });

      if (!response.ok) {
        throw new Error(`Edge function error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Gemini analysis failed:", error);
      throw error;
    }
  }
}

export const geminiService = new GeminiService();
