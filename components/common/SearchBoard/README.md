# SearchBoard Component

A dynamic search bar with column filter dropdown that fetches field definitions from APIs.

## Features

- **Search Input**: Text input with search icon for filtering board data
- **Column Filter**: Dropdown with checkboxes to select which columns to search
- **Dynamic Icons**: Automatically loads column icons from `/public/icons/{fieldKey}.svg`
- **Select All**: Bulk select/deselect all columns
- **Column Search**: Search within the column list
- **API-Driven**: All columns fetched from backend, nothing hardcoded

## Usage

```tsx
import SearchBoard from '@/components/common/SearchBoard';
import { useGetContactFieldsQuery } from '@/store/api_query/contacts.api';

function MyPage() {
  const { data: fieldsData } = useGetContactFieldsQuery();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);

  return (
    <SearchBoard
      fieldDefinitions={fieldsData?.items || []}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      selectedColumns={selectedColumns}
      onColumnsChange={setSelectedColumns}
      placeholder="Search this board"
    />
  );
}
```

## Props

| Prop | Type | Description |
|------|------|-------------|
| `fieldDefinitions` | `FieldDefinition[]` | Array of field definitions from API |
| `searchQuery` | `string` | Current search query (controlled) |
| `onSearchChange` | `(query: string) => void` | Callback when search changes |
| `selectedColumns` | `string[]` | Array of selected column keys (controlled) |
| `onColumnsChange` | `(keys: string[]) => void` | Callback when columns selection changes |
| `placeholder` | `string` | Placeholder text for search input |
| `className` | `string` | Additional CSS classes |

## Field Definition Structure

```typescript
interface FieldDefinition {
  id?: string;
  fieldKey: string;        // e.g., "name", "email", "status"
  displayName: string;     // e.g., "Name", "Email", "Status"
  fieldType?: string;      // e.g., "TEXT", "EMAIL", "DROPDOWN"
  isVisible?: boolean;     // Whether column is visible by default
}
```

## Icon Loading

The component automatically attempts to load icons from:
```
/public/icons/{fieldKey}.svg
```

For example:
- `name` field → `/public/icons/name.svg`
- `email` field → `/public/icons/email.svg`
- `status` field → `/public/icons/status.svg`

If an icon doesn't exist, it's simply hidden without breaking the UI.

## Styling

The component matches the Figma design with:
- **Search bar**: 241px × 30px, white background, #1C75BB border
- **Dropdown**: 241px × max 386px, white background, rounded corners
- **Typography**: Inter font, 14px text size
- **Colors**: #4F5051 for text, #333333 for labels

## Example Integration

### With Contacts Page

```tsx
// In contacts/page.tsx
import SearchBoard from '@/components/common/SearchBoard';

const [searchQuery, setSearchQuery] = useState('');
const [selectedColumns, setSelectedColumns] = useState<string[]>([]);

// Filter contacts based on search query and selected columns
const filteredContacts = useMemo(() => {
  if (!searchQuery) return contactsData?.items || [];
  
  return (contactsData?.items || []).filter(contact => {
    return selectedColumns.some(columnKey => {
      const value = contact[columnKey];
      return String(value).toLowerCase().includes(searchQuery.toLowerCase());
    });
  });
}, [contactsData, searchQuery, selectedColumns]);

// Render
<SearchBoard
  fieldDefinitions={finalFields}
  searchQuery={searchQuery}
  onSearchChange={setSearchQuery}
  selectedColumns={selectedColumns}
  onColumnsChange={setSelectedColumns}
/>
```

## Dependencies

- `react` - Core React library
- `Checkbox` - Custom checkbox component from `@/components/ui buttons/Checkbox`

## Notes

- The component uses controlled/uncontrolled pattern - works with or without external state
- Dropdown auto-closes when clicking outside
- All icons are loaded at original size (no shrinking)
- Fully responsive and follows Figma specifications
