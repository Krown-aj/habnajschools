"use client";

import React, { useRef, useState, useEffect, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import { ColDef } from "ag-grid-community";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { z } from "zod";
import Spinner from "@/components/Spinner/Spinner";

/* ---------------------------
   Types (lightweight)
   --------------------------- */
interface Student {
  id: string;
  firstname: string;
  othername: string | null;
  surname: string;
  class: { id: string; name: string; category: string };
}
interface Class {
  id: string;
  name: string;
  category: string;
}
interface Subject {
  id: string;
  name: string;
}
interface Grading {
  id: string;
  title: string;
  session: string;
  term: string;
  published: boolean;
  gradingPolicyId: string;
}
interface Assessment {
  id: string;
  name: string;
  weight: number;
  maxScore: number;
  gradingPolicyId?: string;
}
interface StudentAssessment {
  id?: string | null;
  studentId: string;
  assessmentId: string;
  subjectId: string;
  classId: string;
  gradingId: string;
  score: number;
  assessment?: Assessment;
}
interface StudentGrade {
  id?: string;
  score: number;
  grade?: string;
  remark?: string;
  studentId: string;
  subjectId: string;
  classId: string;
  gradingId: string;
  subjectPosition?: string | null;
}

/* ---------------------------
   Form schema
   --------------------------- */
const formSchema = z.object({
  classId: z.string().min(1, "Class is required"),
  subjectId: z.string().min(1, "Subject is required"),
});

/* ---------------------------
   Fetch helper
   --------------------------- */
const fetchWithErrorHandling = async (url: string, controller: AbortController) => {
  const response = await fetch(url, { signal: controller.signal });
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  const data = await response.json();
  return data.data ?? data;
};

/* Register AG Grid modules once */
ModuleRegistry.registerModules([AllCommunityModule]);

/* ---------------------------
   Component
   --------------------------- */
const Grade: React.FC = () => {
  const router = useRouter();
  const params = useParams();

  // refs
  const toast = useRef<Toast | null>(null);
  const gridRef = useRef<AgGridReact | null>(null);

  // state (stable hook order)
  const [loading, setLoading] = useState<boolean>(true); // initial data fetch
  const [saving, setSaving] = useState<boolean>(false);  // only for save operations
  const [grading, setGrading] = useState<Grading | null>(null);
  const [gradingPolicy, setGradingPolicy] = useState<{ id?: string; title?: string; passMark?: number; maxScore?: number; assessments?: Assessment[] } | null>(null);
  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [studentAssessments, setStudentAssessments] = useState<StudentAssessment[]>([]);
  const [studentGrades, setStudentGrades] = useState<StudentGrade[]>([]);
  const [quickFilter, setQuickFilter] = useState<string>("");

  const gradingId = (params?.id as string) ?? "";

  // react-hook-form
  const { control, handleSubmit, setValue, watch, formState: { errors } } = useForm<{ classId: string; subjectId: string }>({
    resolver: zodResolver(formSchema),
    defaultValues: { classId: "", subjectId: "" },
  });

  const watchedClassId = watch("classId");
  const watchedSubjectId = watch("subjectId");

  // Show toast after spinner is hidden (tiny delay to let overlay disappear)
  const showToastAfterSpinner = async (opts: { severity: "success" | "info" | "warn" | "error"; summary: string; detail?: string }) => {
    await new Promise((r) => setTimeout(r, 120));
    toast.current?.show(opts as any);
  };

  /* ---------------------------
     INITIAL LOAD: grading, classes, subjects, students, gradingPolicy
     --------------------------- */
  useEffect(() => {
    const controller = new AbortController();
    let mounted = true;

    const fetchData = async () => {
      if (!gradingId) {
        if (mounted) {
          setLoading(false);
          await showToastAfterSpinner({ severity: "error", summary: "Invalid Grading", detail: "Grading ID is missing." });
        }
        return;
      }

      try {
        if (mounted) setLoading(true);
        const [gradingResponse, classesResponse, subjectsResponse, studentsResponse] = await Promise.all([
          fetchWithErrorHandling(`/api/gradings/${gradingId}`, controller),
          fetchWithErrorHandling("/api/classes", controller),
          fetchWithErrorHandling("/api/subjects", controller),
          fetchWithErrorHandling("/api/students", controller),
        ]);

        if (!mounted) return;

        setGrading(gradingResponse);
        setClasses(classesResponse);
        setSubjects(subjectsResponse);
        setAllStudents(studentsResponse);
        setFilteredStudents(studentsResponse);

        if (gradingResponse?.gradingPolicyId) {
          try {
            const policyResponse = await fetchWithErrorHandling(`/api/policies/${gradingResponse.gradingPolicyId}`, controller);
            setGradingPolicy(policyResponse);
          } catch (e) {
            console.warn("Failed to load grading policy:", e);
          }
        }
      } catch (err: any) {
        if (err?.name === "AbortError") return;
        console.error("Initial fetch error:", err);
        if (mounted) await showToastAfterSpinner({ severity: "error", summary: "Error", detail: err.message || "Failed to load data" });
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void fetchData();
    return () => { mounted = false; controller.abort(); };
  }, [gradingId]);

  /* ---------------------------
     When class selected: filter students
     --------------------------- */
  useEffect(() => {
    if (watchedClassId) {
      const filtered = allStudents.filter((s) => s.class.id === watchedClassId);
      setFilteredStudents(filtered);
      setValue("subjectId", "");
      setStudentAssessments([]);
      setStudentGrades([]);
      // ensure loading reset in case it was left true
      setLoading(false);
    } else {
      setFilteredStudents([]);
      setStudentAssessments([]);
      setStudentGrades([]);
      setLoading(false);
    }
  }, [watchedClassId, allStudents, setValue]);

  /* ---------------------------
     When class + subject selected: fetch aggregated grades + per-assessment rows + assessment defs
     Endpoint: /api/grade?gradingId=...&classId=...&subjectId=...
     Expected response shape: { grades, studentAssessments, assessments }
     --------------------------- */
  useEffect(() => {
    const controller = new AbortController();
    let mounted = true;

    const fetchMarksAndGrades = async () => {
      // If missing required params — clear data and ensure loading is false, then return
      if (!gradingId || !watchedClassId || !watchedSubjectId) {
        if (mounted) {
          setStudentAssessments([]);
          setStudentGrades([]);
          setLoading(false);
        }
        return;
      }

      try {
        if (mounted) setLoading(true);

        const payload = await fetchWithErrorHandling(
          `/api/grade?gradingId=${gradingId}&classId=${watchedClassId}&subjectId=${watchedSubjectId}`,
          controller
        ).catch((e) => {
          console.warn("Fetch grades/assessments failed:", e);
          return { grades: [], studentAssessments: [], assessments: [] };
        });

        if (!mounted) return;

        const grades = payload?.grades ?? [];
        const studentAssessmentsRows = payload?.studentAssessments ?? [];
        const assessmentsFromServer = payload?.assessments ?? [];

        // adopt server assessment defs for columns if present
        if (Array.isArray(assessmentsFromServer) && assessmentsFromServer.length > 0) {
          setGradingPolicy((prev) => {
            const prevIds = (prev?.assessments ?? []).map((a) => a.id).join(",");
            const newIds = assessmentsFromServer.map((a: any) => a.id).join(",");
            if (prevIds === newIds) return prev;
            return { ...(prev ?? { id: gradingId, title: "", passMark: 0, maxScore: 0, assessments: [] }), assessments: assessmentsFromServer };
          });
        }

        if (mounted) {
          setStudentAssessments(Array.isArray(studentAssessmentsRows) ? studentAssessmentsRows : []);
          setStudentGrades(Array.isArray(grades) ? grades : []);
        }
      } catch (err: any) {
        if (err?.name === "AbortError") {
          if (mounted) setLoading(false);
          return;
        }
        console.error("Error fetching marks/grades:", err);
        if (mounted) {
          setStudentAssessments([]);
          setStudentGrades([]);
          await showToastAfterSpinner({ severity: "info", summary: "No Data", detail: "No existing marks or grades found. You can enter new marks." });
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void fetchMarksAndGrades();
    return () => { mounted = false; controller.abort(); };
  }, [gradingId, watchedClassId, watchedSubjectId]);

  /* ---------------------------
     Lookups for quick access
     --------------------------- */
  const assessmentLookup = useMemo(() => {
    const m = new Map<string, StudentAssessment>();
    for (const sa of studentAssessments) m.set(`${sa.studentId}:${sa.assessmentId}`, sa);
    return m;
  }, [studentAssessments]);

  const studentGradeLookup = useMemo(() => {
    const m = new Map<string, StudentGrade>();
    for (const sg of studentGrades) m.set(sg.studentId, sg);
    return m;
  }, [studentGrades]);

  /* ---------------------------
     Column definitions based on gradingPolicy.assessments
     --------------------------- */
  const columnDefs = useMemo<ColDef[]>(() => {
    const assessments = gradingPolicy?.assessments ?? [];
    const assessmentColumns: ColDef[] = assessments.map((assessment) => ({
      headerName: assessment.name,
      field: assessment.id,
      editable: true,
      filter: "agTextColumnFilter",
      sortable: true,
      valueSetter: (params) => {
        const newValueRaw = params.newValue;
        const newValue = typeof newValueRaw === "string" ? parseFloat(newValueRaw) : Number(newValueRaw);
        if (!Number.isFinite(newValue) || Number.isNaN(newValue)) {
          toast.current?.show({ severity: "warn", summary: "Invalid Score", detail: "Please enter a valid numeric score.", life: 3000 });
          return false;
        }
        if (newValue >= 0 && newValue <= assessment.maxScore) {
          params.data[assessment.id] = newValue;
          return true;
        }
        toast.current?.show({ severity: "warn", summary: "Invalid Score", detail: `Score must be between 0 and ${assessment.maxScore}`, life: 3000 });
        return false;
      },
    }));

    return [
      { headerName: "Student Name", field: "name", filter: "agTextColumnFilter", sortable: true },
      ...assessmentColumns,
      {
        headerName: "Total",
        field: "serverTotal",
        filter: "agNumberColumnFilter",
        sortable: true,
        valueGetter: (params) => {
          const computed = (gradingPolicy?.assessments ?? []).reduce((total, a) => total + (Number(params.data[a.id]) || 0), 0);
          const val = params.data.serverTotal ?? computed;
          return val !== null && val !== undefined ? val : "";
        },
      },
      {
        headerName: "Grade",
        field: "serverGrade",
        filter: "agTextColumnFilter",
        sortable: true,
        valueGetter: (params) => {
          if (params.data.serverGrade) return params.data.serverGrade;
          const score = (gradingPolicy?.assessments ?? []).reduce((total, a) => total + (Number(params.data[a.id]) || 0), 0);
          if (score >= 70) return "A";
          if (score >= 60) return "B";
          if (score >= 50) return "C";
          if (score >= 45) return "D";
          if (score >= 40) return "E";
          return "F";
        },
      },
      {
        headerName: "Remark",
        field: "serverRemark",
        filter: "agTextColumnFilter",
        sortable: true,
        valueGetter: (params) => {
          if (params.data.serverRemark) return params.data.serverRemark;
          const score = (gradingPolicy?.assessments ?? []).reduce((total, a) => total + (Number(params.data[a.id]) || 0), 0);
          if (score >= 70) return "Excellent";
          if (score >= 60) return "Very Good";
          if (score >= 50) return "Good";
          if (score >= 45) return "Pass";
          if (score >= 40) return "Fair";
          return "Fail";
        },
      },
      {
        headerName: "Position",
        field: "subjectPosition",
        filter: "agTextColumnFilter",
        sortable: true,
        valueGetter: (params) => params.data.subjectPosition ?? "",
      },
    ];
  }, [gradingPolicy?.assessments]);

  /* ---------------------------
     Row data: one row per filtered student
     --------------------------- */
  const rowData = useMemo(() => {
    if (!filteredStudents.length) return [];
    const assessments = gradingPolicy?.assessments ?? [];
    return filteredStudents.map((student) => {
      const row: any = { studentId: student.id, name: `${student.firstname} ${student.othername ?? ""} ${student.surname}`.trim() };
      assessments.forEach((assessment) => {
        const key = `${student.id}:${assessment.id}`;
        const sa = assessmentLookup.get(key);
        row[assessment.id] = sa ? sa.score : 0;
      });
      const sg = studentGradeLookup.get(student.id);
      row.serverTotal = sg?.score ?? null;
      row.serverGrade = sg?.grade ?? null;
      row.serverRemark = sg?.remark ?? null;
      row.subjectPosition = sg?.subjectPosition ?? null;
      row.studentGradeId = sg?.id ?? null;
      return row;
    });
  }, [filteredStudents, gradingPolicy?.assessments, assessmentLookup, studentGradeLookup]);

  /* ---------------------------
     Save handler — only sets/clears 'saving' state (loading is used for fetches)
     --------------------------- */
  const onSave = async (data: { classId: string; subjectId: string }) => {
    const controller = new AbortController();
    let mounted = true;
    setSaving(true);

    try {
      if (!grading || !gradingPolicy?.assessments || gradingPolicy.assessments.length === 0) {
        throw new Error("An error occurred. Please ensure grading and assessments are properly set.");
      }

      const gridData: any[] = [];
      gridRef.current?.api.forEachNode((node) => gridData.push(node.data));

      const studentsPayload = gridData.map((row) => {
        const perAssessmentScores = gradingPolicy!.assessments!.map((assessment) => {
          const raw = row[assessment.id];
          const score = typeof raw === "number" ? raw : parseFloat(String(raw || "0"));
          return { assessmentId: assessment.id, score: Number.isFinite(score) ? score : 0 };
        });
        return { studentId: row.studentId, perAssessmentScores };
      });

      const payload = {
        subjectId: data.subjectId,
        classId: data.classId,
        gradingId: grading.id,
        assessments: gradingPolicy.assessments!.map((a) => a.id),
        students: studentsPayload,
      };

      const response = await fetch("/api/grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (!response.ok) {
        const result = await response.json().catch(() => null);
        throw new Error(result?.error || "Failed to save students' grades");
      }

      const resultBody = await response.json().catch(() => null);
      const returnedGrades: StudentGrade[] = (resultBody?.data ?? resultBody) || [];
      const returnedAssessments: StudentAssessment[] = (resultBody?.studentAssessments ?? []);

      // hide spinner before toast
      setSaving(false);
      await new Promise((r) => setTimeout(r, 120));

      // update per-assessment rows (prefer server returned rows)
      if (Array.isArray(returnedAssessments) && returnedAssessments.length > 0) {
        setStudentAssessments(returnedAssessments);
      } else {
        const reconstructed: StudentAssessment[] = [];
        for (const s of studentsPayload) {
          for (const pa of s.perAssessmentScores) {
            reconstructed.push({
              id: undefined,
              studentId: s.studentId,
              assessmentId: pa.assessmentId,
              subjectId: data.subjectId,
              classId: data.classId,
              gradingId: grading.id,
              score: pa.score,
            });
          }
        }
        setStudentAssessments(reconstructed);
      }

      setStudentGrades(Array.isArray(returnedGrades) ? returnedGrades : []);
      await showToastAfterSpinner({ severity: "success", summary: "Success", detail: "Students' grades saved successfully" });

      // best-effort refresh aggregated grades and assessments
      try {
        setSaving(true);
        const refresh = await fetchWithErrorHandling(`/api/grade?gradingId=${grading.id}&classId=${data.classId}&subjectId=${data.subjectId}`, controller);
        if (refresh) {
          if (Array.isArray(refresh.grades)) setStudentGrades(refresh.grades);
          if (Array.isArray(refresh.studentAssessments) && refresh.studentAssessments.length) setStudentAssessments(refresh.studentAssessments);
          if (Array.isArray(refresh.assessments) && refresh.assessments.length) {
            setGradingPolicy((prev) => ({ ...(prev ?? { id: grading.id, title: "", passMark: 0, maxScore: 0, assessments: [] }), assessments: refresh.assessments }));
          }
        }
      } catch (err) {
        console.warn("Post-save refresh failed:", err);
      } finally {
        if (mounted) setSaving(false);
      }
    } catch (err: any) {
      if (err?.name === "AbortError") return;
      setSaving(false);
      await new Promise((r) => setTimeout(r, 80));
      console.error("Save error:", err);
      toast.current?.show({ severity: "error", summary: "Error", detail: err.message || "Failed to save grades", life: 3000 });
    } finally {
      if (mounted) setSaving(false);
    }

    return () => { mounted = false; controller.abort(); };
  };

  /* ---------------------------
     Options for dropdowns (memoized)
     --------------------------- */
  const classOptions = useMemo(() => classes.sort((a, b) => a.name.localeCompare(b.name)).map((cls) => ({ label: cls.name, value: cls.id })), [classes]);
  const subjectOptions = useMemo(() => subjects.sort((a, b) => a.name.localeCompare(b.name)).map((s) => ({ label: s.name, value: s.id })), [subjects]);

  /* ---------------------------
     Full-page loading UI (rendered only while fetching initial or dependent data)
     --------------------------- */
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
        </div>
      </div>
    );
  }

  /* ---------------------------
     Main render — overlay spinner appears only while saving
     --------------------------- */
  return (
    <section className="w-[96%] bg-white mx-auto my-4 rounded-md shadow-md">
      <Toast ref={toast} />
      {/* overlay spinner only during saving */}
      <Spinner visible={saving} onHide={() => setSaving(false)} />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-200 p-4">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900/80">{grading?.title ?? "Grade Students"}</h2>
        <div className="flex gap-3">
          <Button
            label="Save"
            icon="pi pi-save"
            onClick={handleSubmit(onSave)}
            className="bg-blue-600 text-white rounded-lg border border-blue-600 hover:bg-blue-700 hover:border-blue-700"
            disabled={!watchedClassId || !watchedSubjectId || saving}
          />
          <Button label="Back" icon="pi pi-arrow-left" onClick={() => router.back()} className="bg-red-600 text-white rounded-lg border border-red-600 hover:bg-red-700 hover:border-red-700" />
        </div>
      </div>

      <form className="p-4 space-y-4" onSubmit={handleSubmit(onSave)}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Session</label>
            <InputText value={grading?.session || ""} disabled className="w-full p-2 border rounded-md bg-gray-100" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Term</label>
            <InputText value={grading?.term || ""} disabled className="w-full p-2 border rounded-md bg-gray-100" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
            <Controller name="classId" control={control} render={({ field }) => (
              <Dropdown {...field} options={classOptions} placeholder="Select Class" className={`w-full ${errors.classId ? "p-invalid" : ""}`} onChange={(e) => field.onChange(e.value)} />
            )} />
            {errors.classId && <p className="text-red-500 text-sm mt-1">{errors.classId.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
            <Controller name="subjectId" control={control} render={({ field }) => (
              <Dropdown {...field} options={subjectOptions} placeholder="Select Subject" className={`w-full ${errors.subjectId ? "p-invalid" : ""}`} disabled={!watchedClassId} onChange={(e) => field.onChange(e.value)} />
            )} />
            {errors.subjectId && <p className="text-red-500 text-sm mt-1">{errors.subjectId.message}</p>}
          </div>
        </div>

        {watchedClassId && gradingPolicy?.assessments && gradingPolicy.assessments.length ? (
          <>
            <div>
              <InputText value={quickFilter} onChange={(e) => setQuickFilter((e.target as HTMLInputElement).value)} placeholder="Search students..." className="w-full p-2 border rounded-md" />
            </div>
            <div className="ag-theme-alpine" style={{ height: "500px", width: "100%" }}>
              <AgGridReact
                ref={gridRef}
                columnDefs={columnDefs}
                rowData={rowData}
                defaultColDef={{ resizable: true, sortable: true, filter: true }}
                quickFilterText={quickFilter}
                pagination
                paginationPageSize={10}
                paginationPageSizeSelector={[5, 10, 20, 50, 100]}
                suppressClickEdit={false}
                theme="legacy"
              />
            </div>
          </>
        ) : (
          <p className="text-gray-500 text-center">{watchedClassId ? "No assessments available for this grading policy." : "Please select a class to view and grade students."}</p>
        )}
      </form>
    </section>
  );
};

export default Grade;
