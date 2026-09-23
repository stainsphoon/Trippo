
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, limit, getDocs, writeBatch, doc } from 'firebase/firestore';
import * as fs from 'fs';
import { performDryRunMigration } from './migrationDryRun';

const firebaseConfig = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf8'));

const args = process.argv.slice(2);
const isApply = args.includes('--apply');
const isDryRun = args.includes('--dry-run') || !isApply;
const destIdArg = args.find(a => a.startsWith('--destination-id='));
const destId = destIdArg ? destIdArg.split('=')[1] : null;
const batchSizeArg = args.find(a => a.startsWith('--batch-size='));
const batchSizeVal = batchSizeArg ? parseInt(batchSizeArg.split('=')[1], 10) : 500;
const rollbackFileArg = args.find(a => a.startsWith('--rollback-file='));
const rollbackFile = rollbackFileArg ? rollbackFileArg.split('=')[1] : null;

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function runMigration() {
  console.log(`Starting Migration Tool...`);
  console.log(`Mode: ${isApply ? 'APPLY' : 'DRY-RUN'}`);
  if (destId) console.log(`Targeting Destination ID: ${destId}`);
  if (rollbackFile) {
    await performRollback(rollbackFile);
    return;
  }

  const q = destId 
    ? query(collection(db, 'destinations'), where('id', '==', destId))
    : query(collection(db, 'destinations'), limit(batchSizeVal));

  const snapshot = await getDocs(q);
  const rawDestinations = snapshot.docs.map(d => d.data());
  
  console.log(`Fetched ${rawDestinations.length} destinations.`);

  if (isApply && rawDestinations.length > 0) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const snapshotFile = `migration_snapshot_${timestamp}.json`;
    fs.writeFileSync(snapshotFile, JSON.stringify(rawDestinations, null, 2));
    console.log(`Saved original data for rollback: ${snapshotFile}`);
  }

  const { stats, migratedDestinations } = performDryRunMigration(rawDestinations);
  
  console.log('\n--- Migration Stats ---');
  console.log(`Scanned: ${stats.totalProcessed}`);
  
  let changedCount = 0;
  let skippedCount = 0;
  let failedCount = 0;
  
  if (isApply) {
    const batch = writeBatch(db);
    for (const dest of migratedDestinations) {
      try {
        dest.migrationVersion = 4;
        dest.migratedAt = new Date().toISOString();
        
        const docRef = doc(db, 'destinations', dest.id);
        batch.set(docRef, dest, { merge: true });
        changedCount++;
      } catch (err) {
        failedCount++;
      }
    }
    
    if (changedCount > 0) {
      await batch.commit();
      console.log(`\nCommitted ${changedCount} updates to Firestore.`);
    }
  } else {
    fs.writeFileSync('migration_dryrun_result.json', JSON.stringify(migratedDestinations, null, 2));
    console.log(`\nDry run completed. Results saved to migration_dryrun_result.json`);
  }
  
  console.log(`\n--- Final Summary ---`);
  console.log(`Changed: ${changedCount}`);
  console.log(`Skipped: ${skippedCount}`);
  console.log(`Failed: ${failedCount}`);
}

async function performRollback(file) {
  console.log(`Starting Rollback from ${file}...`);
  if (!fs.existsSync(file)) {
    console.error('Rollback file not found!');
    return;
  }
  
  const originalData = JSON.parse(fs.readFileSync(file, 'utf-8'));
  console.log(`Found ${originalData.length} records to restore.`);
  
  const batch = writeBatch(db);
  for (const item of originalData) {
    if (item.id) {
      const docRef = doc(db, 'destinations', item.id);
      batch.set(docRef, item);
    }
  }
  
  await batch.commit();
  console.log('Rollback completed.');
}

runMigration().catch(console.error);
