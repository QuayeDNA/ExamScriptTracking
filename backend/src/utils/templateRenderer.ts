import fs from 'fs';
import path from 'path';

/**
 * Simple template renderer for HTML templates
 */
export class TemplateRenderer {
  private templatesDir: string;

  constructor() {
    // In production, templates are relative to the dist directory
    // In development, templates are in the root templates directory
    const isProduction = process.env.NODE_ENV === 'production' || !fs.existsSync(path.join(__dirname, '../../../templates'));
    if (isProduction) {
      // Production: look for templates relative to dist directory
      this.templatesDir = path.join(__dirname, '../templates');
    } else {
      // Development: look for templates in root directory
      this.templatesDir = path.join(__dirname, '../../../templates');
    }
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