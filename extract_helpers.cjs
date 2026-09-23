const fs = require('fs');
let code = fs.readFileSync('src/components/GooglePlaceInput.tsx', 'utf-8');

// First, remove the old renderTypeIcon and renderTypeLabel from inside GooglePlaceInput
const oldHelpers = `  const renderTypeIcon = (type: DestinationType) => {
    switch (type) {
      case 'city':
        return <Building2 size={14} className="text-blue-500 shrink-0" />;
      case 'island':
      case 'tourism_region':
        return <Sparkles size={14} className="text-amber-500 shrink-0" />;
      case 'country':
        return <Globe size={14} className="text-emerald-500 shrink-0" />;
      default:
        return <MapPin size={14} className="text-purple-500 shrink-0" />;
    }
  };

  const renderTypeLabel = (type: DestinationType) => {
    switch (type) {
      case 'city':
        return isKo ? '도시' : 'City';
      case 'island':
        return isKo ? '섬·해양' : 'Island';
      case 'tourism_region':
        return isKo ? '관광권역' : 'Region';
      case 'country':
        return isKo ? '국가' : 'Country';
      case 'admin_area':
        return isKo ? '행정구역' : 'State';
      case 'district':
        return isKo ? '지역' : 'District';
      default:
        return isKo ? '목적지' : 'Destination';
    }
  };`;

code = code.replace(oldHelpers, '');

// Now define them outside
const newHelpers = `
export const renderTypeIcon = (type?: DestinationType) => {
  switch (type) {
    case 'city':
      return <Building2 size={14} className="text-blue-500 shrink-0" />;
    case 'island':
    case 'tourism_region':
      return <Sparkles size={14} className="text-amber-500 shrink-0" />;
    case 'country':
      return <Globe size={14} className="text-emerald-500 shrink-0" />;
    default:
      return <MapPin size={14} className="text-purple-500 shrink-0" />;
  }
};

export const renderTypeLabel = (type: DestinationType | undefined, isKo: boolean) => {
  switch (type) {
    case 'city':
      return isKo ? '도시' : 'City';
    case 'island':
      return isKo ? '섬·해양' : 'Island';
    case 'tourism_region':
      return isKo ? '관광권역' : 'Region';
    case 'country':
      return isKo ? '국가' : 'Country';
    case 'admin_area':
      return isKo ? '행정구역' : 'State';
    case 'district':
      return isKo ? '지역' : 'District';
    default:
      return isKo ? '목적지' : 'Destination';
  }
};
`;

code = code.replace(`import { searchInternalDestinations } from '../services/destinationSearchService';`, `import { searchInternalDestinations } from '../services/destinationSearchService';\n` + newHelpers);

// Update calls to renderTypeLabel(type) -> renderTypeLabel(type, isKo)
code = code.replace(/renderTypeLabel\(([^)]+)\)/g, 'renderTypeLabel($1, isKo)');

fs.writeFileSync('src/components/GooglePlaceInput.tsx', code, 'utf-8');
