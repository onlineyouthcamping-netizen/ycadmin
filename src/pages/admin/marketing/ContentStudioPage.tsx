import React, { useEffect, useState } from "react";
import { 
  Lightbulb, Film, Clock, CheckCircle, Send, Plus, Filter, 
  Search, ArrowRight, BookOpen, AlertCircle, Edit, MoreVertical,
  Calendar, FileText, Image, Check, AlertTriangle, User,
  ChevronLeft, ChevronRight, X, ArrowLeft, Upload, Paperclip, 
  CheckSquare, Trash2, ShieldAlert, Loader2
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { marketingService, Idea } from "@/services/marketing.service";

export default function ContentStudioPage() {
  const [activeTab, setActiveTab] = useState("ideas");
  const [viewMode, setViewMode] = useState<'list' | 'add' | 'edit'>('list');
  const [loading, setLoading] = useState(true);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [stats, setStats] = useState<any>(null);
  
  // Active editing ID
  const [editingId, setEditingId] = useState<string | null>(null);

  // Filter States
  const [tripFilter, setTripFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Detailed Form State for Add / Edit
  const [formTitle, setFormTitle] = useState("");
  const [formTrip, setFormTrip] = useState("Manali Kasol Amritsar (MKA)");
  const [formContentType, setFormContentType] = useState("Video");
  const [formCategory, setFormCategory] = useState("Reel");
  const [formPlatform, setFormPlatform] = useState("Instagram");
  const [formPriority, setFormPriority] = useState("Medium");
  const [formTargetAudience, setFormTargetAudience] = useState("Solo Travelers");
  const [formSummary, setFormSummary] = useState("");
  
  const [formKeyMessage, setFormKeyMessage] = useState("");
  const [formLinks, setFormLinks] = useState<string[]>([""]);
  const [formHook, setFormHook] = useState("");
  const [formCta, setFormCta] = useState("");
  
  const [formAssignedTo, setFormAssignedTo] = useState("Vidhi Patel");
  const [formScriptDate, setFormScriptDate] = useState("");
  const [formShootDate, setFormShootDate] = useState("");
  const [formPublishDate, setFormPublishDate] = useState("");
  const [formNotes, setFormNotes] = useState("");

  // Checklist & Attachments state
  const [checklist, setChecklist] = useState([
    { id: 1, text: "Competitor reference checked", checked: true },
    { id: 2, text: "Location / Permissions required", checked: false },
    { id: 3, text: "Talent / Influencer required", checked: false },
    { id: 4, text: "Drone / Special equipment required", checked: false },
    { id: 5, text: "Budget to be considered", checked: false }
  ]);
  const [newChecklistItem, setNewChecklistItem] = useState("");
  const [attachments, setAttachments] = useState<{name: string, size: string}[]>([
    { name: "Manali_References.pdf", size: "2.4 MB" }
  ]);

  const loadStudioData = async () => {
    setLoading(true);
    try {
      const res = await marketingService.getContentStudio();
      setIdeas(res.ideas);
      setStats(res.stats);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load Content Studio data");
    } finally {
      setViewMode('list');
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudioData();
  }, []);

  const handleResetFilters = () => {
    setTripFilter("all");
    setCategoryFilter("all");
    setPriorityFilter("all");
    setStatusFilter("all");
    setSearchQuery("");
    toast.info("Filters reset");
  };

  const handleAddLinkInput = () => {
    setFormLinks([...formLinks, ""]);
  };

  const handleLinkInputChange = (index: number, val: string) => {
    const updated = [...formLinks];
    updated[index] = val;
    setFormLinks(updated);
  };

  const handleAddChecklistItem = () => {
    if (!newChecklistItem.trim()) return;
    setChecklist([...checklist, {
      id: Date.now(),
      text: newChecklistItem,
      checked: false
    }]);
    setNewChecklistItem("");
  };

  const toggleChecklist = (id: number) => {
    setChecklist(checklist.map(item => item.id === id ? { ...item, checked: !item.checked } : item));
  };

  const handleUploadClick = () => {
    const name = `Ref_${Math.floor(Math.random() * 1000)}.jpg`;
    setAttachments([...attachments, { name, size: "1.2 MB" }]);
    toast.success("Moodboard / Image attached!");
  };

  const enterAddMode = () => {
    setFormTitle("");
    setFormTrip("Manali Kasol Amritsar (MKA)");
    setFormContentType("Video");
    setFormCategory("Reel");
    setFormPlatform("Instagram");
    setFormPriority("Medium");
    setFormTargetAudience("Solo Travelers");
    setFormSummary("");
    setFormKeyMessage("");
    setFormLinks([""]);
    setFormHook("");
    setFormCta("");
    setFormAssignedTo("Vidhi Patel");
    setFormScriptDate("");
    setFormShootDate("");
    setFormPublishDate("");
    setFormNotes("");
    setEditingId(null);
    setChecklist([
      { id: 1, text: "Competitor reference checked", checked: false },
      { id: 2, text: "Location / Permissions required", checked: false },
      { id: 3, text: "Talent / Influencer required", checked: false },
      { id: 4, text: "Drone / Special equipment required", checked: false },
      { id: 5, text: "Budget to be considered", checked: false }
    ]);
    setViewMode('add');
  };

  const enterEditMode = (idea: any) => {
    setEditingId(idea.id);
    setFormTitle(idea.title);
    setFormTrip(idea.trip);
    setFormCategory(idea.category);
    setFormPriority(idea.priority);
    setFormAssignedTo(idea.assignedTo);
    setFormSummary(idea.description);
    
    // Fallbacks for extra attributes
    setFormContentType(idea.contentType || "Video");
    setFormPlatform(idea.platform || "Instagram");
    setFormTargetAudience(idea.targetAudience || "Solo Travelers");
    setFormKeyMessage(idea.keyMessage || "");
    setFormLinks(idea.links || [""]);
    setFormHook(idea.suggestedHook || "");
    setFormCta(idea.cta || "");
    setFormScriptDate(idea.expectedScriptDate || "");
    setFormShootDate(idea.expectedShootDate || "");
    setFormPublishDate(idea.expectedPublishDate || "");
    setFormNotes(idea.notes || "");
    
    if (idea.checklist) {
      setChecklist(idea.checklist);
    }
    setViewMode('edit');
  };

  const handleSave = async (submitStatus: 'Draft' | 'Script Writing') => {
    if (!formTitle.trim()) {
      toast.error("Please enter a title");
      return;
    }

    const payload = {
      title: formTitle,
      description: formSummary,
      trip: formTrip,
      category: formCategory,
      priority: formPriority,
      status: submitStatus,
      assignedTo: formAssignedTo,
      contentType: formContentType,
      platform: formPlatform,
      targetAudience: formTargetAudience,
      keyMessage: formKeyMessage,
      links: formLinks,
      suggestedHook: formHook,
      cta: formCta,
      expectedScriptDate: formScriptDate,
      expectedShootDate: formShootDate,
      expectedPublishDate: formPublishDate,
      notes: formNotes,
      checklist
    };

    try {
      setLoading(true);
      if (viewMode === 'edit' && editingId) {
        await marketingService.updateIdea(editingId, payload);
        toast.success("Content idea updated successfully!");
      } else {
        await marketingService.createIdea(payload);
        toast.success(`New idea registered as ${submitStatus}!`);
      }
      loadStudioData();
    } catch (err) {
      console.error(err);
      toast.error("Failed to save Content Studio idea");
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this idea?")) return;
    try {
      setLoading(true);
      await marketingService.deleteIdea(id);
      toast.success("Idea removed from dashboard");
      loadStudioData();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete idea");
      setLoading(false);
    }
  };

  // Filter Logic
  const filteredIdeas = ideas.filter(idea => {
    const matchesSearch = 
      idea.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      idea.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesTrip = tripFilter === "all" || idea.trip.includes(tripFilter) || (tripFilter === "MKA" && idea.trip.includes("MKA"));
    const matchesCategory = categoryFilter === "all" || idea.category.toLowerCase() === categoryFilter.toLowerCase();
    const matchesPriority = priorityFilter === "all" || idea.priority.toLowerCase() === priorityFilter.toLowerCase();
    const matchesStatus = statusFilter === "all" || idea.status.toLowerCase().replace(/\s/g, "") === statusFilter.toLowerCase().replace(/\s/g, "");

    return matchesSearch && matchesTrip && matchesCategory && matchesPriority && matchesStatus;
  });

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#FF6B00]"></div>
      </div>
    );
  }

  // Get icon for categories
  const getCategoryIcon = (cat: string) => {
    switch (cat.toLowerCase()) {
      case "reel":
        return <Film className="w-3.5 h-3.5 text-[#8B5CF6]" />;
      case "poster":
        return <Image className="w-3.5 h-3.5 text-[#3B82F6]" />;
      case "carousel":
        return <BookOpen className="w-3.5 h-3.5 text-[#EC4899]" />;
      case "teaser":
        return <Film className="w-3.5 h-3.5 text-[#F59E0B]" />;
      default:
        return <FileText className="w-3.5 h-3.5 text-slate-450" />;
    }
  };

  const getPriorityBadgeColor = (prio: string) => {
    switch (prio.toLowerCase()) {
      case "high":
        return "text-rose-600 font-bold bg-transparent border-0 p-0 text-xs";
      case "medium":
        return "text-amber-600 font-bold bg-transparent border-0 p-0 text-xs";
      case "low":
        return "text-emerald-600 font-bold bg-transparent border-0 p-0 text-xs";
      default:
        return "text-slate-600 bg-transparent border-0 p-0 text-xs";
    }
  };

  const getStatusBadgeStyles = (status: string) => {
    switch (status.toLowerCase()) {
      case "script writing":
        return "bg-blue-50 text-blue-750 border-blue-205";
      case "waiting approval":
        return "bg-amber-50 text-amber-755 border-amber-205";
      case "script done":
        return "bg-purple-50 text-purple-750 border-purple-205";
      case "new idea":
      case "draft":
        return "bg-cyan-50 text-cyan-755 border-cyan-205";
      default:
        return "bg-slate-50 text-slate-650 border-slate-205";
    }
  };

  return (
    <div className="p-6 space-y-6 font-sans bg-[#F8FAFC] min-h-screen text-[#1E293B] -mx-6 -my-6">
      
      {viewMode === 'list' ? (
        <>
          {/* Main List Workspace */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-[#E2E8F0] pb-4 bg-white -mx-6 -mt-6 p-6 shadow-xs">
            <div className="space-y-1">
              <h1 className="text-xl font-bold tracking-tight text-slate-800">Content Studio</h1>
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Plan, create and manage all your content in one place.</p>
            </div>
            <Button 
              onClick={enterAddMode}
              className="bg-[#FF6B00] hover:bg-[#E56000] text-white rounded-[4px] h-9 px-4 font-bold text-xs flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" /> Add New Idea
            </Button>
          </div>

          {/* Primary Studio Tabs */}
          <div className="border-b border-slate-200 flex gap-6 text-sm font-semibold pt-2">
            {["ideas", "production", "library", "calendar", "approvals"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 capitalize relative text-xs tracking-wide ${
                  activeTab === tab ? "text-[#FF6B00] font-bold" : "text-slate-400 hover:text-slate-600"
                }`}
              >
                {tab}
                {activeTab === tab && (
                  <span className="absolute bottom-0 left-0 w-full h-[2px] bg-[#FF6B00]"></span>
                )}
              </button>
            ))}
          </div>

          {activeTab === "ideas" ? (
            <>
              {/* KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
                <Card className="bg-white border-slate-100 shadow-xs rounded-[4px]">
                  <CardContent className="p-4 flex items-center justify-between h-18">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ideas</span>
                      <h3 className="text-xl font-extrabold tracking-tight text-slate-800">{stats.ideas}</h3>
                      <p className="text-[9px] text-[#FF6B00] font-bold">8 New</p>
                    </div>
                    <div className="w-8.5 h-8.5 rounded bg-purple-50 flex items-center justify-center text-[#8B5CF6]">
                      <Lightbulb className="w-4 h-4" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white border-slate-100 shadow-xs rounded-[4px]">
                  <CardContent className="p-4 flex items-center justify-between h-18">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">In Production</span>
                      <h3 className="text-xl font-extrabold tracking-tight text-slate-800">{stats.inProduction}</h3>
                      <p className="text-[9px] text-rose-500 font-bold">4 Overdue</p>
                    </div>
                    <div className="w-8.5 h-8.5 rounded bg-orange-50 flex items-center justify-center text-[#FF6B00]">
                      <Film className="w-4 h-4" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white border-slate-100 shadow-xs rounded-[4px]">
                  <CardContent className="p-4 flex items-center justify-between h-18">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ready to Review</span>
                      <h3 className="text-xl font-extrabold tracking-tight text-slate-800">{stats.readyToReview}</h3>
                      <p className="text-[9px] text-amber-500 font-bold">Waiting Approval</p>
                    </div>
                    <div className="w-8.5 h-8.5 rounded bg-amber-50 flex items-center justify-center text-amber-500">
                      <Clock className="w-4 h-4" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white border-slate-100 shadow-xs rounded-[4px]">
                  <CardContent className="p-4 flex items-center justify-between h-18">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ready to Publish</span>
                      <h3 className="text-xl font-extrabold tracking-tight text-slate-800">{stats.readyToPublish}</h3>
                      <p className="text-[9px] text-emerald-500 font-bold">Scheduled / Ready</p>
                    </div>
                    <div className="w-8.5 h-8.5 rounded bg-emerald-50 flex items-center justify-center text-emerald-500">
                      <CheckCircle className="w-4 h-4" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white border-slate-100 shadow-xs rounded-[4px]">
                  <CardContent className="p-4 flex items-center justify-between h-18">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Published (Month)</span>
                      <h3 className="text-xl font-extrabold tracking-tight text-slate-800">{stats.published}</h3>
                      <p className="text-[9px] text-emerald-500 font-bold">+18% vs last month</p>
                    </div>
                    <div className="w-8.5 h-8.5 rounded bg-blue-50 flex items-center justify-center text-blue-500">
                      <Send className="w-4 h-4" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Grid Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                
                {/* Main Table side */}
                <div className="lg:col-span-3 space-y-6">
                  <Card className="bg-white border-slate-200 rounded-[4px] shadow-none overflow-hidden">
                    
                    {/* Filter bar */}
                    <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/20">
                      <div className="flex flex-wrap items-center gap-2">
                        <select
                          value={tripFilter}
                          onChange={(e) => setTripFilter(e.target.value)}
                          className="h-8 rounded-[4px] border border-slate-200 text-xs font-semibold text-slate-650 bg-white px-2 focus-visible:ring-[#FF6B00]"
                        >
                          <option value="all">All Trips</option>
                          <option value="MKA">Manali (MKA)</option>
                          <option value="SPT">Spiti Valley (SPT)</option>
                          <option value="LAD">Leh Ladakh (LAD)</option>
                        </select>

                        <select
                          value={categoryFilter}
                          onChange={(e) => setCategoryFilter(e.target.value)}
                          className="h-8 rounded-[4px] border border-slate-200 text-xs font-semibold text-slate-650 bg-white px-2 focus-visible:ring-[#FF6B00]"
                        >
                          <option value="all">All Categories</option>
                          <option value="reel">Reels</option>
                          <option value="poster">Posters</option>
                          <option value="carousel">Carousels</option>
                          <option value="teaser">Teasers</option>
                        </select>

                        <select
                          value={priorityFilter}
                          onChange={(e) => setPriorityFilter(e.target.value)}
                          className="h-8 rounded-[4px] border border-slate-200 text-xs font-semibold text-slate-650 bg-white px-2 focus-visible:ring-[#FF6B00]"
                        >
                          <option value="all">All Priorities</option>
                          <option value="high">High</option>
                          <option value="medium">Medium</option>
                          <option value="low">Low</option>
                        </select>

                        <select
                          value={statusFilter}
                          onChange={(e) => setStatusFilter(e.target.value)}
                          className="h-8 rounded-[4px] border border-slate-200 text-xs font-semibold text-slate-650 bg-white px-2 focus-visible:ring-[#FF6B00]"
                        >
                          <option value="all">All Status</option>
                          <option value="newidea">New Idea</option>
                          <option value="scriptwriting">Script Writing</option>
                          <option value="scriptdone">Script Done</option>
                          <option value="waitingapproval">Waiting Approval</option>
                        </select>

                        <Button variant="ghost" onClick={handleResetFilters} className="text-xs font-bold text-slate-400 hover:text-slate-600 h-8 px-2.5">
                          Reset
                        </Button>
                      </div>

                      <div className="relative w-full md:w-48 shrink-0">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                        <Input 
                          placeholder="Search content..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="h-8 pl-8 text-xs bg-white border-slate-200 rounded-[4px] w-full placeholder:text-slate-400"
                        />
                      </div>
                    </div>

                    {/* Table */}
                    <Table>
                      <TableHeader className="bg-slate-50/50 border-b border-slate-100">
                        <TableRow>
                          <TableHead className="text-[10px] font-bold text-slate-400 uppercase tracking-wider py-3 pl-6">Idea / Title</TableHead>
                          <TableHead className="text-[10px] font-bold text-slate-400 uppercase tracking-wider py-3">Trip / Destination</TableHead>
                          <TableHead className="text-[10px] font-bold text-slate-400 uppercase tracking-wider py-3">Category</TableHead>
                          <TableHead className="text-[10px] font-bold text-slate-400 uppercase tracking-wider py-3">Priority</TableHead>
                          <TableHead className="text-[10px] font-bold text-slate-400 uppercase tracking-wider py-3">Status</TableHead>
                          <TableHead className="text-[10px] font-bold text-slate-400 uppercase tracking-wider py-3">Assigned To</TableHead>
                          <TableHead className="text-[10px] font-bold text-slate-400 uppercase tracking-wider py-3">Added On</TableHead>
                          <TableHead className="text-[10px] font-bold text-slate-400 uppercase tracking-wider py-3 pr-6 text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredIdeas.length > 0 ? (
                          filteredIdeas.map((idea) => (
                            <TableRow key={idea.id} className="hover:bg-slate-55 border-b border-slate-100/60">
                              <TableCell className="py-3 pl-6">
                                <div className="flex items-start gap-2.5">
                                  <div className="w-7.5 h-7.5 rounded bg-slate-50 border border-slate-100 flex items-center justify-center mt-0.5">
                                    {getCategoryIcon(idea.category)}
                                  </div>
                                  <div>
                                    <h4 className="font-bold text-xs text-slate-800 leading-snug">{idea.title}</h4>
                                    <p className="text-[10.5px] text-slate-450 font-semibold truncate max-w-[220px]">{idea.description}</p>
                                  </div>
                                </div>
                              </TableCell>
                              <td className="text-xs font-semibold text-slate-650 py-3">{idea.trip}</td>
                              <td className="py-3">
                                <Badge className="bg-slate-100 text-slate-700 font-extrabold uppercase text-[8px] tracking-wider rounded-[4px] border shadow-none px-2 py-0.5">
                                  {idea.category}
                                </Badge>
                              </td>
                              <td className="py-3 font-bold text-xs">{idea.priority}</td>
                              <td className="py-3">
                                <Badge className={`${getStatusBadgeStyles(idea.status)} font-extrabold uppercase text-[8px] tracking-wider rounded-[4px] border shadow-none px-2 py-0.5`}>
                                  {idea.status}
                                </Badge>
                              </td>
                              <td className="py-3">
                                <span className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                                  <User className="w-3.5 h-3.5 text-slate-400" />
                                  {idea.assignedTo}
                                </span>
                              </td>
                              <td className="text-xs font-semibold text-slate-500 py-3">{idea.addedOn}</td>
                              <td className="py-3 pr-6 text-right">
                                <div className="flex justify-end gap-1">
                                  <Button 
                                    onClick={() => enterEditMode(idea)}
                                    variant="ghost" 
                                    size="icon" 
                                    className="w-7.5 h-7.5 rounded-[4px] border border-slate-100"
                                  >
                                    <Edit className="w-3.5 h-3.5 text-slate-500" />
                                  </Button>
                                  <Button 
                                    onClick={() => handleDelete(idea.id)}
                                    variant="ghost" 
                                    size="icon" 
                                    className="w-7.5 h-7.5 rounded-[4px] border border-slate-100 hover:bg-rose-50"
                                  >
                                    <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                                  </Button>
                                </div>
                              </td>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <td colSpan={8} className="text-center py-10 text-xs font-semibold text-slate-400">
                              No matching ideas found.
                            </td>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>

                    <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 bg-slate-50/20">
                      <span>Showing 1 to {filteredIdeas.length} of {filteredIdeas.length} ideas</span>
                      <div className="flex items-center gap-1">
                        <Button variant="outline" size="icon" className="w-7.5 h-7.5 rounded border-slate-200 text-slate-400 shadow-2xs"><ChevronLeft className="w-3.5 h-3.5" /></Button>
                        <Button variant="outline" className="w-7.5 h-7.5 text-xs font-bold bg-white text-[#FF6B00] border-[#FF6B00] rounded shadow-2xs">1</Button>
                        <Button variant="outline" size="icon" className="w-7.5 h-7.5 rounded border-slate-200 text-slate-400 shadow-2xs"><ChevronRight className="w-3.5 h-3.5" /></Button>
                      </div>
                    </div>
                  </Card>

                  {/* Flow pipeline diagram */}
                  <Card className="bg-white border-slate-200 rounded-[4px] shadow-none p-5">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-5">How It Works</h3>
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6 px-4">
                      {[
                        { step: "1. Idea", desc: "Capture new idea", icon: Lightbulb, bg: "bg-purple-50 text-purple-600" },
                        { step: "2. Script", desc: "Write & submit script", icon: FileText, bg: "bg-blue-50 text-blue-600" },
                        { step: "3. Approval", desc: "Get approval from Hemal", icon: CheckCircle, bg: "bg-amber-50 text-amber-600" },
                        { step: "4. Production", desc: "Shoot, edit & prepare", icon: Film, bg: "bg-orange-50 text-[#FF6B00]" },
                        { step: "5. Review", desc: "Final review & approval", icon: Clock, bg: "bg-cyan-50 text-cyan-600" },
                        { step: "6. Publish", desc: "Schedule & publish", icon: Send, bg: "bg-emerald-50 text-emerald-600" },
                      ].map((node, idx) => (
                        <React.Fragment key={idx}>
                          <div className="flex flex-col items-center text-center space-y-2 relative group w-full md:w-auto">
                            <div className={`w-11 h-11 rounded-full ${node.bg} flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform`}>
                              <node.icon className="w-5 h-5" />
                            </div>
                            <div className="space-y-0.5">
                              <h4 className="font-bold text-xs text-slate-800">{node.step}</h4>
                              <p className="text-[9px] text-slate-400 font-bold max-w-[100px] leading-tight mx-auto">{node.desc}</p>
                            </div>
                          </div>
                          {idx < 5 && (
                            <div className="hidden md:block text-slate-200 font-bold text-lg select-none">&rarr;</div>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </Card>
                </div>

                {/* Sidebar Column */}
                <div className="space-y-6">
                  {/* Deadlines */}
                  <Card className="bg-white border-slate-200 rounded-[4px] shadow-none p-5">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Upcoming Deadlines</h3>
                    <div className="space-y-3">
                      {[
                        { title: "Snowfall Reel - Manali", task: "Script approval", date: "24 Jul" },
                        { title: "Monsoon Offer Poster", task: "Design review", date: "25 Jul" },
                        { title: "Spiti Valley Reel", task: "Shoot planning", date: "26 Jul" },
                        { title: "Leh Ladakh Teaser", task: "Script approval", date: "27 Jul" },
                      ].map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center text-xs font-medium border-b border-slate-50 pb-2.5 last:border-0 last:pb-0">
                          <div className="space-y-0.5 min-w-0">
                            <h4 className="font-bold text-slate-800 truncate">{item.title}</h4>
                            <p className="text-[10px] text-slate-450 font-semibold">{item.task}</p>
                          </div>
                          <span className="font-bold text-slate-700 bg-slate-50 px-2 py-0.5 rounded text-[10px] flex-shrink-0">{item.date}</span>
                        </div>
                      ))}
                    </div>
                  </Card>

                  {/* Categories Count */}
                  <Card className="bg-white border-slate-200 rounded-[4px] shadow-none p-5">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Idea by Category</h3>
                    <div className="space-y-2.5">
                      {[
                        { name: "Reels", count: 12, bg: "bg-purple-50 text-purple-600" },
                        { name: "Posters", count: 6, bg: "bg-blue-50 text-blue-600" },
                        { name: "Carousels", count: 4, bg: "bg-pink-50 text-pink-600" },
                        { name: "Stories", count: 3, bg: "bg-emerald-50 text-emerald-600" },
                        { name: "Teasers", count: 2, bg: "bg-amber-50 text-amber-600" },
                        { name: "Others", count: 1, bg: "bg-slate-50 text-slate-600" },
                      ].map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center text-xs font-semibold">
                          <span className="text-slate-650">{item.name}</span>
                          <span className={`w-6 h-5 rounded ${item.bg} flex items-center justify-center text-[10px] font-bold`}>{item.count}</span>
                        </div>
                      ))}
                    </div>
                  </Card>

                  {/* Quick Actions */}
                  <Card className="bg-white border-slate-200 rounded-[4px] shadow-none p-5">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Quick Actions</h3>
                    <div className="space-y-2">
                      <Button onClick={enterAddMode} className="w-full justify-start h-9 bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-100 text-xs font-semibold rounded-[4px] gap-2 shadow-none">
                        <Plus className="w-3.5 h-3.5 text-slate-500" />
                        <span>Add New Idea</span>
                      </Button>
                      <Button onClick={handleUploadClick} className="w-full justify-start h-9 bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-100 text-xs font-semibold rounded-[4px] gap-2 shadow-none">
                        <Upload className="w-3.5 h-3.5 text-slate-500" />
                        <span>Upload Reference</span>
                      </Button>
                      <Button onClick={enterAddMode} className="w-full justify-start h-9 bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-100 text-xs font-semibold rounded-[4px] gap-2 shadow-none">
                        <FileText className="w-3.5 h-3.5 text-slate-500" />
                        <span>Create Script</span>
                      </Button>
                    </div>
                  </Card>

                  {/* Warning Note */}
                  <Card className="bg-amber-50/50 border border-amber-100 rounded-[4px] shadow-none p-5 space-y-2">
                    <div className="flex items-center gap-1.5 text-amber-800 font-bold text-xs">
                      <AlertCircle className="w-4 h-4 text-[#F59E0B]" />
                      <span>Important Note</span>
                    </div>
                    <p className="text-[11px] text-amber-700 font-semibold leading-relaxed">
                      All content should follow our brand guidelines. Use brand colors, logo and maintain quality.
                    </p>
                  </Card>
                </div>

              </div>
            </>
          ) : (
            <div className="bg-white border border-slate-200 rounded-[4px] p-20 text-center space-y-4 shadow-none">
              <AlertTriangle className="w-10 h-10 text-[#FF6B00] mx-auto animate-pulse" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">Integration Pending</h3>
              <p className="text-xs text-slate-400 font-semibold max-w-xs mx-auto">The {activeTab} workspace is being updated for production deployment.</p>
            </div>
          )}
        </>
      ) : (
        /* Full Page Add / Edit Idea View (Screen 1 & 2 Layout) */
        <div className="space-y-6">
          
          {/* Header Bar */}
          <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-4 bg-white -mx-6 -mt-6 p-6 shadow-xs">
            <div className="flex items-center gap-3">
              <Button 
                onClick={() => setViewMode('list')}
                variant="ghost" 
                size="icon" 
                className="w-8 h-8 rounded border border-slate-200 hover:bg-slate-50"
              >
                <ArrowLeft className="w-4 h-4 text-slate-600" />
              </Button>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-slate-800">{viewMode === 'edit' ? 'Edit Idea' : 'Add New Idea'}</h1>
                <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mt-0.5">Capture your idea and start the content creation process.</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button 
                type="button"
                variant="outline" 
                onClick={() => handleSave('Draft')}
                className="h-9 font-bold text-xs rounded-[4px] border-slate-200 text-slate-700 bg-white"
              >
                Save as Draft
              </Button>
              <Button 
                type="button"
                onClick={() => handleSave('Script Writing')}
                className="bg-[#FF6B00] hover:bg-[#E56000] text-white rounded-[4px] h-9 px-4 font-bold text-xs flex items-center gap-1.5 shadow-sm transition-colors"
              >
                <Send className="w-3.5 h-3.5" /> Submit for Script
              </Button>
            </div>
          </div>

          {/* Form Layout: Grid columns */}
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            
            {/* Left Main Form column */}
            <div className="xl:col-span-3 space-y-6">
              
              {/* Section 1: Idea Details */}
              <Card className="bg-white border-slate-200 rounded-[4px] shadow-none p-5 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-650 flex items-center gap-2 border-b pb-2">
                  <span className="w-5 h-5 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-[10px]">1</span>
                  Idea Details
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-semibold text-slate-755">
                  <div className="space-y-1.5 md:col-span-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450">Idea Title *</label>
                    <Input 
                      placeholder="Enter a catchy title for your content idea"
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      className="h-8.5 border-slate-200 focus-visible:ring-[#FF6B00] rounded-[4px]"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450">Trip / Destination *</label>
                    <select
                      value={formTrip}
                      onChange={(e) => setFormTrip(e.target.value)}
                      className="w-full h-8.5 rounded-[4px] border border-slate-200 bg-white px-2 focus-visible:ring-[#FF6B00]"
                    >
                      <option value="Manali Kasol Amritsar (MKA)">Manali Kasol Amritsar (MKA)</option>
                      <option value="Spiti Valley (SPT)">Spiti Valley (SPT)</option>
                      <option value="Leh Ladakh (LAD)">Leh Ladakh (LAD)</option>
                      <option value="All Trips">All Trips</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450">Content Type *</label>
                    <select
                      value={formContentType}
                      onChange={(e) => setFormContentType(e.target.value)}
                      className="w-full h-8.5 rounded-[4px] border border-slate-200 bg-white px-2 focus-visible:ring-[#FF6B00]"
                    >
                      <option value="Video">Video</option>
                      <option value="Image">Image</option>
                      <option value="Carousel">Carousel</option>
                      <option value="Story">Story</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-semibold text-slate-755">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450">Category *</label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      className="w-full h-8.5 rounded-[4px] border border-slate-200 bg-white px-2 focus-visible:ring-[#FF6B00]"
                    >
                      <option value="Reel">Reel</option>
                      <option value="Poster">Poster</option>
                      <option value="Carousel">Carousel</option>
                      <option value="Teaser">Teaser</option>
                      <option value="Stories">Stories</option>
                      <option value="Others">Others</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450">Platform *</label>
                    <select
                      value={formPlatform}
                      onChange={(e) => setFormPlatform(e.target.value)}
                      className="w-full h-8.5 rounded-[4px] border border-slate-200 bg-white px-2 focus-visible:ring-[#FF6B00]"
                    >
                      <option value="Instagram">Instagram</option>
                      <option value="YouTube">YouTube</option>
                      <option value="Facebook">Facebook</option>
                      <option value="WhatsApp">WhatsApp</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450">Priority *</label>
                    <select
                      value={formPriority}
                      onChange={(e) => setFormPriority(e.target.value)}
                      className="w-full h-8.5 rounded-[4px] border border-slate-200 bg-white px-2 focus-visible:ring-[#FF6B00]"
                    >
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450">Target Audience</label>
                    <select
                      value={formTargetAudience}
                      onChange={(e) => setFormTargetAudience(e.target.value)}
                      className="w-full h-8.5 rounded-[4px] border border-slate-200 bg-white px-2 focus-visible:ring-[#FF6B00]"
                    >
                      <option value="Solo Travelers">Solo Travelers</option>
                      <option value="Families">Families</option>
                      <option value="Couples">Couples</option>
                      <option value="Friends">Friends</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs font-semibold text-slate-755">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450">Idea Summary *</label>
                  <textarea 
                    rows={3}
                    placeholder="Briefly describe the idea, key message and what value it will deliver."
                    value={formSummary}
                    onChange={(e) => setFormSummary(e.target.value)}
                    className="w-full border border-slate-200 rounded-[4px] p-2 text-xs font-medium focus-visible:ring-[#FF6B00]"
                  />
                  <div className="text-[10px] text-right text-slate-400 font-bold">{formSummary.length}/500</div>
                </div>
              </Card>

              {/* Section 2: Content Details */}
              <Card className="bg-white border-slate-200 rounded-[4px] shadow-none p-5 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-650 flex items-center gap-2 border-b pb-2">
                  <span className="w-5 h-5 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-[10px]">2</span>
                  Content Details
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold text-slate-755">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450">Key Message / Angle</label>
                    <textarea 
                      rows={3}
                      placeholder="What is the main message or story you want to communicate?"
                      value={formKeyMessage}
                      onChange={(e) => setFormKeyMessage(e.target.value)}
                      className="w-full border border-slate-200 rounded-[4px] p-2 text-xs font-medium focus-visible:ring-[#FF6B00]"
                    />
                    <div className="text-[10px] text-right text-slate-400 font-bold">{formKeyMessage.length}/300</div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450">Content Inspiration / Reference</label>
                      <button 
                        type="button" 
                        onClick={handleAddLinkInput} 
                        className="text-[9.5px] font-bold uppercase text-[#FF6B00] hover:underline"
                      >
                        + Add More
                      </button>
                    </div>
                    
                    <div className="space-y-2">
                      {formLinks.map((link, idx) => (
                        <div key={idx} className="flex gap-2">
                          <Input 
                            placeholder="Paste link here (Instagram, YouTube, Drive, etc.)"
                            value={link}
                            onChange={(e) => handleLinkInputChange(idx, e.target.value)}
                            className="h-8.5 border-slate-200 focus-visible:ring-[#FF6B00] rounded-[4px]"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold text-slate-755">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450">Suggested Hook (Optional)</label>
                    <Input 
                      placeholder="Example: This is why you must visit Spiti Valley in Monsoon!"
                      value={formHook}
                      onChange={(e) => setFormHook(e.target.value)}
                      className="h-8.5 border-slate-200 focus-visible:ring-[#FF6B00] rounded-[4px]"
                    />
                    <div className="text-[10px] text-right text-slate-400 font-bold">{formHook.length}/150</div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450">Call to Action (Optional)</label>
                    <Input 
                      placeholder="Example: DM us for details or Book your seat now"
                      value={formCta}
                      onChange={(e) => setFormCta(e.target.value)}
                      className="h-8.5 border-slate-200 focus-visible:ring-[#FF6B00] rounded-[4px]"
                    />
                    <div className="text-[10px] text-right text-slate-400 font-bold">{formCta.length}/150</div>
                  </div>
                </div>
              </Card>

              {/* Section 3: Assignment & Timeline */}
              <Card className="bg-white border-slate-200 rounded-[4px] shadow-none p-5 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-650 flex items-center gap-2 border-b pb-2">
                  <span className="w-5 h-5 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-[10px]">3</span>
                  Assignment & Timeline
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-semibold text-slate-755">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450">Assign To *</label>
                    <select
                      value={formAssignedTo}
                      onChange={(e) => setFormAssignedTo(e.target.value)}
                      className="w-full h-8.5 rounded-[4px] border border-slate-200 bg-white px-2 focus-visible:ring-[#FF6B00]"
                    >
                      <option value="Vidhi Patel">Vidhi Patel</option>
                      <option value="Neeki Sharma">Neeki Sharma</option>
                      <option value="Parth Shah">Parth Shah</option>
                      <option value="Hemal Patel">Hemal Patel</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450">Expected Script Date</label>
                    <Input 
                      type="date"
                      value={formScriptDate}
                      onChange={(e) => setFormScriptDate(e.target.value)}
                      className="h-8.5 border-slate-200 focus-visible:ring-[#FF6B00] rounded-[4px]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450">Expected Shoot Date</label>
                    <Input 
                      type="date"
                      value={formShootDate}
                      onChange={(e) => setFormShootDate(e.target.value)}
                      className="h-8.5 border-slate-200 focus-visible:ring-[#FF6B00] rounded-[4px]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450">Expected Publish Date</label>
                    <Input 
                      type="date"
                      value={formPublishDate}
                      onChange={(e) => setFormPublishDate(e.target.value)}
                      className="h-8.5 border-slate-200 focus-visible:ring-[#FF6B00] rounded-[4px]"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 text-xs font-semibold text-slate-755">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450">Notes (Optional)</label>
                  <textarea 
                    rows={2}
                    placeholder="Any additional notes or instructions for the team."
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    className="w-full border border-slate-200 rounded-[4px] p-2 text-xs font-medium focus-visible:ring-[#FF6B00]"
                  />
                  <div className="text-[10px] text-right text-slate-400 font-bold">{formNotes.length}/300</div>
                </div>
              </Card>

            </div>

            {/* Right Sidebar Form column */}
            <div className="space-y-6">
              
              {/* Idea Thumbnail */}
              <Card className="bg-white border-slate-200 rounded-[4px] p-5 shadow-none space-y-3.5">
                <h3 className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400 border-b pb-1.5">
                  Idea Thumbnail (Optional)
                </h3>
                <div className="border border-dashed border-slate-250 rounded-[4px] p-6 text-center bg-slate-50/50 hover:bg-slate-50 transition-colors flex flex-col items-center justify-center space-y-2.5">
                  <Upload className="w-5 h-5 text-slate-400" />
                  <p className="text-[10px] text-slate-500 font-semibold">Drag & drop an image here or</p>
                  <Button 
                    type="button" 
                    onClick={handleUploadClick}
                    className="h-7.5 bg-indigo-650 hover:bg-indigo-700 text-white text-[10px] font-bold rounded shadow-none px-3"
                  >
                    Upload Image
                  </Button>
                  <p className="text-[8px] text-slate-400 font-bold uppercase">JPG, PNG up to 10MB</p>
                </div>
              </Card>

              {/* Attachments */}
              <Card className="bg-white border-slate-200 rounded-[4px] p-5 shadow-none space-y-3.5">
                <h3 className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400 border-b pb-1.5">
                  Attachments (Optional)
                </h3>
                
                <div className="space-y-2">
                  {attachments.map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-slate-50 border rounded text-xs font-semibold text-slate-650">
                      <div className="flex items-center gap-1.5 truncate">
                        <Paperclip className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{file.name}</span>
                      </div>
                      <span className="text-[9px] text-slate-400 shrink-0 font-bold">{file.size}</span>
                    </div>
                  ))}
                  <Button 
                    type="button"
                    onClick={handleUploadClick}
                    variant="outline" 
                    className="w-full h-8.5 rounded-[4px] border-slate-200 text-slate-700 hover:bg-slate-50 text-[10px] font-bold flex items-center justify-center gap-1 shadow-none"
                  >
                    + Add Attachment
                  </Button>
                </div>
              </Card>

              {/* Checklist */}
              <Card className="bg-white border-slate-200 rounded-[4px] p-5 shadow-none space-y-3.5">
                <h3 className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400 border-b pb-1.5">
                  Checklist (Optional)
                </h3>

                <div className="space-y-2.5">
                  {checklist.map(item => (
                    <div key={item.id} className="flex items-start gap-2 text-xs font-semibold text-slate-650">
                      <input 
                        type="checkbox" 
                        checked={item.checked} 
                        onChange={() => toggleChecklist(item.id)}
                        className="mt-0.5 rounded border-slate-200 text-[#FF6B00] focus:ring-[#FF6B00] cursor-pointer"
                      />
                      <span className={item.checked ? "line-through text-slate-400" : ""}>{item.text}</span>
                    </div>
                  ))}
                  
                  <div className="flex gap-2 pt-1">
                    <Input 
                      placeholder="Add custom checkbox..."
                      value={newChecklistItem}
                      onChange={(e) => setNewChecklistItem(e.target.value)}
                      className="h-8 border-slate-200 focus-visible:ring-[#FF6B00] rounded-[4px] text-xs placeholder:text-slate-400"
                    />
                    <Button 
                      type="button" 
                      onClick={handleAddChecklistItem}
                      className="h-8 bg-[#FF6B00] text-white hover:bg-[#e05e00] font-bold text-xs rounded-[4px] px-2.5"
                    >
                      +
                    </Button>
                  </div>
                </div>
              </Card>

              {/* Idea Status */}
              <Card className="bg-white border-slate-200 rounded-[4px] p-5 shadow-none space-y-3">
                <h3 className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400 border-b pb-1.5">
                  Idea Status
                </h3>
                <div className="space-y-2.5 text-xs">
                  <div>
                    <Badge className="bg-amber-50 text-amber-800 border-amber-200 px-2 py-0.5 font-bold uppercase text-[9px] tracking-wider rounded-[4px] border shadow-none">
                      Draft
                    </Badge>
                  </div>
                  <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">
                    This idea is in draft mode. Once you submit, it will move to <span className="font-bold text-slate-700">Script Writing</span> stage.
                  </p>
                </div>
              </Card>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}
