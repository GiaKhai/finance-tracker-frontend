import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { memo, useState } from "react";

const paginationList = [10, 20, 50, 100];

const generatePagination = (current, total) => {
  const delta = 2;
  const range = [];

  for (let i = 1; i <= total; i++) {
    if (
      i === 1 ||
      i === total ||
      (i >= current - delta && i <= current + delta)
    ) {
      range.push(i);
    } else if (range[range.length - 1] !== "...") {
      range.push("...");
    }
  }

  return range;
};

const Pagination = ({ pagination, onPageChange, showQuickJumper = false }) => {
  if (!pagination) return null;

  const pageNum = Number(pagination?.current) || 1;
  const pageSize = Number(pagination?.pageSize) || 10;
  const total = Number(pagination?.total) || 0;
  const totalPages = Math.ceil(total / pageSize);

  const [gotoPage, setGotoPage] = useState("");

  const paginationItems = generatePagination(pageNum, totalPages);

  const handleGotoPage = () => {
    const page = Number(gotoPage);
    if (
      page &&
      page >= 1 &&
      page <= totalPages &&
      page !== pageNum &&
      onPageChange
    ) {
      onPageChange(page, pageSize);
      setGotoPage("");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleGotoPage();
    }
  };

  return (
    <div className="flex md:flex-row flex-col items-center justify-between p-4 gap-2 border-t">
      <div className="flex-1 text-xs text-muted-foreground">
        Total {total} Record(s)
      </div>

      <div className="flex items-center justify-center gap-2 text-sm flex-wrap">
        <div className="flex items-center">
          <ChevronLeft
            onClick={() => {
              if (pageNum === 1) return;
              if (pageNum > 1 && onPageChange) {
                onPageChange(pageNum - 1, pageSize);
              }
            }}
            className={`h-5 w-5 cursor-pointer ${
              pageNum === 1 ? "opacity-50 cursor-not-allowed" : ""
            }`}
          />

          <div className="flex gap-2 mx-2">
            {paginationItems.map((page, index) => (
              <div
                key={index}
                onClick={() =>
                  typeof page === "number" && onPageChange?.(page, pageSize)
                }
                className={`cursor-pointer px-2 py-1 rounded ${
                  pageNum === page
                    ? "text-black font-bold bg-gray-100"
                    : "text-gray-400 hover:bg-gray-50"
                } ${page === "..." ? "pointer-events-none" : ""}`}
              >
                {page}
              </div>
            ))}
          </div>

          <ChevronRight
            onClick={() => {
              if (pageNum !== totalPages && onPageChange) {
                onPageChange(pageNum + 1, pageSize);
              }
            }}
            className={`h-5 w-5 cursor-pointer ${
              pageNum === totalPages ? "opacity-50 cursor-not-allowed" : ""
            }`}
          />
        </div>

        <div className="flex items-center gap-2">
          <Select
            value={String(pageSize)}
            onValueChange={(e) => {
              if (onPageChange) onPageChange(1, Number(e));
            }}
          >
            <SelectTrigger className="w-[120px] h-7 text-sm">
              <SelectValue placeholder="Items per page" />
            </SelectTrigger>
            <SelectContent>
              {paginationList.map((item) => (
                <SelectItem key={item} value={String(item)}>
                  {item} / page
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Go to Page */}
          {showQuickJumper && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Go to</span>
              <Input
                type="number"
                value={gotoPage}
                onChange={(e) => setGotoPage(e.target.value)}
                onKeyDown={handleKeyPress}
                className="w-[70px] h-7 text-sm"
                min={1}
                max={totalPages}
                placeholder={String(pageNum)}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default memo(Pagination);
