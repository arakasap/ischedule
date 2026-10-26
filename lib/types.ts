/** เวลาท้องถิ่นไทย รูปแบบ "YYYY-MM-DDTHH:mm" (ค.ศ.) ไม่มีโซนเวลา */
export interface Slot {
  start: string;
  end: string | null;
}

/** หนึ่งกลุ่มเรียนที่เปิดให้หนึ่งหลักสูตร/ชั้นปี (หนึ่งแถวจาก API ของ REG) */
export interface Offering {
  id: string;
  facultyId: string;
  faculty: string;
  deptId: string;
  dept: string;
  curriculumId: string;
  curriculum: string;
  classYear: number;
  code: string;
  name: string;
  nameTh: string;
  credit: string;
  section: string;
  type: string;
  time: string;
  room: string;
  teacher: string;
  midterm: Slot | null;
  final: Slot | null;
  cond: string;
  seats: string;
  enrolled: string;
}

export interface Dataset {
  meta: {
    term: string;
    level: string;
    source: string;
    fetchedAt: string;
    rowCount: number;
  };
  rows: Offering[];
}

export type ExamKind = "midterm" | "final";
export type ViewMode = "grid" | "list";
