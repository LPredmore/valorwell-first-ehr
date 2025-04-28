import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * @interface Column
 * @description Defines the structure for a column in the DataTable component
 * @template T - The type of data being displayed in the table
 */
export interface Column<T> {
  /**
   * The text to display in the column header
   */
  header: string;
  
  /**
   * The key to access the data from each item
   * Can be a direct property key or a dot-notation path
   */
  accessorKey: keyof T | string;
  
  /**
   * Optional custom cell renderer function
   * @param item - The data item for the current row
   * @returns React node to render in the cell
   */
  cell?: (item: T) => React.ReactNode;
  
  /**
   * Additional CSS class names to apply to the column
   */
  className?: string;
}

/**
 * @component DataTable
 * @description A flexible data table component that supports searching, pagination, and customizable columns.
 * Provides a consistent way to display tabular data throughout the application.
 *
 * @template T - The type of data being displayed in the table
 *
 * @example
 * // Basic usage
 * <DataTable
 *   data={clients}
 *   columns={columns}
 *   keyExtractor={(client) => client.id}
 * />
 *
 * @example
 * // With search and pagination
 * <DataTable
 *   data={clients}
 *   columns={columns}
 *   keyExtractor={(client) => client.id}
 *   searchable
 *   pagination
 *   pageSize={10}
 *   onRowClick={(client) => navigate(`/clients/${client.id}`)}
 * />
 */
export interface DataTableProps<T> {
  /**
   * Array of data items to display in the table
   */
  data: T[];
  
  /**
   * Array of column definitions that specify how to display each column
   */
  columns: Column<T>[];
  
  /**
   * Optional callback function when a row is clicked
   * @param item - The data item for the clicked row
   */
  onRowClick?: (item: T) => void;
  
  /**
   * Function to extract a unique key from each data item
   * Used for React's key prop when rendering rows
   * @param item - The data item
   * @returns A string or number that uniquely identifies the item
   */
  keyExtractor: (item: T) => string | number;
  
  /**
   * Whether to show a search input above the table
   * @default false
   */
  searchable?: boolean;
  
  /**
   * Placeholder text for the search input
   * @default "Search..."
   */
  searchPlaceholder?: string;
  
  /**
   * Whether to enable pagination controls
   * @default false
   */
  pagination?: boolean;
  
  /**
   * Number of items to display per page when pagination is enabled
   * @default 10
   */
  pageSize?: number;
  
  /**
   * Additional CSS class names to apply to the component container
   */
  className?: string;
  
  /**
   * Custom content to display when there are no results
   * @default "No results found."
   */
  emptyState?: React.ReactNode;
  
  /**
   * Whether the data is currently loading
   * Displays a loading indicator when true
   * @default false
   */
  isLoading?: boolean;
}

export function DataTable<T>({
  data,
  columns,
  onRowClick,
  keyExtractor,
  searchable = false,
  searchPlaceholder = 'Search...',
  pagination = false,
  pageSize = 10,
  className = '',
  emptyState,
  isLoading = false,
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [currentPage, setCurrentPage] = React.useState(1);

  // Filter data based on search query
  const filteredData = React.useMemo(() => {
    if (!searchQuery) return data;
    
    return data.filter((item) => {
      return columns.some((column) => {
        const key = column.accessorKey as keyof T;
        const value = item[key];
        
        if (typeof value === 'string') {
          return value.toLowerCase().includes(searchQuery.toLowerCase());
        }
        
        if (typeof value === 'number') {
          return value.toString().includes(searchQuery);
        }
        
        return false;
      });
    });
  }, [data, searchQuery, columns]);

  // Paginate data
  const paginatedData = React.useMemo(() => {
    if (!pagination) return filteredData;
    
    const startIndex = (currentPage - 1) * pageSize;
    return filteredData.slice(startIndex, startIndex + pageSize);
  }, [filteredData, pagination, currentPage, pageSize]);

  // Calculate total pages
  const totalPages = React.useMemo(() => {
    if (!pagination) return 1;
    return Math.ceil(filteredData.length / pageSize);
  }, [filteredData.length, pagination, pageSize]);

  // Get value from item based on accessor key
  const getValue = (item: T, accessorKey: keyof T | string) => {
    if (typeof accessorKey === 'string' && accessorKey.includes('.')) {
      const keys = accessorKey.split('.');
      let value: any = item;
      
      for (const key of keys) {
        if (value === null || value === undefined) return '';
        value = value[key as keyof typeof value];
      }
      
      return value;
    }
    
    return item[accessorKey as keyof T];
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {searchable && (
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
      )}
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column.header} className={column.className}>
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : paginatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  {emptyState || 'No results found.'}
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((item) => (
                <TableRow
                  key={keyExtractor(item)}
                  onClick={() => onRowClick && onRowClick(item)}
                  className={onRowClick ? 'cursor-pointer hover:bg-muted/50' : ''}
                >
                  {columns.map((column) => (
                    <TableCell key={`${keyExtractor(item)}-${column.header}`} className={column.className}>
                      {column.cell
                        ? column.cell(item)
                        : getValue(item, column.accessorKey)?.toString() || ''}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      {pagination && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, filteredData.length)} of {filteredData.length} results
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-sm font-medium">
              Page {currentPage} of {totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}