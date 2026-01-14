export function expandEnvVars(value: string) {
  return value.replace(/\${(\w+)}/g, (_match, key) => process.env[key] || "");
}

export function extractEnvVars(value: string) {
  const vars: string[] = [];
  const regex = /\${(\w+)}/g;
  let match = regex.exec(value);

  while (match !== null) {
    const varName = match[1];
    if (varName) {
      vars.push(varName);
    }
    match = regex.exec(value);
  }

  return vars;
}
