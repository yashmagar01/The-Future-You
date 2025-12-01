import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Shield, UserCog, Users } from "lucide-react";

interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  role: "user" | "tester" | "admin";
  created_at: string;
}

export default function AdminPanel() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [promotingUser, setPromotingUser] = useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Unauthorized",
          description: "Please log in to access the admin panel",
          variant: "destructive",
        });
        navigate("/login");
        return;
      }

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (error || !profile || profile.role !== "admin") {
        toast({
          title: "Access Denied",
          description: "You don't have permission to access this page",
          variant: "destructive",
        });
        navigate("/dashboard");
        return;
      }

      setCurrentUserRole(profile.role);
      await fetchUsers();
    } catch (error) {
      console.error("Error checking admin access:", error);
      navigate("/dashboard");
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Fetch profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name, role, created_at")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch auth users via Edge Function or use service role
      // For now, we'll use a workaround: get emails from auth.users via RPC
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error("No active session");
      }

      // Fetch users with emails using the admin API via Edge Function
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/list-users`,
        {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
        }
      );

      let usersWithEmails: Profile[] = [];

      if (response.ok) {
        const result = await response.json();
        usersWithEmails = result.users || [];
      } else {
        // Fallback: Use profiles without emails
        usersWithEmails = (profiles || []).map(p => ({
          id: p.id,
          full_name: p.full_name,
          email: null, // Email not available without admin function
          role: p.role as any,
          created_at: p.created_at,
        }));
      }

      setUsers(usersWithEmails);
    } catch (error) {
      console.error("Error fetching users:", error);
      
      // Fallback: Try to get profiles without emails
      try {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name, role, created_at")
          .order("created_at", { ascending: false });
        
        setUsers((profiles || []).map(p => ({
        id: p.id,
        full_name: p.full_name,
        email: null,
        role: p.role as any,
        created_at: p.created_at,
      })));
      } catch (fallbackError) {
        console.error("Fallback fetch failed:", fallbackError);
      }
      
      toast({
        title: "Warning",
        description: "User emails may not be visible. Some features might be limited.",
      });
    } finally {
      setLoading(false);
    }
  };

  const promoteUser = async (userId: string, newRole: "user" | "tester" | "admin") => {
    try {
      setPromotingUser(userId);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("No active session");
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/promote-user`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userId, role: newRole }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to update user role");
      }

      toast({
        title: "Success",
        description: result.message,
      });

      // Refresh users list
      await fetchUsers();
    } catch (error) {
      console.error("Error promoting user:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update user role",
        variant: "destructive",
      });
    } finally {
      setPromotingUser(null);
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "admin":
        return "default";
      case "tester":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin":
        return <Shield className="h-4 w-4" />;
      case "tester":
        return <UserCog className="h-4 w-4" />;
      default:
        return <Users className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto py-8 px-4 max-w-6xl">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <CardTitle>Admin Panel - User Management</CardTitle>
          </div>
          <CardDescription>
            Manage user roles and permissions. Testers get instant analysis, regular users wait 2-3 days.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{user.full_name || "Unnamed User"}</p>
                    <Badge variant={getRoleBadgeVariant(user.role)} className="flex items-center gap-1">
                      {getRoleIcon(user.role)}
                      {user.role}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                  <p className="text-xs text-muted-foreground">
                    Joined: {new Date(user.created_at).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Select
                    value={user.role}
                    onValueChange={(newRole) => promoteUser(user.id, newRole as any)}
                    disabled={promotingUser === user.id}
                  >
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          User
                        </div>
                      </SelectItem>
                      <SelectItem value="tester">
                        <div className="flex items-center gap-2">
                          <UserCog className="h-4 w-4" />
                          Tester
                        </div>
                      </SelectItem>
                      <SelectItem value="admin">
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          Admin
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>

                  {promotingUser === user.id && (
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  )}
                </div>
              </div>
            ))}

            {users.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No users found
              </div>
            )}
          </div>

          <div className="mt-6 p-4 bg-muted/50 rounded-lg">
            <h4 className="font-medium mb-2">Role Descriptions:</h4>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li><strong>User:</strong> Standard access, 2-3 day processing time</li>
              <li><strong>Tester:</strong> High priority, instant analysis</li>
              <li><strong>Admin:</strong> Full access to admin panel and user management</li>
            </ul>
          </div>
        </CardContent>
      </Card>
      </div>
    </Layout>
  );
}
