import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, FileText, Download, Trash2, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getTenantLeaseAgreementState } from "@/services/tenantLeaseAgreementService";
import { downloadTenantLeaseAgreementPdf } from "@/utils/leaseAgreementPdf";
import { TenantLeaseAgreementForm } from "@/constants/tenantLeaseAgreement";

interface Document {
  id: string;
  user_id: string;
  title: string;
  file_type: string;
  file_url: string;
  document_type: "lease" | "receipt" | "notice" | "other";
  uploaded_at: string;
  created_at: string;
  isGeneratedLease?: boolean;
}

const DocumentsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [signedLeaseForm, setSignedLeaseForm] = useState<TenantLeaseAgreementForm | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      fetchDocuments();
    }
  }, [user?.id]);

  // Fetch documents
  const fetchDocuments = async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const leaseState = await getTenantLeaseAgreementState(user.id).catch((error) => {
        console.warn("Could not load tenant lease metadata for documents:", error);
        return null;
      });

      const leaseForm = leaseState?.record?.form || leaseState?.form || null;
      setSignedLeaseForm(leaseState?.isSigned ? leaseForm : null);

      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("user_id", user.id)
        .order("uploaded_at", { ascending: false });

      let nextDocuments: Document[] = data || [];

      if (error) {
        console.warn("Could not fetch documents:", error);
        // Use mock data
        nextDocuments = [
          {
            id: "1",
            user_id: user.id,
            title: "Lease Agreement",
            file_type: "PDF",
            file_url: "#",
            document_type: "lease",
            uploaded_at: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
            created_at: new Date().toISOString(),
          },
          {
            id: "2",
            user_id: user.id,
            title: "January 2024 Receipt",
            file_type: "PDF",
            file_url: "#",
            document_type: "receipt",
            uploaded_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            created_at: new Date().toISOString(),
          },
        ];
      }

      if (leaseState?.isSigned && leaseForm) {
        const hasLeaseDocument = (nextDocuments || []).some(
          (doc) =>
            doc.document_type === "lease" &&
            (doc.isGeneratedLease || (Boolean(doc.file_url) && doc.file_url !== "#"))
        );

        if (!hasLeaseDocument) {
          nextDocuments = [
            {
              id: `lease-profile-${user.id}`,
              user_id: user.id,
              title: "Signed Lease Agreement - AYDEN PLAZA",
              file_type: "PDF",
              file_url: "generated:lease-agreement",
              document_type: "lease",
              uploaded_at: leaseState.record?.signedAt || new Date().toISOString(),
              created_at: leaseState.record?.signedAt || new Date().toISOString(),
              isGeneratedLease: true,
            },
            ...nextDocuments,
          ];
        }
      }

      setDocuments(nextDocuments);
    } catch (err) {
      console.error("Error fetching documents:", err);
      toast.error("Failed to load documents");
    } finally {
      setLoading(false);
    }
  };

  // Delete document
  const deleteDocument = async (documentId: string) => {
    try {
      const { error } = await supabase
        .from("documents")
        .delete()
        .eq("id", documentId);

      if (!error) {
        setDocuments(documents.filter((d) => d.id !== documentId));
        toast.success("Document deleted");
      }
    } catch (err) {
      console.error("Error deleting document:", err);
      toast.error("Failed to delete document");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getDocumentIcon = (type: string) => {
    switch (type) {
      case "lease":
        return "📋";
      case "receipt":
        return "🧾";
      case "notice":
        return "📝";
      default:
        return "📄";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[#00356B]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-[#00356B] to-[#00356B]/80 rounded-xl shadow-lg p-6 flex items-center gap-4">
        <div className="bg-white/20 p-3 rounded-lg">
          <FileText className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">Documents</h1>
          <p className="text-blue-100 text-sm mt-1">View your lease, receipts, and important documents</p>
        </div>
      </div>

      {documents.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <FileText size={48} className="text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No documents available yet</p>
              <p className="text-sm text-gray-400 mt-1">They will appear here when added</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {documents.map((doc) => (
            <Card key={doc.id}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="text-4xl">{getDocumentIcon(doc.document_type)}</div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{doc.title}</h3>
                      <p className="text-sm text-gray-600">
                        {doc.file_type} • {formatDate(doc.uploaded_at)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        if (doc.isGeneratedLease && signedLeaseForm) {
                          downloadTenantLeaseAgreementPdf(signedLeaseForm);
                          return;
                        }

                        if (!doc.file_url || doc.file_url === "#" || doc.file_url.startsWith("generated:")) {
                          toast.info("This document can be downloaded after it is fully generated.");
                          return;
                        }

                        window.open(doc.file_url, "_blank");
                      }}
                      className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Download"
                    >
                      <Download size={18} />
                    </button>
                    {!doc.isGeneratedLease && (
                      <button
                        onClick={() => deleteDocument(doc.id)}
                        className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default DocumentsPage;
