import {
    toggleReminders,
    addReminder
} from './ReminderManager';

const defaultState = {
  creatures:[
    {
      name: 'Wellby',
      initiative: 13,
      id: 0,
      alive:true,
      conditions: [],
      notes: []
    },
    {
      name: 'Goblin #1',
      initiative: 12,
      healthPoints: 10,
      maxHealthPoints: 10,
      id: 1,
      alive: true,
      conditions: [],
      notes: [],
      locked: true
    },
    {
      name: 'Goblin #2',
      initiative: 12,
      healthPoints: 10,
      maxHealthPoints: 10,
      id: 2,
      alive: true,
      conditions: [],
      notes: [],
      locked: true
    }
  ],
  creatureIdCount: 3,
  creatureCount: 3,
  activeCreature: 1,
  focusedCreature: 1,
  round: 1,
  ariaAnnouncements: [],
  errors: [],
  reminders: [],
  createCreatureErrors: {},
  remindersEnabled: false
};

describe('toggleReminders', () => {
  it('sets remindersEnabled to true if it is false', () => {
    const expected = {
      ...defaultState,
      remindersEnabled: true
    };
    expect(toggleReminders(defaultState)).toEqual(expected);
  });

  it('sets remindersEnabled to false if it is true', () => {
    const state = {
      ...defaultState,
      remindersEnabled: true
    };

    const expected = {
      ...defaultState,
      remindersEnabled: false
    };
    expect(toggleReminders(state)).toEqual(expected);
  });
});

describe('addReminder', () => {
  test('adds a new reminder', () => {
    const state = {
      ...defaultState,
      reminders: ['one', 'two', 'three']
    };

    const expectedState = {
      ...defaultState,
      reminders: ['one', 'two', 'three', 'four']
    }

    const result = addReminder(state, 'four');
    expect(result).toEqual(expectedState);
  });

  test('does not add a reminder if it exists', () => {
    const reminders = ['one', 'two', 'three'];
    const state = {
      ...defaultState,
      reminders
    };

    const result = addReminder(state, 'three');
    expect(result).toEqual(state);
  });
});
