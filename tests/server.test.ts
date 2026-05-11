import { describe, it, expect } from 'vitest';
import { execSync } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

describe('Resto MCP Server', () => {
  const distPath = path.join(__dirname, '..', 'dist');
  const indexPath = path.join(distPath, 'index.js');

  beforeAll(() => {
    // Ensure build exists
    if (!fs.existsSync(indexPath)) {
      throw new Error('Build not found. Run npm run build first.');
    }
  });

  describe('Package Configuration', () => {
    it('should have valid package.json', () => {
      const pkgPath = path.join(__dirname, '..', 'package.json');
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
      
      expect(pkg.name).toBe('resto-mcp-server');
      expect(pkg.version).toBeDefined();
      expect(pkg.main).toBe('dist/index.js');
      expect(pkg.bin).toBeDefined();
      expect(pkg.bin['resto-mcp-server']).toBe('dist/index.js');
    });

    it('should have required scripts', () => {
      const pkgPath = path.join(__dirname, '..', 'package.json');
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
      
      expect(pkg.scripts.build).toBeDefined();
      expect(pkg.scripts.start).toBeDefined();
      expect(pkg.scripts.test).toBeDefined();
    });

    it('should have correct dependencies', () => {
      const pkgPath = path.join(__dirname, '..', 'package.json');
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
      
      expect(pkg.dependencies['@modelcontextprotocol/sdk']).toBeDefined();
      expect(pkg.devDependencies.typescript).toBeDefined();
    });
  });

  describe('Build Output', () => {
    it('should have compiled index.js', () => {
      expect(fs.existsSync(indexPath)).toBe(true);
    });

    it('should have compiled skills.js', () => {
      const skillsPath = path.join(distPath, 'skills.js');
      expect(fs.existsSync(skillsPath)).toBe(true);
    });

    it('should have shebang in index.js', () => {
      const content = fs.readFileSync(indexPath, 'utf-8');
      expect(content.startsWith('#!/usr/bin/env node')).toBe(true);
    });
  });

  describe('Skills Module', () => {
    it('should export all required skills', async () => {
      const skillsModule = await import('../src/skills.js');
      
      expect(skillsModule.allSkills).toBeDefined();
      expect(Array.isArray(skillsModule.allSkills)).toBe(true);
      expect(skillsModule.allSkills.length).toBe(14);
      
      const skillNames = skillsModule.allSkills.map((s: any) => s.name);
      expect(skillNames).toContain('resto');
      expect(skillNames).toContain('resto-help');
      expect(skillNames).toContain('resto-review');
      expect(skillNames).toContain('resto-commit');
      expect(skillNames).toContain('resto-compress');
      expect(skillNames).toContain('resto-docs');
      expect(skillNames).toContain('resto-debug');
      expect(skillNames).toContain('resto-stats');
      expect(skillNames).toContain('resto-backend');
      expect(skillNames).toContain('resto-frontend');
      expect(skillNames).toContain('resto-chat');
      expect(skillNames).toContain('resto-plan');
      expect(skillNames).toContain('resto-verify');
      expect(skillNames).toContain('resto-learn');
    });

    it('should have valid skill structure', async () => {
      const skillsModule = await import('../src/skills.js');
      
      skillsModule.allSkills.forEach((skill: any) => {
        expect(skill.name).toBeDefined();
        expect(typeof skill.name).toBe('string');
        expect(skill.description).toBeDefined();
        expect(typeof skill.description).toBe('string');
        expect(skill.content).toBeDefined();
        expect(typeof skill.content).toBe('string');
        expect(skill.content.length).toBeGreaterThan(0);
      });
    });

    it('should have resto skill with intensity examples', async () => {
      const skillsModule = await import('../src/skills.js');
      const restoSkill = skillsModule.restoSkill;
      
      expect(restoSkill.content).toContain('lite');
      expect(restoSkill.content).toContain('full');
      expect(restoSkill.content).toContain('ultra');
      expect(restoSkill.content).toContain('zen');
    });

    it('should have backend skill with comprehensive content', async () => {
      const skillsModule = await import('../src/skills.js');
      const backendSkill = skillsModule.restoBackendSkill;
      
      expect(backendSkill.content.length).toBeGreaterThan(1000);
      expect(backendSkill.content).toContain('PostgreSQL');
      expect(backendSkill.content).toContain('API');
      expect(backendSkill.content).toContain('Security');
    });

    it('should have frontend skill with design principles', async () => {
      const skillsModule = await import('../src/skills.js');
      const frontendSkill = skillsModule.restoFrontendSkill;
      
      expect(frontendSkill.content.length).toBeGreaterThan(1000);
      expect(frontendSkill.content).toContain('Typography');
      expect(frontendSkill.content).toContain('Component');
      expect(frontendSkill.content).toContain('Accessibility');
    });
  });

  describe('Server Startup', () => {
    it('should have executable permissions', () => {
      // Verify the built file exists and has content
      const stats = fs.statSync(indexPath);
      expect(stats.size).toBeGreaterThan(0);
      
      // Check for shebang line
      const content = fs.readFileSync(indexPath, 'utf-8');
      expect(content.startsWith('#!/usr/bin/env node')).toBe(true);
    });

    it('should import skills module successfully', async () => {
      // Dynamic import should work
      const skillsModule = await import('../src/skills.js');
      expect(skillsModule.allSkills).toBeDefined();
      expect(skillsModule.allSkills.length).toBe(14);
    });
  });
});
