import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
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
  Loader2,
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

export default function GroupsPage() {
  const { profile } = useAuth();
  const userId = profile?.user_id || Number(profile?.id);

  const [groups, setGroups] = useState<Group[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [contributions, setContributions] = useState<Contribution[]>([]);

  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showContributionModal, setShowContributionModal] = useState(false);

  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');

  const [contributionType, setContributionType] = useState('comment');
  const [contributionDescription, setContributionDescription] = useState('');

  const [search, setSearch] = useState('');

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

      const [membersResponse, contributionsResponse] = await Promise.all([
        fetch(`${API_URL}/api/groups/${group.group_id}/members`),
        fetch(`${API_URL}/api/groups/${group.group_id}/contributions`),
      ]);

      if (membersResponse.ok) {
        const membersData = await membersResponse.json();
        setMembers(Array.isArray(membersData) ? membersData : []);
      }

      if (contributionsResponse.ok) {
        const contributionsData = await contributionsResponse.json();
        setContributions(
          Array.isArray(contributionsData) ? contributionsData : []
        );
      }
    } catch (error) {
      console.error('Group details loading error:', error);
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
        headers: {
          'Content-Type': 'application/json',
        },
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
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: userId,
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

      await openGroup(selectedGroup);
    } catch (error) {
      console.error('Contribution error:', error);
      alert('Unable to connect to backend');
    }
  }

  const filteredGroups = useMemo(() => {
    const value = search.toLowerCase().trim();
    if (!value) return groups;

    return groups.filter(
      (group) =>
        (group.name || group.group_name || '')
          .toLowerCase()
          .includes(value) ||
        group.course_name?.toLowerCase().includes(value) ||
        group.course_code?.toLowerCase().includes(value)
    );
  }, [groups, search]);

  const memberPoints = useMemo(() => {
    const totals: Record<number, number> = {};
    contributions.forEach((item) => {
      totals[item.user_id] =
        (totals[item.user_id] || 0) + Number(item.points || 1);
    });
    return totals;
  }, [contributions]);

  function closeGroup() {
    setSelectedGroup(null);
    setMembers([]);
    setContributions([]);
  }

  if (loading) {
    return (
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="h-44 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Banner */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400 border border-red-200 dark:border-red-900/50 mb-2">
              <Users className="h-3.5 w-3.5" />
              Collaborative Learning & Project Teams
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold font-display text-slate-900 dark:text-white">
              Group Workspaces
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Form academic study circles, track group contributions, and solve problem sets collaboratively.
            </p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span>Create Study Group</span>
          </button>
        </div>
      </div>

      {/* Search Toolbar */}
      <div className="relative">
        <Search
          size={16}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search study groups by name or course code..."
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
            Collaborate with peers by creating a dedicated workspace for your subjects.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary py-2 px-4 text-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Create First Study Group</span>
          </button>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filteredGroups.map((group) => (
            <div
              key={group.group_id}
              className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-all"
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

                <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                  {group.name}
                </h3>

                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {group.course_name || 'Academic Course Circle'}
                </p>

                <p className="mt-2.5 line-clamp-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {group.description || 'Active peer discussion and assignment workgroup.'}
                </p>
              </div>

              <button
                onClick={() => openGroup(group)}
                className="mt-5 w-full rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50/70 dark:bg-red-950/30 px-4 py-2 text-xs font-semibold text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
              >
                Open Workspace
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Selected Group Modal / Workspace Detail */}
      {selectedGroup && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
          <div className="flex flex-col gap-3 border-b border-slate-200 dark:border-slate-800 p-5 md:flex-row md:items-center md:justify-between bg-slate-50/60 dark:bg-slate-800/40">
            <div>
              <div className="flex items-center gap-2">
                <Users className="text-red-700 dark:text-red-400" size={20} />
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {selectedGroup.name}
                </h2>
              </div>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                {selectedGroup.course_code} — {selectedGroup.course_name || 'Collaborative Workspace'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowContributionModal(true)}
                className="btn-primary text-xs py-2 px-3.5"
              >
                <Plus size={15} />
                <span>Add Contribution</span>
              </button>

              <button
                onClick={closeGroup}
                className="rounded-xl border border-slate-200 dark:border-slate-700 p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          <div className="grid gap-6 p-5 lg:grid-cols-3">
            {/* Members List */}
            <div>
              <h3 className="mb-3 flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
                <Users size={16} />
                Workspace Members ({members.length})
              </h3>

              <div className="space-y-2.5">
                {members.map((member) => (
                  <div
                    key={member.group_member_id}
                    className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-xs text-slate-900 dark:text-white">
                          {member.full_name}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {member.email}
                        </p>
                      </div>

                      <span className="rounded-full bg-red-50 dark:bg-red-950/60 px-2 py-0.5 text-[10px] font-bold text-red-700 dark:text-red-300">
                        {memberPoints[member.user_id] || 0} pts
                      </span>
                    </div>
                  </div>
                ))}

                {members.length === 0 && (
                  <p className="text-xs text-slate-400 py-3">No members enrolled yet.</p>
                )}
              </div>
            </div>

            {/* Contributions Activity Feed */}
            <div className="lg:col-span-2">
              <h3 className="mb-3 flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
                <CheckCircle size={16} />
                Activity & Contributions ({contributions.length})
              </h3>

              <div className="space-y-2.5">
                {contributions.map((item) => (
                  <div
                    key={item.contribution_id}
                    className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 flex items-start justify-between gap-3"
                  >
                    <div className="flex gap-3">
                      <div className="mt-0.5">
                        {item.contribution_type === 'file' ? (
                          <FileText size={17} className="text-slate-500" />
                        ) : item.contribution_type === 'meeting' ? (
                          <Calendar size={17} className="text-slate-500" />
                        ) : (
                          <MessageSquare size={17} className="text-slate-500" />
                        )}
                      </div>

                      <div>
                        <p className="font-medium text-xs text-slate-800 dark:text-slate-200">
                          {item.description}
                        </p>
                        <p className="mt-1 text-[11px] text-slate-400">
                          {item.full_name} •{' '}
                          <span className="capitalize font-semibold text-slate-500 dark:text-slate-400">
                            {item.contribution_type}
                          </span>
                        </p>
                      </div>
                    </div>

                    <span className="whitespace-nowrap rounded-md bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                      +{item.points} pts
                    </span>
                  </div>
                ))}

                {contributions.length === 0 && (
                  <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-800 p-8 text-center text-xs text-slate-400">
                    No contributions recorded yet. Click "Add Contribution" to log your work.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Group Modal */}
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
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="mb-1 block font-semibold text-slate-700 dark:text-slate-300">
                  Group Name *
                </label>
                <input
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="e.g. DBMS Semester Project Group"
                  className="input-field"
                />
              </div>

              <div>
                <label className="mb-1 block font-semibold text-slate-700 dark:text-slate-300">
                  Academic Course *
                </label>
                <select
                  value={selectedCourse}
                  onChange={(e) => setSelectedCourse(e.target.value)}
                  className="input-field"
                >
                  <option value="">Select course</option>
                  {courses.map((course) => (
                    <option key={course.course_id} value={course.course_id}>
                      {course.course_code} - {course.course_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block font-semibold text-slate-700 dark:text-slate-300">
                  Description
                </label>
                <textarea
                  value={groupDescription}
                  onChange={(e) => setGroupDescription(e.target.value)}
                  placeholder="Goals, agenda, deliverables or meeting schedules..."
                  rows={3}
                  className="input-field"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={createGroup}
                  disabled={!groupName.trim() || !selectedCourse}
                  className="btn-primary"
                >
                  Create Group
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Contribution Modal */}
      {showContributionModal && selectedGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-xl animate-scale-in">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Add Group Contribution
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Record research, tasks completed or meeting notes
                </p>
              </div>

              <button
                onClick={() => setShowContributionModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="mb-1 block font-semibold text-slate-700 dark:text-slate-300">
                  Contribution Type *
                </label>
                <select
                  value={contributionType}
                  onChange={(e) => setContributionType(e.target.value)}
                  className="input-field"
                >
                  <option value="comment">Comment / Query — 1 point</option>
                  <option value="file">File / Notes Shared — 1 point</option>
                  <option value="task">Assignment Task Completed — 3 points</option>
                  <option value="meeting">Team Meeting Attended — 2 points</option>
                  <option value="research">Academic Research Contribution — 5 points</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block font-semibold text-slate-700 dark:text-slate-300">
                  Description *
                </label>
                <textarea
                  value={contributionDescription}
                  onChange={(e) =>
                    setContributionDescription(e.target.value)
                  }
                  placeholder="Detail your contribution, findings or deliverable..."
                  rows={3}
                  className="input-field"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowContributionModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={addContribution}
                  disabled={!contributionDescription.trim()}
                  className="btn-primary"
                >
                  Save Contribution
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}