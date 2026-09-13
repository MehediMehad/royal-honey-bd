export type ChildrenProps = Readonly<{
  children: React.ReactNode;
}>;

export interface PageParams<T = Record<string, string>> {
  params: Promise<T>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export type AsyncResponse<T> = Promise<{
  data: T | null;
  error: string | null;
  success: boolean;
}>;
