'use client';

import { Skeleton } from '@/src/presentation/components/ui/skeleton';
import React, { useCallback, useEffect, useRef } from 'react';

interface InfiniteListProps<T> {
  data: T[];
  isLoading: boolean;
  itemKey: (item: T) => string;
  listItemComponent: (item: T) => React.ReactNode;
  error: Error | null;
  isFetching: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  fetchNextPage: () => void;
}

export const InfiniteList = <T,>({
  isLoading,
  itemKey,
  listItemComponent,
  data,
  error,
  isFetching,
  isFetchingNextPage,
  hasNextPage,
  fetchNextPage,
}: InfiniteListProps<T>) => {
  const observer = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    return () => {
      if (observer.current) {
        observer.current.disconnect();
        observer.current = null;
      }
    };
  }, [isLoading]);

  const lastElementRef = useCallback(
    (node: HTMLDivElement) => {
      if (isLoading) return;

      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetching) {
          fetchNextPage();
        }
      });

      if (node) observer.current.observe(node);
    },
    [fetchNextPage, hasNextPage, isFetching, isLoading]
  );

  if (error) {
    return (
      <div className="p-4">
        <p>Error: {error.message}</p>
      </div>
    );
  }
  if (isFetching && !isFetchingNextPage) {
    return (
      <div className="flex flex-col gap-3 ">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }
  if (data.length === 0) {
    return (
      <div className="p-4">
        <p>No tasks found</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {data.map((item, index) => {
        const isLastItem = index === data.length - 1;
        return (
          <div
            key={itemKey(item)}
            ref={isLastItem ? lastElementRef : undefined}
          >
            {listItemComponent(item)}
          </div>
        );
      })}
    </div>
  );
};
