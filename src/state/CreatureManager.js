import findIndex from 'lodash.findindex';
import find from 'lodash.find';
import { getSecondsElapsed } from './BattleManager';
import { conditionDescriptions } from '../model/conditions';

function findCreature(creatures, creatureId) {
  return find(creatures, ({id}) => {
    return creatureId === id;
  });
}

function updateCreature(state, id, updates, announcement) {
  let newCreatures = [...state.creatures];
  const creatureIndex = findIndex(newCreatures, (creature) => {
    return creature.id === id;
  });
  const existingCreature = newCreatures[creatureIndex]
  newCreatures[creatureIndex] = {...existingCreature, ...updates};

  const ariaAnnouncement = announcement ? [announcement] : [];
  const ariaAnnouncements = state.ariaAnnouncements.concat(ariaAnnouncement);

  return { ...state, creatures: newCreatures, ariaAnnouncements };
}

export function killCreature(state, creatureId) {
  const creature = findCreature(state.creatures, creatureId);
  const healthPoints = creature.healthPoints === undefined ? undefined : 0;
  const ariaAnnouncement = `${creature.name} killed/made unconscious`;
  return updateCreature(state, creatureId, {alive: false, healthPoints}, ariaAnnouncement);
};

export function stabalizeCreature(state, creatureId) {
  const creature = findCreature(state.creatures, creatureId);
  const ariaAnnouncement = `${creature.name} stabalized`;
  return updateCreature(state, creatureId, {alive: true}, ariaAnnouncement);
};

export function damageCreature(state, creatureId, damage) {
  if (damage < 0) {
    return state;
  }

  const creature = findCreature(state.creatures, creatureId);

  if (!creature.healthPoints) {
    return state;
  }

  let healthPoints = creature.healthPoints - damage;
  let alive = creature.alive
  if (healthPoints <= 0) {
    healthPoints = 0;
    alive = false;
  }

  const ariaAnnouncement = `damaged ${creature.name} by ${damage}. ${creature.name}'s health is ${healthPoints}`;
  return updateCreature(state, creatureId, {alive, healthPoints}, ariaAnnouncement);
};

export function healCreature(state, creatureId, health) {
  if (health < 0) {
    return state;
  }

  const creature = findCreature(state.creatures, creatureId);

  if (creature.healthPoints === undefined) {
    return state;
  }

  let healthPoints = creature.healthPoints + health;
  if (healthPoints > creature.maxHealthPoints) {
    healthPoints = creature.maxHealthPoints;
  }

  let alive = creature.alive;
  if (healthPoints > 0) {
    alive = true;
  }

  const ariaAnnouncement = `healed ${creature.name} by ${health}. ${creature.name}'s health is ${healthPoints}`;
  return updateCreature(state, creatureId, {alive, healthPoints}, ariaAnnouncement);
};

export function getRawName(name) {
  return name.replace(/[0-9]|#/g, '').trim();
}

export function createCreature(creatureId, {name, number, initiative, healthPoints}) {
  const groupedName = number ? `${name} #${number}` : name;
  return {
    name: groupedName,
    initiative,
    healthPoints,
    maxHealthPoints: healthPoints,
    id: creatureId,
    alive: true,
    conditions: [],
    notes: [],
    locked: false
  };
};

export function validateCreature(name, initiative, healthPoints, multiplier) {
  const nameError = name === '';
  const initiativeError = initiative !== undefined && isNaN(initiative);
  const healthError = healthPoints <= 0;
  const multiplierError = multiplier <= 0 || multiplier > 50;

  if (nameError || initiativeError || healthError || multiplierError) {
    return {
      nameError: nameError ? 'Name must be provided.' : false,
      initiativeError: initiativeError ? 'Initiative must be a number.' : false,
      healthError: healthError ? 'Health must be greater than 0.' : false,
      multiplierError: multiplierError ? 'Multiplier must be greater than 0 and less than 50.' : false
    };
  }

  return undefined;
}

export function addNoteToCreature(state, creatureId, text, isCondition) {
  const creature = findCreature(state.creatures, creatureId);
  const note = {
    text,
    appliedAtRound: state.round,
    appliedAtSeconds: getSecondsElapsed(state)
  };

  if (isCondition) {
    const condition = {
      ...note,
      url: conditionDescriptions[note.text]
    };
    const conditions = [...creature.conditions, condition];
    const ariaAnnouncement = `${note.text} condition added to ${creature.name}`;
    return updateCreature(state, creatureId, { conditions }, ariaAnnouncement);
  }

  const notes = [...creature.notes, note];

  const ariaAnnouncement = `note added to ${creature.name}`;
  return updateCreature(state, creatureId, { notes }, ariaAnnouncement);
}

export function removeNoteFromCreature(state, creatureId, note, isCondition) {
  const creature = findCreature(state.creatures, creatureId);
  const notesList = isCondition ? creature.conditions : creature.notes;
  const notes = notesList.filter(({text, appliedAtRound, appliedAtSeconds}) => {
    const notesAreEqual = text === note.text &&
      appliedAtRound === note.appliedAtRound &&
      appliedAtSeconds === note.appliedAtSeconds;

    return !notesAreEqual;
  });
  const newNotes = isCondition ? { conditions: notes } : { notes };
  const ariaAnnouncement = isCondition ?
    `${note.text} condition removed from ${creature.name}` :
    `note removed from ${creature.name}`;
  return updateCreature(state, creatureId, newNotes, ariaAnnouncement);
}

export function addHealthToCreature(state, creatureId, health) {
  if (health <= 0) {
    return state;
  }

  const creature = findCreature(state.creatures, creatureId);
  if (creature.healthPoints !== undefined) {
    return state;
  } 

  let healthPoints = health;
  if (!creature.alive) {
    healthPoints = 0;
  }

  const ariaAnnouncement = `${creature.name}'s health is ${healthPoints}, max health is ${health}`;
  return updateCreature(state, creatureId, { healthPoints, maxHealthPoints: health}, ariaAnnouncement);
}

export function addInitiativeToCreature(state, creatureId, initiative) {
  const creature = findCreature(state.creatures, creatureId);

  if (creature.initiative !== undefined) {
    return state;
  }

  const ariaAnnouncement = `${creature.name}'s initiative is ${initiative}`;
  return updateCreature(state, creatureId, { initiative }, ariaAnnouncement);
}

export function toggleCreatureLock(state, creatureId) {
  const creature = findCreature(state.creatures, creatureId);
  const newState = creature.locked ? 'unlocked' : 'locked';
  const ariaAnnouncement = `${creature.name} is ${newState}`;
  return updateCreature(state, creatureId, { locked: !creature.locked }, ariaAnnouncement);
}

export function resetCreature(id, creature) {
  const notes = creature.notes.map(note => ({...note, appliedAtRound: 0, appliedAtSeconds: 0}));
  const conditions = creature.conditions.map(condition => ({...condition, appliedAtRound: 0, appliedAtSeconds: 0}));
  return {
    ...creature,
    id,
    initiative: undefined,
    notes,
    conditions
  };
}