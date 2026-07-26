# LifeHQ

## Tasks persistence (SQLite)

Tasks are the first feature promoted from in-memory mock state to real,
persisted, single-device storage. Reminders, Meals, Calendar and Household
remain in-memory for now — this is deliberately scoped to Tasks only. No
authentication, cloud sync, or external integrations are implemented.

### Architecture

```
Screens/components → TasksContext → TaskService → TasksRepository (interface) → SQLiteTasksRepository → SQLite
```

No screen or component imports SQLite or database code directly. The
`TasksRepository` interface is the seam: `SQLiteTasksRepository` is the real
implementation, `InMemoryTasksRepository` is a test double used only in
tests, and `TaskService` (which contains no SQLite import at all) can be
constructed with either.

### Changed files

**New:**
- `src/data/dueDate.ts` / `.test.ts` — pure due-date bucket/label derivation (the unit-test target)
- `src/storage/database/migrations.ts` — versioned schema (`tasks`, `app_meta` tables)
- `src/storage/database/migrate.ts` — crash-safe `PRAGMA user_version` migration runner
- `src/storage/database/client.ts` — module-level SQLite connection singleton; fails fast with a clear message on web (SQLite's web backend needs Metro WASM config this project doesn't have)
- `src/storage/database/seed.ts` / `.test.ts` — first-run seed data, guarded by a persisted `app_meta` marker (not a `COUNT(*)` check, so deleting every task never triggers re-seeding)
- `src/storage/id.ts` — shared id generator
- `src/storage/repositories/TasksRepository.ts` — the repository interface
- `src/storage/repositories/taskRowMapper.ts` / `.test.ts` — pure row↔domain mapping (no SQLite import, kept separate specifically so it's unit-testable)
- `src/storage/repositories/SQLiteTasksRepository.ts` — the real implementation
- `src/storage/repositories/InMemoryTasksRepository.ts` — test-only implementation
- `src/services/errors.ts` — `TaskValidationError`, `TaskPersistenceError`, `TaskUnavailableError`, dev-logging helper
- `src/services/TaskService.ts` / `.test.ts` — validation, orchestration, error wrapping (no SQLite import)
- `src/services/taskServiceInstance.ts` — the single composition point wiring `TaskService` to `SQLiteTasksRepository`
- `src/state/tasksOptimistic.ts` / `.test.ts` — optimistic-completion-with-rollback, as a plain testable function

**Modified:**
- `src/types/models.ts` — `CategoryKey`/`PriorityKey` moved here (domain layer, no longer defined in the theme); `Task` gains canonical `dueAt`/`createdAt`/`updatedAt` (+ unused `householdId`/`createdByMemberId`/`updatedByMemberId` schema headroom); new `DisplayTask`/`NewTaskInput`/`UpdateTaskInput`; `EmailSuggestion.dueLabel`/`dueBucket` → `dueAt`
- `src/theme/tokens.ts` — re-exports `CategoryKey`/`PriorityKey` from `types/models` instead of defining them
- `src/state/TasksContext.tsx` — rewritten: DB-backed load/create/toggle, `loading`/`error`/`retry`
- `src/data/mockTasks.ts` — `initialTasks` → `seedTasks` (relative day-offsets, consumed only by the seed script)
- `src/data/notifications.ts` — `computeNotifSummary` now takes `DisplayTask[]`
- `src/components/QuickAddSheet.tsx` — builds a `NewTaskInput` with a real `dueAt`; keeps the sheet open with your text intact if saving fails
- `src/screens/DashboardScreen.tsx`, `src/screens/TasksScreen.tsx` — loading spinner + error card with Retry, built from each screen's existing style tokens (no new visual language)
- `package.json` — `expo-sqlite` dependency; `jest-expo`/`jest`/`@types/jest` devDependencies; `typecheck`/`test`/`test:ci`/`doctor`/`verify` scripts
- `tsconfig.json` — `"types": ["jest"]`

**Confirmed unchanged:** `TaskRow.tsx`, `TaskDetailScreen.tsx`, `TestNotificationBanner.tsx`, `NotificationSettingsScreen.tsx`, `AppProviders.tsx`, `App.tsx`, and everything under Reminders/Meals/Calendar/Household.

### Commands

```bash
# install (already done in this repo, listed for a fresh clone)
npm install

# type-check, test, and doctor
npm run typecheck
npm run test:ci
npm run doctor
npm run verify        # runs all three

# run the app
npm run ios            # or: npm run android — Expo Go, no dev-client build needed
npm run web             # Tasks shows a clear "not available on web" message; every other tab is unaffected
```

### Mobile persistence test (what automated checks can't cover)

1. `npm run ios` or `npm run android`.
2. Confirm the 8 seeded tasks appear on the Dashboard, grouped into Overdue/Today/Upcoming the same way the old mock data did.
3. Toggle a task's checkbox — it should flip instantly (optimistic update).
4. Add a task via Quick Add.
5. **Fully reload the app** (kill and relaunch — not Fast Refresh) and confirm the toggle and the new task both survived.

### Known limitations

- Web cannot exercise the Tasks feature — `expo-sqlite`'s web backend is alpha and needs Metro WASM config + COOP/COEP headers this project doesn't set up. `TasksContext` fails fast with a clear message instead of hanging or crashing.
- No Jest test runs against real SQLite — the native module doesn't resolve under Jest in this project (confirmed while building this feature). Every test targets pure functions or the `TasksRepository` interface via `InMemoryTasksRepository`; actual SQLite I/O is verified by the manual mobile test above.
- `TasksRepository.update()` has no UI caller yet (Snooze/Delete on Task Detail are still inert placeholders, unchanged from before this work).

### Recommended follow-up

- Wire `TaskDetailScreen`'s Snooze/Delete buttons to `update()`/a future `delete()`.
- Populate `householdId`/`createdByMemberId`/`updatedByMemberId` once Household gains real accounts, for shared-task sync.
- Consider an on-device (iOS/Android) integration test suite if SQLite-level coverage becomes important — Jest alone can't provide it here.
