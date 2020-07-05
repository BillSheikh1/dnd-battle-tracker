import { 
  save,
  load,
  isSaveLoadSupported,
  dismissErrors,
  addError,
  damageCreature as appDamageCreature
} from './AppManager';
import { damageCreature } from './CreatureManager';
import { addReminder } from './ReminderManager';
import FileSystem from '../util/fileSystem';

jest.mock('../util/fileSystem');
jest.mock('./CreatureManager');
jest.mock('./ReminderManager');

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
      name: 'Goblin',
      initiative: 12,
      healthPoints: 10,
      maxHealthPoints: 10,
      id: 1,
      alive: true,
      conditions: [],
      notes: []
    },
    {
      name: 'Goblin 2',
      initiative: 10,
      healthPoints: 10,
      maxHealthPoints: 10,
      id: 2,
      alive: true,
      conditions: [],
      notes: []
    }
  ],
  creatureIdCount: 3,
  creatureCount: 3,
  activeCreature: 1,
  focusedCreature: 1,
  round: 1,
  ariaAnnouncements: [],
  errors: [],
  createCreatureErrors: {}
};


beforeEach(() => {
  jest.clearAllMocks();
});

describe('save', () => {
  it('saves the current app state removing aria announcements and errors', () => {
    save(defaultState);
    const { calls } = FileSystem.save.mock;
    expect(calls.length).toBe(1);
    const fileContents = JSON.parse(calls[0][2]);
    const { ariaAnnouncements, errors, createCreatureErrors, ...expectedFileContents } = defaultState;
    expect(fileContents).toEqual(expectedFileContents);
  });

  it('saves the file in JSON format', () => {
    save(defaultState);
    const { calls } = FileSystem.save.mock;
    expect(calls[0][1]).toBe('application/json');
  });

  it('includes the current time in the file name', () => {
    save(defaultState);
    const { calls } = FileSystem.save.mock;
    const fileNameRegex = /dnd_battle_tracker_(\d|\d\d)_(\d|\d\d)_\d\d\d\d_(\d|\d\d)_(\d|\d\d)_(\d|\d\d)\.json/g;
    const fileName = calls[0][0];

    expect(fileName.match(fileNameRegex).length).toBe(1);
  });

  it('sets an aria announcement in the app state', () => {
    const expectedState = {
      ...defaultState,
      ariaAnnouncements: ['battle saved']
    };
    expect(save(defaultState)).toEqual(expectedState);
  });
});

describe('load', () => {
  const file = {
    name: 'fileName'
  };

  it('parses the contents of a file as JSON and adds an aria announcement', async () => {
    const { ariaAnnouncements, ...fileContents } = defaultState;
    FileSystem.load.mockReturnValue(new Promise(resolve =>
      resolve(JSON.stringify(fileContents))
    ));

    const loadedFileContents = await load(file, defaultState);

    const { calls } = FileSystem.load.mock;
    expect(calls.length).toBe(1);
    expect(calls[0][0]).toBe(file);
    const expectedFileContents = {
      ...defaultState,
      ariaAnnouncements: ['battle loaded']
    };
    expect(loadedFileContents).toEqual(expectedFileContents);
  });

  it('resets errors on load', async () => {
    const state = {
      ...defaultState,
      errors: ['an error'],
      createCreatureErrors: {some: 'error'}
    };
    const { ariaAnnouncements, createCreatureErrors, errors, ...fileContents } = defaultState;
    FileSystem.load.mockReturnValue(new Promise(resolve =>
      resolve(JSON.stringify(fileContents))
    ));

    const loadedFileContents = await load(file, state);

    const { calls } = FileSystem.load.mock;
    expect(calls.length).toBe(1);
    expect(calls[0][0]).toBe(file);
    const expectedFileContents = {
      ...defaultState,
      ariaAnnouncements: ['battle loaded']
    };
    expect(loadedFileContents).toEqual(expectedFileContents);
  });

  it('sets an error in app state if the loaded file contents do not meet the schema', async () => {
    expect.assertions(1);

    const fileContents = { fake: 'contents' };
    FileSystem.load.mockReturnValue(new Promise(resolve =>
      resolve(JSON.stringify(fileContents))
    ));

    const results = await load(file, defaultState);

    const expectedState = {
      ...defaultState,
      ariaAnnouncements: ['failed to load battle'],
      errors: ['Failed to load battle. The file "fileName" was invalid.']
    };

    expect(results).toEqual(expectedState);
  });
  
  it('sets an error in app state if the loaded file contents are not JSON', async () => {
    expect.assertions(1);

    const fileContents = 'not JSON';
    FileSystem.load.mockReturnValue(new Promise(resolve =>
      resolve(fileContents)
    ));

    const results = await load(file, defaultState);

    const expectedState = {
      ...defaultState,
      ariaAnnouncements: ['failed to load battle'],
      errors: ['Failed to load battle. The file "fileName" was invalid.']
    };

    expect(results).toEqual(expectedState);
  });
});

describe('isSaveLoadSupported', () => {
  it('returns true if saving a file is supported', () => {
    FileSystem.isSaveSupported.mockReturnValue(true);
    expect(isSaveLoadSupported()).toBe(true);
  });

  it('returns false if saving a file is not supported', () => {
    FileSystem.isSaveSupported.mockReturnValue(false);
    expect(isSaveLoadSupported()).toBe(false);
  });
});

describe('dismissErrors', () => {
  it('resets errors to an empty array', () => {
    const state = {
      ...defaultState,
      errors: ['one', 'two', 'three']
    };

    const result = dismissErrors(state);
    expect(result).toEqual(defaultState);
  });

  it('does nothing if there are no errors', () => {
    const result = dismissErrors(defaultState);
    expect(result).toEqual(defaultState);
  });
});

describe('addError', () => {
  test('adds a new error', () => {
    const state = {
      ...defaultState,
      errors: ['one', 'two', 'three']
    };

    const result = addError(state, 'four');
    const expectedErrors = ['one', 'two', 'three', 'four'];
    expect(result).toEqual(expectedErrors);
  });

  test('does not add an error if it exists', () => {
    const errors = ['one', 'two', 'three'];
    const state = {
      ...defaultState,
      errors
    };

    const result = addError(state, 'three');
    expect(result).toEqual(errors);
  });
});


describe('damageCreature', () => {
  it('damages a creature and adds a reminder', () => {
    const stateWithDamage = {
      ...defaultState,
      creatures: [
        defaultState.creatures[0],
        {
          ...defaultState.creatures[1],
          health: 5
        },
        defaultState.creatures[2],
      ]
    };
    const reminder = 'Did the creature have any damage resistances, immunities or vulnerabilities?';
    const stateWithReminder = {
      ...stateWithDamage,
      reminders: [reminder]
    };
    damageCreature.mockReturnValue(stateWithDamage);
    addReminder.mockReturnValue(stateWithReminder);
    
    const result = appDamageCreature(defaultState, 1, 5);

    expect(result).toEqual(stateWithReminder);
    expect(damageCreature).toHaveBeenCalledWith(defaultState, 1, 5);
    expect(addReminder).toHaveBeenCalledWith(stateWithDamage, reminder);
  });
});
