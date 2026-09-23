import { Destination } from '../types/destination';
import { SEED_DESTINATIONS } from '../data/seedDestinations';
import { normalizeSearchText } from '../utils/destinationSearchNormalization';

interface MigrationStats {
  totalProcessed: number;
  aliasesCorrectedCount: number;
  capabilitiesUpgradedCount: number;
  pendingAliasesConsolidatedCount: number;
  popularityInitializedCount: number;
  displayNamesCreatedCount: number;
}

export function performDryRunMigration(destinations: any[]): {
  stats: MigrationStats;
  migratedDestinations: Destination[];
} {
  const stats: MigrationStats = {
    totalProcessed: 0,
    aliasesCorrectedCount: 0,
    capabilitiesUpgradedCount: 0,
    pendingAliasesConsolidatedCount: 0,
    popularityInitializedCount: 0,
    displayNamesCreatedCount: 0,
  };

  const migratedDestinations: Destination[] = destinations.map((orig) => {
    stats.totalProcessed++;
    const dest = JSON.parse(JSON.stringify(orig)); // Deep clone

    // 1. Process displayKo and displayEn
    let displayKoCreated = false;
    let displayEnCreated = false;

    if (!dest.names) {
      dest.names = { ko: dest.name || '여행지', en: dest.nameEn || 'Destination' };
    }

    const cleanSuffix = (str: string, suffix: string) => {
      if (str.endsWith(suffix) && str.length > suffix.length) {
        return str.slice(0, -suffix.length);
      }
      return str;
    };

    if (!dest.names.displayKo) {
      const koBase = dest.names.ko || '';
      let displayKo = cleanSuffix(koBase, '시');
      displayKo = cleanSuffix(displayKo, '군');
      displayKo = cleanSuffix(displayKo, '구');
      displayKo = cleanSuffix(displayKo, '현');
      dest.names.displayKo = displayKo;
      dest.names.officialKo = koBase;
      dest.names.local = koBase;
      displayKoCreated = true;
    }

    if (!dest.names.displayEn) {
      const enBase = dest.names.en || '';
      let displayEn = enBase.replace(/-(si|gun|gu|do|ken|shi|city|prefecture)$/i, '').trim();
      displayEn = displayEn.replace(/\s+(City|Prefecture|Province|State|District)$/i, '').trim();
      dest.names.displayEn = displayEn;
      dest.names.officialEn = enBase;
      displayEnCreated = true;
    }

    if (displayKoCreated || displayEnCreated) {
      stats.displayNamesCreatedCount++;
    }

    // 2. Separate administrative levels from aliases to hierarchySearchTokens
    const originalAliasesKo = dest.aliases?.ko || [];
    const originalAliasesEn = dest.aliases?.en || [];
    const hierarchySearchTokens = dest.hierarchySearchTokens || [];
    const hierarchyTokensSet = new Set<string>(hierarchySearchTokens);

    const countryNameKo = dest.hierarchy?.countryNameKo;
    const countryNameEn = dest.hierarchy?.countryNameEn;
    const admin1NameKo = dest.hierarchy?.admin1NameKo;
    const admin1NameEn = dest.hierarchy?.admin1NameEn;
    const admin2NameKo = dest.hierarchy?.admin2NameKo;
    const admin2NameEn = dest.hierarchy?.admin2NameEn;

    const parentNames = new Set<string>([
      countryNameKo,
      countryNameEn,
      admin1NameKo,
      admin1NameEn,
      admin2NameKo,
      admin2NameEn,
    ].filter(Boolean).map(x => normalizeSearchText(x)));

    // Clean aliases
    const cleanAliasesKo = originalAliasesKo.filter((a: string) => {
      const norm = normalizeSearchText(a);
      if (parentNames.has(norm)) {
        hierarchyTokensSet.add(a);
        return false;
      }
      return true;
    });

    const cleanAliasesEn = originalAliasesEn.filter((a: string) => {
      const norm = normalizeSearchText(a);
      if (parentNames.has(norm)) {
        hierarchyTokensSet.add(a);
        return false;
      }
      return true;
    });

    // Extract prefixes of hierarchy names
    if (admin1NameKo) {
      hierarchyTokensSet.add(admin1NameKo);
      if (admin1NameKo.startsWith('강원')) {
        hierarchyTokensSet.add('강원');
      }
      const cleanAdmin1 = admin1NameKo.replace(/(특별자치도|광역시|특별자치시|특별시|도)$/, '');
      if (cleanAdmin1 && cleanAdmin1 !== admin1NameKo) {
        hierarchyTokensSet.add(cleanAdmin1);
      }
    }
    if (admin1NameEn) {
      hierarchyTokensSet.add(admin1NameEn);
      const cleanAdmin1En = admin1NameEn.replace(/-(do|province|state|prefecture)$/i, '').trim();
      if (cleanAdmin1En && cleanAdmin1En !== admin1NameEn) {
        hierarchyTokensSet.add(cleanAdmin1En);
      }
    }

    if (
      cleanAliasesKo.length !== originalAliasesKo.length ||
      cleanAliasesEn.length !== originalAliasesEn.length ||
      hierarchyTokensSet.size > (dest.hierarchySearchTokens?.length || 0)
    ) {
      stats.aliasesCorrectedCount++;
    }

    dest.aliases = {
      ko: cleanAliasesKo,
      en: cleanAliasesEn,
      local: dest.aliases?.local || [],
    };
    dest.hierarchySearchTokens = Array.from(hierarchyTokensSet);

    // 3. Process pendingAliases and pendingAliasesMetadata consolidation
    const originalPendingList = dest.pendingAliases || [];
    const originalMetadataList = dest.pendingAliasesMetadata || [];
    const approvedList: string[] = [];
    const consolidatedPendingList: string[] = [];

    originalMetadataList.forEach((meta: any) => {
      if (meta.status === 'approved') {
        approvedList.push(meta.alias);
      } else if (meta.status === 'pending') {
        consolidatedPendingList.push(meta.alias);
      }
    });

    if (approvedList.length > 0) {
      approvedList.forEach((alias) => {
        if (/[ㄱ-ㅎㅏ-ㅣ가-힣]/.test(alias)) {
          if (!dest.aliases.ko.includes(alias)) dest.aliases.ko.push(alias);
        } else {
          if (!dest.aliases.en.includes(alias)) dest.aliases.en.push(alias);
        }
      });
      stats.pendingAliasesConsolidatedCount++;
    }

    dest.pendingAliases = consolidatedPendingList;

    // 4. Upgrade capabilities to stateful format
    let capabilitiesUpgraded = false;
    const defaultStatefulCapabilities = {
      weather: { status: 'verified', provider: 'google_weather' },
      holidays: { status: 'verified', provider: 'public_holidays' },
      festivals: { status: 'pending', provider: null },
      routes: { status: 'verified', provider: 'google_routes' },
      airQuality: { status: 'pending', provider: null },
    };

    if (!dest.capabilities) {
      dest.capabilities = defaultStatefulCapabilities;
      capabilitiesUpgraded = true;
    } else {
      const keys = ['weather', 'holidays', 'festivals', 'routes', 'airQuality'];
      const updatedCaps: any = {};
      keys.forEach((key) => {
        const val = dest.capabilities[key];
        if (typeof val === 'boolean') {
          capabilitiesUpgraded = true;
          if (val) {
            updatedCaps[key] = {
              status: 'verified',
              provider: key === 'weather' ? 'google_weather' : (key === 'routes' ? 'google_routes' : 'default'),
            };
          } else {
            updatedCaps[key] = { status: 'unsupported', provider: null };
          }
        } else if (val && typeof val === 'object' && val.status) {
          updatedCaps[key] = val; // Already updated
        } else {
          updatedCaps[key] = { status: 'pending', provider: null };
          capabilitiesUpgraded = true;
        }
      });
      dest.capabilities = updatedCaps;
    }

    if (capabilitiesUpgraded) {
      stats.capabilitiesUpgradedCount++;
    }

    // 5. Ensure popularity is valid
    if (!dest.popularity || typeof dest.popularity.globalScore !== 'number') {
      dest.popularity = {
        globalScore: 0,
        searchCount: 1,
        recentSearchCount: 1,
      };
      stats.popularityInitializedCount++;
    }

    return dest;
  });

  return {
    stats,
    migratedDestinations,
  };
}

// Executed when run directly from command line
if (process.argv[1] && (process.argv[1].endsWith('migrationDryRun.ts') || process.argv[1].endsWith('migrationDryRun.js'))) {
  console.log('==================================================');
  console.log('      TRIPPO FIRESTORE MIGRATION DRY-RUN CLI      ');
  console.log('==================================================');

  // Inject a dirty/messy "Gangneung" document representing the legacy structure
  const testDestinations = [
    ...SEED_DESTINATIONS,
    {
      id: 'kr-gangneung',
      type: 'city',
      names: {
        ko: '강릉시',
        en: 'Gangneung-si',
      },
      aliases: {
        ko: ['강릉', '강릉시', '강원특별자치도'], // Crucial test: includes hierarchy
        en: ['Gangneung', 'Gangneung-si', 'Gangwon-do'], // Crucial test: includes hierarchy
        local: [],
      },
      hierarchy: {
        countryCode: 'KR',
        countryNameKo: '대한민국',
        countryNameEn: 'South Korea',
        admin1NameKo: '강원특별자치도',
        admin1NameEn: 'Gangwon-do',
      },
      pendingAliases: ['강릉'],
      pendingAliasesMetadata: [
        { alias: '강릉', source: 'autocomplete_selection', status: 'approved', searchable: true }
      ],
      capabilities: {
        weather: true,
        holidays: true,
        festivals: false,
        routes: true,
        airQuality: false,
      },
    }
  ];

  console.log(`Loaded ${testDestinations.length} destinations for dry-run simulation.`);
  const result = performDryRunMigration(testDestinations);

  console.log('\n==================================================');
  console.log('               MIGRATION STATISTICS               ');
  console.log('==================================================');
  console.log(JSON.stringify(result.stats, null, 2));

  console.log('\n==================================================');
  console.log('     MIGRATED DOCUMENT DETAIL: GANGNEUNG          ');
  console.log('==================================================');
  const gangneung = result.migratedDestinations.find(d => d.id === 'kr-gangneung');
  console.log(JSON.stringify(gangneung, null, 2));
}
