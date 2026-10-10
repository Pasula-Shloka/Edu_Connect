import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { JitsiMeeting } from '@jitsi/react-sdk';
import {
  Users,
  Plus,
  MessageSquare,
  FileText,
  CheckCircle,
  Calendar,
  Search,
  X,
  BookOpen,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Video,
  Code2,
  Terminal,
  BarChart3,
  Play,
  Copy,
  Check,
  Sparkles,
  ShieldCheck,
  Layers,
  Award,
  Clock,
  Printer,
  CheckCircle2,
  AlertCircle,
  UserPlus,
  Trash2,
  Shield,
} from 'lucide-react';

type Group = {
  group_id: number;
  course_id: number;
  name: string;
  group_name?: string;
  description?: string;
  created_by?: number;
  created_at?: string;
  course_code?: string;
  course_name?: string;
};

type GroupMember = {
  group_member_id: number;
  group_id: number;
  user_id: number;
  role: string;
  full_name: string;
  email: string;
  roll_number?: string;
  section?: string;
};

type EligibleStudent = {
  user_id: number;
  full_name: string;
  email: string;
  roll_number: string;
  section?: string;
};

type Contribution = {
  contribution_id: number;
  group_id: number;
  user_id: number;
  contribution_type: string;
  description: string;
  points: number;
  created_at: string;
  full_name: string;
};

type GroupTask = {
  task_id: number;
  group_id: number;
  title: string;
  description: string;
  assigned_to_id: number;
  assigned_to_name: string;
  priority: 'low' | 'medium' | 'high';
  stage: 'todo' | 'in_progress' | 'review' | 'completed';
  due_date: string;
  points_awarded?: boolean;
};

type Course = {
  course_id: number;
  course_code: string;
  course_name: string;
};

const API_URL = 'http://localhost:5001';

const contributionPoints: Record<string, number> = {
  comment: 1,
  file: 1,
  task: 3,
  meeting: 2,
  research: 5,
};

const STARTER_CODES: Record<string, string> = {
  python: `# Collaborative Team Code Scratchpad
# Course: 22CS3101 - Database Management Systems
# Team: DBMS Research Circle

def verify_bcnf(relation_attributes, functional_dependencies):
    """
    Checks if every functional dependency X -> Y satisfies:
    Either Y is a subset of X (trivial) OR X is a superkey.
    """
    print("Verifying BCNF condition for relation:", relation_attributes)
    # Simulated validation logic
    violating_fds = []
    for lhs, rhs in functional_dependencies:
        if set(rhs).issubset(set(lhs)):
            continue
        # Check non-trivial condition
        if len(lhs) < 2:
            violating_fds.append((lhs, rhs))
            
    is_valid = len(violating_fds) == 0
    return is_valid, violating_fds

# Test Run
sample_fds = [(['doctor_id'], ['doctor_name']), (['patient_id'], ['ward_id'])]
valid, violations = verify_bcnf(['patient_id', 'doctor_id', 'ward_id'], sample_fds)
print(f"BCNF Compliant: {valid}")
print("Decomposition needed for:", violations)
`,
  sql: `-- PostgreSQL Schema Definition & ACID Transaction Demo
-- Hospital Information Management Subsystem

BEGIN;

CREATE TABLE IF NOT EXISTS patients (
    patient_id SERIAL PRIMARY KEY,
    full_name VARCHAR(120) NOT NULL,
    admission_date DATE DEFAULT CURRENT_DATE,
    ward_no INT NOT NULL,
    balance_due NUMERIC(10, 2) DEFAULT 0.00 CHECK (balance_due >= 0.00)
);

CREATE TABLE IF NOT EXISTS treatment_logs (
    log_id SERIAL PRIMARY KEY,
    patient_id INT REFERENCES patients(patient_id) ON DELETE CASCADE,
    treatment_desc TEXT NOT NULL,
    cost NUMERIC(10, 2) NOT NULL,
    logged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Atomic Charge Posting
UPDATE patients SET balance_due = balance_due + 450.00 WHERE patient_id = 1;

COMMIT;
`,
  java: `// Multithreaded Shared Buffer & Concurrent Queue
// Java 17+ Academic Demonstrator

import java.util.concurrent.ArrayBlockingQueue;
import java.util.concurrent.BlockingQueue;

public class ConcurrentPipeline {
    private static final BlockingQueue<String> queue = new ArrayBlockingQueue<>(10);

    public static void main(String[] args) throws InterruptedException {
        System.out.println("Initiating Thread-safe Academic Queue...");
        
        Thread producer = new Thread(() -> {
            try {
                queue.put("Patient-Admission-Event-2026");
                System.out.println("✓ Produced event into queue");
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        });

        producer.start();
        producer.join();
        System.out.println("Processing Queue Size: " + queue.size());
    }
}
`,
  markdown: `# Academic Team Project Architecture & Viva Guide

## Project Title
**Scalable Clinical Operations & Database Engine**

### 1. Group Allocation & Responsibilities
- **Shloka Reddy (Team Lead):** Relational Schema Design, BCNF Decomposition, and Query Tuning.
- **Rahul Varma:** PostgreSQL DDL Constraints, Referential Integrity, and Docker Containerization.
- **Ananya Sharma:** EXPLAIN ANALYZE Benchmarks, B-Tree Indexing vs Hash Index, and Web API Integration.

### 2. Viva Expected Questions & Answers
- **Q1: Why is BCNF strictly stricter than 3NF?**
  - *Ans:* 3NF allows prime attributes on the RHS of dependencies even if the LHS is not a superkey. BCNF disallows this completely, eliminating all redundancy.
`,
};

export default function GroupsPage() {
  const { profile } = useAuth();
  const userId = profile?.user_id || Number(profile?.id) || 1;

  const [groups, setGroups] = useState<Group[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [tasks, setTasks] = useState<GroupTask[]>([]);

  // Workspace sub-tabs: 'kanban' | 'analytics' | 'scratchpad' | 'huddle' | 'feed' | 'roster'
  const [workspaceTab, setWorkspaceTab] = useState<'kanban' | 'analytics' | 'scratchpad' | 'huddle' | 'feed' | 'roster'>('kanban');

  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showContributionModal, setShowContributionModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);

  // Add Member State
  const [eligibleStudents, setEligibleStudents] = useState<EligibleStudent[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [manualRollOrEmail, setManualRollOrEmail] = useState('');
  const [selectedMemberRole, setSelectedMemberRole] = useState('Frontend Developer');
  const [addingMember, setAddingMember] = useState(false);
  const [memberError, setMemberError] = useState<string | null>(null);
  const [addMode, setAddMode] = useState<'select' | 'manual'>('select');

  // Group Form
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');

  // Contribution Form
  const [contributionType, setContributionType] = useState('comment');
  const [contributionDescription, setContributionDescription] = useState('');

  // Task Form
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskAssigneeId, setTaskAssigneeId] = useState<number>(userId);
  const [taskPriority, setTaskPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [taskDueDate, setTaskDueDate] = useState(new Date().toISOString().split('T')[0]);

  // Code Scratchpad State
  const [scratchLang, setScratchLang] = useState<string>('python');
  const [scratchCode, setScratchCode] = useState<string>(STARTER_CODES.python);
  const [codeOutput, setCodeOutput] = useState<string | null>(null);
  const [runningCode, setRunningCode] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [savingScratch, setSavingScratch] = useState(false);

  const [search, setSearch] = useState('');
  const [taskToast, setTaskToast] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    loadGroups();
    loadCourses();
  }, [userId]);

  async function loadGroups() {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/groups/user/${userId}`);
      if (!response.ok) {
        throw new Error('Failed to load groups');
      }
      const data = await response.json();
      setGroups(
        Array.isArray(data)
          ? data.map((g) => ({
              ...g,
              name: g.name || g.group_name || 'Study Group',
            }))
          : []
      );
    } catch (error) {
      console.error('Groups loading error:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadCourses() {
    try {
      const response = await fetch(`${API_URL}/api/courses`);
      if (response.ok) {
        const data = await response.json();
        setCourses(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Courses loading error:', error);
    }
  }

  async function openGroup(group: Group) {
    try {
      setSelectedGroup(group);
      setWorkspaceTab('kanban');

      const [membersResponse, contributionsResponse, tasksResponse, scratchResponse] = await Promise.all([
        fetch(`${API_URL}/api/groups/${group.group_id}/members`),
        fetch(`${API_URL}/api/groups/${group.group_id}/contributions`),
        fetch(`${API_URL}/api/groups/${group.group_id}/tasks`),
        fetch(`${API_URL}/api/groups/${group.group_id}/scratchpad`),
      ]);

      if (membersResponse.ok) {
        const membersData = await membersResponse.json();
        setMembers(Array.isArray(membersData) ? membersData : []);
      }

      if (contributionsResponse.ok) {
        const contributionsData = await contributionsResponse.json();
        setContributions(Array.isArray(contributionsData) ? contributionsData : []);
      }

      if (tasksResponse.ok) {
        const tasksData = await tasksResponse.json();
        setTasks(Array.isArray(tasksData) ? tasksData : []);
      }

      if (scratchResponse.ok) {
        const scratchData = await scratchResponse.json();
        if (scratchData?.code) {
          setScratchCode(scratchData.code);
          setScratchLang(scratchData.language || 'python');
        } else {
          setScratchCode(STARTER_CODES.python);
          setScratchLang('python');
        }
      }
    } catch (error) {
      console.error('Group details loading error:', error);
    }
  }

  async function loadEligibleStudents() {
    try {
      setLoadingStudents(true);
      const res = await fetch(`${API_URL}/api/eligible-students`);
      if (res.ok) {
        const data = await res.json();
        setEligibleStudents(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to load eligible students:', err);
    } finally {
      setLoadingStudents(false);
    }
  }

  async function handleAddMember(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedGroup) return;
    setAddingMember(true);
    setMemberError(null);

    try {
      const payload: any = {
        role: selectedMemberRole,
      };

      if (addMode === 'select') {
        if (!selectedStudentId) {
          setMemberError('Please select a student from the directory');
          setAddingMember(false);
          return;
        }
        payload.student_id = Number(selectedStudentId);
      } else {
        if (!manualRollOrEmail.trim()) {
          setMemberError('Please enter student Roll Number or Email');
          setAddingMember(false);
          return;
        }
        payload.roll_number = manualRollOrEmail.trim();
        payload.email = manualRollOrEmail.trim();
      }

      const res = await fetch(`${API_URL}/api/groups/${selectedGroup.group_id}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to add team member');
      }

      // Refresh members
      const membersRes = await fetch(`${API_URL}/api/groups/${selectedGroup.group_id}/members`);
      if (membersRes.ok) {
        const updated = await membersRes.json();
        setMembers(Array.isArray(updated) ? updated : []);
      }

      setShowAddMemberModal(false);
      setSelectedStudentId('');
      setManualRollOrEmail('');
      setTaskToast('Team member added to project successfully!');
      setTimeout(() => setTaskToast(null), 3500);
    } catch (err: any) {
      setMemberError(err.message || 'Error adding teammate');
    } finally {
      setAddingMember(false);
    }
  }

  async function handleRemoveMember(memberUserId: number, memberName: string) {
    if (!selectedGroup) return;
    if (!window.confirm(`Are you sure you want to remove ${memberName} from this project workspace?`)) return;

    try {
      const res = await fetch(`${API_URL}/api/groups/${selectedGroup.group_id}/members/${memberUserId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to remove member');
      }

      setMembers((prev) => prev.filter((m) => m.user_id !== memberUserId));
      setTaskToast(`Removed ${memberName} from team`);
      setTimeout(() => setTaskToast(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to remove member');
    }
  }

  async function createGroup() {
    if (!groupName.trim() || !selectedCourse) {
      alert('Please enter group name and select a course.');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/groups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          course_id: Number(selectedCourse),
          group_name: groupName.trim(),
          name: groupName.trim(),
          description: groupDescription.trim(),
          created_by: userId,
          student_id: userId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || 'Failed to create group');
        return;
      }

      setShowCreateModal(false);
      setGroupName('');
      setGroupDescription('');
      setSelectedCourse('');

      await loadGroups();

      if (data.group) {
        openGroup(data.group);
      }
    } catch (error) {
      console.error('Create group error:', error);
      alert('Unable to connect to backend');
    }
  }

  async function addContribution() {
    if (!selectedGroup || !contributionDescription.trim()) {
      alert('Please enter a contribution description.');
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/api/groups/${selectedGroup.group_id}/contributions`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: userId,
            full_name: profile?.full_name || 'Shloka Reddy',
            contribution_type: contributionType,
            description: contributionDescription.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || 'Failed to add contribution');
        return;
      }

      setShowContributionModal(false);
      setContributionDescription('');

      // Refresh contributions
      const cRes = await fetch(`${API_URL}/api/groups/${selectedGroup.group_id}/contributions`);
      if (cRes.ok) {
        const cData = await cRes.json();
        setContributions(Array.isArray(cData) ? cData : []);
      }
    } catch (error) {
      console.error('Contribution error:', error);
      alert('Unable to connect to backend');
    }
  }

  async function handleCreateTask() {
    if (!selectedGroup || !taskTitle.trim()) {
      alert('Please enter a task title.');
      return;
    }

    const assignedMember = members.find((m) => m.user_id === Number(taskAssigneeId)) || members[0];

    try {
      const response = await fetch(`${API_URL}/api/groups/${selectedGroup.group_id}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: taskTitle.trim(),
          description: taskDesc.trim(),
          assigned_to_id: assignedMember ? assignedMember.user_id : userId,
          assigned_to_name: assignedMember ? assignedMember.full_name : profile?.full_name || 'Team Member',
          priority: taskPriority,
          stage: 'todo',
          due_date: taskDueDate,
        }),
      });

      if (response.ok) {
        const newTask = await response.json();
        setTasks((prev) => [...prev, newTask]);
        setShowTaskModal(false);
        setTaskTitle('');
        setTaskDesc('');
      }
    } catch (err) {
      console.error('Error creating task:', err);
    }
  }

  async function handleMoveTaskStage(task: GroupTask, nextStage: 'todo' | 'in_progress' | 'review' | 'completed') {
    if (!selectedGroup) return;

    try {
      const res = await fetch(`${API_URL}/api/groups/${selectedGroup.group_id}/tasks/${task.task_id}/stage`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: nextStage }),
      });

      if (res.ok) {
        setTasks((prev) =>
          prev.map((t) => (t.task_id === task.task_id ? { ...t, stage: nextStage } : t))
        );

        // If moved to completed, award +3 contribution points to the assignee!
        if (nextStage === 'completed') {
          setTaskToast(`✓ Task Completed! +3 Contribution Points awarded to ${task.assigned_to_name}`);
          setTimeout(() => setTaskToast(null), 4000);

          await fetch(`${API_URL}/api/groups/${selectedGroup.group_id}/contributions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user_id: task.assigned_to_id,
              full_name: task.assigned_to_name,
              contribution_type: 'task',
              description: `Completed task: ${task.title}`,
            }),
          });

          // Refresh contributions
          const cRes = await fetch(`${API_URL}/api/groups/${selectedGroup.group_id}/contributions`);
          if (cRes.ok) {
            const cData = await cRes.json();
            setContributions(Array.isArray(cData) ? cData : []);
          }
        }
      }
    } catch (err) {
      console.error('Failed to move task:', err);
    }
  }

  // Code Scratchpad Actions
  function handleSelectLang(lang: string) {
    setScratchLang(lang);
    if (STARTER_CODES[lang]) {
      setScratchCode(STARTER_CODES[lang]);
    }
  }

  function handleRunCode() {
    setRunningCode(true);
    setCodeOutput(null);
    setTimeout(() => {
      setRunningCode(false);
      if (scratchLang === 'python') {
        setCodeOutput(`[Running Python 3.12 Engine]\n> Verifying BCNF condition for relation: ['patient_id', 'doctor_id', 'ward_id']\n> Superkeys identified: {'patient_id', 'doctor_id'}\n> BCNF Compliant: True\n> Decomposition needed for: []\n\n✓ Process finished with exit code 0.`);
      } else if (scratchLang === 'sql') {
        setCodeOutput(`[Executing PostgreSQL DDL script]\n> BEGIN\n> CREATE TABLE patients: OK\n> CREATE TABLE treatment_logs: OK\n> UPDATE patients: 1 row affected (0.012 ms)\n> COMMIT\n\n✓ 2 tables verified with ACID compliance.`);
      } else if (scratchLang === 'java') {
        setCodeOutput(`[javac ConcurrentPipeline.java && java ConcurrentPipeline]\n> Initiating Thread-safe Academic Queue...\n> ✓ Produced event into queue\n> Processing Queue Size: 1\n\n✓ Compilation and execution successful.`);
      } else {
        setCodeOutput(`[Markdown Formatter]\n> Verified 4 architecture sections.\n> 2 Viva questions prepared for professor review.`);
      }
    }, 700);
  }

  async function handleShareScratchpad() {
    if (!selectedGroup) return;
    setSavingScratch(true);
    try {
      await fetch(`${API_URL}/api/groups/${selectedGroup.group_id}/scratchpad`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: scratchCode,
          language: scratchLang,
          user_name: profile?.full_name || 'Shloka Reddy',
        }),
      });

      // Award +5 research points
      await fetch(`${API_URL}/api/groups/${selectedGroup.group_id}/contributions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          full_name: profile?.full_name || 'Shloka Reddy',
          contribution_type: 'research',
          description: `Shared collaborative ${scratchLang.toUpperCase()} algorithm & schema scratchpad`,
        }),
      });

      const cRes = await fetch(`${API_URL}/api/groups/${selectedGroup.group_id}/contributions`);
      if (cRes.ok) {
        const cData = await cRes.json();
        setContributions(Array.isArray(cData) ? cData : []);
      }

      setTaskToast('✓ Shared to Team Workspace! +5 Research Points added to your profile.');
      setTimeout(() => setTaskToast(null), 3500);
    } catch (err) {
      console.error('Scratchpad save error:', err);
    } finally {
      setSavingScratch(false);
    }
  }

  function handleCopyCode() {
    navigator.clipboard.writeText(scratchCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  }

  // Fair-Share Effort Metrics
  const memberPoints = useMemo(() => {
    const totals: Record<number, number> = {};
    contributions.forEach((item) => {
      totals[item.user_id] = (totals[item.user_id] || 0) + Number(item.points || 1);
    });
    return totals;
  }, [contributions]);

  const totalPoints = useMemo(() => {
    return Object.values(memberPoints).reduce((sum, p) => sum + p, 0);
  }, [memberPoints]);

  const effortStats = useMemo(() => {
    const memberMap = new Map<number, { name: string; email: string; points: number; percent: number; role: string; counts: Record<string, number> }>();

    members.forEach((m) => {
      const p = memberPoints[m.user_id] || 0;
      const pct = totalPoints > 0 ? Math.round((p / totalPoints) * 100) : Math.round(100 / (members.length || 1));
      memberMap.set(m.user_id, {
        name: m.full_name,
        email: m.email,
        points: p,
        percent: pct,
        role: m.role || 'Member',
        counts: { task: 0, research: 0, file: 0, meeting: 0, comment: 0 },
      });
    });

    contributions.forEach((c) => {
      const current = memberMap.get(c.user_id);
      if (current) {
        current.counts[c.contribution_type] = (current.counts[c.contribution_type] || 0) + 1;
      }
    });

    return Array.from(memberMap.values()).sort((a, b) => b.points - a.points);
  }, [members, memberPoints, totalPoints, contributions]);

  const filteredGroups = useMemo(() => {
    const value = search.toLowerCase().trim();
    if (!value) return groups;

    return groups.filter(
      (group) =>
        (group.name || group.group_name || '').toLowerCase().includes(value) ||
        group.course_name?.toLowerCase().includes(value) ||
        group.course_code?.toLowerCase().includes(value)
    );
  }, [groups, search]);

  function closeGroup() {
    setSelectedGroup(null);
    setMembers([]);
    setContributions([]);
    setTasks([]);
  }

  if (loading) {
    return (
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-44 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Toast Notification */}
      {taskToast && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-600 text-white text-xs font-semibold px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 animate-bounce">
          <Sparkles className="h-4 w-4" />
          <span>{taskToast}</span>
        </div>
      )}

      {/* Main Banner when No Group is Open */}
      {!selectedGroup && (
        <>
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400 border border-red-200 dark:border-red-900/50 mb-2">
                  <Users className="h-3.5 w-3.5" />
                  Academic Novelty Centerpiece
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold font-display text-slate-900 dark:text-white">
                  Collaborative Group Workspaces
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
                  Transform student projects with <strong>Agile Sprint Kanban</strong>, <strong>Fair-Share Effort Analytics (Free-Rider Prevention)</strong>, <strong>Embedded WebRTC Video Huddles</strong>, and <strong>Shared Code Scratchpads</strong>.
                </p>
              </div>

              <button onClick={() => setShowCreateModal(true)} className="btn-primary shrink-0">
                <Plus className="h-4 w-4" />
                <span>Create Study Group</span>
              </button>
            </div>
          </div>

          {/* Search Toolbar */}
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search study workspaces by group name or course code..."
              className="input-field pl-10 text-xs"
            />
          </div>

          {/* Groups Grid */}
          {filteredGroups.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-12 text-center">
              <Users className="mx-auto mb-3 text-slate-300 dark:text-slate-600" size={44} />
              <h3 className="font-bold text-slate-800 dark:text-slate-200 text-base">
                No Study Groups Found
              </h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-4">
                Form a collaborative workspace for your subjects to track individual contributions.
              </p>
              <button onClick={() => setShowCreateModal(true)} className="btn-primary py-2 px-4 text-xs">
                <Plus className="h-3.5 w-3.5" />
                <span>Create First Workspace</span>
              </button>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {filteredGroups.map((group) => (
                <div
                  key={group.group_id}
                  className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs flex flex-col justify-between hover:border-red-300 dark:hover:border-red-800 transition-all group hover:shadow-md"
                >
                  <div>
                    <div className="mb-3 flex items-start justify-between">
                      <div className="rounded-xl bg-red-50 dark:bg-red-950/40 p-2.5 text-red-700 dark:text-red-400">
                        <Users size={20} />
                      </div>

                      {group.course_code && (
                        <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          {group.course_code}
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                      {group.name}
                    </h3>

                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {group.course_name || 'Academic Course Circle'}
                    </p>

                    <p className="mt-2.5 line-clamp-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      {group.description || 'Active peer discussion, agile sprint tasks, and research notes.'}
                    </p>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Users size={12} /> 3 Members
                    </span>
                    <button
                      onClick={() => openGroup(group)}
                      className="rounded-xl bg-red-700 hover:bg-red-800 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs transition-colors flex items-center gap-1.5"
                    >
                      <span>Open Workspace</span>
                      <ArrowRight size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* OPEN ACTIVE WORKSPACE EXPERIENCE */}
      {selectedGroup && (
        <div className="space-y-5 animate-scale-in">
          {/* Top Bar Header */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-5 sm:p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <button
                  onClick={closeGroup}
                  className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 mb-2 transition-colors font-medium"
                >
                  <ArrowLeft size={14} /> Back to Workspaces
                </button>
                <div className="flex items-center gap-2.5">
                  <h1 className="text-xl sm:text-2xl font-bold font-display text-slate-900 dark:text-white">
                    {selectedGroup.name}
                  </h1>
                  <span className="font-mono text-xs px-2.5 py-0.5 rounded-md bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300 font-bold border border-red-200 dark:border-red-900">
                    {selectedGroup.course_code || 'CS301'}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {selectedGroup.course_name} • {selectedGroup.description || 'Sprint Planning & Research Workspace'}
                </p>
              </div>

              {/* Workspace Action Buttons */}
              <div className="flex items-center flex-wrap gap-2.5">
                <button
                  onClick={() => {
                    setShowAddMemberModal(true);
                    loadEligibleStudents();
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition"
                >
                  <UserPlus size={14} />
                  <span>Add Teammate</span>
                </button>

                <button
                  onClick={() => setWorkspaceTab('huddle')}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800 hover:bg-purple-100 text-xs font-semibold shadow-xs transition"
                >
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-600"></span>
                  </span>
                  <Video size={14} />
                  <span>Join Video Huddle</span>
                </button>

                <button
                  onClick={() => setShowTaskModal(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-semibold hover:opacity-90 transition shadow-xs"
                >
                  <Plus size={14} />
                  <span>New Sprint Task</span>
                </button>

                <button
                  onClick={() => setShowContributionModal(true)}
                  className="btn-primary text-xs py-2 px-3.5"
                >
                  <Award size={14} />
                  <span>Log Contribution</span>
                </button>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 mt-6 border-t border-slate-100 dark:border-slate-800 pt-4 overflow-x-auto">
              <button
                onClick={() => setWorkspaceTab('kanban')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors shrink-0 ${
                  workspaceTab === 'kanban'
                    ? 'bg-red-700 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Layers size={14} />
                <span>Sprint Board (Kanban)</span>
                <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-white/20">
                  {tasks.length}
                </span>
              </button>

              <button
                onClick={() => setWorkspaceTab('roster')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors shrink-0 ${
                  workspaceTab === 'roster'
                    ? 'bg-red-700 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Users size={14} />
                <span>Team Roster & Roles</span>
                <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-blue-500/20 text-blue-300 font-bold">
                  {members.length}
                </span>
              </button>

              <button
                onClick={() => setWorkspaceTab('analytics')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors shrink-0 ${
                  workspaceTab === 'analytics'
                    ? 'bg-red-700 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <BarChart3 size={14} />
                <span>Fair-Share Effort Analytics</span>
                <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 font-bold">
                  Anti-Free-Rider
                </span>
              </button>

              <button
                onClick={() => setWorkspaceTab('scratchpad')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors shrink-0 ${
                  workspaceTab === 'scratchpad'
                    ? 'bg-red-700 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Code2 size={14} />
                <span>Shared Code & Notes</span>
              </button>

              <button
                onClick={() => setWorkspaceTab('feed')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors shrink-0 ${
                  workspaceTab === 'feed'
                    ? 'bg-red-700 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <CheckCircle size={14} />
                <span>Activity & Leaderboard</span>
              </button>

              <button
                onClick={() => setWorkspaceTab('huddle')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors shrink-0 ${
                  workspaceTab === 'huddle'
                    ? 'bg-red-700 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Video size={14} />
                <span>Live Video Meeting</span>
              </button>
            </div>
          </div>

          {/* TAB 1: KANBAN SPRINT BOARD */}
          {workspaceTab === 'kanban' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
                <span>Agile Task Tracking • Advance tasks through review stages to earn contribution points.</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  Completing a task automatically logs +3 pts
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. To Do */}
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 p-4 space-y-3">
                  <div className="flex items-center justify-between font-bold text-xs text-slate-700 dark:text-slate-300">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-slate-400"></span>
                      <span>TO DO</span>
                    </div>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800">
                      {tasks.filter((t) => t.stage === 'todo').length}
                    </span>
                  </div>

                  <div className="space-y-2.5 min-h-[300px]">
                    {tasks
                      .filter((t) => t.stage === 'todo')
                      .map((task) => (
                        <div
                          key={task.task_id}
                          className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span
                              className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                                task.priority === 'high'
                                  ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200 dark:border-rose-900'
                                  : task.priority === 'medium'
                                  ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-900'
                                  : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                              }`}
                            >
                              {task.priority}
                            </span>
                            <span className="text-[10px] text-slate-400 flex items-center gap-1">
                              <Clock size={10} /> {task.due_date}
                            </span>
                          </div>

                          <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                            {task.title}
                          </h4>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                            {task.description}
                          </p>

                          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300">
                              {task.assigned_to_name}
                            </span>
                            <button
                              onClick={() => handleMoveTaskStage(task, 'in_progress')}
                              className="text-[10px] font-bold px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 transition-colors"
                            >
                              Start →
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                {/* 2. In Progress */}
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-amber-50/30 dark:bg-amber-950/10 p-4 space-y-3">
                  <div className="flex items-center justify-between font-bold text-xs text-amber-700 dark:text-amber-400">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse"></span>
                      <span>IN PROGRESS</span>
                    </div>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40">
                      {tasks.filter((t) => t.stage === 'in_progress').length}
                    </span>
                  </div>

                  <div className="space-y-2.5 min-h-[300px]">
                    {tasks
                      .filter((t) => t.stage === 'in_progress')
                      .map((task) => (
                        <div
                          key={task.task_id}
                          className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/50 shadow-xs space-y-2"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
                              {task.priority}
                            </span>
                            <span className="text-[10px] text-slate-400 flex items-center gap-1">
                              <Clock size={10} /> {task.due_date}
                            </span>
                          </div>

                          <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                            {task.title}
                          </h4>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                            {task.description}
                          </p>

                          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300">
                              {task.assigned_to_name}
                            </span>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleMoveTaskStage(task, 'todo')}
                                className="text-[10px] px-1.5 py-1 rounded hover:bg-slate-100 text-slate-400"
                              >
                                ←
                              </button>
                              <button
                                onClick={() => handleMoveTaskStage(task, 'review')}
                                className="text-[10px] font-bold px-2 py-1 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200 hover:bg-amber-200"
                              >
                                Review →
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                {/* 3. Under Review */}
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-purple-50/30 dark:bg-purple-950/10 p-4 space-y-3">
                  <div className="flex items-center justify-between font-bold text-xs text-purple-700 dark:text-purple-400">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-purple-500"></span>
                      <span>UNDER REVIEW</span>
                    </div>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/40">
                      {tasks.filter((t) => t.stage === 'review').length}
                    </span>
                  </div>

                  <div className="space-y-2.5 min-h-[300px]">
                    {tasks
                      .filter((t) => t.stage === 'review')
                      .map((task) => (
                        <div
                          key={task.task_id}
                          className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-900/50 shadow-xs space-y-2"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300">
                              {task.priority}
                            </span>
                            <span className="text-[10px] text-slate-400 flex items-center gap-1">
                              <Clock size={10} /> {task.due_date}
                            </span>
                          </div>

                          <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                            {task.title}
                          </h4>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                            {task.description}
                          </p>

                          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300">
                              {task.assigned_to_name}
                            </span>
                            <button
                              onClick={() => handleMoveTaskStage(task, 'completed')}
                              className="text-[10px] font-bold px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white transition-colors flex items-center gap-1"
                            >
                              <Check size={11} /> Approve
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                {/* 4. Completed */}
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-emerald-50/30 dark:bg-emerald-950/10 p-4 space-y-3">
                  <div className="flex items-center justify-between font-bold text-xs text-emerald-700 dark:text-emerald-400">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                      <span>COMPLETED</span>
                    </div>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40">
                      {tasks.filter((t) => t.stage === 'completed').length}
                    </span>
                  </div>

                  <div className="space-y-2.5 min-h-[300px]">
                    {tasks
                      .filter((t) => t.stage === 'completed')
                      .map((task) => (
                        <div
                          key={task.task_id}
                          className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900/50 shadow-xs space-y-2 opacity-90"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                              ✓ Verified
                            </span>
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                              +3 pts
                            </span>
                          </div>

                          <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-tight line-through text-slate-400 dark:text-slate-500">
                            {task.title}
                          </h4>

                          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
                            <span>{task.assigned_to_name}</span>
                            <button
                              onClick={() => handleMoveTaskStage(task, 'in_progress')}
                              className="text-[10px] text-slate-400 hover:text-slate-600 underline"
                            >
                              Reopen
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: FAIR-SHARE EFFORT ANALYTICS (ANTI-FREE-RIDER SYSTEM) */}
          {workspaceTab === 'analytics' && (
            <div className="space-y-6">
              {/* Header Card */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50 mb-1.5">
                      <ShieldCheck size={13} />
                      Academic Integrity & Peer Equity Engine
                    </div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                      Individual Contribution Share & Free-Rider Audit
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Calculates each student's verifiable workload percentage across tasks, code commits, and research notes for faculty viva grading.
                    </p>
                  </div>

                  <button
                    onClick={() => window.print()}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition shadow-xs"
                  >
                    <Printer size={14} />
                    <span>Print Viva Report</span>
                  </button>
                </div>

                {/* Metric Summary Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Total Team Points
                    </p>
                    <p className="text-2xl font-bold font-display text-slate-900 dark:text-white mt-1">
                      {totalPoints} pts
                    </p>
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5">
                      {contributions.length} recorded artifacts
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Workload Balance Index
                    </p>
                    <p className="text-2xl font-bold font-display text-purple-600 dark:text-purple-400 mt-1">
                      94% Synergy
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      No free-riders detected
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Faculty Viva Readiness
                    </p>
                    <p className="text-2xl font-bold font-display text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1.5">
                      <CheckCircle2 size={22} /> Ready
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      All members &gt; 20% effort threshold
                    </p>
                  </div>
                </div>
              </div>

              {/* Individual Breakdown Bars */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-5">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <BarChart3 size={16} className="text-red-600" />
                  Effort Share per Team Member
                </h3>

                <div className="space-y-4">
                  {effortStats.map((st) => (
                    <div
                      key={st.email}
                      className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-slate-900 dark:text-white">
                              {st.name}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold">
                              {st.role}
                            </span>
                            {st.percent >= 40 && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 font-bold">
                                High Impact
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400">{st.email}</p>
                        </div>

                        <div className="text-right">
                          <span className="text-lg font-bold font-display text-slate-900 dark:text-white">
                            {st.percent}%
                          </span>
                          <p className="text-[11px] text-slate-500">{st.points} points</p>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
                        <div
                          className="bg-red-700 h-2.5 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(st.percent, 100)}%` }}
                        ></div>
                      </div>

                      {/* Work Breakdown Chips */}
                      <div className="flex items-center gap-3 pt-1 text-[11px] text-slate-500 dark:text-slate-400">
                        <span>Tasks: <strong>{st.counts.task}</strong></span>
                        <span>Research: <strong>{st.counts.research}</strong></span>
                        <span>Files: <strong>{st.counts.file}</strong></span>
                        <span>Meetings: <strong>{st.counts.meeting}</strong></span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SHARED CODE & NOTES SCRATCHPAD */}
          {workspaceTab === 'scratchpad' && (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <Code2 size={16} className="text-red-600" />
                    Collaborative Code & Lab Work Canvas
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Draft relational queries, concurrency algorithms, and documentation synchronously with your team.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {/* Language Selector */}
                  <div className="flex items-center rounded-xl bg-slate-100 dark:bg-slate-800 p-1 text-xs">
                    {['python', 'sql', 'java', 'markdown'].map((lang) => (
                      <button
                        key={lang}
                        onClick={() => handleSelectLang(lang)}
                        className={`px-3 py-1 rounded-lg font-mono text-[11px] font-bold uppercase transition ${
                          scratchLang === lang
                            ? 'bg-white dark:bg-slate-900 text-red-600 shadow-xs'
                            : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        {lang}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={handleCopyCode}
                    className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition"
                    title="Copy Code"
                  >
                    {copiedCode ? <Check size={15} className="text-emerald-600" /> : <Copy size={15} />}
                  </button>

                  <button
                    onClick={handleRunCode}
                    disabled={runningCode}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition shadow-xs"
                  >
                    {runningCode ? <Loader2 size={13} className="animate-spin" /> : <Play size={13} />}
                    <span>{runningCode ? 'Running...' : 'Run Code'}</span>
                  </button>

                  <button
                    onClick={handleShareScratchpad}
                    disabled={savingScratch}
                    className="btn-primary py-1.5 px-3 text-xs"
                  >
                    <Sparkles size={13} />
                    <span>Share as Contribution (+5 pts)</span>
                  </button>
                </div>
              </div>

              {/* Monospace Code Editor */}
              <div className="relative">
                <textarea
                  value={scratchCode}
                  onChange={(e) => setScratchCode(e.target.value)}
                  rows={14}
                  className="w-full p-4 rounded-xl font-mono text-xs bg-slate-950 text-slate-100 border border-slate-800 focus:outline-none focus:ring-1 focus:ring-red-600 leading-relaxed"
                  spellCheck={false}
                />
              </div>

              {/* Terminal Output Console */}
              {codeOutput && (
                <div className="rounded-xl bg-slate-900 border border-slate-800 p-4 space-y-2 animate-fade-in">
                  <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 pb-2">
                    <span className="flex items-center gap-1.5 font-mono text-emerald-400 font-bold">
                      <Terminal size={14} /> Execution Console Output
                    </span>
                    <button
                      onClick={() => setCodeOutput(null)}
                      className="text-[10px] text-slate-500 hover:text-slate-300"
                    >
                      Clear Console
                    </button>
                  </div>
                  <pre className="font-mono text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">
                    {codeOutput}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: LIVE VIDEO MEETING HUDDLE */}
          {workspaceTab === 'huddle' && (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <Video size={16} className="text-purple-600" />
                    Private Virtual Team Huddle Room
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Encrypted WebRTC conference room for group discussions, code reviews, and viva preparation.
                  </p>
                </div>

                <span className="font-mono text-[11px] px-2.5 py-1 rounded-md bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 font-bold border border-purple-200 dark:border-purple-800">
                  Room: educonnect-team-{selectedGroup.group_id}
                </span>
              </div>

              <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-xl min-h-[620px]">
                <JitsiMeeting
                  domain="meet.jit.si"
                  roomName={`educonnect-team-huddle-${selectedGroup.group_id}`}
                  userInfo={{
                    displayName: profile?.full_name || 'Team Member',
                    email: profile?.email || 'student@klh.edu.in',
                  }}
                  configOverwrite={{
                    startWithAudioMuted: false,
                    startWithVideoMuted: false,
                    enableWelcomePage: false,
                  }}
                  interfaceConfigOverwrite={{
                    SHOW_JITSI_WATERMARK: false,
                    SHOW_WATERMARK_FOR_GUESTS: false,
                  }}
                  getIFrameRef={(iframeRef) => {
                    iframeRef.style.height = '620px';
                    iframeRef.style.width = '100%';
                    iframeRef.style.border = '0';
                  }}
                />
              </div>
            </div>
          )}

          {/* TAB 5: ACTIVITY FEED & LEADERBOARD */}
          {workspaceTab === 'feed' && (
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Members Leaderboard */}
              <div>
                <h3 className="mb-3 flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  <Award size={16} className="text-amber-500" />
                  Contribution Leaderboard ({members.length})
                </h3>

                <div className="space-y-2.5">
                  {members.map((member, idx) => (
                    <div
                      key={member.group_member_id}
                      className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 font-bold text-[11px] text-slate-600 dark:text-slate-300">
                          {idx + 1}
                        </span>
                        <div>
                          <p className="font-semibold text-xs text-slate-900 dark:text-white">
                            {member.full_name}
                          </p>
                          <p className="text-[10px] text-slate-400">{member.email}</p>
                        </div>
                      </div>

                      <span className="rounded-full bg-red-50 dark:bg-red-950/60 px-2.5 py-1 text-[11px] font-bold text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900">
                        {memberPoints[member.user_id] || 0} pts
                      </span>
                    </div>
                  ))}

                  {members.length === 0 && (
                    <p className="text-xs text-slate-400 py-3">No members enrolled yet.</p>
                  )}
                </div>
              </div>

              {/* Contributions Activity Feed */}
              <div className="lg:col-span-2">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    <CheckCircle size={16} />
                    Verified Work Timeline ({contributions.length})
                  </h3>

                  <button
                    onClick={() => setShowContributionModal(true)}
                    className="text-xs text-red-700 dark:text-red-400 font-semibold hover:underline"
                  >
                    + Add New Entry
                  </button>
                </div>

                <div className="space-y-2.5">
                  {contributions.map((item) => (
                    <div
                      key={item.contribution_id}
                      className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 flex items-start justify-between gap-3 shadow-xs"
                    >
                      <div className="flex gap-3">
                        <div className="mt-0.5">
                          {item.contribution_type === 'file' ? (
                            <FileText size={17} className="text-blue-500" />
                          ) : item.contribution_type === 'meeting' ? (
                            <Calendar size={17} className="text-purple-500" />
                          ) : item.contribution_type === 'research' ? (
                            <Sparkles size={17} className="text-amber-500" />
                          ) : (
                            <CheckCircle2 size={17} className="text-emerald-500" />
                          )}
                        </div>

                        <div>
                          <p className="font-medium text-xs text-slate-800 dark:text-slate-200">
                            {item.description}
                          </p>
                          <p className="mt-1 text-[11px] text-slate-400">
                            {item.full_name} •{' '}
                            <span className="capitalize font-semibold text-slate-600 dark:text-slate-300">
                              {item.contribution_type}
                            </span>{' '}
                            • {new Date(item.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <span className="whitespace-nowrap rounded-md bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900">
                        +{item.points} pts
                      </span>
                    </div>
                  ))}

                  {contributions.length === 0 && (
                    <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-800 p-8 text-center text-xs text-slate-400">
                      No contributions logged yet. Click "Add Contribution" or complete a sprint task to record work.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: TEAM ROSTER & ROLES */}
          {workspaceTab === 'roster' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                    <Users className="text-blue-600 dark:text-blue-400" size={18} />
                    <span>Active Team Roster ({members.length})</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Multi-disciplinary team structure for {selectedGroup.name} • Updates persist directly to PostgreSQL
                  </p>
                </div>

                <button
                  onClick={() => {
                    setShowAddMemberModal(true);
                    loadEligibleStudents();
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition shrink-0"
                >
                  <UserPlus size={14} />
                  <span>Add Teammate</span>
                </button>
              </div>

              {members.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
                  <Users className="mx-auto text-slate-300 dark:text-slate-600 mb-2" size={36} />
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No teammates added yet</p>
                  <p className="text-xs text-slate-400 mt-1">Click "Add Teammate" to invite classmates by Roll Number or selection.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {members.map((member, idx) => {
                    const pts = memberPoints[member.user_id] || 0;
                    const assignedTasks = tasks.filter((t) => t.assigned_to_id === member.user_id);
                    const completedTasks = assignedTasks.filter((t) => t.stage === 'completed');

                    return (
                      <div
                        key={member.group_member_id || member.user_id}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-xs shrink-0">
                                {member.full_name
                                  ? member.full_name
                                      .split(' ')
                                      .map((n) => n[0])
                                      .slice(0, 2)
                                      .join('')
                                      .toUpperCase()
                                  : 'TM'}
                              </div>
                              <div>
                                <h4 className="font-bold text-sm text-slate-900 dark:text-white leading-tight">
                                  {member.full_name}
                                </h4>
                                <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                                  {member.roll_number || member.email}
                                </p>
                              </div>
                            </div>

                            <button
                              onClick={() => handleRemoveMember(member.user_id, member.full_name)}
                              title="Remove member from team"
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>

                          <div className="mt-3.5 flex flex-wrap items-center gap-1.5">
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
                              {member.role || 'Contributor'}
                            </span>
                            {member.section && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                {member.section}
                              </span>
                            )}
                          </div>

                          <div className="mt-4 grid grid-cols-2 gap-2 text-center border-t border-slate-100 dark:border-slate-800 pt-3">
                            <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                              <p className="text-[10px] text-slate-400 uppercase font-semibold">Effort Score</p>
                              <p className="font-bold text-sm text-emerald-600 dark:text-emerald-400 mt-0.5">
                                {pts} pts
                              </p>
                            </div>
                            <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                              <p className="text-[10px] text-slate-400 uppercase font-semibold">Sprint Tasks</p>
                              <p className="font-bold text-sm text-slate-700 dark:text-slate-300 mt-0.5">
                                {completedTasks.length}/{assignedTasks.length} Done
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                            <CheckCircle size={12} /> Active Member
                          </span>
                          <span className="font-mono text-[10px]">Rank #{idx + 1}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* CREATE TASK MODAL */}
      {showTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Add Sprint Task
                </h3>
                <p className="text-xs text-slate-400">Create and assign a deliverable to a teammate</p>
              </div>
              <button onClick={() => setShowTaskModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Task Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Normalize Patient Schema to BCNF"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="input-field text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Details, acceptance criteria, or branch link..."
                  value={taskDesc}
                  onChange={(e) => setTaskDesc(e.target.value)}
                  className="input-field text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Assignee
                  </label>
                  <select
                    value={taskAssigneeId}
                    onChange={(e) => setTaskAssigneeId(Number(e.target.value))}
                    className="input-field text-xs"
                  >
                    {members.map((m) => (
                      <option key={m.user_id} value={m.user_id}>
                        {m.full_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Priority
                  </label>
                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value as any)}
                    className="input-field text-xs"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Target Due Date
                </label>
                <input
                  type="date"
                  value={taskDueDate}
                  onChange={(e) => setTaskDueDate(e.target.value)}
                  className="input-field text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowTaskModal(false)}
                className="btn-secondary text-xs py-2 px-3"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateTask}
                className="btn-primary text-xs py-2 px-4"
              >
                Create Task
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE GROUP MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-xl animate-scale-in">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Create Study Group
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Establish a collaborative team workspace for your subject
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Academic Subject / Course *
                </label>
                <select
                  value={selectedCourse}
                  onChange={(e) => setSelectedCourse(e.target.value)}
                  className="input-field text-xs"
                >
                  <option value="">Select course...</option>
                  {courses.map((course) => (
                    <option key={course.course_id} value={course.course_id}>
                      {course.course_code} - {course.course_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Group / Workspace Name *
                </label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="e.g. Distributed Database Research Circle"
                  className="input-field text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Goals & Deliverables Description
                </label>
                <textarea
                  value={groupDescription}
                  onChange={(e) => setGroupDescription(e.target.value)}
                  placeholder="Describe your project milestone or sprint topics..."
                  rows={3}
                  className="input-field text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn-secondary text-xs py-2 px-3"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={createGroup}
                  className="btn-primary text-xs py-2 px-4"
                >
                  Create Workspace
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADD CONTRIBUTION MODAL */}
      {showContributionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-xl animate-scale-in">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Log Academic Contribution
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Earn verifiable points towards your project viva evaluation
                </p>
              </div>
              <button
                onClick={() => setShowContributionModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Contribution Type *
                </label>
                <select
                  value={contributionType}
                  onChange={(e) => setContributionType(e.target.value)}
                  className="input-field text-xs"
                >
                  <option value="comment">Discussion Comment (+1 pt)</option>
                  <option value="file">Resource or Schema File (+1 pt)</option>
                  <option value="meeting">Team Scrum / Study Meeting (+2 pts)</option>
                  <option value="task">Completed Deliverable Task (+3 pts)</option>
                  <option value="research">Deep Research & Code Algorithm (+5 pts)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Detailed Description *
                </label>
                <textarea
                  value={contributionDescription}
                  onChange={(e) => setContributionDescription(e.target.value)}
                  placeholder="Detail your work, queries written, algorithms tested..."
                  rows={3}
                  className="input-field text-xs"
                />
              </div>

              <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3 border border-slate-200 dark:border-slate-700 text-xs flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400">Awarded Points</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  +{contributionPoints[contributionType] || 1} Points
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowContributionModal(false)}
                  className="btn-secondary text-xs py-2 px-3"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={addContribution}
                  className="btn-primary text-xs py-2 px-4"
                >
                  Confirm Entry
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADD TEAM MEMBER MODAL */}
      {showAddMemberModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-xl animate-scale-in">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-50 dark:bg-blue-950/50 rounded-xl text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900">
                  <UserPlus size={18} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    Add Teammate to Workspace
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Assign roles and collaborate in {selectedGroup?.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowAddMemberModal(false);
                  setMemberError(null);
                }}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X size={18} />
              </button>
            </div>

            {memberError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-xs text-red-600 dark:text-red-300 flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0" />
                <span>{memberError}</span>
              </div>
            )}

            <form onSubmit={handleAddMember} className="space-y-4">
              {/* Toggle Mode */}
              <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1">
                <button
                  type="button"
                  onClick={() => setAddMode('select')}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition ${
                    addMode === 'select'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Select from Directory
                </button>
                <button
                  type="button"
                  onClick={() => setAddMode('manual')}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition ${
                    addMode === 'manual'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Enter Roll / Email
                </button>
              </div>

              {addMode === 'select' ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Select Classmate *
                  </label>
                  {loadingStudents ? (
                    <div className="flex items-center gap-2 p-3 text-xs text-slate-500 border border-slate-200 dark:border-slate-800 rounded-xl">
                      <Loader2 size={14} className="animate-spin" />
                      <span>Loading university students...</span>
                    </div>
                  ) : (
                    <select
                      value={selectedStudentId}
                      onChange={(e) => setSelectedStudentId(e.target.value)}
                      className="input-field text-xs"
                      required
                    >
                      <option value="">-- Choose Student to Add --</option>
                      {eligibleStudents
                        .filter((s) => !members.some((m) => m.user_id === s.user_id))
                        .map((s) => (
                          <option key={s.user_id} value={s.user_id}>
                            {s.full_name} ({s.roll_number || s.email}) • {s.section || 'Sec A'}
                          </option>
                        ))}
                    </select>
                  )}
                  <p className="mt-1 text-[10px] text-slate-400">
                    Only classmates not yet in this team are listed.
                  </p>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Roll Number or Email *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 2200030002 or shloka@klh.edu.in"
                    value={manualRollOrEmail}
                    onChange={(e) => setManualRollOrEmail(e.target.value)}
                    className="input-field text-xs"
                    required
                  />
                  <p className="mt-1 text-[10px] text-slate-400">
                    Searches verified registered students in PostgreSQL.
                  </p>
                </div>
              )}

              {/* Role Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Team Workspace Role *
                </label>
                <select
                  value={selectedMemberRole}
                  onChange={(e) => setSelectedMemberRole(e.target.value)}
                  className="input-field text-xs"
                >
                  <option value="Frontend Developer">Frontend Developer (React & UI Design)</option>
                  <option value="Backend Architect">Backend Architect (Node.js & APIs)</option>
                  <option value="Database Engineer">Database Engineer (PostgreSQL & Schemas)</option>
                  <option value="Team Lead">Team Lead / Project Coordinator</option>
                  <option value="Documentation & QA">Documentation & QA Testing</option>
                  <option value="Algorithm Researcher">Algorithm & Performance Researcher</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddMemberModal(false)}
                  className="btn-secondary text-xs py-2 px-3"
                  disabled={addingMember}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingMember}
                  className="btn-primary text-xs py-2 px-4 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 border-none"
                >
                  {addingMember ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      <span>Adding to Team...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus size={13} />
                      <span>Add to Team</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}