export type RouteType = 'mutation' | 'query' | 'delete'

export type RouteDef<TType extends RouteType, TInput = unknown, TOutput = unknown> = {
  input: TInput,
  output: TOutput,
  type: TType,
}