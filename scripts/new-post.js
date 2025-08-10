#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.resolve(__dirname, '..');
const templatePath = path.join(projectRoot, 'src', 'content', 'blog-template.md');
const blogDir = path.join(projectRoot, 'src', 'content', 'blog');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const prompt = question => {
  return new Promise(resolve => {
    rl.question(question, answer => {
      resolve(answer);
    });
  });
};

const titleToSlug = title => {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
};

const main = async () => {
  try {
    if (!fs.existsSync(blogDir)) {
      fs.mkdirSync(blogDir, { recursive: true });
    }

    if (!fs.existsSync(templatePath)) {
      console.error(`Template file not found: ${templatePath}`);
      process.exit(1);
    }

    console.log('Creating new blog post\n');
    const title = await prompt('Enter post title: ');

    if (!title.trim()) {
      console.error('Error: Title is required');
      rl.close();
      process.exit(1);
    }

    let slug = titleToSlug(title);

    if (!slug) {
      const customSlug = await prompt('Enter slug for URL (alphanumeric and hyphens only): ');
      slug = titleToSlug(customSlug);

      if (!slug) {
        console.log('Warning: Invalid slug. Using timestamp instead.');
        slug = Date.now().toString();
      }
    }

    let newPostPath = path.join(blogDir, `${slug}.md`);

    let counter = 1;
    const originalSlug = slug;
    while (fs.existsSync(newPostPath)) {
      slug = `${originalSlug}-${counter}`;
      newPostPath = path.join(blogDir, `${slug}.md`);
      counter++;
    }

    const description = await prompt('Enter post description (optional): ');

    const tagsInput = await prompt('Enter tags (comma-separated, e.g., javascript, react): ');
    const tags = tagsInput
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);

    let templateContent = fs.readFileSync(templatePath, 'utf-8');

    const currentDate = new Date().toISOString().split('T')[0];

    templateContent = templateContent
      .replace(/title: '.*?'/, `title: '${title}'`)
      .replace(/description: '.*?'/, `description: '${description || title}'`)
      .replace(/pubDate: '.*?'/, `pubDate: '${currentDate}'`)
      .replace(/tags: \[.*?\]/, `tags: [${tags.map(tag => `'${tag}'`).join(', ')}]`);

    fs.writeFileSync(newPostPath, templateContent);

    console.log('\nSuccess! New post created:\n');
    console.log(`File: ${path.relative(projectRoot, newPostPath)}`);
    console.log(`Slug: ${slug}`);
    console.log(`Title: ${title}`);
    if (description) {
      console.log(`Description: ${description}`);
    }
    if (tags.length > 0) {
      console.log(`Tags: ${tags.join(', ')}`);
    }

    rl.close();
  } catch (error) {
    console.error('Error:', error.message);
    rl.close();
    process.exit(1);
  }
};

main();
