/**
 * Unit tests for the Calendar Redux reducer
 *
 * Tests verify state transitions for all fulfilled/rejected action cases.
 * Thunks are not called — we dispatch raw action objects directly to the reducer.
 */
import calendarReducer, { initialState } from '../slices/calendar/reducer';

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Build a fake fulfilled action matching the RTK pattern */
const fulfilled = (type: string, payload: unknown) => ({
  type: `calendar/${type}/fulfilled`,
  payload,
});

/** Build a fake rejected action matching the RTK pattern */
const rejected = (type: string, message: string) => ({
  type: `calendar/${type}/rejected`,
  error: { message },
});

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('calendarReducer', () => {
  it('returns initial state when called with undefined state', () => {
    const state = calendarReducer(undefined, { type: '@@INIT' });
    expect(state).toEqual(initialState);
  });

  // ── getEvents ─────────────────────────────────────────────────────────────

  it('getEvents/fulfilled → sets state.events to the payload', () => {
    const events = [{ id: '1', title: 'Booking A', start: '2026-04-01T10:00' }];
    const state = calendarReducer(initialState, fulfilled('getEvents', events));
    expect(state.events).toEqual(events);
  });

  it('getEvents/rejected → stores error message in state.error', () => {
    const state = calendarReducer(initialState, rejected('getEvents', 'Network error'));
    expect(state.error).toBe('Network error');
  });

  // ── addNewEvent ───────────────────────────────────────────────────────────

  it('addNewEvent/fulfilled → appends new event to state.events', () => {
    const existing = { id: '1', title: 'Existing', start: '2026-04-01T09:00' };
    const newEvent = { id: '2', title: 'New Event', start: '2026-04-01T10:00' };
    const stateWithEvent = { ...initialState, events: [existing] };

    const state = calendarReducer(stateWithEvent, fulfilled('addNewEvent', newEvent));
    expect(state.events).toHaveLength(2);
    expect(state.events[1]).toEqual(newEvent);
  });

  it('addNewEvent/rejected → stores error message', () => {
    const state = calendarReducer(initialState, rejected('addNewEvent', 'Server error'));
    expect(state.error).toBe('Server error');
  });

  // ── updateEvent ───────────────────────────────────────────────────────────

  it('updateEvent/fulfilled → updates the matching event in state.events', () => {
    const original = { id: '42', title: 'Original', start: '2026-04-01T10:00', color: 'red' };
    const updated = { id: '42', title: 'Updated', start: '2026-04-01T11:00', color: 'blue' };
    const stateWithEvent = { ...initialState, events: [original] };

    const state = calendarReducer(stateWithEvent, fulfilled('updateEvent', updated));
    expect(state.events).toHaveLength(1);
    expect(state.events[0].title).toBe('Updated');
    expect(state.events[0].color).toBe('blue');
  });

  it('updateEvent/fulfilled → leaves other events untouched', () => {
    const eventA = { id: '1', title: 'A' };
    const eventB = { id: '2', title: 'B' };
    const updatedB = { id: '2', title: 'B Updated' };
    const baseState = { ...initialState, events: [eventA, eventB] };

    const state = calendarReducer(baseState, fulfilled('updateEvent', updatedB));
    expect(state.events[0]).toEqual(eventA); // A is unchanged
    expect(state.events[1].title).toBe('B Updated');
  });

  it('updateEvent/rejected → stores error message', () => {
    const state = calendarReducer(initialState, rejected('updateEvent', 'Update failed'));
    expect(state.error).toBe('Update failed');
  });

  // ── deleteEvent ───────────────────────────────────────────────────────────

  it('deleteEvent/fulfilled → removes event with matching id from state.events', () => {
    const eventA = { id: '1', title: 'Keep' };
    const eventB = { id: '2', title: 'Delete me' };
    const baseState = { ...initialState, events: [eventA, eventB] };

    const state = calendarReducer(baseState, fulfilled('deleteEvent', '2'));
    expect(state.events).toHaveLength(1);
    expect(state.events[0].id).toBe('1');
  });

  it('deleteEvent/rejected → stores error message', () => {
    const state = calendarReducer(initialState, rejected('deleteEvent', 'Delete failed'));
    expect(state.error).toBe('Delete failed');
  });

  // ── getCategories ─────────────────────────────────────────────────────────

  it('getCategories/fulfilled → sets state.categories', () => {
    const cats = [{ id: 'cat-1', label: 'Manicure', color: '#ff0000' }];
    const state = calendarReducer(initialState, fulfilled('getCategories', cats));
    expect(state.categories).toEqual(cats);
  });

  it('getCategories/rejected → stores error message', () => {
    const state = calendarReducer(initialState, rejected('getCategories', 'Failed to load categories'));
    expect(state.error).toBe('Failed to load categories');
  });

  // ── getUpCommingEvent ─────────────────────────────────────────────────────

  it('getUpCommingEvent/fulfilled → sets state.upcommingevents', () => {
    const upcoming = [{ id: 'e-1', title: 'Upcoming' }];
    const state = calendarReducer(initialState, fulfilled('getUpCommingEvent', upcoming));
    expect(state.upcommingevents).toEqual(upcoming);
  });

  it('getUpCommingEvent/rejected → stores error message', () => {
    const state = calendarReducer(initialState, rejected('getUpCommingEvent', 'Upcoming fetch error'));
    expect(state.error).toBe('Upcoming fetch error');
  });

  // ── error field handling ──────────────────────────────────────────────────

  it('rejected action with undefined error.message stores null in state.error', () => {
    // action.error?.message is undefined → should fall back to null
    const state = calendarReducer(initialState, {
      type: 'calendar/getEvents/rejected',
      error: {},
    });
    expect(state.error).toBeNull();
  });
});
