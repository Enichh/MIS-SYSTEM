/**
 * Embedding Backfill Script
 * 
 * Run this to populate embeddings for all existing data
 * Usage: npx ts-node scripts/backfill-embeddings.ts [employees|projects|tasks|all]
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing required environment variables:');
  console.error('  - NEXT_PUBLIC_SUPABASE_URL');
  console.error('  - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

interface EmbeddingResult {
  success: number;
  failed: number;
  total: number;
}

async function generateEmbedding(text: string): Promise<number[]> {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/generate-embedding`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({ text, normalize: true }),
  });

  if (!response.ok) {
    throw new Error(`Edge Function error: ${response.status}`);
  }

  const data = await response.json();
  return data.embedding;
}

async function backfillEmployees(batchSize = 10): Promise<EmbeddingResult> {
  const { data: employees, error } = await supabase
    .from('employees')
    .select('id, name, role, department, skills')
    .is('embedding', null);

  if (error) throw error;
  if (!employees?.length) {
    console.log('✓ All employees already have embeddings');
    return { success: 0, failed: 0, total: 0 };
  }

  console.log(`\n🔄 Backfilling ${employees.length} employees...`);
  let success = 0, failed = 0;

  for (let i = 0; i < employees.length; i += batchSize) {
    const batch = employees.slice(i, i + batchSize);
    
    await Promise.all(batch.map(async (emp) => {
      try {
        const skills = Array.isArray(emp.skills) ? emp.skills.join(', ') : '';
        const text = `${emp.name} is a ${emp.role} in ${emp.department} with skills in ${skills}`.trim();
        const embedding = await generateEmbedding(text);
        
        const { error: updateError } = await supabase
          .from('employees')
          .update({ embedding })
          .eq('id', emp.id);

        if (updateError) throw updateError;
        
        success++;
        process.stdout.write(`\r  Progress: ${success + failed}/${employees.length} (${success} ✓, ${failed} ✗)`);
      } catch (err) {
        failed++;
        console.error(`\n  ✗ Failed: ${emp.name}`, err);
      }
    }));

    // Rate limiting delay
    if (i + batchSize < employees.length) {
      await new Promise(r => setTimeout(r, 500));
    }
  }

  console.log(`\n✓ Employees: ${success} succeeded, ${failed} failed`);
  return { success, failed, total: employees.length };
}

async function backfillProjects(batchSize = 10): Promise<EmbeddingResult> {
  const { data: projects, error } = await supabase
    .from('projects')
    .select('id, name, description, status, priority')
    .is('embedding', null);

  if (error) throw error;
  if (!projects?.length) {
    console.log('✓ All projects already have embeddings');
    return { success: 0, failed: 0, total: 0 };
  }

  console.log(`\n🔄 Backfilling ${projects.length} projects...`);
  let success = 0, failed = 0;

  for (let i = 0; i < projects.length; i += batchSize) {
    const batch = projects.slice(i, i + batchSize);
    
    await Promise.all(batch.map(async (proj) => {
      try {
        const text = `${proj.name} ${proj.description || ''} ${proj.status} priority ${proj.priority} project`.trim();
        const embedding = await generateEmbedding(text);
        
        const { error: updateError } = await supabase
          .from('projects')
          .update({ embedding })
          .eq('id', proj.id);

        if (updateError) throw updateError;
        
        success++;
        process.stdout.write(`\r  Progress: ${success + failed}/${projects.length} (${success} ✓, ${failed} ✗)`);
      } catch (err) {
        failed++;
        console.error(`\n  ✗ Failed: ${proj.name}`, err);
      }
    }));

    if (i + batchSize < projects.length) {
      await new Promise(r => setTimeout(r, 500));
    }
  }

  console.log(`\n✓ Projects: ${success} succeeded, ${failed} failed`);
  return { success, failed, total: projects.length };
}

async function backfillTasks(batchSize = 10): Promise<EmbeddingResult> {
  const { data: tasks, error } = await supabase
    .from('tasks')
    .select('id, title, description, priority, status')
    .is('embedding', null);

  if (error) throw error;
  if (!tasks?.length) {
    console.log('✓ All tasks already have embeddings');
    return { success: 0, failed: 0, total: 0 };
  }

  console.log(`\n🔄 Backfilling ${tasks.length} tasks...`);
  let success = 0, failed = 0;

  for (let i = 0; i < tasks.length; i += batchSize) {
    const batch = tasks.slice(i, i + batchSize);
    
    await Promise.all(batch.map(async (task) => {
      try {
        const text = `${task.title} ${task.description || ''} ${task.priority} priority ${task.status} status`.trim();
        const embedding = await generateEmbedding(text);
        
        const { error: updateError } = await supabase
          .from('tasks')
          .update({ embedding })
          .eq('id', task.id);

        if (updateError) throw updateError;
        
        success++;
        process.stdout.write(`\r  Progress: ${success + failed}/${tasks.length} (${success} ✓, ${failed} ✗)`);
      } catch (err) {
        failed++;
        console.error(`\n  ✗ Failed: ${task.title}`, err);
      }
    }));

    if (i + batchSize < tasks.length) {
      await new Promise(r => setTimeout(r, 500));
    }
  }

  console.log(`\n✓ Tasks: ${success} succeeded, ${failed} failed`);
  return { success, failed, total: tasks.length };
}

async function main() {
  const target = process.argv[2] || 'all';
  const batchSize = parseInt(process.argv[3]) || 10;

  console.log('═══════════════════════════════════════════════════');
  console.log('       Embedding Backfill Script');
  console.log('       Using: Supabase AI gte-small (384d)');
  console.log('═══════════════════════════════════════════════════');

  const startTime = Date.now();
  const results: Record<string, EmbeddingResult> = {};

  try {
    if (target === 'all' || target === 'employees') {
      results.employees = await backfillEmployees(batchSize);
    }
    
    if (target === 'all' || target === 'projects') {
      results.projects = await backfillProjects(batchSize);
    }
    
    if (target === 'all' || target === 'tasks') {
      results.tasks = await backfillTasks(batchSize);
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    
    console.log('\n═══════════════════════════════════════════════════');
    console.log('       Backfill Complete!');
    console.log(`       Duration: ${duration}s`);
    console.log('═══════════════════════════════════════════════════');
    
    Object.entries(results).forEach(([type, result]) => {
      if (result.total > 0) {
        console.log(`  ${type}: ${result.success}/${result.total} (${result.failed} failed)`);
      }
    });
    
    process.exit(0);
  } catch (error) {
    console.error('\n✗ Backfill failed:', error);
    process.exit(1);
  }
}

main();
