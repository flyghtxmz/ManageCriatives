import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import Sidebar from "@/components/layout/sidebar";
import StatsCard from "@/components/ui/stats-card";
import { 
  Users, 
  Clock, 
  Play, 
  CheckCircle, 
  Plus, 
  Facebook,
  AlertCircle,
  Edit,
  Trash2,
  FolderOpen,
  Upload,
  RotateCcw,
  ChevronDown,
  ChevronRight
} from "lucide-react";

type DashboardView = 
  | "dashboard" 
  | "users"
  | "projects"
  | "request-creative" 
  | "creatives-progress" 
  | "creatives-done" 
  | "requested-creatives"
  | "my-creative-requests"
  | "configurations"
  | "performance";

export default function Dashboard() {
  const [currentView, setCurrentView] = useState<DashboardView>("dashboard");
  const [showAddUserForm, setShowAddUserForm] = useState(false);
  const [showAddProjectForm, setShowAddProjectForm] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [editingCreative, setEditingCreative] = useState<any>(null);
  const [editingProject, setEditingProject] = useState<any>(null);
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({
    stats: false,
    allRequests: false,
    allProgress: false,
    allCompleted: false,
    languages: false,
    formats: false
  });
  const [showAddLanguageForm, setShowAddLanguageForm] = useState(false);
  const [showAddFormatForm, setShowAddFormatForm] = useState(false);
  const [editingLanguage, setEditingLanguage] = useState<any>(null);
  const [editingFormat, setEditingFormat] = useState<any>(null);
  const [uploadedFiles, setUploadedFiles] = useState<{ [key: number]: File | null }>({});
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Queries
  const { data: stats = {} } = useQuery({
    queryKey: ["/api/stats"],
    enabled: !!user,
  });

  const { data: users = [] } = useQuery({
    queryKey: ["/api/users"],
    enabled: !!user?.isAdmin,
  });

  const { data: projects = [] } = useQuery({
    queryKey: ["/api/projects"],
    enabled: !!user,
  });

  const { data: userProjects = [] } = useQuery({
    queryKey: ["/api/projects/user", user?.id],
    enabled: !!user?.isGestor && !!user?.id,
  });

  const { data: creativeRequests = [] } = useQuery({
    queryKey: ["/api/creative-requests"],
    enabled: !!user,
  });

  const { data: languages = [] } = useQuery({
    queryKey: ["/api/languages"],
    enabled: !!user?.isAdmin,
  });

  const { data: formats = [] } = useQuery({
    queryKey: ["/api/formats"],
    enabled: !!user?.isAdmin,
  });



  // Mutations
  const createUserMutation = useMutation({
    mutationFn: async (userData: any) => {
      const response = await apiRequest("POST", "/api/users", userData);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setShowAddUserForm(false);
      toast({
        title: "Usuário criado",
        description: "Usuário adicionado com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar usuário.",
        variant: "destructive",
      });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await apiRequest("PATCH", `/api/users/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setEditingUser(null);
      toast({
        title: "Usuário atualizado",
        description: "Dados atualizados com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao atualizar usuário.",
        variant: "destructive",
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      const response = await apiRequest("DELETE", `/api/users/${userId}`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Usuário removido",
        description: "Usuário excluído com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao excluir usuário.",
        variant: "destructive",
      });
    },
  });

  const createProjectMutation = useMutation({
    mutationFn: async (projectData: any) => {
      const response = await apiRequest("POST", "/api/projects", projectData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      setShowAddProjectForm(false);
      toast({
        title: "Projeto criado",
        description: "Projeto adicionado com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao criar projeto.",
        variant: "destructive",
      });
    },
  });

  const updateProjectMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await apiRequest("PATCH", `/api/projects/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      setEditingProject(null);
      toast({
        title: "Projeto atualizado",
        description: "Projeto atualizado com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao atualizar projeto.",
        variant: "destructive",
      });
    },
  });

  const deleteProjectMutation = useMutation({
    mutationFn: async (projectId: number) => {
      const response = await apiRequest("DELETE", `/api/projects/${projectId}`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({
        title: "Projeto removido",
        description: "Projeto excluído com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao excluir projeto.",
        variant: "destructive",
      });
    },
  });

  const createCreativeRequestMutation = useMutation({
    mutationFn: async (requestData: any) => {
      const response = await apiRequest("POST", "/api/creative-requests", requestData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/creative-requests"] });
      toast({
        title: "Solicitação enviada",
        description: "Criativo solicitado com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao solicitar criativo.",
        variant: "destructive",
      });
    },
  });

  const updateCreativeStatusMutation = useMutation({
    mutationFn: async ({ id, status, assignedToId }: { id: number; status: string; assignedToId?: number }) => {
      const response = await apiRequest("PATCH", `/api/creative-requests/${id}/status`, {
        status,
        assignedToId,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/creative-requests"] });
      toast({
        title: "Status atualizado",
        description: "Status do criativo atualizado com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao atualizar status.",
        variant: "destructive",
      });
    },
  });

  const deleteCreativeRequestMutation = useMutation({
    mutationFn: async (creativeId: number) => {
      const response = await apiRequest("DELETE", `/api/creative-requests/${creativeId}`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/creative-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Criativo excluído",
        description: "Criativo removido com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao excluir criativo.",
        variant: "destructive",
      });
    },
  });

  const updateCreativeMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await apiRequest("PATCH", `/api/creative-requests/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/creative-requests"] });
      setEditingCreative(null);
      toast({
        title: "Criativo atualizado",
        description: "Criativo editado com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao atualizar criativo.",
        variant: "destructive",
      });
    },
  });

  const deleteCreativeMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/creative-requests/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/creative-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Criativo excluído",
        description: "Criativo removido com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao excluir criativo.",
        variant: "destructive",
      });
    },
  });

  const resetAllDataMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/reset-all-data", {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/creative-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Dados resetados",
        description: "Todos os projetos e criativos foram removidos com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao resetar dados.",
        variant: "destructive",
      });
    },
  });

  const handleCreateUser = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const userData = {
      id: parseInt(formData.get("id") as string),
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      isAdmin: formData.get("isAdmin") === "on",
      isEditor: formData.get("isEditor") === "on",
      isGestor: formData.get("isGestor") === "on",
    };

    createUserMutation.mutate(userData);
  };

  const handleUpdateUser = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const userData = {
      id: parseInt(formData.get("id") as string),
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      password: formData.get("password") as string || undefined,
      isAdmin: formData.get("isAdmin") === "on",
      isEditor: formData.get("isEditor") === "on",
      isGestor: formData.get("isGestor") === "on",
    };

    // Remove password if empty
    if (!userData.password) {
      delete userData.password;
    }

    updateUserMutation.mutate({ id: editingUser.id, data: userData });
  };

  const handleCreateProject = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const projectData = {
      id: parseInt(formData.get("id") as string),
      name: formData.get("name") as string,
      domain: formData.get("domain") as string,
      description: formData.get("description") as string,
    };

    createProjectMutation.mutate(projectData);
  };

  const handleCreateCreativeRequest = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const requestData = {
      projectId: parseInt(formData.get("projectId") as string),
      requestedById: user?.id,
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      type: formData.get("type") as string,
      languageId: formData.get("languageId") ? parseInt(formData.get("languageId") as string) : null,
      formatId: formData.get("formatId") ? parseInt(formData.get("formatId") as string) : null,
      deadline: formData.get("deadline") ? new Date(formData.get("deadline") as string) : null,
    };

    createCreativeRequestMutation.mutate(requestData, {
      onSuccess: () => {
        // Reset form after successful submission
        (e.target as HTMLFormElement).reset();
      }
    });
  };

  const handleUpdateUserRoles = (userId: number, roles: any) => {
    updateUserMutation.mutate({ id: userId, roles });
  };

  const handleDeleteUser = (userId: number) => {
    if (confirm("Tem certeza que deseja excluir este usuário?")) {
      deleteUserMutation.mutate(userId);
    }
  };

  const handleUpdateProject = (projectId: number, data: any) => {
    updateProjectMutation.mutate({ id: projectId, data });
  };

  const handleDeleteProject = (projectId: number) => {
    if (confirm("Tem certeza que deseja excluir este projeto?")) {
      deleteProjectMutation.mutate(projectId);
    }
  };

  const getUserName = (userId: number) => {
    const foundUser = users.find((u: any) => u.id === userId);
    return foundUser ? foundUser.name : `Usuário ${userId}`;
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "solicitado":
        return "secondary";
      case "em_progresso":
        return "default";
      case "pronto":
        return "outline";
      default:
        return "secondary";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "solicitado":
        return "Solicitado";
      case "em_progresso":
        return "Em Progresso";
      case "pronto":
        return "Pronto";
      default:
        return status;
    }
  };

  const handleResetAllData = () => {
    if (confirm("ATENÇÃO: Esta ação irá remover TODOS os projetos, criativos em andamento, criativos prontos e pedidos. Esta ação não pode ser desfeita. Tem certeza?")) {
      resetAllDataMutation.mutate();
    }
  };

  const handleDeleteCreativeRequest = (creativeId: number) => {
    if (confirm("Tem certeza que deseja excluir este criativo? Esta ação não pode ser desfeita.")) {
      deleteCreativeRequestMutation.mutate(creativeId);
    }
  };

  const createLanguageMutation = useMutation({
    mutationFn: async (languageData: any) => {
      const response = await apiRequest("POST", "/api/languages", languageData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/languages"] });
      setShowAddLanguageForm(false);
      toast({
        title: "Idioma criado",
        description: "Idioma adicionado com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao criar idioma.",
        variant: "destructive",
      });
    },
  });

  const deleteLanguageMutation = useMutation({
    mutationFn: async (languageId: number) => {
      const response = await apiRequest("DELETE", `/api/languages/${languageId}`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/languages"] });
      toast({
        title: "Idioma excluído",
        description: "Idioma removido com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao excluir idioma.",
        variant: "destructive",
      });
    },
  });

  const createFormatMutation = useMutation({
    mutationFn: async (formatData: any) => {
      const response = await apiRequest("POST", "/api/formats", formatData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/formats"] });
      setShowAddFormatForm(false);
      toast({
        title: "Formato criado",
        description: "Formato adicionado com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao criar formato.",
        variant: "destructive",
      });
    },
  });

  const deleteFormatMutation = useMutation({
    mutationFn: async (formatId: number) => {
      const response = await apiRequest("DELETE", `/api/formats/${formatId}`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/formats"] });
      toast({
        title: "Formato excluído",
        description: "Formato removido com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao excluir formato.",
        variant: "destructive",
      });
    },
  });

  const handleDeleteLanguage = (languageId: number) => {
    if (confirm("Tem certeza que deseja excluir este idioma? Esta ação não pode ser desfeita.")) {
      deleteLanguageMutation.mutate(languageId);
    }
  };

  const handleDeleteFormat = (formatId: number) => {
    if (confirm("Tem certeza que deseja excluir este formato? Esta ação não pode ser desfeita.")) {
      deleteFormatMutation.mutate(formatId);
    }
  };

  const updateLanguageMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await apiRequest("PATCH", `/api/languages/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/languages"] });
      setEditingLanguage(null);
      toast({
        title: "Idioma atualizado",
        description: "Idioma editado com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao atualizar idioma.",
        variant: "destructive",
      });
    },
  });

  const updateFormatMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await apiRequest("PATCH", `/api/formats/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/formats"] });
      setEditingFormat(null);
      toast({
        title: "Formato atualizado",
        description: "Formato editado com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao atualizar formato.",
        variant: "destructive",
      });
    },
  });

  const renderContent = () => {
    switch (currentView) {
      case "dashboard":
        return (
          <div className="space-y-8">
            {/* Dashboard simplificado - Estatísticas movidas para Configurações */}

            {/* Facebook Integration - Only for Admin and Gestor */}
            {(user?.isAdmin || user?.isGestor) && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Facebook className="text-blue-600" />
                        Integração Facebook
                      </CardTitle>
                      <CardDescription>
                        Conecte sua conta para visualizar campanhas
                      </CardDescription>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Em Manutenção
                      </Badge>
                      <Button disabled variant="outline">
                        <Facebook className="w-4 h-4 mr-2" />
                        Conectar Facebook
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-8 text-center">
                    <Facebook className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-600 dark:text-slate-400">
                      A integração com o Facebook está temporariamente indisponível
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Atividade Recente</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {creativeRequests.slice(0, 5).map((request: any) => (
                    <div key={request.id} className="flex items-center p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mr-4">
                        <Plus className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">Nova solicitação de criativo</p>
                        <p className="text-sm text-muted-foreground">
                          {request.title} - {request.type}
                        </p>
                      </div>
                      <Badge variant={getStatusBadgeVariant(request.status)}>
                        {getStatusText(request.status)}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>


          </div>
        );

      case "users":
        if (!user?.isAdmin) return <div>Acesso negado</div>;
        
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Gerenciar Usuários</CardTitle>
                  <Button onClick={() => setShowAddUserForm(!showAddUserForm)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Usuário
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {showAddUserForm && (
                  <Card className="mb-6">
                    <CardHeader>
                      <CardTitle>Novo Usuário</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleCreateUser} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="userId">ID do Usuário</Label>
                            <Input id="userId" name="id" type="number" required placeholder="ex: 1" />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="name">Nome</Label>
                            <Input id="name" name="name" required />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="email">E-mail</Label>
                            <Input id="email" name="email" type="email" required />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="password">Senha</Label>
                            <Input id="password" name="password" type="password" required />
                          </div>
                          <div className="space-y-3">
                            <Label>Funções (Obrigatório selecionar pelo menos uma)</Label>
                            <div className="space-y-2">
                              <div className="flex items-center space-x-2">
                                <Checkbox id="isAdmin" name="isAdmin" />
                                <Label htmlFor="isAdmin">Administrador</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Checkbox id="isEditor" name="isEditor" />
                                <Label htmlFor="isEditor">Editor</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Checkbox id="isGestor" name="isGestor" />
                                <Label htmlFor="isGestor">Gestor</Label>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex space-x-3">
                          <Button type="submit" disabled={createUserMutation.isPending}>
                            {createUserMutation.isPending ? "Salvando..." : "Salvar"}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowAddUserForm(false)}
                          >
                            Cancelar
                          </Button>
                        </div>
                      </form>
                    </CardContent>
                  </Card>
                )}

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium">Nome</th>
                        <th className="text-left py-3 px-4 font-medium">E-mail</th>
                        <th className="text-left py-3 px-4 font-medium">Funções</th>
                        <th className="text-left py-3 px-4 font-medium">Status</th>
                        <th className="text-left py-3 px-4 font-medium">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((userItem: any) => (
                        <tr key={userItem.id} className="border-b">
                          <td className="py-3 px-4">
                            <div className="flex items-center">
                              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center mr-3">
                                <span className="text-primary text-sm font-medium">
                                  {userItem.name.split(' ').map((n: string) => n[0]).join('')}
                                </span>
                              </div>
                              {userItem.name}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-muted-foreground">{userItem.email}</td>
                          <td className="py-3 px-4">
                            <div className="flex gap-1">
                              {userItem.isAdmin && <Badge variant="destructive">Admin</Badge>}
                              {userItem.isEditor && <Badge variant="default">Editor</Badge>}
                              {userItem.isGestor && <Badge variant="secondary">Gestor</Badge>}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              Ativo
                            </Badge>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEditingUser(userItem)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeleteUser(userItem.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Edit User Modal */}
                {editingUser && (
                  <Card className="mt-6">
                    <CardHeader>
                      <CardTitle>Editar Usuário - {editingUser.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleUpdateUser} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="editUserId">ID do Usuário</Label>
                            <Input 
                              id="editUserId" 
                              name="id" 
                              type="number" 
                              defaultValue={editingUser.id}
                              required 
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="editName">Nome</Label>
                            <Input 
                              id="editName" 
                              name="name" 
                              defaultValue={editingUser.name}
                              required 
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="editEmail">E-mail</Label>
                            <Input 
                              id="editEmail" 
                              name="email" 
                              type="email" 
                              defaultValue={editingUser.email}
                              required 
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="editPassword">Nova Senha (opcional)</Label>
                            <Input 
                              id="editPassword" 
                              name="password" 
                              type="password" 
                              placeholder="Deixe em branco para manter a atual"
                            />
                          </div>
                          <div className="space-y-3 md:col-span-2">
                            <Label>Funções</Label>
                            <div className="space-y-2">
                              <div className="flex items-center space-x-2">
                                <Checkbox 
                                  id="editAdmin" 
                                  name="isAdmin"
                                  defaultChecked={editingUser.isAdmin}
                                />
                                <Label htmlFor="editAdmin">Administrador</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Checkbox 
                                  id="editEditor" 
                                  name="isEditor"
                                  defaultChecked={editingUser.isEditor}
                                />
                                <Label htmlFor="editEditor">Editor</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Checkbox 
                                  id="editGestor" 
                                  name="isGestor"
                                  defaultChecked={editingUser.isGestor}
                                />
                                <Label htmlFor="editGestor">Gestor</Label>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex space-x-3">
                          <Button type="submit" disabled={updateUserMutation.isPending}>
                            {updateUserMutation.isPending ? "Salvando..." : "Salvar"}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setEditingUser(null)}
                          >
                            Cancelar
                          </Button>
                        </div>
                      </form>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          </div>
        );

      case "projects":
        if (!user?.isAdmin) return <div>Acesso negado</div>;
        
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Gerenciar Projetos</CardTitle>
                  <Button onClick={() => setShowAddProjectForm(!showAddProjectForm)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Projeto
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {showAddProjectForm && (
                  <Card className="mb-6">
                    <CardHeader>
                      <CardTitle>Novo Projeto</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleCreateProject} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="projectId">ID do Projeto</Label>
                            <Input id="projectId" name="id" type="number" required placeholder="ex: 1" />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="projectName">Nome do Projeto</Label>
                            <Input id="projectName" name="name" required />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="projectDomain">Domínio do Projeto</Label>
                            <Input id="projectDomain" name="domain" placeholder="exemplo.com" />
                          </div>
                          <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="projectDescription">Descrição</Label>
                            <Textarea id="projectDescription" name="description" rows={3} />
                          </div>
                        </div>
                        <div className="flex space-x-3">
                          <Button type="submit" disabled={createProjectMutation.isPending}>
                            {createProjectMutation.isPending ? "Salvando..." : "Salvar"}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowAddProjectForm(false)}
                          >
                            Cancelar
                          </Button>
                        </div>
                      </form>
                    </CardContent>
                  </Card>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {projects.map((project: any) => (
                    <Card key={project.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                              <FolderOpen className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <CardTitle className="text-lg">{project.name}</CardTitle>
                              <p className="text-xs text-muted-foreground font-mono">ID: {project.id}</p>
                              {project.domain && (
                                <p className="text-sm text-muted-foreground">{project.domain}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingProject(project)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteProject(project.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {project.description && (
                          <p className="text-sm text-muted-foreground mb-4">{project.description}</p>
                        )}
                        <div className="text-xs text-muted-foreground">
                          Criado em: {new Date(project.createdAt).toLocaleDateString('pt-BR')}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Edit Project Modal */}
                {editingProject && (
                  <Card className="mt-6">
                    <CardHeader>
                      <CardTitle>Editar Projeto - {editingProject.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={(e) => {
                        e.preventDefault();
                        const formData = new FormData(e.currentTarget);
                        const projectData = {
                          id: parseInt(formData.get("id") as string),
                          name: formData.get("name") as string,
                          domain: formData.get("domain") as string,
                          description: formData.get("description") as string,
                        };
                        handleUpdateProject(editingProject.id, projectData);
                      }} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="editProjectId">ID do Projeto</Label>
                            <Input id="editProjectId" name="id" type="number" defaultValue={editingProject.id} required />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="editProjectName">Nome do Projeto</Label>
                            <Input id="editProjectName" name="name" defaultValue={editingProject.name} required />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="editProjectDomain">Domínio do Projeto</Label>
                            <Input id="editProjectDomain" name="domain" defaultValue={editingProject.domain || ""} placeholder="exemplo.com" />
                          </div>
                          <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="editProjectDescription">Descrição</Label>
                            <Textarea id="editProjectDescription" name="description" defaultValue={editingProject.description || ""} rows={3} />
                          </div>
                        </div>
                        <div className="flex space-x-3">
                          <Button type="submit" disabled={updateProjectMutation.isPending}>
                            {updateProjectMutation.isPending ? "Salvando..." : "Salvar"}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setEditingProject(null)}
                          >
                            Cancelar
                          </Button>
                        </div>
                      </form>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          </div>
        );

      case "request-creative":
        if (!user?.isGestor && !user?.isAdmin) return <div>Acesso negado</div>;
        
        const availableProjects = projects;
        
        return (
          <Card>
            <CardHeader>
              <CardTitle>Solicitar Criativo</CardTitle>
              <CardDescription>Faça uma nova solicitação de criativo</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateCreativeRequest} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="project">Projeto</Label>
                    <Select name="projectId" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um projeto" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableProjects.map((project: any) => (
                          <SelectItem key={project.id} value={project.id.toString()}>
                            {project.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="type">Tipo de Criativo</Label>
                    <Select name="type" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="image">Imagem</SelectItem>
                        <SelectItem value="video">Vídeo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="language">Idioma</Label>
                    <Select name="languageId" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um idioma" />
                      </SelectTrigger>
                      <SelectContent>
                        {(languages as any[]).map((lang: any) => (
                          <SelectItem key={lang.id} value={lang.id.toString()}>
                            {lang.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="format">Formato</Label>
                    <Select name="formatId" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um formato" />
                      </SelectTrigger>
                      <SelectContent>
                        {(formats as any[]).map((format: any) => (
                          <SelectItem key={format.id} value={format.id.toString()}>
                            {format.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="title">Título do Criativo</Label>
                    <Input id="title" name="title" required />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="deadline">Prazo (Opcional)</Label>
                    <Input id="deadline" name="deadline" type="date" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição/Instruções</Label>
                  <Textarea 
                    id="description" 
                    name="description" 
                    rows={4} 
                    placeholder="Descreva como você quer o criativo..."
                    required 
                  />
                </div>

                <Button type="submit" disabled={createCreativeRequestMutation.isPending}>
                  {createCreativeRequestMutation.isPending ? "Enviando..." : "Solicitar Criativo"}
                </Button>
              </form>
            </CardContent>
          </Card>
        );

      case "creatives-progress":
        if (!user?.isGestor && !user?.isAdmin) return <div>Acesso negado</div>;
        
        const progressCreatives = creativeRequests.filter((req: any) => 
          req.status === "em_progresso" && req.requestedById === user?.id
        );
        
        return (
          <Card>
            <CardHeader>
              <CardTitle>Criativos em Andamento</CardTitle>
              <CardDescription>Criativos que estão sendo desenvolvidos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {progressCreatives.map((request: any) => (
                  <div key={request.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">{request.title}</h3>
                        <p className="text-sm text-muted-foreground">{request.description}</p>
                        <div className="flex items-center gap-4 mt-2">
                          <Badge variant="default">
                            <Play className="w-3 h-3 mr-1" />
                            Em Progresso
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            Tipo: {request.type === "image" ? "Imagem" : "Vídeo"}
                          </span>
                        </div>
                      </div>
                      {request.assignedToId && (
                        <div className="text-sm text-muted-foreground">
                          Editor responsável: {getUserName(request.assignedToId)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {progressCreatives.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhum criativo em andamento
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        );

      case "creatives-done":
        if (!user?.isGestor && !user?.isAdmin) return <div>Acesso negado</div>;
        
        const doneCreatives = creativeRequests.filter((req: any) => 
          req.status === "pronto" && req.requestedById === user?.id
        ).sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        
        return (
          <Card>
            <CardHeader>
              <CardTitle>Criativos Prontos</CardTitle>
              <CardDescription>Criativos finalizados pelos editores</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {doneCreatives.map((request: any) => (
                  <div key={request.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">{request.title}</h3>
                        <p className="text-sm text-muted-foreground">{request.description}</p>
                        <div className="flex items-center gap-4 mt-2">
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Pronto
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            Tipo: {request.type === "image" ? "Imagem" : "Vídeo"}
                          </span>
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground text-right">
                        {request.assignedToId && (
                          <div>Finalizado por: {getUserName(request.assignedToId)}</div>
                        )}
                        <div>Data: {new Date(request.updatedAt).toLocaleDateString('pt-BR')}</div>
                      </div>
                    </div>
                  </div>
                ))}
                {doneCreatives.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhum criativo finalizado
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        );

      case "requested-creatives":
        if (!user?.isEditor && !user?.isAdmin) return <div>Acesso negado</div>;
        
        const requestedCreatives = creativeRequests.filter((req: any) => 
          req.status === "solicitado" || req.assignedToId === user?.id
        ).sort((a: any, b: any) => {
          // Priorizar "solicitado" sobre outros status
          if (a.status === "solicitado" && b.status !== "solicitado") return -1;
          if (b.status === "solicitado" && a.status !== "solicitado") return 1;
          // Por data (mais recente primeiro)
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
        
        return (
          <Card>
            <CardHeader>
              <CardTitle>Criativos Solicitados</CardTitle>
              <CardDescription>Solicitações de criativos dos gestores</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {requestedCreatives.map((request: any) => {
                  const project = projects.find((p: any) => p.id === request.projectId);
                  return (
                    <div key={request.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-medium">{request.title}</h3>
                            <Badge variant={getStatusBadgeVariant(request.status)}>
                              {getStatusText(request.status)}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{request.description}</p>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="font-medium">Projeto:</span> {project?.name || 'N/A'}
                            </div>
                            <div>
                              <span className="font-medium">Tipo:</span> {request.type === "image" ? "Imagem" : "Vídeo"}
                            </div>
                            {request.languageId && (
                              <div>
                                <span className="font-medium">Idioma:</span> {(languages as any[])?.find((l: any) => l.id === request.languageId)?.name || "N/A"}
                              </div>
                            )}
                            {request.formatId && (
                              <div>
                                <span className="font-medium">Formato:</span> {(formats as any[])?.find((f: any) => f.id === request.formatId)?.name || "N/A"}
                              </div>
                            )}
                            <div>
                              <span className="font-medium">Solicitado por:</span> {getUserName(request.requestedById)}
                            </div>
                            {request.assignedToId && (
                              <div>
                                <span className="font-medium">Atribuído a:</span> {getUserName(request.assignedToId)}
                              </div>
                            )}
                            <div>
                              <span className="font-medium">Data:</span> {new Date(request.createdAt).toLocaleDateString('pt-BR')}
                            </div>
                          </div>
                          {request.deadline && (
                            <div className="mt-2 text-sm">
                              <span className="font-medium">Prazo:</span> {new Date(request.deadline).toLocaleDateString('pt-BR')}
                            </div>
                          )}
                        </div>
                        <div className="ml-4 space-y-2">
                          {request.status === "solicitado" && (
                            <Button
                              size="sm"
                              onClick={() => updateCreativeStatusMutation.mutate({
                                id: request.id,
                                status: "em_progresso",
                                assignedToId: user?.id
                              })}
                              disabled={updateCreativeStatusMutation.isPending}
                            >
                              Aceitar
                            </Button>
                          )}
                          {request.status === "em_progresso" && request.assignedToId === user?.id && (
                            <div className="space-y-2">
                              <div>
                                <input
                                  type="file"
                                  accept={request.type === "video" ? "video/*" : "image/*"}
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      setUploadedFiles(prev => ({
                                        ...prev,
                                        [request.id]: file
                                      }));
                                      toast({
                                        title: "Arquivo selecionado",
                                        description: `${file.name} foi selecionado para upload.`,
                                      });
                                    }
                                  }}
                                  className="hidden"
                                  id={`file-upload-${request.id}`}
                                />
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => document.getElementById(`file-upload-${request.id}`)?.click()}
                                >
                                  <Upload className="h-4 w-4 mr-1" />
                                  Upload {request.type === "video" ? "Vídeo" : "Imagem"}
                                </Button>
                              </div>
                              {uploadedFiles[request.id] && (
                                <div className="text-xs text-green-600">
                                  Arquivo: {uploadedFiles[request.id]?.name}
                                </div>
                              )}
                              <Button
                                size="sm"
                                onClick={() => updateCreativeStatusMutation.mutate({
                                  id: request.id,
                                  status: "pronto"
                                })}
                                disabled={updateCreativeStatusMutation.isPending || !uploadedFiles[request.id]}
                              >
                                Marcar como Pronto
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {requestedCreatives.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhuma solicitação de criativo disponível
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        );

      case "my-creative-requests":
        const myRequests = creativeRequests?.filter((request: any) => request.requestedById === user?.id) || [];
        
        const solicitados = myRequests.filter((r: any) => r.status === "solicitado").sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        const emProgresso = myRequests.filter((r: any) => r.status === "em_progresso").sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        const prontos = myRequests.filter((r: any) => r.status === "pronto").sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

        const toggleSection = (section: string) => {
          setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
          }));
        };

        const renderCreativeItem = (request: any) => {
          const project = projects.find((p: any) => p.id === request.projectId);
          return (
            <div key={request.id} className="p-4 border rounded-lg bg-white">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-medium">{request.title}</h3>
                    <Badge 
                      className={request.status === "pronto" ? "bg-green-500 text-white hover:bg-green-600" : ""}
                      variant={request.status === "pronto" ? "default" : getStatusBadgeVariant(request.status)}
                    >
                      {getStatusText(request.status)}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{request.description}</p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Projeto:</span> {project?.name || 'N/A'}
                    </div>
                    <div>
                      <span className="font-medium">Tipo:</span> {request.type === "image" ? "Imagem" : "Vídeo"}
                    </div>
                    {request.assignedToId && (
                      <div>
                        <span className="font-medium">Atribuído a:</span> {getUserName(request.assignedToId)}
                      </div>
                    )}
                    <div>
                      <span className="font-medium">Data:</span> {new Date(request.createdAt).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                  {request.deadline && (
                    <div className="mt-2 text-sm">
                      <span className="font-medium">Prazo:</span> {new Date(request.deadline).toLocaleDateString('pt-BR')}
                    </div>
                  )}
                </div>
                <div className="ml-4 space-y-2">
                  {request.status === "solicitado" && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingCreative(request)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Editar
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          if (confirm("Tem certeza que deseja excluir este pedido?")) {
                            deleteCreativeMutation.mutate(request.id);
                          }
                        }}
                        disabled={deleteCreativeMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Excluir
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        };
        
        return (
          <Card>
            <CardHeader>
              <CardTitle>Meus Pedidos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Criativos Solicitados */}
              {solicitados.length > 0 && (
                <div className="border rounded-lg">
                  <div 
                    className="p-4 cursor-pointer hover:bg-gray-50 flex items-center justify-between"
                    onClick={() => toggleSection('solicitados')}
                  >
                    <div className="flex items-center gap-2">
                      {expandedSections.solicitados ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      <h3 className="font-medium">Criativos Solicitados ({solicitados.length})</h3>
                    </div>
                  </div>
                  {expandedSections.solicitados && (
                    <div className="border-t p-4 space-y-3">
                      {solicitados.map(renderCreativeItem)}
                    </div>
                  )}
                </div>
              )}

              {/* Criativos em Progresso */}
              {emProgresso.length > 0 && (
                <div className="border rounded-lg">
                  <div 
                    className="p-4 cursor-pointer hover:bg-gray-50 flex items-center justify-between"
                    onClick={() => toggleSection('progresso')}
                  >
                    <div className="flex items-center gap-2">
                      {expandedSections.progresso ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      <h3 className="font-medium">Criativos em Progresso ({emProgresso.length})</h3>
                    </div>
                  </div>
                  {expandedSections.progresso && (
                    <div className="border-t p-4 space-y-3">
                      {emProgresso.map(renderCreativeItem)}
                    </div>
                  )}
                </div>
              )}

              {/* Criativos Prontos */}
              {prontos.length > 0 && (
                <div className="border rounded-lg">
                  <div 
                    className="p-4 cursor-pointer hover:bg-gray-50 flex items-center justify-between"
                    onClick={() => toggleSection('prontos')}
                  >
                    <div className="flex items-center gap-2">
                      {expandedSections.prontos ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      <h3 className="font-medium text-green-600">Criativos Prontos ({prontos.length})</h3>
                    </div>
                  </div>
                  {expandedSections.prontos && (
                    <div className="border-t p-4 space-y-3">
                      {prontos.map(renderCreativeItem)}
                    </div>
                  )}
                </div>
              )}
              
              {myRequests.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  Você ainda não fez nenhuma solicitação de criativo
                </p>
              )}
            </CardContent>
          </Card>
        );

      case "configurations":
        if (!user?.isAdmin) return <div>Acesso negado</div>;
        
        return (
          <div className="space-y-6">

            {/* Estatísticas do Sistema */}
            <Card>
              <CardHeader>
                <div 
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => setExpandedSections(prev => ({ ...prev, stats: !prev.stats }))}
                >
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {expandedSections.stats ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      Estatísticas do Sistema
                    </CardTitle>
                    <CardDescription>Dados gerais do sistema</CardDescription>
                  </div>
                </div>
              </CardHeader>
              {expandedSections.stats && (
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatsCard
                      title="Criativos Pendentes"
                      value={stats.pending || 0}
                      icon={Clock}
                      description="Aguardando atribuição"
                      className="bg-orange-50 dark:bg-orange-950"
                    />
                    <StatsCard
                      title="Em Produção"
                      value={stats.progress || 0}
                      icon={Play}
                      description="Sendo desenvolvidos"
                      className="bg-blue-50 dark:bg-blue-950"
                    />
                    <StatsCard
                      title="Finalizados"
                      value={stats.completed || 0}
                      icon={CheckCircle}
                      description="Concluídos este mês"
                      className="bg-green-50 dark:bg-green-950"
                    />
                    <StatsCard
                      title="Total de Usuários"
                      value={stats.users || 0}
                      icon={Users}
                      description="Ativos no sistema"
                      className="bg-purple-50 dark:bg-purple-950"
                    />
                  </div>
                </CardContent>
              )}
            </Card>

            {/* Todos os Pedidos */}
            <Card>
              <CardHeader>
                <div 
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => setExpandedSections(prev => ({ ...prev, allRequests: !prev.allRequests }))}
                >
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {expandedSections.allRequests ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      Todos os Pedidos
                    </CardTitle>
                    <CardDescription>Visualize e gerencie todos os pedidos de criativos</CardDescription>
                  </div>
                </div>
              </CardHeader>
              {expandedSections.allRequests && (
                <CardContent>
                  <div className="space-y-4">
                    {(creativeRequests as any[]).filter((request: any) => 
                      request.status === "solicitado"
                    ).map((request: any) => (
                      <div key={request.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold">{request.title}</h3>
                            <p className="text-sm text-muted-foreground">
                              Solicitado por: {getUserName(request.requestedById)}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Projeto: {(projects as any[]).find((p: any) => p.id === request.projectId)?.name || "Projeto não encontrado"}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Tipo: {request.type}
                            </p>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingCreative(request)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteCreativeRequest(request.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                    {(creativeRequests as any[]).filter((request: any) => request.status === "solicitado").length === 0 && (
                      <p className="text-center text-muted-foreground py-8">
                        Nenhum pedido encontrado
                      </p>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>

            {/* Todos os Andamentos */}
            <Card>
              <CardHeader>
                <div 
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => setExpandedSections(prev => ({ ...prev, allProgress: !prev.allProgress }))}
                >
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {expandedSections.allProgress ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      Todos os Andamentos
                    </CardTitle>
                    <CardDescription>Visualize todos os criativos em andamento</CardDescription>
                  </div>
                </div>
              </CardHeader>
              {expandedSections.allProgress && (
                <CardContent>
                  <div className="space-y-4">
                    {(creativeRequests as any[]).filter((request: any) => 
                      request.status === "em_progresso"
                    ).map((request: any) => (
                      <div key={request.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold">{request.title}</h3>
                            <p className="text-sm text-muted-foreground">
                              Solicitado por: {getUserName(request.requestedById)}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Atribuído para: {getUserName(request.assignedToId)}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Projeto: {(projects as any[]).find((p: any) => p.id === request.projectId)?.name || "Projeto não encontrado"}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Tipo: {request.type}
                            </p>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingCreative(request)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteCreativeRequest(request.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                    {(creativeRequests as any[]).filter((request: any) => request.status === "em_progresso").length === 0 && (
                      <p className="text-center text-muted-foreground py-8">
                        Nenhum criativo em andamento
                      </p>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>

            {/* Todos os Criativos Prontos */}
            <Card>
              <CardHeader>
                <div 
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => setExpandedSections(prev => ({ ...prev, allCompleted: !prev.allCompleted }))}
                >
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {expandedSections.allCompleted ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      Todos os Criativos Prontos
                    </CardTitle>
                    <CardDescription>Visualize todos os criativos finalizados</CardDescription>
                  </div>
                </div>
              </CardHeader>
              {expandedSections.allCompleted && (
                <CardContent>
                  <div className="space-y-4">
                    {(creativeRequests as any[]).filter((request: any) => 
                      request.status === "pronto"
                    ).sort((a: any, b: any) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime())
                    .map((request: any) => (
                      <div key={request.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold">{request.title}</h3>
                            <p className="text-sm text-muted-foreground">
                              Solicitado por: {getUserName(request.requestedById)}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Finalizado por: {getUserName(request.assignedToId)}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Projeto: {(projects as any[]).find((p: any) => p.id === request.projectId)?.name || "Projeto não encontrado"}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Tipo: {request.type}
                            </p>
                          </div>
                          <div className="flex space-x-2">
                            <Badge className="bg-green-600 text-white">
                              Pronto
                            </Badge>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteCreativeRequest(request.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                    {(creativeRequests as any[]).filter((request: any) => request.status === "pronto").length === 0 && (
                      <p className="text-center text-muted-foreground py-8">
                        Nenhum criativo finalizado
                      </p>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>

            {/* Editar Idiomas */}
            <Card>
              <CardHeader>
                <div 
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => setExpandedSections(prev => ({ ...prev, languages: !prev.languages }))}
                >
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {expandedSections.languages ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      Editar Idiomas
                    </CardTitle>
                    <CardDescription>Gerencie os idiomas disponíveis para criativos</CardDescription>
                  </div>
                </div>
              </CardHeader>
              {expandedSections.languages && (
                <CardContent>
                  <div className="space-y-4">
                    <Button onClick={() => setShowAddLanguageForm(true)}>
                      Adicionar Idioma
                    </Button>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {(languages as any[]).map((lang: any) => (
                        <div key={lang.id} className="border rounded-lg p-3 flex justify-between items-center">
                          <div>
                            <span className="font-medium">{lang.name}</span>
                            <span className="text-sm text-muted-foreground ml-2">ID: {lang.id}</span>
                          </div>
                          <div className="flex space-x-2">
                            <Button size="sm" variant="outline" onClick={() => setEditingLanguage(lang)}>
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleDeleteLanguage(lang.id)} className="text-red-600">
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                    {(languages as any[]).length === 0 && (
                      <p className="text-center text-muted-foreground py-8">
                        Nenhum idioma criado ainda
                      </p>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>

            {/* Formato */}
            <Card>
              <CardHeader>
                <div 
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => setExpandedSections(prev => ({ ...prev, formats: !prev.formats }))}
                >
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {expandedSections.formats ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      Formato
                    </CardTitle>
                    <CardDescription>Gerencie os formatos disponíveis para criativos</CardDescription>
                  </div>
                </div>
              </CardHeader>
              {expandedSections.formats && (
                <CardContent>
                  <div className="space-y-4">
                    <Button onClick={() => setShowAddFormatForm(true)}>
                      Adicionar Formato
                    </Button>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {(formats as any[]).map((format: any) => (
                        <div key={format.id} className="border rounded-lg p-3 flex justify-between items-center">
                          <div>
                            <span className="font-medium">{format.name}</span>
                            <span className="text-sm text-muted-foreground ml-2">ID: {format.id}</span>
                          </div>
                          <div className="flex space-x-2">
                            <Button size="sm" variant="outline" onClick={() => setEditingFormat(format)}>
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleDeleteFormat(format.id)} className="text-red-600">
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                    {(formats as any[]).length === 0 && (
                      <p className="text-center text-muted-foreground py-8">
                        Nenhum formato personalizado criado
                      </p>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>

            {/* Reset All Data - Em último lugar e menor */}
            <Card className="border-red-200 dark:border-red-800">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-red-600 text-lg">
                      <RotateCcw className="w-4 h-4 text-red-600" />
                      Resetar Todos os Dados
                    </CardTitle>
                    <CardDescription className="text-sm">
                      Remove todos os projetos, criativos e pedidos do sistema
                    </CardDescription>
                  </div>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={handleResetAllData}
                    disabled={resetAllDataMutation.isPending}
                    className="text-xs px-3 py-1"
                  >
                    <RotateCcw className="w-3 h-3 mr-1" />
                    {resetAllDataMutation.isPending ? "Resetando..." : "Resetar"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-red-50 dark:bg-red-950 rounded-lg p-3 border border-red-200 dark:border-red-800">
                  <p className="text-red-700 dark:text-red-300 text-xs">
                    <strong>Atenção:</strong> Esta ação irá remover permanentemente todos os projetos, 
                    criativos em andamento, criativos prontos e pedidos. Esta operação não pode ser desfeita.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case "performance":
        return (
          <Card>
            <CardHeader>
              <CardTitle>Performance de Criativos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
                  <Clock className="h-8 w-8 text-yellow-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Área em Manutenção</h3>
                <p className="text-gray-600 mb-1">
                  Esta seção está sendo desenvolvida e estará disponível em breve.
                </p>
                <p className="text-sm text-gray-500">
                  Aqui você poderá visualizar métricas e relatórios de performance dos criativos.
                </p>
              </div>
            </CardContent>
          </Card>
        );

      default:
        return <div>Seção em desenvolvimento</div>;
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar 
        currentView={currentView} 
        onViewChange={(view) => setCurrentView(view as DashboardView)} 
      />
      <main className="flex-1 ml-64 p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          <header className="mb-8">
            <h1 className="text-3xl font-bold">
              {currentView === "dashboard" && "Dashboard"}
              {currentView === "users" && "Gerenciar Usuários"}
              {currentView === "projects" && "Gerenciar Projetos"}
              {currentView === "request-creative" && "Solicitar Criativo"}
              {currentView === "creatives-progress" && "Criativos em Andamento"}
              {currentView === "creatives-done" && "Criativos Prontos"}
              {currentView === "my-creative-requests" && "Meus Pedidos"}
              {currentView === "configurations" && "Configurações"}
              {currentView === "requested-creatives" && "Criativos Solicitados"}
              {currentView === "performance" && "Performance de Criativos"}
            </h1>
          </header>
          {renderContent()}
        </div>
      </main>

      {/* Modal de Edição de Criativo */}
      <Dialog open={!!editingCreative} onOpenChange={() => setEditingCreative(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Criativo</DialogTitle>
          </DialogHeader>
          {editingCreative && (
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const updateData = {
                title: formData.get("title") as string,
                description: formData.get("description") as string,
                type: formData.get("type") as string,
                deadline: formData.get("deadline") ? new Date(formData.get("deadline") as string) : null,
              };
              updateCreativeMutation.mutate({ id: editingCreative.id, data: updateData });
            }} className="space-y-4">
              <div>
                <Label htmlFor="title">Título</Label>
                <Input 
                  id="title" 
                  name="title" 
                  defaultValue={editingCreative.title}
                  required 
                />
              </div>
              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea 
                  id="description" 
                  name="description" 
                  defaultValue={editingCreative.description}
                  required 
                />
              </div>
              <div>
                <Label htmlFor="type">Tipo</Label>
                <Select name="type" defaultValue={editingCreative.type}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="image">Imagem</SelectItem>
                    <SelectItem value="video">Vídeo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="deadline">Prazo (opcional)</Label>
                <Input 
                  id="deadline" 
                  name="deadline" 
                  type="date"
                  defaultValue={editingCreative.deadline ? new Date(editingCreative.deadline).toISOString().split('T')[0] : ''}
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={updateCreativeMutation.isPending}>
                  Salvar Alterações
                </Button>
                <Button type="button" variant="outline" onClick={() => setEditingCreative(null)}>
                  Cancelar
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal para Adicionar Idioma */}
      <Dialog open={showAddLanguageForm} onOpenChange={setShowAddLanguageForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Novo Idioma</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            const languageData = {
              id: parseInt(formData.get("id") as string),
              name: formData.get("name") as string,
            };
            createLanguageMutation.mutate(languageData);
          }} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="languageId">ID do Idioma</Label>
              <Input id="languageId" name="id" type="number" required placeholder="Ex: 1" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="languageName">Nome do Idioma</Label>
              <Input id="languageName" name="name" required placeholder="Ex: Português - Brasil" />
            </div>
            <div className="flex space-x-3">
              <Button type="submit" disabled={createLanguageMutation.isPending}>
                {createLanguageMutation.isPending ? "Criando..." : "Criar Idioma"}
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowAddLanguageForm(false)}>
                Cancelar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal para Adicionar Formato */}
      <Dialog open={showAddFormatForm} onOpenChange={setShowAddFormatForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Novo Formato</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            const formatData = {
              id: parseInt(formData.get("id") as string),
              name: formData.get("name") as string,
            };
            createFormatMutation.mutate(formatData);
          }} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="formatId">ID do Formato</Label>
              <Input id="formatId" name="id" type="number" required placeholder="Ex: 1" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="formatName">Nome do Formato</Label>
              <Input id="formatName" name="name" required placeholder="Ex: 16:9, Square, Stories" />
            </div>
            <div className="flex space-x-3">
              <Button type="submit" disabled={createFormatMutation.isPending}>
                {createFormatMutation.isPending ? "Criando..." : "Criar Formato"}
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowAddFormatForm(false)}>
                Cancelar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal para Editar Idioma */}
      {editingLanguage && (
        <Dialog open={!!editingLanguage} onOpenChange={() => setEditingLanguage(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Idioma</DialogTitle>
            </DialogHeader>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const updateData = {
                id: parseInt(formData.get("id") as string),
                name: formData.get("name") as string,
              };
              updateLanguageMutation.mutate({ id: editingLanguage.id, data: updateData });
            }} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="editLanguageId">ID do Idioma</Label>
                <Input id="editLanguageId" name="id" type="number" defaultValue={editingLanguage.id} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editLanguageName">Nome do Idioma</Label>
                <Input id="editLanguageName" name="name" defaultValue={editingLanguage.name} required />
              </div>
              <div className="flex space-x-3">
                <Button type="submit" disabled={updateLanguageMutation.isPending}>
                  {updateLanguageMutation.isPending ? "Salvando..." : "Salvar Alterações"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setEditingLanguage(null)}>
                  Cancelar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal para Editar Formato */}
      {editingFormat && (
        <Dialog open={!!editingFormat} onOpenChange={() => setEditingFormat(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Formato</DialogTitle>
            </DialogHeader>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const updateData = {
                id: parseInt(formData.get("id") as string),
                name: formData.get("name") as string,
              };
              updateFormatMutation.mutate({ id: editingFormat.id, data: updateData });
            }} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="editFormatId">ID do Formato</Label>
                <Input id="editFormatId" name="id" type="number" defaultValue={editingFormat.id} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editFormatName">Nome do Formato</Label>
                <Input id="editFormatName" name="name" defaultValue={editingFormat.name} required />
              </div>
              <div className="flex space-x-3">
                <Button type="submit" disabled={updateFormatMutation.isPending}>
                  {updateFormatMutation.isPending ? "Salvando..." : "Salvar Alterações"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setEditingFormat(null)}>
                  Cancelar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}