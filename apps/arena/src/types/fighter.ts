export interface FighterDef {
  id: string;
  name: string;
  tagline: string;
  color: string;
  animations: {
    idle: string;
    attack: string;
    stun: string;
    special: string;
  };
}
