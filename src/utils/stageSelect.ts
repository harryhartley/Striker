export const bansStringToList = (bans: string): number[] => {
  if (bans === '') return []
  return bans.split(',').map(Number)
}
