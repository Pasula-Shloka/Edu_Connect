export type UserRole = 'student' | 'faculty' | 'admin';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  avatar_url: string | null;
  bio: string | null;
  department: string | null;
  student_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  code: string;
  faculty_id: string;
  semester: string | null;
  credits: number;
  thumbnail_url: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface Enrollment {
  id: string;
  course_id: string;
  student_id: string;
  enrolled_at: string;
  status: 'active' | 'completed' | 'dropped';
}

export interface Resource {
  id: string;
  course_id: string;
  title: string;
  description: string;
  resource_type: 'document' | 'video' | 'link' | 'pdf' | 'slide' | 'other';
  url: string | null;
  file_path: string | null;
  uploaded_by: string;
  created_at: string;
}

export interface Assignment {
  id: string;
  course_id: string;
  title: string;
  description: string;
  due_date: string | null;
  max_marks: number;
  assignment_type: 'homework' | 'project' | 'quiz' | 'exam' | 'lab';
  created_by: string;
  created_at: string;
}

export interface Submission {
  id: string;
  assignment_id: string;
  student_id: string;
  content: string;
  file_url: string | null;
  submitted_at: string;
  status: 'submitted' | 'late' | 'graded' | 'returned';
}

export interface Mark {
  id: string;
  submission_id: string;
  student_id: string;
  score: number;
  max_score: number;
  grade: string | null;
  feedback: string;
  graded_by: string | null;
  graded_at: string;
}

export interface Discussion {
  id: string;
  course_id: string;
  author_id: string;
  title: string;
  content: string;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
}

export interface Reply {
  id: string;
  discussion_id: string;
  author_id: string;
  content: string;
  parent_reply_id: string | null;
  created_at: string;
}

export interface Group {
  id: string;
  name: string;
  description: string;
  course_id: string | null;
  created_by: string;
  created_at: string;
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  role: 'leader' | 'member';
  joined_at: string;
}

export interface Contribution {
  id: string;
  group_id: string;
  user_id: string;
  contribution_type: 'comment' | 'file' | 'task' | 'meeting' | 'research';
  description: string;
  points: number;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: 'general' | 'assignment' | 'grade' | 'discussion' | 'enrollment' | 'group' | 'announcement';
  title: string;
  message: string;
  is_read: boolean;
  related_id: string | null;
  created_at: string;
}

export interface Analytic {
  id: string;
  user_id: string;
  course_id: string | null;
  metric_type: 'study_time' | 'completion_rate' | 'engagement_score' | 'grade_trend' | 'resource_access';
  metric_value: number;
  metadata: Record<string, unknown>;
  recorded_at: string;
}

export interface AIConversation {
  id: string;
  user_id: string;
  role: 'user' | 'assistant';
  content: string;
  context: Record<string, unknown>;
  created_at: string;
}
