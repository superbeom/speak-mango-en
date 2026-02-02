# Vocabulary Feature Implementation Reference (v0.14.24)

This document records the implementation details for the Vocabulary List Management and Bulk Selection features. This serves as a guide for re-implementing these features step-by-step.

## 1. Global State (`store/useLocalActionStore.ts`)

To support custom ordering of vocabulary lists, the local store needs to persist the order.

### Changes:

- **New State**: `listOrder: string[]` to store the array of List IDs in their user-defined order.
- **New Action**: `reorderLists(newOrder: string[])` to update the `listOrder`.
- **Logic Updates**:
  - `createList`: Push the new List ID to `listOrder`.
  - `deleteList`: Filter the deleted List ID from `listOrder`.
  - `getLists`: Use `listOrder` to sort the returned lists if it exists.

```typescript
// Interface Update
interface LocalActionState {
  // ...
  listOrder: string[];
  reorderLists: (newOrder: string[]) => void;
}

// Logic in create()
reorderLists: (newOrder) => set({ listOrder: newOrder }),
```

## 2. Vocabulary List Manager (`components/me/VocabularyListManager.tsx`)

Manages the display and reordering of generic lists + the static "Learned" folder.

### Key Logic:

1.  **Learned Folder Separation**:
    - The "Learned" folder is **static** and **cannot be dragged**.
    - It is visually rendered as the first item in the grid but is **excluded** from the `Reorder.Group` state management to prevent index conflicts and infinite loops.
2.  **Grid Layout**:
    - The container uses `Reorder.Group` with `as="div"` and `className="grid grid-cols-2 ..."`.
    - The "Learned" folder is rendered as a standard `motion.div` (with `layout` prop) _before_ the mapping of draggable items.
3.  **Persistence**:
    - `handleReorder` updates the local state immediately for UI responsiveness.
    - If the user is on the Free tier (Local), it calls `reorderLists` to persist the new order to LocalStorage.

### Component Structure:

```tsx
<LayoutGroup>
  <Reorder.Group values={orderedLists} onReorder={handleReorder} className="grid grid-cols-2 ...">
    {/* Static Learned Folder */}
    <motion.div layout id="learned">
       <VocabularyListCard list={learnedList} ... />
    </motion.div>

    {/* Draggable Items */}
    {orderedLists.map(list => (
      <Reorder.Item key={list.id} value={list}>
        <VocabularyListCard list={list} ... />
      </Reorder.Item>
    ))}
  </Reorder.Group>
</LayoutGroup>
```

## 3. Bulk Selection & Views (`components/me/VocabularyItemsGrid.tsx`)

Allows users to select multiple expressions and toggle between view modes.

### Key Logic:

1.  **View Modes**:
    - **Compact**: Denser, Enlish-focused card (`CompactExpressionCard`).
    - **Full**: Standard `ExpressionCard` with an overlay.
2.  **Selection State**:
    - `isSelectionMode`: Boolean toggle.
    - `selectedIds`: `Set<string>` of selected item IDs.
3.  **Interaction**:
    - **Toolbar**: Sticky header with "Select/Cancel" toggle and "Compact/Card" view switcher.
    - **Links**: In Selection Mode, `InteractiveLink` navigation is disabled (or covered by overlay) to prevent accidental navigation while selecting.
    - **Animation**: Uses `AnimatePresence` with `mode="popLayout"` to smoothly transition between view modes.
4.  **Bulk Actions**:
    - Floating bar at the bottom appears when `selectedIds.size > 0`.
    - Includes Copy, Move, Delete buttons (placeholder handlers).

### Components:

- `CompactExpressionCard`: Simple container with checkbox.
- `InteractiveLink`: Updated with `draggable={false}` to prevent native drag interference during list reordering.

## 4. UI Primitives

- `components/ui/checkbox.tsx`: Standard Radix UI checkbox.
- `components/ui/dropdown-menu.tsx`: Radix UI Dropdown wrapper for list actions (Rename/Delete).
