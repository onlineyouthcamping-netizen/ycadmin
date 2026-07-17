import React, { useState, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { useBlocker } from 'react-router-dom';
import { Bold, Heading2, Heading3, List, ListOrdered, Link as LinkIcon, Undo, Redo, RemoveFormatting, Save, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import DOMPurify from 'dompurify';

interface ArticleEditorProps {
  initialContent?: string;
  initialTitle?: string;
  status: string;
  onSaveDraft: (data: { title: string; content: string }) => Promise<void>;
  onSubmitForReview: (data: { title: string; content: string }) => Promise<void>;
}

export const TravelDeskArticleEditor: React.FC<ArticleEditorProps> = ({ 
  initialContent = '', 
  initialTitle = '', 
  status, 
  onSaveDraft, 
  onSubmitForReview 
}) => {
  const [title, setTitle] = useState(initialTitle);
  const [isDirty, setIsDirty] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize Tiptap
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-[#FF6B00] underline cursor-pointer',
        },
      }),
      Placeholder.configure({
        placeholder: 'Start writing your knowledge article...',
      }),
    ],
    content: initialContent,
    onUpdate: () => {
      setIsDirty(true);
    },
  });

  // Protect internal navigation
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      isDirty && currentLocation.pathname !== nextLocation.pathname
  );

  useEffect(() => {
    if (blocker.state === 'blocked') {
      const confirm = window.confirm('You have unsaved changes. Are you sure you want to leave?');
      if (confirm) {
        blocker.proceed();
      } else {
        blocker.reset();
      }
    }
  }, [blocker]);

  // Protect window close/refresh
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const handleAction = async (action: 'draft' | 'review') => {
    if (isSubmitting || !editor) return;
    setIsSubmitting(true);
    
    // Sanitize output
    const cleanContent = DOMPurify.sanitize(editor.getHTML());
    
    try {
      if (action === 'draft') {
        await onSaveDraft({ title, content: cleanContent });
      } else {
        await onSubmitForReview({ title, content: cleanContent });
      }
      setIsDirty(false); // Clean after successful save
    } catch (err) {
      console.error('Failed to save article', err);
      // Do not clean isDirty if the save failed (retains unsaved content)
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!editor) return null;

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col h-full">
      {/* HEADER */}
      <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
        <input 
          type="text"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            setIsDirty(true);
          }}
          placeholder="Article Title..."
          className="text-lg font-black text-slate-800 bg-transparent focus:outline-none w-1/2 placeholder-slate-400"
        />
        <div className="flex items-center gap-3">
          <button 
            onClick={() => handleAction('draft')}
            disabled={isSubmitting || !isDirty}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-all"
          >
            <Save className="w-4 h-4" />
            Save Draft
          </button>
          
          {(status === 'DRAFT' || status === 'CHANGES_REQUESTED') && (
            <button 
              onClick={() => handleAction('review')}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-4 py-2 bg-[#FF6B00] text-white rounded-lg text-sm font-bold shadow-sm hover:bg-orange-600 disabled:opacity-50 transition-all"
            >
              <Send className="w-4 h-4" />
              Submit for Review
            </button>
          )}
        </div>
      </div>

      {/* TOOLBAR */}
      <div className="px-4 py-2 border-b border-slate-200 bg-white flex flex-wrap gap-1">
        <ToolbarButton onClick={() => editor.chain().focus().setParagraph().run()} isActive={editor.isActive('paragraph')} icon={RemoveFormatting} title="Paragraph" />
        <div className="w-px h-6 bg-slate-200 mx-1 self-center" />
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} isActive={editor.isActive('heading', { level: 2 })} icon={Heading2} title="Heading 2" />
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} isActive={editor.isActive('heading', { level: 3 })} icon={Heading3} title="Heading 3" />
        <div className="w-px h-6 bg-slate-200 mx-1 self-center" />
        <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive('bold')} icon={Bold} title="Bold" />
        <div className="w-px h-6 bg-slate-200 mx-1 self-center" />
        <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive('bulletList')} icon={List} title="Bullet List" />
        <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive('orderedList')} icon={ListOrdered} title="Numbered List" />
        <div className="w-px h-6 bg-slate-200 mx-1 self-center" />
        <ToolbarButton 
          onClick={() => {
            const url = window.prompt('URL');
            if (url) {
              editor.chain().focus().setLink({ href: url }).run();
            } else if (url === '') {
              editor.chain().focus().unsetLink().run();
            }
          }} 
          isActive={editor.isActive('link')} 
          icon={LinkIcon} 
          title="Link" 
        />
        <div className="flex-1" />
        <ToolbarButton onClick={() => editor.chain().focus().undo().run()} isActive={false} icon={Undo} title="Undo" />
        <ToolbarButton onClick={() => editor.chain().focus().redo().run()} isActive={false} icon={Redo} title="Redo" />
      </div>

      {/* EDITOR CONTENT */}
      <div className="flex-1 p-6 overflow-y-auto bg-white cursor-text tiptap-wrapper" onClick={() => editor.commands.focus()}>
        <EditorContent editor={editor} className="prose prose-slate max-w-none focus:outline-none" />
      </div>
    </div>
  );
};

interface ToolbarButtonProps {
  onClick: () => void;
  isActive: boolean;
  icon: React.ElementType;
  title: string;
}

const ToolbarButton: React.FC<ToolbarButtonProps> = ({ onClick, isActive, icon: Icon, title }) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    className={cn(
      "p-2 rounded-lg transition-colors flex items-center justify-center",
      isActive ? "bg-slate-100 text-[#FF6B00]" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
    )}
  >
    <Icon className="w-4 h-4" />
  </button>
);
