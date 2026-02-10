export default (sp: any) => {
  const name = sp.name?.includes(":")
    ? sp.name.split(":")[1]
    : sp.name
  return {
    ...sp,
    name,
  }
}
