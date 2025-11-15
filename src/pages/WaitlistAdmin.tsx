import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  Users,
  CheckCircle2,
  Clock,
  UserPlus,
  Trash2,
  Download,
  Search,
  Filter,
  Loader2,
  Mail,
  Phone,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface WaitlistEntry {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  role_interest: string;
  message: string | null;
  referrer: string | null;
  source: string | null;
  status: "pending" | "confirmed" | "promoted" | "removed";
  created_at: string;
  updated_at: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

const WaitlistAdmin = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0,
  });

  const [selectedEntry, setSelectedEntry] = useState<WaitlistEntry | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showPromoteDialog, setShowPromoteDialog] = useState(false);

  // Check admin access
  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) {
        navigate("/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (!profile || profile.role !== "admin") {
        toast({
          title: "Access Denied",
          description: "You don't have permission to access this page",
          variant: "destructive",
        });
        navigate("/");
      }
    };

    checkAdmin();
  }, [user, navigate, toast]);

  // Fetch waitlist entries
  const fetchEntries = async () => {
    try {
      setLoading(true);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No session");

      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      if (statusFilter !== "all") {
        params.append("status", statusFilter);
      }

      if (searchQuery) {
        params.append("search", searchQuery);
      }

      const response = await fetch(`/api/waitlist?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch entries");
      }

      const data = await response.json();
      setEntries(data.entries);
      setPagination(data.pagination);
    } catch (error) {
      console.error("Fetch error:", error);
      toast({
        title: "Error",
        description: "Failed to load waitlist entries",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, [pagination.page, statusFilter, searchQuery]);

  const handlePromote = async (entry: WaitlistEntry) => {
    try {
      setActionLoading(entry.id);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No session");

      const response = await fetch("/api/waitlist/promote", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          email: entry.email,
          promoteTo: "tester",
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to promote user");
      }

      toast({
        title: "Success",
        description: `${entry.email} promoted to tester`,
      });

      setShowPromoteDialog(false);
      fetchEntries();
    } catch (error) {
      console.error("Promote error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to promote user",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemove = async (entry: WaitlistEntry) => {
    try {
      setActionLoading(entry.id);

      const { error } = await supabase
        .from("waitlist_entries")
        .update({ status: "removed" })
        .eq("id", entry.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Entry removed from waitlist",
      });

      fetchEntries();
    } catch (error) {
      console.error("Remove error:", error);
      toast({
        title: "Error",
        description: "Failed to remove entry",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleExportCSV = () => {
    const csv = [
      ["Name", "Email", "Phone", "Role", "Message", "Referrer", "Status", "Created"],
      ...entries.map(e => [
        e.name || "",
        e.email,
        e.phone || "",
        e.role_interest,
        e.message || "",
        e.referrer || "",
        e.status,
        new Date(e.created_at).toLocaleDateString(),
      ]),
    ]
      .map(row => row.map(cell => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `waitlist-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
      confirmed: "bg-green-500/10 text-green-600 border-green-500/20",
      promoted: "bg-blue-500/10 text-blue-600 border-blue-500/20",
      removed: "bg-gray-500/10 text-gray-600 border-gray-500/20",
    };
    return (
      <Badge className={`${variants[status as keyof typeof variants]} border`}>
        {status}
      </Badge>
    );
  };

  const stats = {
    total: pagination.total,
    pending: entries.filter(e => e.status === "pending").length,
    confirmed: entries.filter(e => e.status === "confirmed").length,
    promoted: entries.filter(e => e.status === "promoted").length,
  };

  if (loading && entries.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Waitlist Management</h1>
          <p className="text-muted-foreground">
            Manage early access signups and promote users to testers
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-yellow-600" />
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">{stats.pending}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Confirmed</p>
                <p className="text-2xl font-bold">{stats.confirmed}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <UserPlus className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Promoted</p>
                <p className="text-2xl font-bold">{stats.promoted}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Filters & Search */}
        <Card className="p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="promoted">Promoted</SelectItem>
                <SelectItem value="removed">Removed</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleExportCSV} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </Card>

        {/* Table */}
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="font-medium">{entry.email}</TableCell>
                  <TableCell>{entry.name || "—"}</TableCell>
                  <TableCell className="capitalize">
                    {entry.role_interest.replace("_", " ")}
                  </TableCell>
                  <TableCell>{getStatusBadge(entry.status)}</TableCell>
                  <TableCell>
                    {new Date(entry.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedEntry(entry);
                          setShowDetailDialog(true);
                        }}
                      >
                        View
                      </Button>
                      {entry.status === "confirmed" && (
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedEntry(entry);
                            setShowPromoteDialog(true);
                          }}
                          disabled={actionLoading === entry.id}
                        >
                          {actionLoading === entry.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <UserPlus className="h-4 w-4 mr-1" />
                              Promote
                            </>
                          )}
                        </Button>
                      )}
                      {entry.status !== "removed" && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleRemove(entry)}
                          disabled={actionLoading === entry.id}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination */}
          <div className="flex items-center justify-between p-4 border-t">
            <p className="text-sm text-muted-foreground">
              Showing {entries.length} of {pagination.total} entries
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="flex items-center px-3 text-sm">
                Page {pagination.page} of {pagination.pages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page >= pagination.pages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>

        {/* Detail Dialog */}
        <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Waitlist Entry Details</DialogTitle>
            </DialogHeader>
            {selectedEntry && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{selectedEntry.email}</span>
                </div>
                {selectedEntry.name && (
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedEntry.name}</span>
                  </div>
                )}
                {selectedEntry.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedEntry.phone}</span>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium mb-1">Role/Interest:</p>
                  <p className="capitalize">{selectedEntry.role_interest.replace("_", " ")}</p>
                </div>
                {selectedEntry.message && (
                  <div>
                    <p className="text-sm font-medium mb-1 flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Message:
                    </p>
                    <p className="text-sm text-muted-foreground">{selectedEntry.message}</p>
                  </div>
                )}
                {selectedEntry.referrer && (
                  <div>
                    <p className="text-sm font-medium mb-1">Referrer:</p>
                    <p className="capitalize">{selectedEntry.referrer}</p>
                  </div>
                )}
                {selectedEntry.source && (
                  <div>
                    <p className="text-sm font-medium mb-1">Source:</p>
                    <p>{selectedEntry.source}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium mb-1">Status:</p>
                  {getStatusBadge(selectedEntry.status)}
                </div>
                <div className="text-xs text-muted-foreground pt-4 border-t">
                  <p>Created: {new Date(selectedEntry.created_at).toLocaleString()}</p>
                  <p>Updated: {new Date(selectedEntry.updated_at).toLocaleString()}</p>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Promote Dialog */}
        <Dialog open={showPromoteDialog} onOpenChange={setShowPromoteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Promote to Tester</DialogTitle>
              <DialogDescription>
                This will promote <strong>{selectedEntry?.email}</strong> to a tester role and send them an invite email.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowPromoteDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => selectedEntry && handlePromote(selectedEntry)}
                disabled={!!actionLoading}
              >
                {actionLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <UserPlus className="h-4 w-4 mr-2" />
                )}
                Confirm Promotion
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default WaitlistAdmin;
