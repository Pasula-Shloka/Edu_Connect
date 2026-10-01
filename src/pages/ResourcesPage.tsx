import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  FileText,
  Video,
  Link as LinkIcon,
  File,
  Presentation,
  Plus,
  X,
  Loader2,
  ExternalLink,
  BookOpen,
  Search,
  Download,
  Filter,
  Layers,
  GraduationCap,
} from 'lucide-react';

type Course = {
  course_id: number;
  course_code: string;
  course_name: string;
  description?: string | null;
  faculty_id: number;
};

type Resource = {
  resource_id: number;
  course_id: number;
  unit_id?: number | null;
  title: string;
  description?: string | null;
  resource_type: string;
  url?: string | null;
  uploaded_by: number;
  created_at?: string;
  course_code?: string;
  course_name?: string;
};

type CourseUnit = {
  unit_id: number;
  course_id: number;
  unit_name: string;
};

const API_URL = 'http://localhost:5001';

const typeConfig: Record<
  string,
  { icon: typeof FileText; label: string; color: string; badge: string }
> = {
  pdf: {
    icon: File,
    label: 'PDF Document',
    color: 'text-red-600 bg-red-50 dark:bg-red-950/50 dark:text-red-400',
    badge: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900',
  },
  slide: {
    icon: Presentation,
    label: 'Lecture Slides',
    color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/50 dark:text-amber-400',
    badge: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900',
  },
  presentation: {
    icon: Presentation,
    label: 'Lecture Slides',
    color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/50 dark:text-amber-400',
    badge: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900',
  },
  document: {
    icon: FileText,
    label: 'Study Notes',
    color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/50 dark:text-blue-400',
    badge: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900',
  },
  video: {
    icon: Video,
    label: 'Video Lecture',
    color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/50 dark:text-purple-400',
    badge: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-900',
  },
  link: {
    icon: LinkIcon,
    label: 'Web Reference',
    color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 dark:text-emerald-400',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900',
  },
  other: {
    icon: BookOpen,
    label: 'Academic Resource',
    color: 'text-slate-600 bg-slate-50 dark:bg-slate-800 dark:text-slate-300',
    badge: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
  },
};

export default function ResourcesPage() {
  const { profile } = useAuth();

  const [courses, setCourses] = useState<Course[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [units, setUnits] = useState<CourseUnit[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [adding, setAdding] = useState(false);

  const [addForm, setAddForm] = useState({
    course_id: '',
    unit_id: '',
    title: '',
    description: '',
    resource_type: 'document',
    url: '',
  });

  useEffect(() => {
    if (profile) {
      fetchData();
    }
  }, [profile]);

  async function fetchData() {
    if (!profile) return;
    setLoading(true);

    try {
      const userId = Number(profile.user_id || profile.id);

      // 1. Get Courses
      const coursesResponse = await fetch(`${API_URL}/api/courses`);
      if (!coursesResponse.ok) throw new Error('Failed to load courses');
      const allCourses: Course[] = await coursesResponse.json();

      let availableCourses: Course[] = [];

      if (profile.role === 'faculty') {
        availableCourses = allCourses.filter(
          (course) => Number(course.faculty_id) === Number(userId)
        );
      } else if (profile.role === 'admin') {
        availableCourses = allCourses;
      } else {
        // Student: fetch enrollments
        const enrollmentResponse = await fetch(
          `${API_URL}/api/enrollments/student/${userId}`
        );
        if (enrollmentResponse.ok) {
          const enrollmentData = await enrollmentResponse.json();
          const courseIds = Array.isArray(enrollmentData)
            ? enrollmentData.map((e: any) => Number(e.course_id))
            : [];
          availableCourses = allCourses.filter((course) =>
            courseIds.includes(Number(course.course_id))
          );
        }
      }

      setCourses(availableCourses);

      if (availableCourses.length === 0) {
        setResources([]);
        setLoading(false);
        return;
      }

      // 2. Fetch resources for available courses
      const resourceResults = await Promise.all(
        availableCourses.map(async (course) => {
          try {
            const response = await fetch(`${API_URL}/api/resources/${course.course_id}`);
            if (!response.ok) return [];
            const data = await response.json();
            return Array.isArray(data)
              ? data.map((item) => ({
                  ...item,
                  course_code: course.course_code,
                  course_name: course.course_name,
                }))
              : [];
          } catch {
            return [];
          }
        })
      );

      const allResources: Resource[] = resourceResults.flat().sort((a, b) => {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return dateB - dateA;
      });

      setResources(allResources);
    } catch (error) {
      console.error('Resources loading failed:', error);
      setCourses([]);
      setResources([]);
    } finally {
      setLoading(false);
    }
  }

  async function loadUnits(courseId: string) {
    if (!courseId) {
      setUnits([]);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/course-units/${courseId}`);
      if (response.ok) {
        const data = await response.json();
        setUnits(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to load units:', err);
      setUnits([]);
    }
  }

  async function addResource(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setAdding(true);

    try {
      const userId = Number(profile.user_id || profile.id);
      const response = await fetch(`${API_URL}/api/resources`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          course_id: Number(addForm.course_id),
          unit_id: addForm.unit_id ? Number(addForm.unit_id) : null,
          title: addForm.title.trim(),
          description: addForm.description.trim(),
          resource_type: addForm.resource_type,
          url: addForm.url.trim() || null,
          uploaded_by: userId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || 'Failed to add resource');
        return;
      }

      setShowAdd(false);
      setAddForm({
        course_id: '',
        unit_id: '',
        title: '',
        description: '',
        resource_type: 'document',
        url: '',
      });
      setUnits([]);
      await fetchData();
    } catch (err) {
      console.error('Add resource failed:', err);
      alert('Unable to connect to backend server');
    } finally {
      setAdding(false);
    }
  }

  const isFaculty = profile?.role === 'faculty';
  const isAdmin = profile?.role === 'admin';

  // Filtered resources based on course, type, and search query
  const filtered = useMemo(() => {
    return resources.filter((res) => {
      // Course match
      if (selectedCourse !== 'all' && String(res.course_id) !== selectedCourse) {
        return false;
      }
      // Type match
      if (selectedType !== 'all' && res.resource_type?.toLowerCase() !== selectedType) {
        return false;
      }
      // Search query match
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = res.title?.toLowerCase().includes(q);
        const matchesDesc = res.description?.toLowerCase().includes(q);
        const matchesCourse =
          res.course_code?.toLowerCase().includes(q) ||
          res.course_name?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc && !matchesCourse) return false;
      }
      return true;
    });
  }, [resources, selectedCourse, selectedType, searchQuery]);

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
      {/* Top Header Card */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400 border border-red-200 dark:border-red-900/50 mb-2">
              <BookOpen className="h-3.5 w-3.5" />
              University Digital Repository • Lecture Library
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold font-display text-slate-900 dark:text-white">
              Study Resources & Reference Materials
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Curated lecture notes, syllabus presentations, code repositories, and reference textbooks.
            </p>
          </div>

          {(isFaculty || isAdmin) && (
            <button
              onClick={() => {
                setShowAdd(true);
                setUnits([]);
              }}
              className="btn-primary shrink-0"
            >
              <Plus className="h-4 w-4" />
              <span>Add Resource</span>
            </button>
          )}
        </div>
      </div>

      {/* Search and Filters Toolbar */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search resources by title, topic, or course name..."
              className="input-field pl-10 text-xs"
            />
          </div>

          {/* Type Filter Dropdown */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-400 shrink-0" />
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="input-field text-xs py-2 w-44"
            >
              <option value="all">All Material Types</option>
              <option value="pdf">PDF Documents</option>
              <option value="slide">Lecture Slides</option>
              <option value="document">Study Notes</option>
              <option value="video">Video Lectures</option>
              <option value="link">Web References</option>
            </select>
          </div>
        </div>

        {/* Course Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={() => setSelectedCourse('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              selectedCourse === 'all'
                ? 'bg-red-700 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            All Courses ({resources.length})
          </button>

          {courses.map((c) => {
            const count = resources.filter((r) => r.course_id === c.course_id).length;
            return (
              <button
                key={c.course_id}
                onClick={() => setSelectedCourse(String(c.course_id))}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  selectedCourse === String(c.course_id)
                    ? 'bg-red-700 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {c.course_code} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Resources Cards Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <BookOpen className="w-14 h-14 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-1">
            No Study Resources Found
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            {courses.length === 0
              ? 'Enroll in courses from the Course Management page to view study resources.'
              : 'No resources match your active search or filter criteria.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((res) => {
            const typeInfo =
              typeConfig[res.resource_type?.toLowerCase()] || typeConfig.other;
            const Icon = typeInfo.icon;

            return (
              <div
                key={res.resource_id}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Top Bar: Icon & Format Badge */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${typeInfo.color}`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border ${typeInfo.badge}`}
                      >
                        {typeInfo.label}
                      </span>
                      {res.course_code && (
                        <span className="font-mono text-[10px] font-bold text-slate-500 dark:text-slate-400">
                          {res.course_code}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm line-clamp-2 leading-snug">
                    {res.title}
                  </h3>

                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-3 leading-relaxed">
                    {res.description || 'Reference material uploaded for academic coursework.'}
                  </p>
                </div>

                {/* Bottom Card Footer */}
                <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-400">
                    {res.created_at
                      ? new Date(res.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })
                      : 'Semester note'}
                  </span>

                  {res.url ? (
                    <a
                      href={res.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900/60 font-semibold hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                    >
                      <span>Open Material</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  ) : (
                    <span className="text-slate-400 text-[11px] italic">In-class notes</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Resource Modal */}
      {showAdd && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in"
          onClick={() => setShowAdd(false)}
        >
          <div
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl w-full max-w-lg p-6 animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Add Study Resource
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Upload lecture material or web reference for your students
                </p>
              </div>

              <button
                onClick={() => setShowAdd(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={addResource} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Select Course *
                </label>
                <select
                  required
                  value={addForm.course_id}
                  onChange={(e) => {
                    const cid = e.target.value;
                    setAddForm({ ...addForm, course_id: cid, unit_id: '' });
                    loadUnits(cid);
                  }}
                  className="input-field"
                >
                  <option value="">Choose an active course</option>
                  {courses.map((c) => (
                    <option key={c.course_id} value={c.course_id}>
                      {c.course_code} — {c.course_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Resource Type *
                  </label>
                  <select
                    value={addForm.resource_type}
                    onChange={(e) =>
                      setAddForm({ ...addForm, resource_type: e.target.value })
                    }
                    className="input-field"
                  >
                    <option value="pdf">PDF Document</option>
                    <option value="slide">Lecture Slides</option>
                    <option value="document">Study Notes</option>
                    <option value="video">Video Recording</option>
                    <option value="link">Web Reference</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Course Unit (Optional)
                  </label>
                  <select
                    value={addForm.unit_id}
                    onChange={(e) =>
                      setAddForm({ ...addForm, unit_id: e.target.value })
                    }
                    disabled={!addForm.course_id}
                    className="input-field"
                  >
                    <option value="">General (All Units)</option>
                    {units.map((u) => (
                      <option key={u.unit_id} value={u.unit_id}>
                        {u.unit_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Resource Title *
                </label>
                <input
                  type="text"
                  required
                  value={addForm.title}
                  onChange={(e) =>
                    setAddForm({ ...addForm, title: e.target.value })
                  }
                  placeholder="e.g. Unit 2 - Relational Algebra & SQL Query Optimization"
                  className="input-field"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Resource / Download URL
                </label>
                <input
                  type="url"
                  value={addForm.url}
                  onChange={(e) =>
                    setAddForm({ ...addForm, url: e.target.value })
                  }
                  placeholder="https://drive.google.com/... or https://klh.edu.in/..."
                  className="input-field"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Description / Topic Summary
                </label>
                <textarea
                  rows={3}
                  value={addForm.description}
                  onChange={(e) =>
                    setAddForm({ ...addForm, description: e.target.value })
                  }
                  placeholder="Detailed summary or preparation guidance for students..."
                  className="input-field"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAdd(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adding || !addForm.title.trim() || !addForm.course_id}
                  className="btn-primary"
                >
                  {adding ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <span>Publish Resource</span>
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