export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
};

export type PaginatedResponse<T> = {
  data: T[];
  meta: PaginationMeta;
};

export type PaginationOptions = {
  page: number;
  limit: number;
  skip: number;
};

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

export function resolvePagination(page?: number, limit?: number): PaginationOptions | null {
  if (page === undefined && limit === undefined) {
    return null;
  }

  const normalizedPage = Number.isFinite(page) && Number(page) > 0 ? Number(page) : DEFAULT_PAGE;
  const requestedLimit =
    Number.isFinite(limit) && Number(limit) > 0 ? Number(limit) : DEFAULT_LIMIT;
  const normalizedLimit = Math.min(requestedLimit, MAX_LIMIT);

  return {
    page: normalizedPage,
    limit: normalizedLimit,
    skip: (normalizedPage - 1) * normalizedLimit,
  };
}

export function buildPaginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
): PaginatedResponse<T> {
  return {
    data,
    meta: {
      page,
      limit,
      total,
    },
  };
}
