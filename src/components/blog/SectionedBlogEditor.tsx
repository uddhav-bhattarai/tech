'use client'

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Eye, Plus, Trash2, GripVertical, ChevronDown, ChevronUp, FileText } from 'lucide-react';
import RichTextEditor from './RichTextEditor';
import MarkdownImport from './MarkdownImport';
import { ParsedSection, MarkdownSectionParser } from '@/lib/markdownParser';

// Section type definitions
type SectionType = 
  | 'title_meta'
  | 'hero'
  | 'overview'
  | 'highlights'
  | 'pricing'
  | 'design'
  | 'display'
  | 'performance'
  | 'camera'
  | 'battery'
  | 'pros_cons'
  | 'comparison'
  | 'verdict'
  | 'specs_table'
  | 'custom';

interface BlogSection {
  id: string;
  type: SectionType;
  title: string;
  content: string;
  order: number;
  data?: Record<string, unknown>; // For structured data like tables, specs, etc.
}

interface SectionedBlogEditorProps {
  initialData?: {
    title?: string;
    slug?: string;
    excerpt?: string;
    featuredImage?: string;
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string[];
    status?: string;
    publishedAt?: string;
    sections?: BlogSection[];
  };
  mode: 'create' | 'edit';
  slug?: string;
}

const defaultBlog = {
  title: '',
  slug: '',
  excerpt: '',
  featuredImage: '',
  metaTitle: '',
  metaDescription: '',
  keywords: [] as string[],
  status: 'DRAFT',
  publishedAt: '',
  sections: [] as BlogSection[]
};

// Section templates
const sectionTemplates: Record<SectionType, { title: string; description: string; template: string; icon: string }> = {
  title_meta: {
    title: 'Title & Meta',
    description: 'Main title, rating, and meta information',
    icon: '📝',
    template: `# 📱 [Device Name] – Full Tech Review

⭐ **Expert Score: 4.6/5**`
  },
  hero: {
    title: 'Hero Section',
    description: 'Hero image, pricing, and key ratings',
    icon: '🎯',
    template: `![Hero Image](https://example.com/image.jpg)

* **Starting Price (Nepal):** NPR 44,999 (base variant)
* **Expert Ratings:**
  * ⭐ Display: 4.7
  * ⭐ Performance: 4.6
  * ⭐ Battery: 4.5
  * ⭐ Camera: 4.2
  * ⭐ Value: 4.6

👉 **CTA:** [Compare Now] | [Buy Now]`
  },
  overview: {
    title: 'Phone Overview',
    description: 'Comprehensive device overview and key features',
    icon: '📋',
    template: `The **[Device Name]** is a premium flagship that blends design elegance with extreme performance. It features a **[Screen Size] [Display Type]** display with [refresh rate], [processor] processor, [camera system], and [battery capacity] battery with [charging speeds].`
  },
  highlights: {
    title: 'Key Highlights',
    description: 'At-a-glance specifications and features',
    icon: '⭐',
    template: `* **Display:** [Size] [Type], [Refresh Rate], [Features]
* **Processor:** [Chip Name]
* **RAM/Storage:** [RAM] | [Storage Options]
* **Cameras:** [Camera Setup] | [Front Camera]
* **Battery:** [Capacity], [Charging Speeds]
* **Software:** [OS Version], [UI], [Update Policy]
* **Connectivity:** [Network Support], [Other Features]`
  },
  pricing: {
    title: 'Variants & Pricing',
    description: 'Price table for different variants',
    icon: '💰',
    template: `| Variant | Price (NPR) |
|---------|-------------|
| [RAM] + [Storage] | [Price] |
| [RAM] + [Storage] | [Price] |
| [RAM] + [Storage] | [Price] |

**Availability:** [Store Information]`
  },
  design: {
    title: 'Design & Build Quality',
    description: 'Physical design, materials, and build quality',
    icon: '🎨',
    template: `* **Dimensions:** [Length] × [Width] × [Thickness] mm
* **Weight:** [Weight]g
* **Build:** [Materials]
* **Protection:** [Water/Dust Rating]
* **Colors:** [Available Colors]

👉 *[Design Summary]*`
  },
  display: {
    title: 'Display',
    description: 'Screen specifications and quality',
    icon: '📺',
    template: `* **Size:** [Size] inches [Resolution]
* **Panel:** [Display Technology]
* **Refresh Rate:** [Rate]
* **Brightness:** [Peak Brightness]
* **Features:** [HDR Support], [Protection]

👉 *[Display Quality Summary]*`
  },
  performance: {
    title: 'Performance',
    description: 'Processor, gaming, and benchmark scores',
    icon: '⚡',
    template: `* **Processor:** [Chip Details]
* **GPU:** [Graphics Chip]
* **RAM:** [RAM Specifications]
* **Storage:** [Storage Type and Speeds]
* **Benchmarks:** [Benchmark Scores]
* **Gaming:** [Gaming Performance Details]

👉 *[Performance Summary]*`
  },
  camera: {
    title: 'Camera',
    description: 'Camera system and photo/video quality',
    icon: '📸',
    template: `* **Rear Cameras:**
  * [Main Camera Specs]
  * [Ultra-wide Specs]
  * [Telephoto/Other Specs]
* **Front Camera:** [Front Camera Specs]
* **Features:** [Camera Features]
* **Video:** [Video Recording Capabilities]

👉 *[Camera Performance Summary]*`
  },
  battery: {
    title: 'Battery & Charging',
    description: 'Battery life and charging specifications',
    icon: '🔋',
    template: `* **Capacity:** [Battery Capacity]
* **Charging:** [Wired Speed] wired, [Wireless Speed] wireless
* **Battery Life:** [Screen-on Time/Usage Details]
* **Features:** [Power-saving Features]

👉 *[Battery Performance Summary]*`
  },
  pros_cons: {
    title: 'Pros & Cons',
    description: 'Advantages and disadvantages',
    icon: '⚖️',
    template: `✅ [Positive Point 1]
✅ [Positive Point 2]
✅ [Positive Point 3]
✅ [Positive Point 4]
✅ [Positive Point 5]

❌ [Negative Point 1]
❌ [Negative Point 2]
❌ [Negative Point 3]`
  },
  comparison: {
    title: 'Comparison',
    description: 'Compare with similar devices',
    icon: '🔄',
    template: `* **vs [Competitor 1]:** [Comparison Summary]
* **vs [Competitor 2]:** [Comparison Summary]
* **vs [Competitor 3]:** [Comparison Summary]`
  },
  verdict: {
    title: 'Verdict / Conclusion',
    description: 'Final recommendation and summary',
    icon: '🎯',
    template: `The **[Device Name]** is the ultimate choice for **[Target Users]** who want [key benefits]. With its [main strengths], it stands tall as one of the **best [category] devices** of [year]. If you can afford it, this is a **buy without hesitation**.`
  },
  specs_table: {
    title: 'Specifications Table',
    description: 'Complete specifications in table format',
    icon: '📊',
    template: `| Category | Details |
|----------|---------|
| **Display** | [Display Specifications] |
| **Processor** | [Processor Details] |
| **RAM/Storage** | [Memory Details] |
| **Cameras** | [Camera System] |
| **Battery** | [Battery & Charging] |
| **Software** | [OS & Updates] |
| **Connectivity** | [Network & Features] |
| **Build** | [Materials & Protection] |`
  },
  custom: {
    title: 'Custom Section',
    description: 'Create your own custom section',
    icon: '✨',
    template: `## Custom Section Title

Add your custom content here...`
  }
};

const SectionedBlogEditor: React.FC<SectionedBlogEditorProps> = ({ initialData, mode, slug }) => {
  const [blog, setBlog] = useState({
    ...defaultBlog,
    ...initialData,
    sections: initialData?.sections || []
  });
  const [preview, setPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSectionSelector, setShowSectionSelector] = useState(false);
  const [showMarkdownImport, setShowMarkdownImport] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const router = useRouter();

  // Generate unique ID for sections
  const generateSectionId = () => `section_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Add new section
  const addSection = (type: SectionType) => {
    const newSection: BlogSection = {
      id: generateSectionId(),
      type,
      title: sectionTemplates[type].title,
      content: sectionTemplates[type].template,
      order: blog.sections.length,
      data: {}
    };

    setBlog(prev => ({
      ...prev,
      sections: [...prev.sections, newSection]
    }));

    setExpandedSections(prev => new Set([...prev, newSection.id]));
    setShowSectionSelector(false);
  };

  // Import sections from markdown
  const handleMarkdownImport = (parsedSections: ParsedSection[]) => {
    // Convert ParsedSection to BlogSection
    const newSections: BlogSection[] = parsedSections.map((section, index) => ({
      id: generateSectionId(),
      type: section.type as SectionType,
      title: section.title,
      content: section.content,
      order: blog.sections.length + index,
      data: section.metadata || {}
    }));

    // Add imported sections to existing sections
    setBlog(prev => ({
      ...prev,
      sections: [...prev.sections, ...newSections]
    }));

    // Expand all newly imported sections
    const newSectionIds = newSections.map(s => s.id);
    setExpandedSections(prev => new Set([...prev, ...newSectionIds]));
    
    setShowMarkdownImport(false);
  };

  // Remove section
  const removeSection = (sectionId: string) => {
    setBlog(prev => ({
      ...prev,
      sections: prev.sections.filter(section => section.id !== sectionId)
        .map((section, index) => ({ ...section, order: index }))
    }));
    setExpandedSections(prev => {
      const updated = new Set(prev);
      updated.delete(sectionId);
      return updated;
    });
  };

  // Update section content
  const updateSectionContent = (sectionId: string, content: string) => {
    setBlog(prev => ({
      ...prev,
      sections: prev.sections.map(section =>
        section.id === sectionId ? { ...section, content } : section
      )
    }));
  };

  // Update section title
  const updateSectionTitle = (sectionId: string, title: string) => {
    setBlog(prev => ({
      ...prev,
      sections: prev.sections.map(section =>
        section.id === sectionId ? { ...section, title } : section
      )
    }));
  };

  // Toggle section expansion
  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      const updated = new Set(prev);
      if (updated.has(sectionId)) {
        updated.delete(sectionId);
      } else {
        updated.add(sectionId);
      }
      return updated;
    });
  };

  // Move section up/down
  const moveSection = (sectionId: string, direction: 'up' | 'down') => {
    setBlog(prev => {
      const sections = [...prev.sections];
      const currentIndex = sections.findIndex(s => s.id === sectionId);
      
      if (currentIndex === -1) return prev;
      if (direction === 'up' && currentIndex === 0) return prev;
      if (direction === 'down' && currentIndex === sections.length - 1) return prev;

      const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      
      // Swap sections
      [sections[currentIndex], sections[targetIndex]] = [sections[targetIndex], sections[currentIndex]];
      
      // Update order
      sections.forEach((section, index) => {
        section.order = index;
      });

      return { ...prev, sections };
    });
  };

  // Handle form changes for basic blog data
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'keywords') {
      setBlog({ ...blog, [name]: value.split(',').map(k => k.trim()).filter(k => k) });
    } else {
      setBlog({ ...blog, [name]: value });
    }
  };

  // Auto-generate slug from title
  useEffect(() => {
    if (mode === 'create' && blog.title && !blog.slug) {
      const generatedSlug = blog.title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
      setBlog(prev => ({ ...prev, slug: generatedSlug }));
    }
  }, [blog.title, blog.slug, mode]);

  // Save blog
  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      const blogData = {
        ...blog,
        keywords: blog.keywords || []
      };

      const url = mode === 'create' ? '/api/admin/blogs' : `/api/admin/blogs/${slug}`;
      const method = mode === 'create' ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(blogData),
      });

      if (response.ok) {
        router.push('/admin/blog');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to save blog');
      }
    } catch (err) {
      setError('Network error occurred');
      console.error('Save error:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button 
            onClick={() => router.back()} 
            className="inline-flex items-center gap-2 text-slate-800 hover:text-blue-700 transition-colors font-medium"
          >
            <ArrowLeft className="w-5 h-5" /> 
            Back to Blog Management
          </button>
          
          <div className="flex gap-3">
            <button 
              type="button" 
              onClick={() => setPreview(!preview)} 
              className="inline-flex items-center gap-2 bg-slate-200 text-slate-900 px-6 py-2 rounded-xl font-semibold border border-slate-400 hover:bg-slate-300 transition-all"
            >
              <Eye className="w-4 h-4" /> 
              {preview ? 'Hide Preview' : 'Preview'}
            </button>
            
            <button 
              onClick={handleSave} 
              disabled={saving || !blog.title || !blog.slug}
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-xl font-medium hover:bg-blue-700 transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : mode === 'create' ? 'Create Blog' : 'Update Blog'}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Editor */}
          <div className="bg-white rounded-2xl shadow-lg p-8 h-fit">
            <h1 className="text-3xl font-bold text-slate-900 mb-8">
              {mode === 'create' ? 'Create Sectioned Blog Post' : 'Edit Sectioned Blog Post'}
            </h1>

            <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
              {/* Basic Blog Information */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    Title *
                  </label>
                  <input 
                    type="text" 
                    name="title" 
                    value={blog.title} 
                    onChange={handleChange} 
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 bg-white placeholder-slate-500" 
                    required 
                    placeholder="Enter blog title"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    Slug *
                  </label>
                  <input 
                    type="text" 
                    name="slug" 
                    value={blog.slug} 
                    onChange={handleChange} 
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 bg-white placeholder-slate-500" 
                    required 
                    placeholder="blog-post-url"
                  />
                </div>
              </div>

              {/* Excerpt */}
              <div className="mb-8">
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Excerpt
                </label>
                <textarea 
                  name="excerpt" 
                  value={blog.excerpt} 
                  onChange={handleChange} 
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 bg-white placeholder-slate-500" 
                  placeholder="Brief description of the blog post"
                />
              </div>

              {/* Sections */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-slate-900">
                    Content Sections
                  </h3>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setShowMarkdownImport(true)}
                      className="inline-flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-all"
                    >
                      <FileText className="w-4 h-4" />
                      Import Markdown
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowSectionSelector(true)}
                      className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-all"
                    >
                      <Plus className="w-4 h-4" />
                      Add Section
                    </button>
                  </div>
                </div>

                {/* Section List */}
                <div className="space-y-4">
                  {blog.sections.map((section, index) => (
                    <div key={section.id} className="border border-gray-200 rounded-xl">
                      {/* Section Header */}
                      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-t-xl border-b">
                        <div className="flex items-center gap-3">
                          <span className="text-lg">{sectionTemplates[section.type].icon}</span>
                          <input
                            type="text"
                            value={section.title}
                            onChange={(e) => updateSectionTitle(section.id, e.target.value)}
                            className="font-medium text-slate-900 bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
                          />
                          <span className="text-sm text-slate-600">({sectionTemplates[section.type].description})</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => moveSection(section.id, 'up')}
                            disabled={index === 0}
                            className="p-1 text-slate-600 hover:text-slate-900 disabled:opacity-50"
                          >
                            <ChevronUp className="w-4 h-4" />
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => moveSection(section.id, 'down')}
                            disabled={index === blog.sections.length - 1}
                            className="p-1 text-slate-600 hover:text-slate-900 disabled:opacity-50"
                          >
                            <ChevronDown className="w-4 h-4" />
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => toggleSection(section.id)}
                            className="p-1 text-slate-600 hover:text-slate-900"
                          >
                            <GripVertical className="w-4 h-4" />
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => removeSection(section.id)}
                            className="p-1 text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Section Content */}
                      {expandedSections.has(section.id) && (
                        <div className="p-4">
                          <RichTextEditor
                            content={section.content}
                            onChange={(content) => updateSectionContent(section.id, content)}
                            placeholder={`Add content for ${section.title}...`}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {blog.sections.length === 0 && (
                    <div className="text-center py-12 text-slate-600 border-2 border-dashed border-slate-300 rounded-xl">
                      <p className="text-lg mb-4">No sections added yet</p>
                      <p className="text-sm">Click &quot;Add Section&quot; to start building your structured blog post</p>
                    </div>
                  )}
                </div>
              </div>
            </form>
          </div>

          {/* Preview */}
          {preview && (
            <div className="bg-white rounded-2xl shadow-lg p-8 h-fit">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Preview</h2>
              
              {blog.sections.map((section) => (
                <div key={section.id} className="mb-8">
                  <div 
                    className="prose prose-lg max-w-none"
                    dangerouslySetInnerHTML={{ __html: MarkdownSectionParser.markdownToHtml(section.content) }}
                  />
                </div>
              ))}
              
              {blog.sections.length === 0 && (
                <p className="text-slate-600">Add sections to see preview...</p>
              )}
            </div>
          )}
        </div>

        {/* Section Selector Modal */}
        {showSectionSelector && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-xl shadow-xl max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-slate-900">Choose Section Type</h3>
                <button
                  onClick={() => setShowSectionSelector(false)}
                  className="text-slate-600 hover:text-slate-900"
                >
                  ×
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(sectionTemplates).map(([type, template]) => (
                  <button
                    key={type}
                    onClick={() => addSection(type as SectionType)}
                    className="p-4 border border-gray-200 rounded-lg text-left hover:bg-slate-50 hover:border-blue-300 transition-all"
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{template.icon}</span>
                      <div>
                        <h4 className="font-semibold text-slate-900 mb-1">{template.title}</h4>
                        <p className="text-sm text-slate-600">{template.description}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Markdown Import Modal */}
        {showMarkdownImport && (
          <MarkdownImport
            onImport={handleMarkdownImport}
            onCancel={() => setShowMarkdownImport(false)}
          />
        )}
      </div>
    </div>
  );
};

export default SectionedBlogEditor;