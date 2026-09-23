const fs = require('fs');
let code = fs.readFileSync('src/types/destination.ts', 'utf-8');

const oldItem = `export interface DestinationSearchItem {
  source: "internal" | "external";
  destinationId?: string;
  externalId?: string;
  type: DestinationType;
  displayName: string;
  secondaryText: string;
  names: DestinationNames;
  countryCode: string;
  timezoneId?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  capabilities?: {
    weather: boolean;
    holidays: boolean;
    festivals: boolean;
    routes?: boolean;
    airQuality?: boolean;
  };
  rawDestination?: Destination;
  matchCategory?: 'strong' | 'contextual';
}`;

const newItem = `export interface DestinationSearchItem {
  source?: "internal" | "external";
  destinationId?: string;
  externalId?: string;
  type?: DestinationType;
  displayName: string;
  secondaryText?: string;
  names?: DestinationNames;
  countryCode?: string;
  timezoneId?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  capabilities?: {
    weather: boolean;
    holidays: boolean;
    festivals: boolean;
    routes?: boolean;
    airQuality?: boolean;
  };
  rawDestination?: Destination;
  matchCategory?: 'strong' | 'contextual';

  // Grouping fields
  groupId?: string;
  isGroup?: boolean;
  recommendedItem?: {
    source: "internal" | "external";
    destinationId?: string;
    externalId?: string;
    type: DestinationType;
    label: string;
    rawDestination?: Destination;
  };
  alternatives?: {
    source: "internal" | "external";
    destinationId?: string;
    externalId?: string;
    type: DestinationType;
    label: string;
    rawDestination?: Destination;
  }[];
  groupingReason?: string;
}`;

code = code.replace(oldItem, newItem);
fs.writeFileSync('src/types/destination.ts', code, 'utf-8');
