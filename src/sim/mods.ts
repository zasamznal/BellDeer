import { RULES } from './rules';

/** Derived stats after the active cards are applied. One rank per card. */
export interface Mods {
  fuelPerLog: number;
  chopSeconds: number;
  beamDrain: number;
  sprintCost: number;
  trapStun: number;
  berryHp: number;
  berryStamina: number;
  radiusMult: number;
  trapCost: number;
  pulse: boolean;
  sprint: number;
  beamRange: number;
  revealSeconds: number;
  torchSeconds: number;
  hearStep: number;
  hearRun: number;
  ember: boolean;
  autoTrap: boolean;
  dynamo: boolean;
  flareRadius: number;
  flareStun: number;
}

export function computeMods(cards: readonly string[]): Mods {
  const has = (id: string) => cards.includes(id);
  return {
    fuelPerLog: has('C01') ? 24 : RULES.fire.fuelPerLog,
    chopSeconds: has('C02') ? 1.5 : RULES.player.chopSeconds,
    beamDrain: has('C03') ? 1 : RULES.flashlight.drain,
    sprintCost: has('C04') ? 12 : RULES.player.sprintCost,
    trapStun: has('C05') ? 4 : RULES.trap.stun,
    berryHp: has('C06') ? 28 : RULES.player.berryHp,
    berryStamina: has('C06') ? 35 : RULES.player.berryStamina,
    radiusMult: has('R01') ? 1.2 : 1,
    trapCost: has('R02') ? 1 : RULES.trap.cost,
    pulse: has('R03'),
    sprint: has('R04') ? 7 : RULES.player.sprint,
    beamRange: has('R05') ? 20 : RULES.flashlight.range,
    revealSeconds: has('R05') ? 0.5 : RULES.flashlight.revealSeconds,
    torchSeconds: has('R06') ? 27 : RULES.torch.seconds,
    hearStep: has('R07') ? 3 : RULES.deer.hearStep,
    hearRun: has('R07') ? 6 : RULES.deer.hearRun,
    ember: has('E01'),
    autoTrap: has('E02'),
    dynamo: has('E03'),
    flareRadius: has('E04') ? 6 : RULES.flare.radius,
    flareStun: has('E04') ? 2.5 : RULES.flare.stun,
  };
}
