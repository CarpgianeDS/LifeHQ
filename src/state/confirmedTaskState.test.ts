import { createConfirmedTaskState } from './confirmedTaskState';

describe('createConfirmedTaskState', () => {
  test('get() returns undefined for a task with no confirmed value yet', () => {
    const confirmed = createConfirmedTaskState();
    expect(confirmed.get('t1')).toBeUndefined();
  });

  test('set() then get() round-trips the confirmed value', () => {
    const confirmed = createConfirmedTaskState();
    confirmed.set('t1', true);
    expect(confirmed.get('t1')).toBe(true);
    confirmed.set('t1', false);
    expect(confirmed.get('t1')).toBe(false);
  });

  test('resetFrom() initialises confirmed state from a loaded task list', () => {
    const confirmed = createConfirmedTaskState();
    confirmed.resetFrom([
      { id: 't1', completed: true },
      { id: 't2', completed: false },
    ]);
    expect(confirmed.get('t1')).toBe(true);
    expect(confirmed.get('t2')).toBe(false);
    expect(confirmed.size()).toBe(2);
  });

  test('resetFrom() replaces the previous set entirely — a task missing from the new load loses its entry', () => {
    const confirmed = createConfirmedTaskState();
    confirmed.set('stale-task', true);
    confirmed.resetFrom([{ id: 't1', completed: false }]);

    expect(confirmed.get('stale-task')).toBeUndefined();
    expect(confirmed.get('t1')).toBe(false);
    expect(confirmed.size()).toBe(1);
  });

  test('resetFrom() overwrites any confirmed value set before it, even for tasks present in both', () => {
    const confirmed = createConfirmedTaskState();
    confirmed.set('t1', true);
    confirmed.resetFrom([{ id: 't1', completed: false }]);
    expect(confirmed.get('t1')).toBe(false);
  });

  test('size() reflects the number of tracked task ids', () => {
    const confirmed = createConfirmedTaskState();
    expect(confirmed.size()).toBe(0);
    confirmed.set('a', true);
    expect(confirmed.size()).toBe(1);
    confirmed.set('b', false);
    expect(confirmed.size()).toBe(2);
    confirmed.set('a', false); // overwriting an existing key doesn't grow the count
    expect(confirmed.size()).toBe(2);
  });
});
