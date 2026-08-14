export function getInitials(value: string): string {

  const fullName = value.split(" ");

  const first = fullName[0][0].toUpperCase();
  const second = fullName[1][0].toUpperCase();

  const initials = first + second;



  return initials

}

