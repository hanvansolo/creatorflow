// OpenF1 API Types
// Documentation: https://openf1.org/docs/

export interface Session {
  session_key: number;
  meeting_key: number;
  session_name: string;        // "Race", "Qualifying", "Practice 1", "Sprint"
  session_type: string;        // "Race", "Qualifying", "Practice", "Sprint", "Sprint Qualifying"
  circuit_key: number;
  circuit_short_name: string;  // "Monza", "Silverstone", "Monaco"
  country_key: number;
  country_code: string;        // "ITA", "GBR", "MCO"
  country_name: string;        // "Italy", "United Kingdom", "Monaco"
  location: string;            // City name
  date_start: string;          // ISO 8601
  date_end: string;            // ISO 8601
  gmt_offset: string;          // e.g., "02:00:00"
  year: number;
}

export interface Interval {
  date: string;                // ISO 8601 timestamp
  driver_number: number;
  gap_to_leader: number | null;  // Seconds, null if leader or lapped
  interval: number | null;        // Gap to car ahead in seconds
  meeting_key: number;
  session_key: number;
}

export interface Position {
  date: string;                // ISO 8601 timestamp
  driver_number: number;
  meeting_key: number;
  position: number;
  session_key: number;
}

export interface Lap {
  date_start: string;
  driver_number: number;
  duration_sector_1: number | null;
  duration_sector_2: number | null;
  duration_sector_3: number | null;
  i1_speed: number | null;     // Speed at intermediate 1
  i2_speed: number | null;     // Speed at intermediate 2
  is_pit_out_lap: boolean;
  lap_duration: number | null; // Total lap time in seconds
  lap_number: number;
  meeting_key: number;
  segments_sector_1: number[] | null;
  segments_sector_2: number[] | null;
  segments_sector_3: number[] | null;
  session_key: number;
  st_speed: number | null;     // Speed trap
}

export type TireCompound = 'SOFT' | 'MEDIUM' | 'HARD' | 'INTERMEDIATE' | 'WET' | 'UNKNOWN';

export interface Stint {
  compound: TireCompound;
  driver_number: number;
  lap_end: number | null;      // null if current stint
  lap_start: number;
  meeting_key: number;
  session_key: number;
  stint_number: number;
  tyre_age_at_start: number;
}

export interface PitStop {
  date: string;                // ISO 8601 timestamp
  driver_number: number;
  lap_number: number;
  meeting_key: number;
  pit_duration: number;        // Total pit lane time in seconds
  session_key: number;
}

export type RaceControlCategory =
  | 'Flag'
  | 'SafetyCar'
  | 'Drs'
  | 'CarEvent'
  | 'Other';

export type FlagType =
  | 'GREEN'
  | 'YELLOW'
  | 'DOUBLE YELLOW'
  | 'RED'
  | 'CHEQUERED'
  | 'BLACK AND WHITE'
  | 'BLUE'
  | 'BLACK'
  | 'CLEAR';

export interface RaceControlMessage {
  category: RaceControlCategory;
  date: string;                // ISO 8601 timestamp
  driver_number: number | null;
  flag: FlagType | null;
  lap_number: number | null;
  meeting_key: number;
  message: string;
  scope: 'Track' | 'Sector' | 'Driver' | null;
  sector: number | null;       // 1, 2, or 3
  session_key: number;
}

export interface Driver {
  broadcast_name: string;      // "M VERSTAPPEN"
  country_code: string;        // "NED"
  driver_number: number;
  first_name: string;
  full_name: string;           // "Max VERSTAPPEN"
  headshot_url: string | null;
  last_name: string;
  meeting_key: number;
  name_acronym: string;        // "VER"
  session_key: number;
  team_colour: string;         // Hex without # - "3671C6"
  team_name: string;           // "Red Bull Racing"
}

export interface Weather {
  air_temperature: number;     // Celsius
  date: string;                // ISO 8601 timestamp
  humidity: number;            // Percentage 0-100
  meeting_key: number;
  pressure: number;            // hPa
  rainfall: number;            // 0 = no rain, 1 = raining
  session_key: number;
  track_temperature: number;   // Celsius
  wind_direction: number;      // Degrees 0-360
  wind_speed: number;          // m/s
}

export interface CarData {
  brake: number;               // 0-100
  date: string;
  driver_number: number;
  drs: number;                 // 0-14 (DRS status)
  meeting_key: number;
  n_gear: number;              // 0-8
  rpm: number;
  session_key: number;
  speed: number;               // km/h
  throttle: number;            // 0-100
}

export interface Location {
  date: string;                // ISO 8601 timestamp
  driver_number: number;
  meeting_key: number;
  session_key: number;
  x: number;                   // X coordinate on track
  y: number;                   // Y coordinate on track
  z: number;                   // Z coordinate (elevation)
}

// Aggregated types for the dashboard
export interface DriverWithData {
  driver: Driver;
  position: number;
  previousPosition?: number;
  gapToLeader: number | null;
  interval: number | null;
  currentStint: Stint | null;
  lastLap: Lap | null;
  pitStops: PitStop[];
}

export interface LiveData {
  session: Session | null;
  drivers: Driver[];
  positions: Position[];
  intervals: Interval[];
  stints: Stint[];
  pitStops: PitStop[];
  raceControl: RaceControlMessage[];
  weather: Weather | null;
  laps: Lap[];
}

export interface LiveSessionState {
  isLive: boolean;
  session: Session | null;
  lastUpdated: Date | null;
}
