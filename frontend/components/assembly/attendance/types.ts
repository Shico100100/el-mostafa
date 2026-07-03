export interface Worker {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
}

export interface AttendanceRecord {
  id: number;
  user_id: number;
  user?: Worker;
  date: string;
  status: string;
  check_in?: string;
  check_out?: string;
  notes?: string;
}

export function translateStatus(status: string) {
  switch (status) {
    case 'PRESENT': return 'حاضر';
    case 'ABSENT': return 'غائب';
    case 'LATE': return 'متأخر';
    case 'EXCUSED': return 'إذن';
    default: return status;
  }
}

export function getStatusColor(status: string) {
  switch (status) {
    case 'PRESENT': return 'text-emerald-400 bg-emerald-400/10';
    case 'ABSENT': return 'text-rose-400 bg-rose-400/10';
    case 'LATE': return 'text-amber-400 bg-amber-400/10';
    case 'EXCUSED': return 'text-blue-400 bg-blue-400/10';
    default: return 'text-gray-400 bg-gray-400/10';
  }
}
