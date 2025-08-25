# Content Creation Guide

## ✍️ Creating New Blog Posts

### Quick Start

```bash
# Interactive post creation
npm run new-post

# Follow prompts:
# 1. Enter post title
# 2. Add description
# 3. Select tags (comma-separated)
# 4. Post file created with proper frontmatter
```

### Manual Creation

1. Create file in `src/content/blog/your-post-slug.md`
2. Add required frontmatter
3. Write content in Markdown/MDX

## 📝 Post Structure

### Required Frontmatter

```yaml
---
title: 'Your Post Title'
description: 'Brief description for SEO and previews'
pubDate: '2024-01-25' # ISO date format
tags: ['JavaScript', 'Astro', 'web-development']
---
```

### Optional Frontmatter

```yaml
---
# ... required fields above
updatedDate: '2024-01-26' # Shows "Updated on" date
heroImage: '../../assets/blog/hero-image.jpg' # Relative path
featured: true # Highlight as featured post
---
```

### Content Guidelines

**Title Best Practices**:

- Clear and descriptive
- 50-60 characters for SEO
- Use active voice
- Include main keyword

**Description Requirements**:

- 120-160 characters
- Summarize key points
- Include primary keyword
- Avoid duplicate descriptions

## 🏷️ Tagging System

### Available Tags

Use consistent, lowercase tags:

- `JavaScript`, `TypeScript`, `react`, `Astro`
- `CSS`, `HTML`, `frontend`, `backend`
- `tutorial`, `tips`, `review`, `opinion`
- `productivity`, `tools`, `workflow`

### Tag Guidelines

- **Maximum**: 5 tags per post
- **Specificity**: Use specific over generic tags
- **Consistency**: Check existing tags in `/tags/`
- **Relevance**: Tags should match content

## 🖼️ Images & Assets

### Image Management

**Directory**: `src/assets/blog/` or `src/assets/hero-images/`

**Formats Supported**:

- JPEG/JPG (photographs)
- PNG (graphics with transparency)
- WebP (modern format, auto-converted)
- SVG (vector graphics)

### Hero Images

**Random Selection System**:

```typescript
// Automatic random hero image if not specified
const heroImages = [
  'blog-placeholder-2.jpg',
  'blog-placeholder-3.jpg',
  'blog-placeholder-4.jpg',
  'blog-placeholder-5.jpg',
];
```

**Custom Hero Image**:

```yaml
---
heroImage: '../../assets/blog/my-custom-hero.jpg'
---
```

### Image Optimization

**Automatic Processing**:

- WebP conversion for modern browsers
- Responsive size generation
- Lazy loading implementation
- Alt text from filename or caption

**Best Practices**:

- Max width: 1200px for hero images
- Optimize before upload (80-85% JPEG quality)
- Use descriptive filenames
- Include alt text for accessibility

## 📊 SEO Optimization

### Meta Tags (Auto-generated)

The blog automatically generates:

- `<title>` from post title + site name
- `<meta name="description">` from frontmatter
- Open Graph tags for social sharing
- Twitter Card metadata
- Canonical URLs

### Content SEO

**Heading Structure**:

```markdown
# Main Title (H1) - Auto-generated from frontmatter

## Major Section (H2)

### Subsection (H3)

#### Minor Point (H4)
```

**Internal Linking**:

```markdown
<!-- Link to other posts -->

[Previous post about React](../react-hooks-guide/)

<!-- Link to tag pages -->

Check out more [JavaScript posts](/tags/JavaScript/)
```

**Code Blocks**:

````markdown
```JavaScript
// Syntax highlighting included
const greeting = 'Hello, World!';
console.log(greeting);
```
````

````

## 🔗 Social Sharing

### Share Buttons

Automatically generated for:
- Twitter/X
- Facebook
- LinkedIn
- Hatena Bookmark (Japanese audience)
- Pocket

### Custom Share Text

Share buttons use:
- **Title**: Post title
- **URL**: Full canonical URL
- **Description**: Frontmatter description

## 📅 Publishing Workflow

### Development Preview

```bash
# Start dev server
npm run dev

# Navigate to: http://localhost:4321/blog/your-post-slug/
# Check formatting, links, images
````

### Pre-publish Checklist

- [ ] Frontmatter complete and valid
- [ ] Images optimized and loading
- [ ] Internal/external links working
- [ ] Code blocks properly highlighted
- [ ] Tags consistent with existing ones
- [ ] Description under 160 characters
- [ ] Spelling and grammar checked

### Publishing

```bash
# Add and commit new post
git add src/content/blog/your-new-post.md
git commit -m "feat: add post about [topic]"
git push origin main

# Automatic deployment to production
```

## 🎨 Content Features

### Table of Contents

Auto-generated from H2 and H3 headings:

- Smooth scrolling navigation
- Current section highlighting
- Mobile-responsive collapsible

### Related Posts

Automatic suggestions based on:

- Shared tags (primary factor)
- Publication date proximity
- Content similarity

### Syntax Highlighting

**Supported Languages**:

- JavaScript, TypeScript, JSX, TSX
- Python, Rust, Go, Java, C++
- HTML, CSS, SCSS, JSON, YAML
- Bash, Shell, PowerShell
- And 100+ more via Shiki

**Features**:

- GitHub Dark theme
- Line highlighting
- Copy code button
- Language labels

## 📱 Mobile Optimization

### Responsive Design

All content automatically optimized for:

- **Mobile**: < 768px width
- **Tablet**: 768px - 1024px width
- **Desktop**: > 1024px width

### Reading Experience

- Optimized line length (45-75 characters)
- Comfortable line spacing
- Touch-friendly navigation
- Fast loading on mobile networks

---

_See [Development Guide](./development.md) for technical implementation details_
