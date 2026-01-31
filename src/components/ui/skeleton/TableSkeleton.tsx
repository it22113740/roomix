"use client";
import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../table";

interface TableSkeletonProps {
  columns?: number;
  rows?: number;
  showHeader?: boolean;
  noWrapper?: boolean;
}

export default function TableSkeleton({
  columns = 5,
  rows = 5,
  showHeader = true,
  noWrapper = false,
}: TableSkeletonProps) {
  const tableContent = (
    <div className="max-w-full overflow-x-auto">
      <Table>
        {showHeader && (
          <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
            <TableRow>
              {Array.from({ length: columns }).map((_, index) => (
                <TableCell
                  key={index}
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  <div className="h-4 w-24 bg-gray-200 rounded animate-pulse dark:bg-gray-700"></div>
                </TableCell>
              ))}
            </TableRow>
          </TableHeader>
        )}
        <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <TableRow key={rowIndex}>
              {Array.from({ length: columns }).map((_, colIndex) => (
                <TableCell
                  key={colIndex}
                  className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400"
                >
                  <div className="h-4 bg-gray-200 rounded animate-pulse dark:bg-gray-700" style={{ width: `${Math.random() * 40 + 60}%` }}></div>
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  if (noWrapper) {
    return tableContent;
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      {tableContent}
    </div>
  );
}
