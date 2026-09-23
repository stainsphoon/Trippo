const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

const originalRoute = code.substring(
  code.indexOf("app.post('/app-api/destinations/resolve'"),
  code.indexOf("  // Catch-all 404 for unhandled API routes")
);

const newRoute = `app.post('/app-api/destinations/resolve', async (req, res) => {
    try {
      const { provider = 'google', externalId, language = 'ko', pendingAlias } = req.body;
      if (!externalId) {
        return res.status(400).json({ error: 'externalId is required' });
      }

      if (!webDb) {
        throw new Error('Firestore not initialized');
      }

      // 1. Google Place ID 매핑 문서 조회
      const encodedPlaceId = Buffer.from(externalId).toString('base64').replace(/[/+=]/g, '');
      const mappingDocRef = webDoc(webDb, 'destinationProviderMappings', \`google_\${encodedPlaceId}\`);
      
      const mappingSnap = await webGetDoc(mappingDocRef);
      if (mappingSnap.exists()) {
        const mappingData = mappingSnap.data();
        if (mappingData.destinationId) {
          const destRef = webDoc(webDb, 'destinations', mappingData.destinationId);
          const destSnap = await webGetDoc(destRef);
          if (destSnap.exists()) {
             // 2. 존재하면 연결된 기존 Destination 반환
             console.log(\`[RESOLVE_MAPPING_HIT] Found existing mapping for \${externalId} -> \${mappingData.destinationId}\`);
             upsertRuntimeDestination(destSnap.data() as any);
             return res.json({ status: 'resolved', destination: destSnap.data() });
          }
        }
      }

      // 3. 없으면 canonical Destination 후보 조회
      const apiKey = process.env.GOOGLE_MAPS_PLATFORM_KEY || process.env.GOOGLE_MAPS_API_KEY || process.env.GEMINI_API_KEY;
      const destination = await resolveDestinationDetails({
        provider,
        externalId,
        language: language as 'ko' | 'en',
        googleApiKey: apiKey,
        pendingAlias,
        skipCache: true
      });

      // 4. Firestore transaction 시작
      let finalizedDestination = destination;
      try {
        const docRef = webDoc(webDb, 'destinations', destination.id);
        
        finalizedDestination = await webRunTransaction(webDb, async (transaction) => {
          // Check mapping again inside transaction just in case of race condition (인스턴스 A와 B 동시 resolve)
          const txMappingSnap = await transaction.get(mappingDocRef);
          if (txMappingSnap.exists()) {
            const txMappingData = txMappingSnap.data();
            const existingDestRef = webDoc(webDb, 'destinations', txMappingData.destinationId);
            const existingDestSnap = await transaction.get(existingDestRef);
            if (existingDestSnap.exists()) {
              return existingDestSnap.data() as any;
            }
          }

          const docSnap = await transaction.get(docRef);
          
          let merged: any;
          if (!docSnap.exists()) {
            merged = destination;
            transaction.set(docRef, destination);
          } else {
            // 5. Destination 문서 생성 또는 병합
            const existing = docSnap.data() as any;

            const mergedAliasesKo = Array.from(new Set([
              ...(existing.aliases?.ko || []),
              ...(destination.aliases?.ko || [])
            ].filter(Boolean)));

            const mergedAliasesEn = Array.from(new Set([
              ...(existing.aliases?.en || []),
              ...(destination.aliases?.en || [])
            ].filter(Boolean)));

            const mergedPendingAliases = Array.from(new Set([
              ...(existing.pendingAliases || []),
              ...(destination.pendingAliases || [])
            ].filter(Boolean)));

            const mergedMetaMap = new Map<string, any>();
            (existing.pendingAliasesMetadata || []).forEach((m: any) => mergedMetaMap.set(m.alias, m));
            (destination.pendingAliasesMetadata || []).forEach((m: any) => {
              const prev = mergedMetaMap.get(m.alias);
              if (prev) {
                mergedMetaMap.set(m.alias, {
                  ...prev,
                  selectionCount: (prev.selectionCount || 1) + 1,
                  lastSelectedAt: m.lastSelectedAt
                });
              } else {
                mergedMetaMap.set(m.alias, m);
              }
            });

            const mergedMetaList = Array.from(mergedMetaMap.values());

            merged = {
              ...destination,
              aliases: {
                ko: mergedAliasesKo,
                en: mergedAliasesEn,
                local: existing.aliases?.local || [],
              },
              pendingAliases: mergedPendingAliases,
              pendingAliasesMetadata: mergedMetaList,
              createdAt: existing.createdAt || destination.createdAt,
              updatedAt: new Date().toISOString(),
              popularity: {
                ...destination.popularity,
                searchCount: (existing.popularity?.searchCount || 0) + 1,
                recentSearchCount: (existing.popularity?.recentSearchCount || 0) + 1
              }
            };

            transaction.set(docRef, merged);
          }

          // 6. Provider Mapping 문서 생성
          transaction.set(mappingDocRef, {
            provider: 'google',
            providerPlaceId: externalId,
            destinationId: merged.id,
            createdAt: merged.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });

          return merged;
        });

        // 8. 메모리 매핑은 성능 캐시로만 갱신
        upsertRuntimeDestination(finalizedDestination);
        
        console.log(\`[RESOLVE_TRANSACTION_SUCCESS] Atomic merge & mapping completed for: \${finalizedDestination.id}\`);
        enqueueDestinationEnrichment(webDb, finalizedDestination.id);
      } catch (fErr: any) {
        console.warn('[Firestore Transaction Warning] Transaction failed, falling back:', fErr.message);
        upsertRuntimeDestination(destination);
        try {
          await webSetDocData('destinations', destination.id, destination, { merge: true });
        } catch (subErr) {
          console.warn('[Firestore Fallback Write Warning] Fallback failed too.');
        }
      }

      // Invalidate empty cache entries for this resolved destination (and all its names/aliases/prefixes)
      const termsToClear = [
        finalizedDestination.names?.ko,
        finalizedDestination.names?.en,
        ...(finalizedDestination.aliases?.ko || []),
        ...(finalizedDestination.aliases?.en || []),
        ...(finalizedDestination.prefixes || [])
      ].map(t => normalizeSearchText(t)).filter(Boolean);

      const clearedKeys: string[] = [];
      for (const key of emptyQueryCache.keys()) {
        const keyQuery = key.split(':')[0];
        if (termsToClear.some((term: string) => keyQuery === term || term.startsWith(keyQuery) || keyQuery.startsWith(term))) {
          emptyQueryCache.delete(key);
          clearedKeys.push(key);
        }
      }

      lastPrefixedSyncTime.clear();
      console.log(\`[RESOLVE_CACHE_INVALIDATION] Invalidated negative cache keys: \${JSON.stringify(clearedKeys)} for destination: \${finalizedDestination.id}.\`);

      return res.json({
        status: 'resolved',
        destination: finalizedDestination
      });
    } catch (err: any) {
      console.error('[Resolve Destination Error]', err.message);
      return res.status(500).json({ error: 'Failed to resolve destination', details: err.message });
    }
  });\n\n`;

code = code.replace(originalRoute, newRoute);

// Also add import for enqueueDestinationEnrichment
code = code.replace(
  `import crypto from "crypto";`,
  `import crypto from "crypto";\nimport { enqueueDestinationEnrichment } from "./src/services/destinationLifecycleWorker.js";`
);

fs.writeFileSync('server.ts', code, 'utf-8');
