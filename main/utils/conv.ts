export const stringToInt = (str: string): number => {
  return parseInt(str, 10);
};

export function convertBirthdateToAgeOver(
  birthdate: string,
  minAge: number
): boolean {
  const birthDate = new Date(birthdate);
  const today = new Date();
  const age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    return age - 1 >= minAge;
  }

  return age >= minAge;
}
