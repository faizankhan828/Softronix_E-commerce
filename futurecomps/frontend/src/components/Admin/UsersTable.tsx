import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import {
  Search,
  MoreHorizontal,
  UserCog,
  ShieldCheck,
  ShieldX,
  Trash2,
  Eye,
  MailOpen,
  AlertCircle,
} from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/Avatar";

export interface User {
  _id?: string;
  id?: string;
  name?: string;
  email?: string;
  role?: string;
  createdAt?: string;
  status?: string;
  avatarUrl?: string;
}

interface UsersTableProps {
  users: User[];
  loading: boolean;
  onInspectUser: (user: User) => void;
  onDeleteUser: (userId: string) => void;
  onToggleUserStatus: (userId: string, currentStatus: string) => void;
  onChangeUserRole?: (userId: string, newRole: string) => void;
}

export default function UsersTable({
  users,
  loading,
  onInspectUser,
  onDeleteUser,
  onToggleUserStatus,
  onChangeUserRole,
}: UsersTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [hasError, setHasError] = useState(false);
  const { toast } = useToast();

  // Check if users data is valid
  useEffect(() => {
    if (!Array.isArray(users)) {
      setHasError(true);
      toast({
        title: "Error",
        description: "Invalid users data format",
        variant: "destructive",
      });
    } else {
      setHasError(false);
    }
  }, [users, toast]);

  // Get unique roles for filter
  const uniqueRoles = Array.from(
    new Set(users.map((user) => user.role || "user"))
  );

  // Filter users based on search and filters
  const filteredUsers = users.filter((user) => {
    // Search filter
    const matchesSearch =
      searchTerm === "" ||
      (user.name &&
        user.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.email &&
        user.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user._id && user._id.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.id && user.id.toLowerCase().includes(searchTerm.toLowerCase()));

    // Role filter
    const userRole = user.role || "user";
    const matchesRole = roleFilter === "all" || userRole === roleFilter;

    // Status filter
    const userStatus = user.status || "active";
    const matchesStatus = statusFilter === "all" || userStatus === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  // Sort users by creation date (newest first)
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    if (!a.createdAt || !b.createdAt) return 0;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  if (loading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center space-y-4">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        <p className="text-muted-foreground">Loading users...</p>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="p-8 flex flex-col items-center justify-center space-y-4">
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-red-100">
          <AlertCircle className="h-8 w-8 text-red-600" />
        </div>
        <h3 className="text-lg font-medium">Error Loading Users</h3>
        <p className="text-muted-foreground text-center max-w-md">
          There was a problem loading the user data. Please try refreshing the
          page or contact support if the issue persists.
        </p>
        <Button onClick={() => window.location.reload()} variant="outline">
          Refresh Page
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Users</h2>
        <div className="text-sm text-muted-foreground">
          {users.length} total users
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              {uniqueRoles.map((role) => (
                <SelectItem key={role} value={role}>
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Email</TableHead>
              <TableHead className="text-center">Role</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedUsers.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-8 text-muted-foreground"
                >
                  No users found.
                </TableCell>
              </TableRow>
            ) : (
              sortedUsers.map((user) => {
                const userId = user._id || user.id || "";
                const userName =
                  user.name || user.email?.split("@")[0] || "Unknown";
                const userEmail = user.email || "No email";
                const userRole = user.role || "user";
                const userStatus = user.status || "active";
                const userCreatedAt = user.createdAt
                  ? new Date(user.createdAt).toLocaleDateString()
                  : "Unknown";

                // Get initials for avatar
                const initials = userName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase();

                return (
                  <TableRow key={userId}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={user.avatarUrl} alt={userName} />
                          <AvatarFallback>{initials}</AvatarFallback>
                        </Avatar>
                        <div className="font-medium">{userName}</div>
                      </div>
                    </TableCell>
                    <TableCell>{userEmail}</TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={userRole === "admin" ? "default" : "outline"}
                        className={
                          userRole === "admin"
                            ? "bg-purple-100 text-purple-800 hover:bg-purple-100"
                            : ""
                        }
                      >
                        {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>{userCreatedAt}</TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant="outline"
                        className={
                          userStatus === "active"
                            ? "bg-green-100 text-green-800 hover:bg-green-100"
                            : "bg-red-100 text-red-800 hover:bg-red-100"
                        }
                      >
                        {userStatus.charAt(0).toUpperCase() +
                          userStatus.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => onInspectUser(user)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <MailOpen className="mr-2 h-4 w-4" />
                            Send Email
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {userStatus === "active" ? (
                            <DropdownMenuItem
                              onClick={() =>
                                onToggleUserStatus(userId, userStatus)
                              }
                            >
                              <ShieldX className="mr-2 h-4 w-4" />
                              Deactivate User
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              onClick={() =>
                                onToggleUserStatus(userId, userStatus)
                              }
                            >
                              <ShieldCheck className="mr-2 h-4 w-4" />
                              Activate User
                            </DropdownMenuItem>
                          )}
                          {userRole !== "admin" && (
                            <DropdownMenuItem
                              onClick={() =>
                                onChangeUserRole &&
                                onChangeUserRole(userId, "admin")
                              }
                            >
                              <UserCog className="mr-2 h-4 w-4" />
                              Make Admin
                            </DropdownMenuItem>
                          )}
                          {userRole === "admin" && (
                            <DropdownMenuItem
                              onClick={() =>
                                onChangeUserRole &&
                                onChangeUserRole(userId, "user")
                              }
                            >
                              <UserCog className="mr-2 h-4 w-4" />
                              Remove Admin
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => onDeleteUser(userId)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete User
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
