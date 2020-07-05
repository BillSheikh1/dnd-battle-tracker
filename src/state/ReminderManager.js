import find from 'lodash.find';

export function toggleReminders(state) {
  return {...state, remindersEnabled: !state.remindersEnabled};
}

export function addReminder(state, reminderToAdd) {
  const reminderExists = find(state.reminders, reminder => reminder === reminderToAdd);

  if (reminderExists) {
    return state;
  }
  const reminders = state.reminders.concat(reminderToAdd);
  return {...state, reminders};
}