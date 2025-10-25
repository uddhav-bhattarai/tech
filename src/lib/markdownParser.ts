import { v4 as uuidv4 } from 'uuid';

export interface ParsedSection {
  id: string;
  type: string;
  title: string;
  content: string;
  order: number;
  originalHeadingLevel?: number;
  metadata?: Record<string, unknown>;
}

export interface MarkdownParseResult {
  sections: ParsedSection[];
  metadata: {
    estimatedReadTime: number;
    wordCount: number;
    hasImages: boolean;
    hasTables: boolean;
    hasCodeBlocks: boolean;
  };
}

// Section type mapping based on common heading patterns
const SECTION_TYPE_MAPPING: Record<string, string> = {
  // Title patterns
  'title': 'title_meta',
  'review': 'title_meta',
  'intro': 'hero',
  'introduction': 'hero',
  'hero': 'hero',
  'overview': 'overview',
  'summary': 'overview',
  'about': 'overview',
  
  // Key highlights
  'highlights': 'highlights',
  'key features': 'highlights',
  'main features': 'highlights',
  'standout features': 'highlights',
  'key points': 'highlights',
  
  // Pricing
  'price': 'pricing',
  'pricing': 'pricing',
  'cost': 'pricing',
  'variants': 'pricing',
  'price in nepal': 'pricing',
  'nepal price': 'pricing',
  
  // Design
  'design': 'design',
  'build': 'design',
  'build quality': 'design',
  'design & build': 'design',
  'construction': 'design',
  'materials': 'design',
  
  // Display
  'display': 'display',
  'screen': 'display',
  'display quality': 'display',
  'display excellence': 'display',
  
  // Performance
  'performance': 'performance',
  'processor': 'performance',
  'chipset': 'performance',
  'cpu': 'performance',
  'gpu': 'performance',
  'gaming': 'performance',
  'benchmarks': 'performance',
  'speed': 'performance',
  
  // Camera
  'camera': 'camera',
  'cameras': 'camera',
  'photography': 'camera',
  'camera system': 'camera',
  'photo': 'camera',
  'video': 'camera',
  
  // Battery
  'battery': 'battery',
  'battery life': 'battery',
  'charging': 'battery',
  'power': 'battery',
  'endurance': 'battery',
  
  // Pros and Cons
  'pros': 'pros_cons',
  'cons': 'pros_cons',
  'pros and cons': 'pros_cons',
  'advantages': 'pros_cons',
  'disadvantages': 'pros_cons',
  'positives': 'pros_cons',
  'negatives': 'pros_cons',
  
  // Comparison
  'comparison': 'comparison',
  'compare': 'comparison',
  'vs': 'comparison',
  'versus': 'comparison',
  'alternatives': 'comparison',
  
  // Verdict
  'verdict': 'verdict',
  'conclusion': 'verdict',
  'final thoughts': 'verdict',
  'recommendation': 'verdict',
  'should you buy': 'verdict',
  
  // Specs table
  'specifications': 'specs_table',
  'specs': 'specs_table',
  'spec sheet': 'specs_table',
  'technical specs': 'specs_table',
  'specification sheet': 'specs_table',
};

export class MarkdownSectionParser {
  private static detectSectionType(heading: string): string {
    const cleanHeading = heading.toLowerCase().trim();
    
    // Direct match
    if (SECTION_TYPE_MAPPING[cleanHeading]) {
      return SECTION_TYPE_MAPPING[cleanHeading];
    }
    
    // Partial match
    for (const [key, type] of Object.entries(SECTION_TYPE_MAPPING)) {
      if (cleanHeading.includes(key)) {
        return type;
      }
    }
    
    // Default to custom section
    return 'custom';
  }

  private static extractMetadata(content: string) {
    const wordCount = content.split(/\s+/).filter(word => word.length > 0).length;
    const estimatedReadTime = Math.max(1, Math.ceil(wordCount / 200));
    const hasImages = /!\[[^\]]*\]\([^)]+\)/.test(content);
    const hasTables = /\|.*\|/.test(content);
    const hasCodeBlocks = /```[\s\S]*?```|`[^`]+`/.test(content);

    return {
      wordCount,
      estimatedReadTime,
      hasImages,
      hasTables,
      hasCodeBlocks,
    };
  }

  private static convertToHtml(markdownContent: string): string {
    let html = markdownContent;

    // Handle code blocks first (to avoid interference)
    const codeBlocks: string[] = [];
    html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
      const placeholder = `__CODE_BLOCK_${codeBlocks.length}__`;
      codeBlocks.push(`<pre class="bg-gray-100 p-4 rounded-lg overflow-x-auto my-4"><code class="language-${lang || 'text'}">${code.trim()}</code></pre>`);
      return placeholder;
    });

    // Handle inline code
    const inlineCode: string[] = [];
    html = html.replace(/`([^`]+)`/g, (match, code) => {
      const placeholder = `__INLINE_CODE_${inlineCode.length}__`;
      inlineCode.push(`<code class="bg-gray-100 px-2 py-1 rounded text-sm">${code}</code>`);
      return placeholder;
    });

    // Remove horizontal rules (--- lines)
    html = html.replace(/^---+\s*$/gm, '');
    
    // Remove table separator lines (like ----------------	-----------------------------------------------------------)
    html = html.replace(/^[\s]*[-\s\t|]+[\s]*$/gm, '');

    // Convert headers (but preserve for section detection)
    html = html.replace(/^#### (.*$)/gim, '<h4 class="text-lg font-semibold text-slate-900 my-3">$1</h4>');
    html = html.replace(/^### (.*$)/gim, '<h3 class="text-xl font-semibold text-slate-900 my-4">$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2 class="text-2xl font-bold text-slate-900 my-4">$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1 class="text-3xl font-bold text-slate-900 my-6">$1</h1>');

    // Convert bold and italic
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em class="italic">$1</em>');

    // Convert strikethrough
    html = html.replace(/~~(.*?)~~/g, '<del class="line-through">$1</del>');

    // Convert links with security attributes
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 underline">$1</a>');

    // Convert images with responsive styling
    html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="w-full h-auto rounded-lg my-4 border border-gray-200" loading="lazy" />');

    // Handle tables with improved parsing
    html = this.parseComplexTables(html);

    // Convert bullet points with improved nesting support
    html = this.parseNestedLists(html);

    // Convert line breaks to paragraphs with better handling
    html = this.convertToParagraphs(html);

    // Restore code blocks and inline code
    codeBlocks.forEach((block, index) => {
      html = html.replace(`__CODE_BLOCK_${index}__`, block);
    });
    inlineCode.forEach((code, index) => {
      html = html.replace(`__INLINE_CODE_${index}__`, code);
    });

    // Clean up extra whitespace and empty paragraphs
    html = html.replace(/<p>\s*<\/p>/g, '');
    html = html.replace(/\n\s*\n/g, '\n');

    return html.trim();
  }

  private static parseComplexTables(html: string): string {
    // Split by lines to handle tables properly
    const lines = html.split('\n');
    const result: string[] = [];
    let inTable = false;
    let tableRows: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Check if line is a table row
      if (line.trim().includes('|') && line.trim().split('|').length > 2) {
        if (!inTable) {
          inTable = true;
          tableRows = [];
        }
        tableRows.push(line);
        
        // Check if next line is separator or end of table
        const nextLine = lines[i + 1];
        if (!nextLine || !nextLine.includes('|') || nextLine.match(/^\|[\s\-:]*\|$/)) {
          if (nextLine && nextLine.match(/^\|[\s\-:]*\|$/)) {
            // Skip separator line
            i++;
          }
          
          // Process accumulated table rows
          if (tableRows.length > 0) {
            result.push(this.buildHtmlTable(tableRows));
          }
          inTable = false;
          tableRows = [];
        }
      } else {
        if (inTable) {
          // End of table
          if (tableRows.length > 0) {
            result.push(this.buildHtmlTable(tableRows));
          }
          inTable = false;
          tableRows = [];
        }
        result.push(line);
      }
    }

    return result.join('\n');
  }

  private static buildHtmlTable(rows: string[]): string {
    let html = '<table class="w-full border-collapse border border-gray-300 my-6">';
    
    // First row is header
    if (rows.length > 0) {
      const headerCells = rows[0].split('|').map(cell => cell.trim()).filter(cell => cell);
      html += '<thead class="bg-gray-50"><tr>';
      headerCells.forEach(cell => {
        html += `<th class="border border-gray-300 px-4 py-3 text-left font-semibold text-slate-900">${cell}</th>`;
      });
      html += '</tr></thead>';
    }

    // Remaining rows are body
    html += '<tbody>';
    for (let i = 1; i < rows.length; i++) {
      const cells = rows[i].split('|').map(cell => cell.trim()).filter(cell => cell);
      if (cells.length > 0) {
        html += '<tr>';
        cells.forEach(cell => {
          html += `<td class="border border-gray-300 px-4 py-3 text-slate-800">${cell}</td>`;
        });
        html += '</tr>';
      }
    }
    html += '</tbody></table>';

    return html;
  }

  private static parseNestedLists(html: string): string {
    // Handle unordered lists
    html = html.replace(/^[\s]*[-*+] (.+)$/gm, '<li class="my-1">$1</li>');
    html = html.replace(/(<li class="my-1">.*<\/li>\s*)+/g, '<ul class="list-disc list-inside my-4 space-y-1 ml-4">$&</ul>');

    // Handle ordered lists
    html = html.replace(/^[\s]*\d+\. (.+)$/gm, '<li class="my-1">$1</li>');
    html = html.replace(/(<li class="my-1">.*<\/li>\s*)+/g, (match) => {
      if (match.includes('<ul')) return match; // Already processed as unordered list
      return '<ol class="list-decimal list-inside my-4 space-y-1 ml-4">' + match + '</ol>';
    });

    return html;
  }

  private static convertToParagraphs(html: string): string {
    // Split into blocks
    const blocks = html.split(/\n\s*\n/);
    const processedBlocks = blocks.map(block => {
      block = block.trim();
      if (!block) return '';
      
      // Don't wrap already formatted elements
      if (block.startsWith('<') && (
        block.includes('<h1') || block.includes('<h2') || block.includes('<h3') || 
        block.includes('<h4') || block.includes('<ul') || block.includes('<ol') ||
        block.includes('<table') || block.includes('<pre') || block.includes('<div')
      )) {
        return block;
      }
      
      // Wrap in paragraph
      return `<p class="text-slate-800 leading-relaxed my-4 text-justify">${block}</p>`;
    });

    return processedBlocks.filter(block => block).join('\n\n');
  }

  public static parseMarkdown(markdownContent: string): MarkdownParseResult {
    const sections: ParsedSection[] = [];
    let order = 0;

    // Split content by headings
    const headingRegex = /^(#{1,6})\s+(.+)$/gm;
    const matches = [...markdownContent.matchAll(headingRegex)];
    
    if (matches.length === 0) {
      // No headings found, create a single custom section
      const htmlContent = this.convertToHtml(markdownContent);
      sections.push({
        id: uuidv4(),
        type: 'custom',
        title: 'Content',
        content: htmlContent,
        order: 0,
      });
    } else {
      // Handle content before first heading
      if (matches[0].index! > 0) {
        const preContent = markdownContent.substring(0, matches[0].index!).trim();
        if (preContent) {
          const htmlContent = this.convertToHtml(preContent);
          sections.push({
            id: uuidv4(),
            type: 'hero',
            title: 'Introduction',
            content: htmlContent,
            order: order++,
          });
        }
      }

      // Process each section
      for (let i = 0; i < matches.length; i++) {
        const match = matches[i];
        const headingLevel = match[1].length;
        const headingText = match[2].trim();
        const startIndex = match.index! + match[0].length;
        const endIndex = i < matches.length - 1 ? matches[i + 1].index! : markdownContent.length;
        
        const sectionContent = markdownContent.substring(startIndex, endIndex).trim();
        
        const htmlContent = this.convertToHtml(sectionContent);
        const sectionType = this.detectSectionType(headingText);

        sections.push({
          id: uuidv4(),
          type: sectionType,
          title: headingText,
          content: htmlContent,
          order: order++,
          originalHeadingLevel: headingLevel,
          metadata: {
            originalMarkdown: sectionContent,
          },
        });

        // Keep track of processed content
        void(endIndex); // Explicitly mark as intentionally unused
      }
    }

    const metadata = this.extractMetadata(markdownContent);

    return {
      sections,
      metadata,
    };
  }

  public static sectionsToMarkdown(sections: ParsedSection[]): string {
    let markdown = '';
    
    sections
      .sort((a, b) => a.order - b.order)
      .forEach(section => {
        // Determine heading level based on section type
        let headingLevel = '##';
        if (section.type === 'title_meta') headingLevel = '#';
        else if (section.type === 'hero') headingLevel = '##';
        else if (['overview', 'highlights', 'pricing', 'verdict'].includes(section.type)) headingLevel = '##';
        else headingLevel = '###';

        markdown += `${headingLevel} ${section.title}\n\n`;
        
        // Convert HTML back to markdown (basic conversion)
        let content = section.content;
        content = content.replace(/<h[1-6]>(.*?)<\/h[1-6]>/g, '### $1');
        content = content.replace(/<strong>(.*?)<\/strong>/g, '**$1**');
        content = content.replace(/<em>(.*?)<\/em>/g, '*$1*');
        content = content.replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/g, '[$2]($1)');
        content = content.replace(/<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*\/>/g, '![$2]($1)');
        content = content.replace(/<code[^>]*>(.*?)<\/code>/g, '`$1`');
        content = content.replace(/<pre[^>]*><code[^>]*>([\s\S]*?)<\/code><\/pre>/g, '```\n$1\n```');
        content = content.replace(/<li>(.*?)<\/li>/g, '- $1');
        content = content.replace(/<ul[^>]*>|<\/ul>/g, '');
        content = content.replace(/<ol[^>]*>|<\/ol>/g, '');
        content = content.replace(/<p[^>]*>|<\/p>/g, '');
        content = content.replace(/<br\s*\/?>/g, '\n');

        markdown += content + '\n\n';
      });

    return markdown.trim();
  }

  /**
   * Simple utility to convert markdown content to HTML
   * @param markdownContent - Raw markdown string
   * @returns HTML string
   */
  public static markdownToHtml(markdownContent: string): string {
    return this.convertToHtml(markdownContent);
  }
}