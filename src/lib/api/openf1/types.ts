// TODO: Rewrite for Footy Feed (stubbed during F1→Soccer migration)

export interface Session {
  session_key: number;
  meeting_key: number;
  session_name: string;
  session_type: string;
  circuit_key: number;
  circuit_short_name: string;
  country_key: number;
  country_code: string;
  country_name: string;
  location: string;
  date_start: string;
  date_end: string;
  gmt_offset: string;
  year: number;
}

export interface Interval {
  date: string;
  driver_number: number;
  gap_to_leader: number | null;
  interval: number | null;
  meeting_key: number;
  session_key: number;
}

export interface Position {
  date: string;
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
  i1_speed: number | null;
  i2_speed: number | null;
  is_pit_out_lap: boolean;
  lap_duration: number | null;
  lap_number: number;
  meeting_key: number;
  segments_sector_1: number[] | null;
  segments_sector_2: number[] | null;
  segments_sector_3: number[] | null;
  session_key: number;
  st_speed: number | null;
}

export type TireCompound = 'SOFT' | 'MEDIUM' | 'HARD' | 'INTERMEDIATE' | 'WET' | 'UNKNOWN';

export interface Stint {
  compound: TireCompound;
  driver_number: number;
  lap_end: number | null;
  lap_start: number;
  meeting_key: number;
  session_key: number;
  stint_number: number;
  tyre_age_at_start: number;
}

export interface PitStop {
  date: string;
  driver_number: number;
  lap_number: number;
  meeting_key: number;
  pit_duration: number;
  session_key: number;
}

export type RaceControlCategory = 'Flag' | 'SafetyCar' | 'Drs' | 'CarEvent' | 'Other';
export type FlagType = 'GREEN' | 'YELLOW' | 'DOUBLE YELLOW' | 'RED' | 'CHEQUERED' | 'BLACK AND WHITE' | 'BLUE' | 'BLACK' | 'CLEAR';

export interface RaceControlMessage {
  category: RaceControlCategory;
  date: string;
  driver_number: number | null;
  flag: FlagType | null;
  lap_number: number | null;
  meeting_key: number;
  message: string;
  scope: 'Track' | 'Sector' | 'Driver' | null;
  sector: number | null;
  session_key: number;
}

export interface Driver {
  broadcast_name: string;
  country_code: string;
  driver_number: number;
  first_name: string;
  full_name: string;
  headshot_url: string | null;
  last_name: string;
  meeting_key: number;
  name_acronym: string;
  session_key: number;
  team_colour: string;
  team_name: string;
}

export interface Weather {
  air_temperature: number;
  date: string;
  humidity: number;
  meeting_key: number;
  pressure: number;
  rainfall: number;
  session_key: number;
  track_temperature: number;
  wind_direction: number;
  wind_speed: number;
}

export interface CarData {
  brake: number;
  date: string;
  driver_number: number;
  drs: number;
  meeting_key: number;
  n_gear: number;
  rpm: number;
  session_key: number;
  speed: number;
  throttle: number;
}

export interface Location {
  date: string;
  driver_number: number;
  meeting_key: number;
  session_key: number;
  x: number;
  y: number;
  z: number;
}

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
