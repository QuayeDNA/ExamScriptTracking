import fs from 'fs';
import path from 'path';

/**
 * Simple template renderer for HTML templates
 */
export class TemplateRenderer {
  private templatesDir: string;

  constructor(templatesDir: string = path.join(__dirname, '../templates')) {
    this.templatesDir = templatesDir;
  }

  /**
   * Render a template with data
   */
  render(templateName: string, data: Record<string, any>): string {
    const templatePath = path.join(this.templatesDir, templateName);
    let template = fs.readFileSync(templatePath, 'utf-8');

    // Replace placeholders with data
    for (const [key, value] of Object.entries(data)) {
      const placeholder = `{{${key.toUpperCase()}}}`;
      template = template.replace(new RegExp(placeholder, 'g'), value);
    }

    return template;
  }

  /**
   * Render features list for the landing page
   */
  renderFeaturesList(features: string[]): string {
    return features
      .map(feature => `<div class="feature-item">${feature}</div>`)
      .join('');
  }
}

// Export singleton instance
export const templateRenderer = new TemplateRenderer();