import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, 
  Users, 
  FolderOpen,
  Plus, 
  Clock, 
  CheckCircle, 
  Inbox,
  List,
  BarChart3,
  Palette,
  LogOut,
  Settings
} from "lucide-react";

interface SidebarProps {
  currentView: string;
  onViewChange: (view: string) => void;
}

export default function Sidebar({ currentView, onViewChange }: SidebarProps) {
  const { user, logout } = useAuth();

  const menuItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      show: true,
    },
    {
      id: "users",
      label: "Usuários",
      icon: Users,
      show: user?.isAdmin,
    },
    {
      id: "projects",
      label: "Projetos",
      icon: FolderOpen,
      show: user?.isAdmin,
    },
    {
      id: "request-creative",
      label: "Solicitar Criativo",
      icon: Plus,
      show: user?.isGestor || user?.isAdmin,
      category: "Criativos",
    },
    {
      id: "my-creative-requests",
      label: "Meus Pedidos",
      icon: List,
      show: user?.isGestor || user?.isAdmin,
      category: "Criativos",
    },
    {
      id: "creatives-progress",
      label: "Criativos em Andamento",
      icon: Clock,
      show: user?.isGestor || user?.isAdmin,
      category: "Criativos",
    },
    {
      id: "creatives-done",
      label: "Criativos Prontos",
      icon: CheckCircle,
      show: user?.isGestor || user?.isAdmin,
      category: "Criativos",
    },
    {
      id: "requested-creatives",
      label: "Criativos Solicitados",
      icon: Inbox,
      show: user?.isEditor || user?.isAdmin,
      category: "Editor",
    },
    {
      id: "performance",
      label: "Performance de Criativos",
      icon: BarChart3,
      show: user?.isEditor || user?.isAdmin,
      category: "Editor",
    },
    {
      id: "configurations",
      label: "Configurações",
      icon: Settings,
      show: user?.isAdmin,
      category: "Admin",
    },
  ];

  const visibleItems = menuItems.filter(item => item.show);
  const categories = Array.from(new Set(visibleItems.map(item => item.category).filter(Boolean)));

  const getUserRole = () => {
    if (user?.isAdmin) return "Administrador";
    if (user?.isEditor) return "Editor";
    if (user?.isGestor) return "Gestor";
    return "Usuário";
  };

  const getUserInitials = () => {
    return user?.name?.split(' ').map(n => n[0]).join('') || 'U';
  };

  return (
    <div className="fixed inset-y-0 left-0 w-64 bg-sidebar shadow-lg z-50">
      <div className="flex items-center p-6 border-b border-sidebar-border">
        <div className="w-10 h-10 bg-sidebar-primary rounded-lg flex items-center justify-center mr-3">
          <Palette className="text-sidebar-primary-foreground" />
        </div>
        <div>
          <h2 className="font-bold text-sidebar-foreground">Sistema Criativos</h2>
          <p className="text-sm text-sidebar-foreground/70">{getUserRole()}</p>
        </div>
      </div>

      <nav className="p-4 space-y-2">
        {/* Main items (no category) */}
        {visibleItems
          .filter(item => !item.category)
          .map(item => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={`w-full sidebar-item ${
                  currentView === item.id ? 'sidebar-item-active' : 'sidebar-item-inactive'
                }`}
              >
                <Icon className="w-5 h-5 mr-3" />
                {item.label}
              </button>
            );
          })}

        {/* Categorized items */}
        {categories.map(category => (
          <div key={category}>
            <div className="pt-4 pb-2">
              <p className="text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider px-3">
                {category}
              </p>
            </div>
            {visibleItems
              .filter(item => item.category === category)
              .map(item => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => onViewChange(item.id)}
                    className={`w-full sidebar-item ${
                      currentView === item.id ? 'sidebar-item-active' : 'sidebar-item-inactive'
                    }`}
                  >
                    <Icon className="w-5 h-5 mr-3" />
                    {item.label}
                  </button>
                );
              })}
          </div>
        ))}
      </nav>

      <div className="absolute bottom-4 left-4 right-4">
        <div className="bg-sidebar-accent rounded-lg p-3 flex items-center">
          <div className="w-8 h-8 bg-sidebar-primary rounded-full flex items-center justify-center mr-3">
            <span className="text-sidebar-primary-foreground text-sm font-medium">
              {getUserInitials()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">
              {user?.name}
            </p>
            <p className="text-xs text-sidebar-foreground/70 truncate">
              {user?.email}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={logout}
            className="text-sidebar-foreground/60 hover:text-sidebar-foreground"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
