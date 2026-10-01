/*
# AI Digital Learning Platform - RLS Policies

Adds row-level security policies for all tables.
- Profiles: all authenticated can read, users manage their own
- Courses: published courses visible to all, faculty manages own
- Enrollments: students and course faculty can see
- Resources/Assignments: enrolled students and faculty
- Submissions: students own theirs, faculty sees course submissions
- Marks: students see own, faculty grades course submissions
- Discussions/Replies: enrolled students and faculty participate
- Groups/Members/Contributions: members only
- Notifications/Analytics/AI: user owns their data
*/

-- Profiles policies
DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile" ON profiles FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Courses policies
DROP POLICY IF EXISTS "select_courses" ON courses;
CREATE POLICY "select_courses" ON courses FOR SELECT
  TO authenticated USING (is_published = true OR auth.uid() = faculty_id);

DROP POLICY IF EXISTS "insert_courses" ON courses;
CREATE POLICY "insert_courses" ON courses FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = faculty_id);

DROP POLICY IF EXISTS "update_courses" ON courses;
CREATE POLICY "update_courses" ON courses FOR UPDATE
  TO authenticated USING (auth.uid() = faculty_id) WITH CHECK (auth.uid() = faculty_id);

DROP POLICY IF EXISTS "delete_courses" ON courses;
CREATE POLICY "delete_courses" ON courses FOR DELETE
  TO authenticated USING (auth.uid() = faculty_id);

-- Enrollments policies
DROP POLICY IF EXISTS "select_enrollments" ON enrollments;
CREATE POLICY "select_enrollments" ON enrollments FOR SELECT
  TO authenticated USING (
    auth.uid() = student_id OR
    EXISTS (SELECT 1 FROM courses WHERE courses.id = enrollments.course_id AND courses.faculty_id = auth.uid())
  );

DROP POLICY IF EXISTS "insert_enrollments" ON enrollments;
CREATE POLICY "insert_enrollments" ON enrollments FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = student_id);

DROP POLICY IF EXISTS "update_enrollments" ON enrollments;
CREATE POLICY "update_enrollments" ON enrollments FOR UPDATE
  TO authenticated USING (
    auth.uid() = student_id OR
    EXISTS (SELECT 1 FROM courses WHERE courses.id = enrollments.course_id AND courses.faculty_id = auth.uid())
  );

DROP POLICY IF EXISTS "delete_enrollments" ON enrollments;
CREATE POLICY "delete_enrollments" ON enrollments FOR DELETE
  TO authenticated USING (auth.uid() = student_id);

-- Resources policies
DROP POLICY IF EXISTS "select_resources" ON resources;
CREATE POLICY "select_resources" ON resources FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM enrollments WHERE enrollments.course_id = resources.course_id AND enrollments.student_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM courses WHERE courses.id = resources.course_id AND courses.faculty_id = auth.uid())
  );

DROP POLICY IF EXISTS "insert_resources" ON resources;
CREATE POLICY "insert_resources" ON resources FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM courses WHERE courses.id = resources.course_id AND courses.faculty_id = auth.uid())
  );

DROP POLICY IF EXISTS "update_resources" ON resources;
CREATE POLICY "update_resources" ON resources FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM courses WHERE courses.id = resources.course_id AND courses.faculty_id = auth.uid())
  );

DROP POLICY IF EXISTS "delete_resources" ON resources;
CREATE POLICY "delete_resources" ON resources FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM courses WHERE courses.id = resources.course_id AND courses.faculty_id = auth.uid())
  );

-- Assignments policies
DROP POLICY IF EXISTS "select_assignments" ON assignments;
CREATE POLICY "select_assignments" ON assignments FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM enrollments WHERE enrollments.course_id = assignments.course_id AND enrollments.student_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM courses WHERE courses.id = assignments.course_id AND courses.faculty_id = auth.uid())
  );

DROP POLICY IF EXISTS "insert_assignments" ON assignments;
CREATE POLICY "insert_assignments" ON assignments FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM courses WHERE courses.id = assignments.course_id AND courses.faculty_id = auth.uid())
  );

DROP POLICY IF EXISTS "update_assignments" ON assignments;
CREATE POLICY "update_assignments" ON assignments FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM courses WHERE courses.id = assignments.course_id AND courses.faculty_id = auth.uid())
  );

DROP POLICY IF EXISTS "delete_assignments" ON assignments;
CREATE POLICY "delete_assignments" ON assignments FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM courses WHERE courses.id = assignments.course_id AND courses.faculty_id = auth.uid())
  );

-- Submissions policies
DROP POLICY IF EXISTS "select_submissions" ON submissions;
CREATE POLICY "select_submissions" ON submissions FOR SELECT
  TO authenticated USING (
    auth.uid() = student_id OR
    EXISTS (
      SELECT 1 FROM assignments a
      JOIN courses c ON c.id = a.course_id
      WHERE a.id = submissions.assignment_id AND c.faculty_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "insert_submissions" ON submissions;
CREATE POLICY "insert_submissions" ON submissions FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = student_id);

DROP POLICY IF EXISTS "update_submissions" ON submissions;
CREATE POLICY "update_submissions" ON submissions FOR UPDATE
  TO authenticated USING (
    auth.uid() = student_id OR
    EXISTS (
      SELECT 1 FROM assignments a
      JOIN courses c ON c.id = a.course_id
      WHERE a.id = submissions.assignment_id AND c.faculty_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "delete_submissions" ON submissions;
CREATE POLICY "delete_submissions" ON submissions FOR DELETE
  TO authenticated USING (auth.uid() = student_id);

-- Marks policies
DROP POLICY IF EXISTS "select_marks" ON marks;
CREATE POLICY "select_marks" ON marks FOR SELECT
  TO authenticated USING (
    auth.uid() = student_id OR
    EXISTS (
      SELECT 1 FROM submissions s
      JOIN assignments a ON a.id = s.assignment_id
      JOIN courses c ON c.id = a.course_id
      WHERE s.id = marks.submission_id AND c.faculty_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "insert_marks" ON marks;
CREATE POLICY "insert_marks" ON marks FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM submissions s
      JOIN assignments a ON a.id = s.assignment_id
      JOIN courses c ON c.id = a.course_id
      WHERE s.id = marks.submission_id AND c.faculty_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "update_marks" ON marks;
CREATE POLICY "update_marks" ON marks FOR UPDATE
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM submissions s
      JOIN assignments a ON a.id = s.assignment_id
      JOIN courses c ON c.id = a.course_id
      WHERE s.id = marks.submission_id AND c.faculty_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "delete_marks" ON marks;
CREATE POLICY "delete_marks" ON marks FOR DELETE
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM submissions s
      JOIN assignments a ON a.id = s.assignment_id
      JOIN courses c ON c.id = a.course_id
      WHERE s.id = marks.submission_id AND c.faculty_id = auth.uid()
    )
  );

-- Discussions policies
DROP POLICY IF EXISTS "select_discussions" ON discussions;
CREATE POLICY "select_discussions" ON discussions FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM enrollments WHERE enrollments.course_id = discussions.course_id AND enrollments.student_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM courses WHERE courses.id = discussions.course_id AND courses.faculty_id = auth.uid())
  );

DROP POLICY IF EXISTS "insert_discussions" ON discussions;
CREATE POLICY "insert_discussions" ON discussions FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM enrollments WHERE enrollments.course_id = discussions.course_id AND enrollments.student_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM courses WHERE courses.id = discussions.course_id AND courses.faculty_id = auth.uid())
  );

DROP POLICY IF EXISTS "update_discussions" ON discussions;
CREATE POLICY "update_discussions" ON discussions FOR UPDATE
  TO authenticated USING (auth.uid() = author_id);

DROP POLICY IF EXISTS "delete_discussions" ON discussions;
CREATE POLICY "delete_discussions" ON discussions FOR DELETE
  TO authenticated USING (
    auth.uid() = author_id OR
    EXISTS (SELECT 1 FROM courses WHERE courses.id = discussions.course_id AND courses.faculty_id = auth.uid())
  );

-- Replies policies
DROP POLICY IF EXISTS "select_replies" ON replies;
CREATE POLICY "select_replies" ON replies FOR SELECT
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM discussions d
      JOIN enrollments e ON e.course_id = d.course_id AND e.student_id = auth.uid()
      WHERE d.id = replies.discussion_id
    ) OR
    EXISTS (
      SELECT 1 FROM discussions d
      JOIN courses c ON c.id = d.course_id
      WHERE d.id = replies.discussion_id AND c.faculty_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "insert_replies" ON replies;
CREATE POLICY "insert_replies" ON replies FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "update_replies" ON replies;
CREATE POLICY "update_replies" ON replies FOR UPDATE
  TO authenticated USING (auth.uid() = author_id);

DROP POLICY IF EXISTS "delete_replies" ON replies;
CREATE POLICY "delete_replies" ON replies FOR DELETE
  TO authenticated USING (auth.uid() = author_id);

-- Groups policies
DROP POLICY IF EXISTS "select_groups" ON groups;
CREATE POLICY "select_groups" ON groups FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM group_members WHERE group_members.group_id = groups.id AND group_members.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "insert_groups" ON groups;
CREATE POLICY "insert_groups" ON groups FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "update_groups" ON groups;
CREATE POLICY "update_groups" ON groups FOR UPDATE
  TO authenticated USING (auth.uid() = created_by);

DROP POLICY IF EXISTS "delete_groups" ON groups;
CREATE POLICY "delete_groups" ON groups FOR DELETE
  TO authenticated USING (auth.uid() = created_by);

-- Group members policies
DROP POLICY IF EXISTS "select_group_members" ON group_members;
CREATE POLICY "select_group_members" ON group_members FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM group_members gm2 WHERE gm2.group_id = group_members.group_id AND gm2.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "insert_group_members" ON group_members;
CREATE POLICY "insert_group_members" ON group_members FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_group_members" ON group_members;
CREATE POLICY "delete_group_members" ON group_members FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Contributions policies
DROP POLICY IF EXISTS "select_contributions" ON contributions;
CREATE POLICY "select_contributions" ON contributions FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM group_members WHERE group_members.group_id = contributions.group_id AND group_members.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "insert_contributions" ON contributions;
CREATE POLICY "insert_contributions" ON contributions FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_contributions" ON contributions;
CREATE POLICY "update_contributions" ON contributions FOR UPDATE
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_contributions" ON contributions;
CREATE POLICY "delete_contributions" ON contributions FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Notifications policies
DROP POLICY IF EXISTS "select_notifications" ON notifications;
CREATE POLICY "select_notifications" ON notifications FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_notifications" ON notifications;
CREATE POLICY "insert_notifications" ON notifications FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_notifications" ON notifications;
CREATE POLICY "update_notifications" ON notifications FOR UPDATE
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_notifications" ON notifications;
CREATE POLICY "delete_notifications" ON notifications FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Analytics policies
DROP POLICY IF EXISTS "select_analytics" ON analytics;
CREATE POLICY "select_analytics" ON analytics FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_analytics" ON analytics;
CREATE POLICY "insert_analytics" ON analytics FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_analytics" ON analytics;
CREATE POLICY "update_analytics" ON analytics FOR UPDATE
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_analytics" ON analytics;
CREATE POLICY "delete_analytics" ON analytics FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- AI Conversations policies
DROP POLICY IF EXISTS "select_ai_conversations" ON ai_conversations;
CREATE POLICY "select_ai_conversations" ON ai_conversations FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_ai_conversations" ON ai_conversations;
CREATE POLICY "insert_ai_conversations" ON ai_conversations FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_ai_conversations" ON ai_conversations;
CREATE POLICY "delete_ai_conversations" ON ai_conversations FOR DELETE
  TO authenticated USING (auth.uid() = user_id);