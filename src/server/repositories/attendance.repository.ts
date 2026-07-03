export class AttendanceRepository {
  async getAttendance(): Promise<never> {
    throw new Error('Not implemented');
  }
}

export const attendanceRepository = new AttendanceRepository();
