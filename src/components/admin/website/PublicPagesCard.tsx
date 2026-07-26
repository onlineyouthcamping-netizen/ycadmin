import React from "react";
import { Link2, Edit3, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface PublicPageItem {
  id: string;
  title: string;
  slug: string;
  published: boolean;
  lastEdited: string;
}

interface PublicPagesCardProps {
  pages: PublicPageItem[];
  onEditPage: (page: PublicPageItem) => void;
}

export function PublicPagesCard({ pages, onEditPage }: PublicPagesCardProps) {
  const [sortField, setSortField] = React.useState<"title" | "slug" | "published">("title");
  const [sortOrder, setSortOrder] = React.useState<"asc" | "desc">("asc");

  const toggleSort = (field: "title" | "slug" | "published") => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const sortedPages = [...pages].sort((a, b) => {
    let comparison = 0;
    if (sortField === "title") comparison = a.title.localeCompare(b.title);
    else if (sortField === "slug") comparison = a.slug.localeCompare(b.slug);
    else if (sortField === "published") comparison = (a.published === b.published ? 0 : a.published ? -1 : 1);
    
    return sortOrder === "asc" ? comparison : -comparison;
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Link2 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-[#0B1528]">Public Pages ({pages.length})</h3>
            <p className="text-xs text-slate-500 font-medium">Site routes and landing pages</p>
          </div>
        </div>

        <span className="text-xs font-bold text-slate-500">
          {pages.filter((p) => p.published).length} Published
        </span>
      </div>

      {/* Desktop Table */}
      <div className="hidden sm:block overflow-x-auto rounded-xl border border-slate-200/80">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200/80">
            <tr>
              <th
                onClick={() => toggleSort("title")}
                className="py-3 px-4 cursor-pointer hover:text-slate-900 transition-colors"
              >
                <div className="flex items-center gap-1">
                  <span>Page Name</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th
                onClick={() => toggleSort("slug")}
                className="py-3 px-4 cursor-pointer hover:text-slate-900 transition-colors"
              >
                <div className="flex items-center gap-1">
                  <span>URL Slug</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th
                onClick={() => toggleSort("published")}
                className="py-3 px-4 cursor-pointer hover:text-slate-900 transition-colors"
              >
                <div className="flex items-center gap-1">
                  <span>Status</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
            {sortedPages.map((page) => (
              <tr key={page.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="py-3 px-4 font-bold text-[#0B1528]">{page.title}</td>
                <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">/{page.slug}</td>
                <td className="py-3 px-4">
                  {page.published ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Live
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                      Draft
                    </span>
                  )}
                </td>
                <td className="py-3 px-4 text-right">
                  <Button
                    onClick={() => onEditPage(page)}
                    variant="ghost"
                    className="h-7 px-2.5 text-xs font-bold text-[#D4541A] hover:bg-orange-50 cursor-pointer"
                  >
                    <Edit3 className="w-3 h-3 mr-1" /> Edit
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card List */}
      <div className="block sm:hidden space-y-2.5">
        {sortedPages.map((page) => (
          <div
            key={page.id}
            className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50 flex items-center justify-between gap-3"
          >
            <div className="space-y-0.5">
              <p className="text-xs font-bold text-[#0B1528]">{page.title}</p>
              <p className="text-[11px] font-mono text-slate-400">/{page.slug}</p>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  page.published
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-amber-50 text-amber-700 border border-amber-200"
                }`}
              >
                {page.published ? "Live" : "Draft"}
              </span>

              <Button
                onClick={() => onEditPage(page)}
                variant="ghost"
                className="h-8 w-8 p-0 text-[#D4541A]"
              >
                <Edit3 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
