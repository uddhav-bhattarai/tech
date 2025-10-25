/**
 * Content Transformation Utilities
 * Converts between Traditional, Sectioned, and Markdown formats
 */

import { marked } from 'marked'
import TurndownService from 'turndown'
import { 
  UnifiedContentData, 
  TraditionalContent, 
  SectionContent, 
  MarkdownContent,
  BlogSection,
  ContentTransformer
} from '../types/content'

// Configure markdown parser
const renderer = new marked.Renderer()
marked.setOptions({
  renderer,
  pedantic: false,
  gfm: true,
  breaks: false
})

// Configure HTML to Markdown converter
const turndownService = new TurndownService({
  headingStyle: 'atx',
  hr: '---',
  bulletListMarker: '-',
  codeBlockStyle: 'fenced',
  fence: '```'
})

// Section type mapping for intelligent detection
const SECTION_TYPE_KEYWORDS: Record<string, string[]> = {
  introduction: ['intro', 'introduction', 'overview', 'about', 'what is'],
  overview: ['overview', 'summary', 'at a glance', 'key features', 'highlights'],
  design: ['design', 'build', 'construction', 'materials', 'appearance', 'aesthetics'],
  display: ['display', 'screen', 'panel', 'resolution', 'brightness', 'color'],
  performance: ['performance', 'benchmark', 'speed', 'processor', 'cpu', 'gpu', 'gaming'],
  camera: ['camera', 'photo', 'video', 'imaging', 'lens', 'sensor', 'portrait'],
  battery: ['battery', 'charging', 'power', 'endurance', 'life', 'consumption'],
  software: ['software', 'os', 'operating system', 'ui', 'interface', 'features'],
  connectivity: ['connectivity', 'network', '5g', 'wifi', 'bluetooth', 'nfc'],
  audio: ['audio', 'sound', 'speaker', 'music', 'volume', 'quality'],
  security: ['security', 'biometric', 'fingerprint', 'face', 'privacy', 'encryption'],
  comparison: ['comparison', 'vs', 'versus', 'compare', 'against', 'alternative'],
  'pros-cons': ['pros', 'cons', 'advantages', 'disadvantages', 'positives', 'negatives'],
  verdict: ['verdict', 'conclusion', 'final', 'thoughts', 'recommendation', 'summary'],
  specifications: ['specifications', 'specs', 'technical', 'details', 'features'],
  pricing: ['price', 'pricing', 'cost', 'variants', 'availability', 'purchase'],
  accessories: ['accessories', 'extras', 'add-ons', 'compatible', 'ecosystem']
}

export class ContentTransformationService implements ContentTransformer {
  
  /**
   * Convert from Traditional content to unified format
   */
  fromTraditional(content: TraditionalContent): UnifiedContentData {
    return content
  }

  /**
   * Convert from Sectioned content to unified format
   */
  fromSectioned(content: SectionContent): UnifiedContentData {
    return content
  }

  /**
   * Convert from Markdown content to unified format
   */
  fromMarkdown(content: MarkdownContent): UnifiedContentData {
    return content
  }

  /**
   * Convert unified content to Traditional format
   */
  toTraditional(data: UnifiedContentData): TraditionalContent {
    switch (data.type) {
      case 'traditional':
        return data
      
      case 'sectioned':
        const htmlContent = this.sectionsToHtml(data.sections)
        return {
          type: 'traditional',
          content: htmlContent,
          format: 'html'
        }
      
      case 'markdown':
        const htmlFromMarkdown = marked(data.content) as string
        return {
          type: 'traditional',
          content: htmlFromMarkdown,
          format: 'html'
        }
      
      default:
        throw new Error(`Unsupported content type: ${(data as UnifiedContentData).type}`)
    }
  }

  /**
   * Convert unified content to Sectioned format
   */
  toSectioned(data: UnifiedContentData): SectionContent {
    switch (data.type) {
      case 'sectioned':
        return data
      
      case 'traditional':
        const sections = this.htmlToSections(data.content)
        return {
          type: 'sectioned',
          sections
        }
      
      case 'markdown':
        const sectionsFromMarkdown = this.markdownToSections(data.content)
        return {
          type: 'sectioned',
          sections: sectionsFromMarkdown
        }
      
      default:
        throw new Error(`Unsupported content type: ${(data as UnifiedContentData).type}`)
    }
  }

  /**
   * Convert unified content to Markdown format
   */
  toMarkdown(data: UnifiedContentData): MarkdownContent {
    switch (data.type) {
      case 'markdown':
        return data
      
      case 'traditional':
        const markdownFromHtml = turndownService.turndown(data.content)
        return {
          type: 'markdown',
          content: markdownFromHtml
        }
      
      case 'sectioned':
        const markdownFromSections = this.sectionsToMarkdown(data.sections)
        return {
          type: 'markdown',
          content: markdownFromSections
        }
      
      default:
        throw new Error(`Unsupported content type: ${(data as UnifiedContentData).type}`)
    }
  }

  /**
   * Convert sections to HTML
   */
  private sectionsToHtml(sections: BlogSection[]): string {
    const sortedSections = [...sections].sort((a, b) => a.order - b.order)
    
    return sortedSections.map(section => {
      const headingLevel = this.getSectionHeadingLevel(section.type)
      return `<h${headingLevel}>${section.title}</h${headingLevel}>\n${section.content}\n`
    }).join('\n')
  }

  /**
   * Convert sections to Markdown
   */
  private sectionsToMarkdown(sections: BlogSection[]): string {
    const sortedSections = [...sections].sort((a, b) => a.order - b.order)
    
    return sortedSections.map(section => {
      const headingLevel = this.getSectionHeadingLevel(section.type)
      const headingPrefix = '#'.repeat(headingLevel)
      const markdownContent = turndownService.turndown(section.content)
      return `${headingPrefix} ${section.title}\n\n${markdownContent}\n`
    }).join('\n')
  }

  /**
   * Convert HTML to sections by parsing headings
   */
  private htmlToSections(html: string): BlogSection[] {
    const sections: BlogSection[] = []
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')
    
    const headings = doc.querySelectorAll('h1, h2, h3, h4, h5, h6')
    let currentSection: BlogSection | null = null
    let sectionContent: string[] = []
    let order = 1

    for (let i = 0; i < headings.length; i++) {
      const heading = headings[i]
      const title = heading.textContent?.trim() || ''
      
      // Save previous section if exists
      if (currentSection) {
        currentSection.content = sectionContent.join('\n').trim()
        sections.push(currentSection)
        sectionContent = []
      }

      // Create new section
      currentSection = {
        id: `section-${order}`,
        type: this.detectSectionType(title),
        title,
        content: '',
        order: order++
      }

      // Collect content until next heading
      let nextElement = heading.nextElementSibling
      while (nextElement && !nextElement.matches('h1, h2, h3, h4, h5, h6')) {
        sectionContent.push(nextElement.outerHTML)
        nextElement = nextElement.nextElementSibling
      }
    }

    // Add last section
    if (currentSection) {
      currentSection.content = sectionContent.join('\n').trim()
      sections.push(currentSection)
    }

    return sections
  }

  /**
   * Convert Markdown to sections by parsing headings
   */
  private markdownToSections(markdown: string): BlogSection[] {
    const sections: BlogSection[] = []
    const lines = markdown.split('\n')
    let currentSection: BlogSection | null = null
    let sectionContent: string[] = []
    let order = 1

    for (const line of lines) {
      const headingMatch = line.match(/^(#{1,6})\s+(.+)$/)
      
      if (headingMatch) {
        // Save previous section if exists
        if (currentSection) {
          currentSection.content = marked(sectionContent.join('\n').trim()) as string
          sections.push(currentSection)
          sectionContent = []
        }

        // Create new section
        const title = headingMatch[2].trim()
        currentSection = {
          id: `section-${order}`,
          type: this.detectSectionType(title),
          title,
          content: '',
          order: order++
        }
      } else if (currentSection) {
        sectionContent.push(line)
      }
    }

    // Add last section
    if (currentSection) {
      currentSection.content = marked(sectionContent.join('\n').trim()) as string
      sections.push(currentSection)
    }

    return sections
  }

  /**
   * Detect section type based on title content
   */
  private detectSectionType(title: string): BlogSection['type'] {
    const lowerTitle = title.toLowerCase()
    
    for (const [type, keywords] of Object.entries(SECTION_TYPE_KEYWORDS)) {
      if (keywords.some(keyword => lowerTitle.includes(keyword))) {
        return type as BlogSection['type']
      }
    }
    
    return 'custom'
  }

  /**
   * Get appropriate heading level for section type
   */
  private getSectionHeadingLevel(sectionType: BlogSection['type']): number {
    const headingMap: Record<string, number> = {
      introduction: 2,
      overview: 2,
      design: 2,
      display: 2,
      performance: 2,
      camera: 2,
      battery: 2,
      software: 2,
      connectivity: 2,
      audio: 2,
      security: 2,
      comparison: 2,
      'pros-cons': 2,
      verdict: 2,
      specifications: 2,
      pricing: 2,
      highlights: 3,
      accessories: 3,
      custom: 2
    }
    
    return headingMap[sectionType] || 2
  }

  /**
   * Validate content structure
   */
  validateContent(data: UnifiedContentData): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    switch (data.type) {
      case 'traditional':
        if (!data.content || data.content.trim().length === 0) {
          errors.push('Traditional content cannot be empty')
        }
        break
      
      case 'sectioned':
        if (!data.sections || data.sections.length === 0) {
          errors.push('Sectioned content must have at least one section')
        } else {
          data.sections.forEach((section, index) => {
            if (!section.title || section.title.trim().length === 0) {
              errors.push(`Section ${index + 1} must have a title`)
            }
            if (!section.content || section.content.trim().length === 0) {
              errors.push(`Section ${index + 1} must have content`)
            }
          })
        }
        break
      
      case 'markdown':
        if (!data.content || data.content.trim().length === 0) {
          errors.push('Markdown content cannot be empty')
        }
        break
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * Get content statistics
   */
  getContentStats(data: UnifiedContentData) {
    switch (data.type) {
      case 'traditional':
        const textContent = data.content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
        return {
          wordCount: textContent.split(' ').length,
          characterCount: textContent.length,
          sectionCount: (data.content.match(/<h[1-6][^>]*>/g) || []).length
        }
      
      case 'sectioned':
        const totalText = data.sections
          .map(s => s.content.replace(/<[^>]*>/g, ' '))
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim()
        return {
          wordCount: totalText.split(' ').length,
          characterCount: totalText.length,
          sectionCount: data.sections.length
        }
      
      case 'markdown':
        const plainText = data.content.replace(/[#*_`~]/g, '').replace(/\s+/g, ' ').trim()
        return {
          wordCount: plainText.split(' ').length,
          characterCount: plainText.length,
          sectionCount: (data.content.match(/^#+\s/gm) || []).length
        }
    }
  }
}

// Export singleton instance
export const contentTransformer = new ContentTransformationService()

// Export individual utility functions
export {
  SECTION_TYPE_KEYWORDS,
  marked,
  turndownService
}