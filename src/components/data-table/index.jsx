import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown, Inbox } from "lucide-react";
import { useState } from "react";
import Pagination from "../pagination";

const DataTable = ({
  columns,
  data,
  isLoading,
  onPageChange,
  pagination,
  footer,
  tableHeadClassName = "bg-gray-100",
  showPagination = true,
  summaryData,
  columnPinning,
  showQuickJumper,
  idRowHighlight = [],
}) => {
  const [sorting, setSorting] = useState([]);

  const getCommonPinningStyles = (column) => {
    const isPinned = column.getIsPinned();
    const isLastLeftPinnedColumn =
      isPinned === "left" && column.getIsLastColumn("left");
    const isFirstRightPinnedColumn =
      isPinned === "right" && column.getIsFirstColumn("right");

    return {
      boxShadow: isLastLeftPinnedColumn
        ? "-1px 0 1px -1px gray inset"
        : isFirstRightPinnedColumn
          ? "1px 0 1px -1px gray inset"
          : undefined,
      left: isPinned === "left" ? `${column.getStart("left")}px` : undefined,
      right: isPinned === "right" ? `${column.getAfter("right")}px` : undefined,
      position: isPinned ? "sticky" : "relative",
      width: column.getSize(),
      zIndex: isPinned ? 1 : 0,
      background: "inherit",
    };
  };

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
      columnPinning: columnPinning || { left: [], right: [] },
    },
  });

  const { getHeaderGroups, getRowModel } = table;

  const renderSkeleton = () => (
    <>
      {Array(4)
        .fill(0)
        .map((_, index) => (
          <TableRow key={index}>
            {columns.map((_, colIndex) => (
              <TableCell key={colIndex}>
                <Skeleton className="w-full h-6" />
              </TableCell>
            ))}
          </TableRow>
        ))}
    </>
  );

  return (
    <div className="w-full rounded-lg border shadow-sm bg-white overflow-x-auto">
      <Table className="border-b-1 table-auto w-full">
        {/* Header */}
        <TableHeader className={tableHeadClassName}>
          {getHeaderGroups().map((headerGroup) => {
            return (
              <TableRow
                key={headerGroup.id}
                className="bg-gray-100 hover:bg-muted"
              >
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="relative whitespace-nowrap after:absolute after:right-0 after:top-2 after:bottom-2 after:w-[1px] after:bg-gray-300 last:after:hidden"
                    style={{ ...getCommonPinningStyles(header.column) }}
                  >
                    <div
                      className="flex items-center space-x-2 text-black"
                      onClick={
                        header.column.getCanSort()
                          ? header.column.getToggleSortingHandler()
                          : undefined
                      }
                      style={{
                        cursor: header.column.getCanSort()
                          ? "pointer"
                          : "default",
                      }}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                      {header.column.getCanSort() && (
                        <div className="ms-1">
                          {
                            {
                              asc: <ArrowUp className="h-3 w-3" />,
                              desc: <ArrowDown className="h-3 w-3" />,
                            }[header.column.getIsSorted()]
                          }
                          {!header.column.getIsSorted() && (
                            <ArrowUpDown className="h-3 w-3" />
                          )}
                        </div>
                      )}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            );
          })}
        </TableHeader>

        {/* Body */}
        <TableBody>
          {isLoading ? (
            renderSkeleton()
          ) : getRowModel().rows.length ? (
            getRowModel().rows.map((row) => {
              const isRowHighlight =
                idRowHighlight &&
                idRowHighlight.includes(String(row.original?.id));
              return (
                <TableRow
                  key={row.id}
                  className={`duration-150 ease-in-out ${isRowHighlight
                    ? "bg-red-50 hover:bg-red-100"
                    : "bg-white hover:bg-muted"
                    }`}
                >
                  {row.getVisibleCells().map((cell) => {
                    return (
                      <TableCell
                        key={cell.id}
                        className="whitespace-nowrap"
                        style={{ ...getCommonPinningStyles(cell.column) }}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              );
            })
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="py-12 text-center">
                <div className="flex flex-col items-center justify-center gap-3 animate-[fade-in_0.3s_ease-in-out]">
                  <Inbox className="w-8 h-8 text-gray-400" />
                  <span className="text-gray-500 text-sm font-medium">
                    No data available
                  </span>
                </div>
              </TableCell>
            </TableRow>
          )}

          {/* Summary */}
          {summaryData && (
            <TableRow className="font-semibold bg-gray-50 border-b border-gray-300">
              <TableCell
                style={{
                  position: "sticky",
                  left: 300,
                  zIndex: 1,
                  background: "inherit",
                  minWidth: 300,
                  whiteSpace: "nowrap",
                }}
                className="text-center"
              >
                {summaryData.title?.value || "SubTotal"}
              </TableCell>
              {table
                .getAllColumns()
                .slice(1)
                .map((column) => (
                  <TableCell
                    key={column.id}
                    style={{ ...getCommonPinningStyles(column) }}
                    className={`${summaryData[column.id]?.align === "left"
                      ? "text-left"
                      : summaryData[column.id]?.align === "right"
                        ? "text-right"
                        : summaryData[column.id]?.align === "center"
                          ? "text-center"
                          : ""
                      }`}
                  >
                    {summaryData[column.id]?.value || ""}
                  </TableCell>
                ))}
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Footer */}
      {footer && <div className="p-4 border-t">{footer}</div>}

      {/* Pagination */}
      {showPagination && data.length > 0 && (
        <Pagination
          pagination={pagination}
          onPageChange={onPageChange}
          showQuickJumper={showQuickJumper}
        />
      )}
    </div>
  );
};

export default DataTable;
