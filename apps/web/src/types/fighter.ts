export interface FighterDef {
  id: string;
  name: string;
  tagline: string;
  voice: string;
  strategy: string;
  weakness: string;
  color: string;
  animations: {
    idle: string;
    attack: string;
    stun: string;
    special: string;
  };
}
