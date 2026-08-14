export function sentenceCase(value: string): string | null {
  if(!value) {
    return null;
  }

  const firstLetter = value[0].toUpperCase();
  const others = value.substring(1);

  return firstLetter + others;


}
