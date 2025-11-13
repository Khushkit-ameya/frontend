import React from 'react';

// Base types for common data structures
export type Primitive = string | number | boolean | null | undefined;
export type TableData = Record<string, Primitive | object | Array<unknown>>;
export type FormData = Record<string, unknown>;
export type DropdownOption = {
  label: string;
  value: Primitive;
  [key: string]: unknown;
};

// Generic handler types
export type DataHandler<T = TableData> = (data: T) => void;
export type RowHandler<T = TableData> = (row: T, index?: number) => void;
export type ValueHandler<T = unknown> = (value: T) => void;

// Table related interfaces
export interface TableI {
  frontendName: string;
  backendName: string;
  type: 'text' | 'phone' | 'email' | 'date' | 'date&time' | 'text-color' | 'supplierObject' | 'object' | 'array' | 'url' | 'image' | 'button' | 'component' | 'createable dropdown' | 'selectable dropdown' | 'productObject';
  handle?: DataHandler;
  sort?: boolean;
  classText?: string;
  className?: string;
  cellClassName?: string;
  headerClassName?: string;
  actions?: TableActionI[];
  component?: React.ComponentType<{ data: TableData; row: TableData; index: number }>;
  arrayDisplay?: (data: unknown[]) => React.ReactNode;
  style?: React.CSSProperties;
  cellStyle?: React.CSSProperties;
  headerStyle?: React.CSSProperties;
  width?: string | number;
  minWidth?: string | number;
  maxWidth?: string | number;
  align?: 'left' | 'center' | 'right';
  sticky?: boolean;
  resizable?: boolean;
  sortable?: boolean;
  filterable?: boolean;
  searchable?: boolean;
  tooltip?: string | ((data: TableData) => string);
  render?: (data: unknown, row: TableData, index: number) => React.ReactNode;
  editable?: boolean;
  required?: boolean;
  validation?: {
    pattern?: RegExp;
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
    custom?: (value: unknown) => boolean | string;
  };
}

export interface TableActionI {
  iconsName?: string;
  icons?: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  color?: string;
  handle: RowHandler;
  classText?: string;
  className?: string;
  style?: React.CSSProperties;
  label?: string | ((data: TableData) => string);
  buttonClass?: string | ((data: TableData) => string);
  disabled?: (data: TableData) => boolean;
  tooltip?: string | ((data: TableData) => string);
  confirm?: {
    title?: string;
    message?: string;
    confirmText?: string;
    cancelText?: string;
  };
}

export interface TableExpandableI {
  getRowKey: (row: TableData, idx: number) => string | number;
  getExpandedContent: (row: TableData) => React.ReactNode;
  expandIcon?: {
    collapsed: React.ReactNode;
    expanded: React.ReactNode;
  };
  expandedRowClassName?: string | ((row: TableData) => string);
  defaultExpandedRows?: (string | number)[];
  onExpand?: (expanded: boolean, row: TableData) => void;
  onExpandedRowsChange?: (expandedRows: (string | number)[]) => void;
}

export interface TableStyleI {
  container?: {
    className?: string;
    style?: React.CSSProperties;
  };
  table?: {
    className?: string;
    style?: React.CSSProperties;
    minWidth?: string | number;
  };
  header?: {
    className?: string;
    style?: React.CSSProperties;
    stickyTop?: string | number;
  };
  headerRow?: {
    className?: string;
    style?: React.CSSProperties;
  };
  headerCell?: {
    className?: string;
    style?: React.CSSProperties;
  };
  body?: {
    className?: string;
    style?: React.CSSProperties;
  };
  row?: {
    className?: string | ((row: TableData, index: number) => string);
    style?: React.CSSProperties | ((row: TableData, index: number) => React.CSSProperties);
    hoverClassName?: string;
    selectedClassName?: string;
  };
  cell?: {
    className?: string;
    style?: React.CSSProperties;
  };
  pagination?: {
    className?: string;
    style?: React.CSSProperties;
  };
  loading?: {
    className?: string;
    style?: React.CSSProperties;
  };
  empty?: {
    className?: string;
    style?: React.CSSProperties;
  };
}

export interface TableSortI {
  field: string;
  direction: 'asc' | 'desc';
}

export interface TablePaginationI {
  current: number;
  pageSize: number;
  total: number;
  showSizeChanger?: boolean;
  showQuickJumper?: boolean;
  showTotal?: boolean | ((total: number, range: [number, number]) => React.ReactNode);
  pageSizeOptions?: number[];
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

export interface TableSelectionI {
  type: 'checkbox' | 'radio';
  selectedRowKeys?: (string | number)[];
  onChange?: (selectedRowKeys: (string | number)[], selectedRows: TableData[]) => void;
  onSelect?: (record: TableData, selected: boolean, selectedRows: TableData[], nativeEvent: Event) => void;
  onSelectAll?: (selected: boolean, selectedRows: TableData[], changeRows: TableData[]) => void;
  getCheckboxProps?: (record: TableData) => { disabled?: boolean; name?: string };
  columnWidth?: string | number;
  fixed?: boolean;
}

export interface TablePropsI {
  fields: TableI[];
  data: TableData[];
  loading?: boolean;
  expandable?: TableExpandableI;
  sortConfig?: TableSortI | null;
  onSort?: (field: string) => void;
  pagination?: TablePaginationI;
  selection?: TableSelectionI;
  styles?: TableStyleI;
  size?: 'small' | 'middle' | 'large';
  bordered?: boolean;
  striped?: boolean;
  hoverable?: boolean;
  responsive?: boolean;
  virtual?: boolean;
  resizable?: boolean;
  rowKey?: string | ((row: TableData) => string | number);
  emptyText?: string | React.ReactNode;
  loadingComponent?: React.ReactNode;
  onRow?: (record: TableData, index: number) => {
    onClick?: (event: React.MouseEvent) => void;
    onDoubleClick?: (event: React.MouseEvent) => void;
    onContextMenu?: (event: React.MouseEvent) => void;
    onMouseEnter?: (event: React.MouseEvent) => void;
    onMouseLeave?: (event: React.MouseEvent) => void;
  };
  scroll?: {
    x?: string | number | true;
    y?: string | number;
  };
  sticky?: boolean | {
    offsetHeader?: number;
    offsetScroll?: number;
  };
}

// Form related interfaces
export interface FormI {
  label: string;
  valueName?: string;
  editable?: boolean;
  type: 'text' | 'email' | 'password' | 'number' | 'date' | 'time' | 'datetime-local' | 'textarea' | 'select' | 'multiselect' | 'checkbox' | 'radio' | 'file' | 'button' | 'selectable dropdown' | 'createable dropdown';
  buttonType?: 'button' | 'submit' | 'reset';
  buttonPoistion?: 'in last' | 'inline';
  labelIcon?: React.ComponentType<{ className?: string }>;
  buttonAction?: {
    handle: () => void;
  };
  parameters?: {
    required?: boolean;
    minDate?: Date;
    maxDate?: Date;
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    placeholder?: string;
    disabled?: boolean;
    readonly?: boolean;
  };
  dropDownShow?: boolean;
  typeDropdown?: DropdownOption[];
  validation?: {
    required?: boolean;
    pattern?: RegExp;
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
    custom?: (value: unknown) => boolean | string;
  };
  className?: string;
  style?: React.CSSProperties;
  containerClassName?: string;
  containerStyle?: React.CSSProperties;
}

export interface FormTableI {
  frontendName: string;
  backendName: string;
  type: 'text' | 'number' | 'select' | 'date' | 'button' | 'autoCalculate';
  editable?: boolean;
  validation?: {
    required?: boolean;
    number?: boolean;
    min?: number;
    max?: number;
    pattern?: RegExp;
  };
  actions?: Array<{
    handle: (index: string, formTableState: FormData) => void;
    icons?: React.ComponentType<{ className?: string }>;
    label?: string;
    className?: string;
  }>;
  options?: DropdownOption[];
  className?: string;
  style?: React.CSSProperties;
}

export interface FilterI {
  frontendName: string;
  backendName: string;
  type: 'text' | 'date' | 'select' | 'number' | 'daterange';
  options?: DropdownOption[];
}

export interface AboveBTNFormTableI {
  Name: string;
  icons?: React.ComponentType<{ className?: string }>;
  Action: {
    handle: () => void;
  };
  class_: string;
  type: 'button' | 'selectable dropdown';
  options?: DropdownOption[];
}